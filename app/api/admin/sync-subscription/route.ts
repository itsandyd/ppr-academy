import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { fetchQuery, fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Admin endpoint to manually sync a user's PPR Pro subscription from Stripe.
 * Looks up the customer by email, finds active subscriptions, and creates/updates
 * the subscription record in Convex.
 *
 * POST /api/admin/sync-subscription
 * Body: { email: string } or { stripeSubscriptionId: string, stripeCustomerId: string, userId: string, plan: "monthly" | "yearly" }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check admin status
    const dbUser = await fetchQuery(api.users.getUserFromClerk, { clerkId: user.id });
    if (!dbUser || dbUser.admin !== true) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await request.json();

    // Mode 1: Direct activation with known IDs
    if (body.stripeSubscriptionId && body.stripeCustomerId && body.userId && body.plan) {
      await fetchAction(api.serverActions.serverAdminActivateSubscription, {
        userId: body.userId,
        plan: body.plan,
        stripeSubscriptionId: body.stripeSubscriptionId,
        stripeCustomerId: body.stripeCustomerId,
      });

      return NextResponse.json({
        success: true,
        message: `Activated PPR Pro for user ${body.userId}`,
        mode: "direct",
      });
    }

    // Mode 2: Auto-sync by email
    if (body.email) {
      const customers = await stripe.customers.list({ email: body.email, limit: 5 });

      if (customers.data.length === 0) {
        return NextResponse.json({ error: "No Stripe customer found with that email" }, { status: 404 });
      }

      const results = [];

      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 10,
        });

        for (const sub of subscriptions.data) {
          if (sub.metadata?.productType === "ppr_pro" && (sub.status === "active" || sub.status === "trialing")) {
            const userId = sub.metadata.userId;
            const plan = sub.metadata.plan as "monthly" | "yearly";

            if (userId && plan) {
              await fetchAction(api.serverActions.serverCreateSubscription, {
                userId,
                plan,
                stripeSubscriptionId: sub.id,
                stripeCustomerId: customer.id,
                currentPeriodStart: ((sub as any).current_period_start || Math.floor(Date.now() / 1000)) * 1000,
                currentPeriodEnd: ((sub as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400) * 1000,
                status: sub.status === "trialing" ? "trialing" : "active",
              });

              results.push({
                subscriptionId: sub.id,
                userId,
                plan,
                status: sub.status,
                synced: true,
              });
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        customersFound: customers.data.length,
        subscriptionsSynced: results.length,
        results,
      });
    }

    return NextResponse.json({ error: "Provide either { email } or { stripeSubscriptionId, stripeCustomerId, userId, plan }" }, { status: 400 });
  } catch (error) {
    console.error("Sync subscription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
