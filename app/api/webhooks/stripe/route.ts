import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("✅ Stripe webhook received:", event.type, event.id);

  try {
    switch (event.type) {
      case "account.updated":
        // Handle Connect account updates
        const account = event.data.object as Stripe.Account;
        console.log("📋 Account updated:", {
          id: account.id,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        });

        // Update user record with account status in Convex
        try {
          const { fetchQuery: fetchQueryAccount, fetchMutation: fetchMutationAccount } =
            await import("convex/nextjs");
          const { api: apiAccount } = await import("@/convex/_generated/api");

          // Find user by Stripe account ID
          const users = await fetchQueryAccount(apiAccount.users.getAllUsers);
          const user = users?.find((u: any) => u.stripeConnectAccountId === account.id);

          if (user) {
            // Determine account status
            let status: "pending" | "restricted" | "enabled" = "pending";
            if (account.charges_enabled && account.payouts_enabled) {
              status = "enabled";
            } else if (account.details_submitted) {
              status = "restricted"; // Submitted but not fully enabled
            }

            await fetchMutationAccount(apiAccount.users.updateUserByClerkId, {
              clerkId: user.clerkId,
              updates: {
                stripeAccountStatus: status,
                stripeOnboardingComplete: account.details_submitted || false,
              },
            });

            console.log("✅ Updated user Stripe account status:", {
              userId: user._id,
              status,
              onboardingComplete: account.details_submitted,
            });
          } else {
            console.log("⚠️ No user found with Stripe account ID:", account.id);
          }
        } catch (error) {
          console.error("❌ Failed to update user Stripe status:", error);
          // Don't throw - we still want to acknowledge the webhook
        }

        break;

      case "account.application.authorized":
        // When a user completes Connect onboarding
        const application = event.data.object as any;
        console.log("🎉 Account application authorized:", application.account);
        break;

      case "payment_intent.succeeded":
        // Handle successful course purchases
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("💰 Payment succeeded:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        });

        // TODO: Create course enrollment in Convex
        // This will happen when we implement course purchase flow

        break;

      case "checkout.session.completed":
        // Handle successful checkout (for credits and subscriptions)
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("💳 Checkout completed:", {
          id: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          metadata: session.metadata,
          mode: session.mode,
        });

        // Handle subscription checkouts
        if (session.mode === "subscription" && session.subscription) {
          const { planId, userId, storeId, billingCycle, productType, plan } =
            session.metadata || {};

          // Handle creator plan subscriptions
          if (productType === "creator_plan" && storeId && plan) {
            console.log("🎨 Creating creator plan subscription:", {
              userId,
              storeId,
              plan,
              stripeSubscriptionId: session.subscription,
            });

            const { fetchMutation: fetchMutationPlan } = await import("convex/nextjs");
            const { api: apiPlan } = await import("@/convex/_generated/api");

            // Get subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            await fetchMutationPlan(apiPlan.creatorPlans.upgradePlan, {
              storeId: storeId as any,
              plan: plan as "creator" | "creator_pro",
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status === "trialing" ? "trialing" : "active",
              trialEndsAt: subscription.trial_end ? subscription.trial_end * 1000 : undefined,
            });

            console.log("✅ Creator plan subscription created successfully");
          }
          // Handle membership subscriptions
          else if (productType === "membership" && userId) {
            const { tierId, creatorId } = session.metadata || {};

            console.log("⭐ Creating membership subscription:", {
              userId,
              tierId,
              creatorId,
              stripeSubscriptionId: session.subscription,
              billingCycle,
            });

            const { fetchMutation: fetchMutationMembership } = await import("convex/nextjs");
            const { api: apiMembership } = await import("@/convex/_generated/api");

            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            try {
              await fetchMutationMembership(
                apiMembership.memberships.createMembershipSubscription,
                {
                  userId,
                  tierId: tierId as any,
                  stripeSubscriptionId: subscription.id,
                  billingCycle: (billingCycle as "monthly" | "yearly") || "monthly",
                  trialEnd: subscription.trial_end ? subscription.trial_end * 1000 : undefined,
                }
              );

              console.log("✅ Membership subscription created successfully");
            } catch (error) {
              console.error("❌ Failed to create membership subscription:", error);
            }
          }
          // Handle content subscription (existing)
          else if (planId && userId) {
            console.log("🔄 Creating content subscription in Convex:", {
              userId,
              planId,
              stripeSubscriptionId: session.subscription,
              billingCycle,
            });

            const { fetchMutation } = await import("convex/nextjs");
            const { api } = await import("@/convex/_generated/api");

            await fetchMutation(api.subscriptions.createSubscription, {
              userId,
              planId: planId as any,
              billingCycle: (billingCycle as "monthly" | "yearly") || "monthly",
              stripeSubscriptionId: session.subscription as string,
            });

            console.log("✅ Content subscription created successfully");
          }
        }

        // Handle course purchases
        if (session.metadata?.productType === "course") {
          const { userId, courseId, amount, currency } = session.metadata;

          if (userId && courseId && amount) {
            console.log("📚 Processing course purchase:", {
              userId,
              courseId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
              sessionId: session.id,
              paymentIntentId: session.payment_intent,
            });

            const { fetchMutation: fetchMutationEnroll } = await import("convex/nextjs");
            const { api: apiEnroll } = await import("@/convex/_generated/api");

            try {
              const purchaseId = await fetchMutationEnroll(
                apiEnroll.library.createCourseEnrollment,
                {
                  userId,
                  courseId: courseId as any,
                  amount: parseInt(amount),
                  currency: currency || "USD",
                  paymentMethod: "stripe",
                  transactionId: session.payment_intent as string,
                }
              );

              console.log("✅ Course enrollment created:", { purchaseId, userId, courseId });
            } catch (error) {
              console.error("❌ Failed to create course enrollment:", error);
            }
          }
        }

        // Handle digital product purchases
        if (session.metadata?.productType === "digitalProduct") {
          const { userId, productId, amount, currency } = session.metadata;

          if (userId && productId && amount) {
            console.log("📦 Processing digital product purchase:", {
              userId,
              productId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
              sessionId: session.id,
              paymentIntentId: session.payment_intent,
            });

            const { fetchMutation: fetchMutationProduct } = await import("convex/nextjs");
            const { api: apiProduct } = await import("@/convex/_generated/api");

            try {
              const purchaseId = await fetchMutationProduct(
                apiProduct.library.createDigitalProductPurchase,
                {
                  userId,
                  productId: productId as any,
                  amount: parseInt(amount),
                  currency: currency || "USD",
                  paymentMethod: "stripe",
                  transactionId: session.payment_intent as string,
                }
              );

              console.log("✅ Digital product purchase created:", {
                purchaseId,
                userId,
                productId,
              });
            } catch (error) {
              console.error("❌ Failed to create digital product purchase:", error);
            }
          }
        }

        if (session.metadata?.productType === "bundle") {
          const { userId, bundleId, amount, currency } = session.metadata;

          if (userId && bundleId && amount) {
            console.log("📦 Processing bundle purchase:", {
              userId,
              bundleId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
              sessionId: session.id,
              paymentIntentId: session.payment_intent,
            });

            const { fetchMutation: fetchMutationBundle } = await import("convex/nextjs");
            const { api: apiBundle } = await import("@/convex/_generated/api");

            try {
              const purchaseId = await fetchMutationBundle(apiBundle.library.createBundlePurchase, {
                userId,
                bundleId: bundleId as any,
                amount: parseInt(amount),
                currency: currency || "USD",
                paymentMethod: "stripe",
                transactionId: session.payment_intent as string,
              });

              console.log("✅ Bundle purchase created:", {
                purchaseId,
                userId,
                bundleId,
              });
            } catch (error) {
              console.error("❌ Failed to create bundle purchase:", error);
            }
          }
        }

        // Handle credit package purchases
        if (session.metadata?.productType === "credit_package") {
          const { userId, packageId, credits, bonusCredits, packageName } = session.metadata;
          const creditsAmount = parseInt(credits || "0");
          const bonusAmount = parseInt(bonusCredits || "0");
          const totalCredits = creditsAmount + bonusAmount;

          console.log("🪙 Processing credit purchase:", {
            userId,
            packageId,
            totalCredits,
            sessionId: session.id,
          });

          if (userId && totalCredits > 0) {
            const { fetchMutation: fetchMutationCredits } = await import("convex/nextjs");
            const { internal: internalCredits } = await import("@/convex/_generated/api");

            try {
              await fetchMutationCredits(internalCredits.credits.addCredits, {
                userId,
                amount: creditsAmount,
                type: "purchase" as const,
                description: `Purchased ${packageName || "Credit Package"}`,
                metadata: {
                  stripePaymentId: session.payment_intent as string,
                  dollarAmount: session.amount_total ? session.amount_total / 100 : 0,
                  packageName: packageName || "Credit Package",
                },
              });

              if (bonusAmount > 0) {
                await fetchMutationCredits(internalCredits.credits.addCredits, {
                  userId,
                  amount: bonusAmount,
                  type: "bonus" as const,
                  description: `Bonus credits from ${packageName || "Credit Package"}`,
                  metadata: {
                    stripePaymentId: session.payment_intent as string,
                    packageName: packageName || "Credit Package",
                  },
                });
              }

              console.log("✅ Credits added successfully:", {
                userId,
                purchased: creditsAmount,
                bonus: bonusAmount,
                total: totalCredits,
              });
            } catch (error) {
              console.error("❌ Failed to add credits:", error);
            }
          }
        }

        break;

      case "customer.subscription.updated":
        // Handle subscription status changes
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log("🔄 Subscription updated:", {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        });

        const { fetchMutation: fetchMutationUpdate } = await import("convex/nextjs");
        const { api: apiUpdate } = await import("@/convex/_generated/api");

        // Check if this is a creator plan subscription
        if (updatedSubscription.metadata?.storeId && updatedSubscription.metadata?.plan) {
          await fetchMutationUpdate(apiUpdate.creatorPlans.updateSubscriptionStatus, {
            storeId: updatedSubscription.metadata.storeId as any,
            subscriptionStatus: updatedSubscription.status as
              | "active"
              | "trialing"
              | "past_due"
              | "canceled"
              | "incomplete",
          });
          console.log("✅ Creator plan subscription status updated");
        } else {
          // Handle content subscriptions (existing)
          await fetchMutationUpdate(apiUpdate.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: updatedSubscription.id,
            status: updatedSubscription.status as "active" | "canceled" | "past_due" | "expired",
          });
          console.log("✅ Content subscription status updated in Convex");
        }
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log("❌ Subscription canceled:", {
          id: deletedSubscription.id,
          canceledAt: deletedSubscription.canceled_at,
        });

        const { fetchMutation: fetchMutationDelete } = await import("convex/nextjs");
        const { api: apiDelete } = await import("@/convex/_generated/api");

        // Check if this is a creator plan subscription
        if (deletedSubscription.metadata?.storeId) {
          await fetchMutationDelete(apiDelete.creatorPlans.updateSubscriptionStatus, {
            storeId: deletedSubscription.metadata.storeId as any,
            subscriptionStatus: "canceled",
            downgradeToPlan: "free",
          });
          console.log("✅ Creator plan subscription canceled, downgraded to free");
        } else {
          // Handle content subscriptions (existing)
          await fetchMutationDelete(apiDelete.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: deletedSubscription.id,
            status: "canceled",
          });
          console.log("✅ Content subscription marked as canceled in Convex");
        }
        break;

      case "invoice.payment_succeeded":
        // Handle successful subscription renewal
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          console.log("💰 Subscription payment succeeded:", {
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid / 100,
          });

          // Optionally track revenue here
        }
        break;

      case "invoice.payment_failed":
        // Handle failed subscription payment
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          console.log("❌ Subscription payment failed:", {
            subscriptionId: failedInvoice.subscription,
            attemptCount: failedInvoice.attempt_count,
          });

          // Optionally send email notification to user
        }
        break;

      case "payment_intent.payment_failed":
        // Handle failed payments
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log("❌ Payment failed:", {
          id: failedPayment.id,
          lastPaymentError: failedPayment.last_payment_error,
          metadata: failedPayment.metadata,
        });

        // Send payment failure notification
        try {
          const metadata = failedPayment.metadata || {};
          const { customerEmail, customerName, courseTitle, productType } = metadata;

          if (customerEmail) {
            // TODO: Integrate with Resend to send actual email
            // For now, log the failure notification
            console.log("📧 Payment failure notification (to be sent):", {
              to: customerEmail,
              subject: "Payment Issue - Action Required",
              details: {
                customerName: customerName || "Customer",
                productType: productType || "purchase",
                productName: courseTitle || "your purchase",
                failureReason: failedPayment.last_payment_error?.message || "Payment declined",
                paymentIntentId: failedPayment.id,
                amount: failedPayment.amount / 100,
                currency: failedPayment.currency,
              },
            });

            // Email template should include:
            // - Clear subject: "Payment Issue - Action Required"
            // - Friendly explanation of what happened
            // - Specific failure reason (if card declined, expired, etc.)
            // - Link to retry payment
            // - Support contact information
            // - Amount and what they were trying to purchase
          }
        } catch (error) {
          console.error("❌ Failed to send payment failure notification:", error);
          // Don't throw - we still want to acknowledge the webhook
        }

        break;

      case "transfer.created":
        // When money is transferred to a Connect account
        const transfer = event.data.object as Stripe.Transfer;
        console.log("💸 Transfer created:", {
          id: transfer.id,
          amount: transfer.amount / 100,
          destination: transfer.destination,
        });
        break;

      case "transfer.paid":
        // When transfer is completed
        const paidTransfer = event.data.object as Stripe.Transfer;
        console.log("✅ Transfer completed:", paidTransfer.id);
        break;

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
