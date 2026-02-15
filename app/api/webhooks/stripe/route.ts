import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { serverLogger } from "@/lib/server-logger";
import * as Sentry from "@sentry/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    serverLogger.error("Webhook signature verification failed", err);
    Sentry.captureException(err, { tags: { component: "stripe-webhook", stage: "signature-verification" } });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  serverLogger.webhook("Event received", { type: event.type, id: event.id });

  // Idempotency check: skip already-processed events, allow retry of failed ones
  try {
    const { fetchQuery: fetchQueryIdempotency } = await import("convex/nextjs");
    const { api: apiIdempotency } = await import("@/convex/_generated/api");

    const existingEvent = await fetchQueryIdempotency(
      apiIdempotency.webhookEvents.getWebhookEvent,
      { stripeEventId: event.id }
    );

    if (existingEvent?.status === "processed") {
      serverLogger.info("Webhook", "Duplicate webhook event, skipping", {
        stripeEventId: event.id,
        eventType: event.type,
      });
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    if (existingEvent?.status === "failed") {
      serverLogger.info("Webhook", "Retrying previously failed webhook event", {
        stripeEventId: event.id,
        eventType: event.type,
      });
    }
  } catch (idempotencyError) {
    // If the idempotency check itself fails, log and continue processing
    // (better to risk a duplicate than to drop an event)
    serverLogger.error("Idempotency check failed, continuing with processing", idempotencyError);
  }

  try {
    switch (event.type) {
      case "account.updated":
        // Handle Connect account updates
        const account = event.data.object as Stripe.Account;
        serverLogger.payment("Account updated", {
          id: account.id,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          metadata: account.metadata,
        });

        // Update user record with account status in Convex
        try {
          const { fetchQuery: fetchQueryAccount, fetchMutation: fetchMutationAccount } =
            await import("convex/nextjs");
          const { api: apiAccount } = await import("@/convex/_generated/api");

          // First try to find user by Stripe account ID
          let user = await fetchQueryAccount(apiAccount.users.getUserByStripeAccountId, {
            stripeConnectAccountId: account.id,
          });

          // If not found by stripeConnectAccountId, try to find by userId from metadata
          // This handles the case where the account was created but stripeConnectAccountId wasn't saved yet
          if (!user && account.metadata?.userId) {
            user = await fetchQueryAccount(apiAccount.users.getUserFromClerk, {
              clerkId: account.metadata.userId,
            });

            if (user) {
              serverLogger.payment("Found user by metadata.userId, will save stripeConnectAccountId", {
                userId: user._id,
                accountId: account.id,
              });
            }
          }

          if (user && user.clerkId) {
            // Determine account status
            let status: "pending" | "restricted" | "enabled" = "pending";
            if (account.charges_enabled && account.payouts_enabled) {
              status = "enabled";
            } else if (account.details_submitted) {
              status = "restricted"; // Submitted but not fully enabled
            }

            // Update user with account ID and status
            // This ensures stripeConnectAccountId is always saved, even if frontend failed to save it
            await fetchMutationAccount(apiAccount.users.updateUserByClerkId, {
              clerkId: user.clerkId as string,
              updates: {
                stripeConnectAccountId: account.id,
                stripeAccountStatus: status,
                stripeOnboardingComplete: account.details_submitted || false,
              },
            });

            serverLogger.payment("Updated user Stripe account status", {
              userId: user._id,
              accountId: account.id,
              status,
              onboardingComplete: account.details_submitted,
            });
          } else {
            serverLogger.payment("Could not find user for Stripe account update", {
              accountId: account.id,
              metadata: account.metadata,
            });
          }
        } catch (error) {
          serverLogger.error("Failed to update user Stripe status", error);
          Sentry.captureException(error, {
            tags: { component: "stripe-webhook", eventType: event.type, productType: "account_update" },
            extra: { stripeEventId: event.id, accountId: account.id, metadata: account.metadata },
          });
          // Don't throw - we still want to acknowledge the webhook
        }

        break;

      case "account.application.authorized":
        // When a user completes Connect onboarding
        const application = event.data.object as any;

        break;

      case "payment_intent.succeeded":
        // Log successful payment (enrollment is handled in checkout.session.completed)
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        serverLogger.payment("Payment succeeded", {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          type: "payment_intent",
        });
        // Note: Course enrollment is created in checkout.session.completed handler
        break;

      case "checkout.session.completed":
        // Handle successful checkout (for credits and subscriptions)
        const session = event.data.object as Stripe.Checkout.Session;
        serverLogger.payment("Checkout completed", {
          id: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          type: session.mode,
          status: "completed",
        });

        // Handle PPR Pro subscription checkouts
        if (session.mode === "subscription" && session.subscription && session.metadata?.productType === "ppr_pro") {
          const { userId, plan, customerEmail, customerName } = session.metadata || {};

          if (userId && plan) {
            serverLogger.payment("Creating PPR Pro subscription", {
              id: session.subscription as string,
              type: "ppr_pro",
              status: "creating",
            });

            const { fetchMutation: fetchMutationPprPro } = await import("convex/nextjs");
            const { api: apiPprPro } = await import("@/convex/_generated/api");

            const subscriptionResponse = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            const subscription = subscriptionResponse as any;

            try {
              await fetchMutationPprPro(apiPprPro.pprPro.createSubscription, {
                userId,
                plan: plan as "monthly" | "yearly",
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                currentPeriodStart: (subscription.current_period_start || Math.floor(Date.now() / 1000)) * 1000,
                currentPeriodEnd: (subscription.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400) * 1000,
                status: subscription.status === "trialing" ? "trialing" : "active",
              });

              serverLogger.info("PPR Pro", "Subscription created successfully");

              // Send PPR Pro welcome email
              try {
                const { sendPprProWelcomeEmail } = await import("@/lib/email");
                await sendPprProWelcomeEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Member",
                  plan: plan as "monthly" | "yearly",
                });
                serverLogger.debug("Email", "PPR Pro welcome email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send PPR Pro welcome email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create PPR Pro subscription", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "ppr_pro" },
                extra: { userId, stripeEventId: event.id, stripeSessionId: session.id, subscriptionId: session.subscription },
              });
            }
          }
        }

        // Handle subscription checkouts
        if (session.mode === "subscription" && session.subscription && session.metadata?.productType !== "ppr_pro") {
          const { planId, userId, storeId, billingCycle, productType, plan } =
            session.metadata || {};

          // Handle creator plan subscriptions
          if (productType === "creator_plan" && storeId && plan) {
            serverLogger.payment("Creating creator plan subscription", {
              id: session.subscription as string,
              type: "creator_plan",
              status: "creating",
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


          }
          // Handle membership subscriptions
          else if (productType === "membership" && userId) {
            const { tierId, creatorId, tierName, membershipName, customerEmail, customerName } = session.metadata || {};

            serverLogger.payment("Creating membership subscription", {
              id: session.subscription as string,
              type: "membership",
              status: "creating",
            });

            const { fetchMutation: fetchMutationMembership, fetchQuery: fetchQueryMembership } = await import("convex/nextjs");
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

              serverLogger.info("Membership", "Subscription created successfully");

              // Send membership confirmation email
              try {
                const { sendMembershipConfirmationEmail } = await import("@/lib/email");
                await sendMembershipConfirmationEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Member",
                  membershipName: membershipName || "Membership",
                  tierName: tierName || "Standard",
                  amount: (session.amount_total || 0) / 100,
                  currency: session.currency || "usd",
                  billingCycle: (billingCycle as "monthly" | "yearly") || "monthly",
                });
                serverLogger.debug("Email", "Membership confirmation email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send membership confirmation email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create membership subscription", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "membership" },
                extra: { userId, tierId, stripeEventId: event.id, stripeSessionId: session.id, subscriptionId: session.subscription },
              });
            }
          }
          // Handle content subscription (existing)
          else if (planId && userId) {
            serverLogger.payment("Creating content subscription", {
              id: session.subscription as string,
              type: "content_subscription",
              status: "creating",
            });

            const { fetchMutation } = await import("convex/nextjs");
            const { api } = await import("@/convex/_generated/api");

            await fetchMutation(api.subscriptions.createSubscription, {
              userId,
              planId: planId as any,
              billingCycle: (billingCycle as "monthly" | "yearly") || "monthly",
              stripeSubscriptionId: session.subscription as string,
            });


          }
        }

        // Handle course purchases
        if (session.metadata?.productType === "course") {
          const { userId, courseId, amount, currency, courseTitle, customerEmail, customerName } = session.metadata;

          if (userId && courseId && amount) {
            serverLogger.payment("Processing course purchase", {
              id: session.id,
              type: "course",
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
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

              serverLogger.info("Course", "Enrollment created successfully");

              // Send course enrollment email
              try {
                const { sendCourseEnrollmentEmail } = await import("@/lib/email");
                await sendCourseEnrollmentEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Student",
                  courseTitle: courseTitle || "Course",
                  amount: parseInt(amount) / 100,
                  currency: currency || "USD",
                });
                serverLogger.debug("Email", "Course enrollment email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send course enrollment email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create course enrollment", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "course" },
                extra: { userId, courseId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle digital product purchases
        if (session.metadata?.productType === "digitalProduct") {
          const { userId, productId, amount, currency, productTitle, customerEmail, customerName } = session.metadata;

          if (userId && productId && amount) {
            serverLogger.payment("Processing digital product purchase", {
              type: "digitalProduct",
              id: productId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
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

              serverLogger.info("Digital Product", "Purchase created successfully");

              // Send digital product purchase email
              try {
                const { sendDigitalProductPurchaseEmail } = await import("@/lib/email");
                await sendDigitalProductPurchaseEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Customer",
                  productTitle: productTitle || "Digital Product",
                  productType: "digital",
                  amount: parseInt(amount) / 100,
                  currency: currency || "USD",
                });
                serverLogger.debug("Email", "Digital product purchase email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send digital product purchase email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create digital product purchase", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "digitalProduct" },
                extra: { userId, productId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        if (session.metadata?.productType === "bundle") {
          const { userId, bundleId, amount, currency, bundleTitle, itemCount, customerEmail, customerName } = session.metadata;

          if (userId && bundleId && amount) {
            serverLogger.payment("Processing bundle purchase", {
              type: "bundle",
              id: bundleId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
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

              serverLogger.info("Bundle", "Purchase created successfully");

              // Send bundle purchase email
              try {
                const { sendBundlePurchaseEmail } = await import("@/lib/email");
                await sendBundlePurchaseEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Customer",
                  bundleTitle: bundleTitle || "Bundle",
                  itemCount: parseInt(itemCount || "0") || 1,
                  amount: parseInt(amount) / 100,
                  currency: currency || "USD",
                });
                serverLogger.debug("Email", "Bundle purchase email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send bundle purchase email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create bundle purchase", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "bundle" },
                extra: { userId, bundleId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle beat lease purchases
        if (session.metadata?.productType === "beatLease") {
          const { userId, beatId, tierType, tierName, storeId, amount, currency, customerEmail, customerName } = session.metadata;

          if (userId && beatId && tierType && storeId && amount) {
            serverLogger.payment("Processing beat lease purchase", {
              type: "beatLease",
              id: beatId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
            });

            const { fetchMutation: fetchMutationBeatLease, fetchQuery: fetchQueryBeat } = await import("convex/nextjs");
            const { api: apiBeatLease, internal: internalBeatLease } = await import("@/convex/_generated/api");

            try {
              // Get beat details for email
              const beat = await fetchQueryBeat(apiBeatLease.digitalProducts.getProductById, {
                productId: beatId as any,
              });

              // Create the beat license purchase (internal mutation - no user auth in webhook context)
              const result = await fetchMutationBeatLease(
                internalBeatLease.beatLeases.createBeatLicensePurchase as any,
                {
                  beatId: beatId as any,
                  tierType: tierType as "basic" | "premium" | "exclusive" | "unlimited",
                  tierName: tierName || tierType,
                  userId,
                  storeId,
                  amount: parseInt(amount),
                  currency: currency || "USD",
                  paymentMethod: "stripe",
                  transactionId: session.payment_intent as string,
                  buyerEmail: session.customer_details?.email || customerEmail || "",
                  buyerName: session.customer_details?.name || customerName,
                }
              );

              serverLogger.info("Beat Lease", "License purchase created successfully");

              // Send beat purchase email
              try {
                const { sendBeatPurchaseEmail } = await import("@/lib/email");
                await sendBeatPurchaseEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Customer",
                  beatTitle: beat?.title || "Beat",
                  tierName: tierName || tierType,
                  tierType: tierType,
                  amount: parseInt(amount) / 100,
                  currency: currency || "USD",
                });
                serverLogger.debug("Email", "Beat purchase email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send beat purchase email", emailError);
              }

              // If exclusive tier, mark beat as sold (hides from marketplace)
              if (tierType === "exclusive") {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await fetchMutationBeatLease(internalBeatLease.beatLeases.markBeatAsExclusivelySold as any, {
                    beatId: beatId as any,
                    userId,
                    purchaseId: result.purchaseId,
                  });
                  serverLogger.info("Beat Lease", "Beat marked as exclusively sold");
                } catch (exclusiveError) {
                  serverLogger.error("Failed to mark beat as exclusively sold", exclusiveError);
                }
              }
            } catch (error) {
              serverLogger.error("Failed to create beat license purchase", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "beatLease" },
                extra: { userId, beatId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle credit package purchases
        if (session.metadata?.productType === "credit_package") {
          const { userId, packageId, credits, bonusCredits, packageName, customerEmail, customerName } = session.metadata;
          const creditsAmount = parseInt(credits || "0");
          const bonusAmount = parseInt(bonusCredits || "0");
          const totalCredits = creditsAmount + bonusAmount;

          serverLogger.payment("Processing credit purchase", {
            type: "credit_package",
            id: packageId,
            amount: totalCredits,
          });

          if (userId && totalCredits > 0) {
            const { fetchMutation: fetchMutationCredits } = await import("convex/nextjs");
            const { api: apiCredits } = await import("@/convex/_generated/api");

            try {
              // Add purchased credits
              await fetchMutationCredits(apiCredits.credits.addCreditsFromWebhook, {
                userId,
                amount: creditsAmount,
                type: "purchase" as const,
                description: `Purchased ${packageName || "Credit Package"}`,
                stripePaymentId: session.payment_intent as string,
                metadata: {
                  dollarAmount: session.amount_total ? session.amount_total / 100 : 0,
                  packageName: packageName || "Credit Package",
                },
              });

              // Add bonus credits if any
              if (bonusAmount > 0) {
                await fetchMutationCredits(apiCredits.credits.addCreditsFromWebhook, {
                  userId,
                  amount: bonusAmount,
                  type: "bonus" as const,
                  description: `Bonus credits from ${packageName || "Credit Package"}`,
                  stripePaymentId: `${session.payment_intent}-bonus`,
                  metadata: {
                    packageName: packageName || "Credit Package",
                  },
                });
              }

              serverLogger.info("Credits", "Credits added successfully");

              // Send credits purchase email
              try {
                const { sendCreditsPurchaseEmail } = await import("@/lib/email");
                await sendCreditsPurchaseEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Customer",
                  packageName: packageName || "Credit Package",
                  credits: creditsAmount,
                  bonusCredits: bonusAmount,
                  amount: (session.amount_total || 0) / 100,
                  currency: session.currency || "usd",
                });
                serverLogger.debug("Email", "Credits purchase email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send credits purchase email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to add credits", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "credit_package" },
                extra: { userId, packageId, totalCredits, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle playlist submission payments
        if (session.metadata?.productType === "playlist_submission") {
          const { submitterId, creatorId, trackId, playlistId, message, amount, trackName, playlistName, customerEmail, customerName } =
            session.metadata;

          if (submitterId && creatorId && trackId && playlistId) {
            serverLogger.payment("Processing playlist submission payment", {
              type: "playlist_submission",
              id: playlistId,
              amount: parseInt(amount || "0") / 100,
            });

            const { fetchMutation: fetchMutationSubmission, fetchQuery: fetchQuerySubmission } = await import("convex/nextjs");
            const { api: apiSubmission } = await import("@/convex/_generated/api");

            try {
              // Create the track submission with paid status
              const submissionId = await fetchMutationSubmission(
                apiSubmission.submissions.submitTrack,
                {
                  submitterId,
                  creatorId,
                  trackId: trackId as any,
                  playlistId: playlistId as any,
                  message: message || undefined,
                  submissionFee: parseInt(amount || "0") / 100,
                  paymentId: session.payment_intent as string,
                }
              );

              // Update payment status to paid
              await fetchMutationSubmission(
                apiSubmission.submissions.updatePaymentStatus,
                {
                  submissionId,
                  paymentStatus: "paid",
                  paymentId: session.payment_intent as string,
                }
              );

              serverLogger.info("Playlist Submission", "Submission created successfully");

              // Send playlist submission confirmation email
              try {
                const { sendPlaylistSubmissionEmail } = await import("@/lib/email");
                await sendPlaylistSubmissionEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Artist",
                  trackName: trackName || "Your Track",
                  playlistName: playlistName || "Playlist",
                  amount: parseInt(amount || "0") / 100,
                  currency: session.currency || "usd",
                  message: message || undefined,
                });
                serverLogger.debug("Email", "Playlist submission confirmation email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send playlist submission email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create playlist submission", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "playlist_submission" },
                extra: { submitterId, playlistId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle mixing service purchases
        if (session.metadata?.productType === "mixingService") {
          const {
            userId,
            creatorId,
            productId,
            storeId,
            serviceType,
            selectedTier,
            isRush,
            rushFee,
            basePrice,
            totalPrice,
            customerNotes,
            customerEmail,
            customerName,
            serviceTitle,
          } = session.metadata;

          if (userId && creatorId && productId && selectedTier) {
            serverLogger.payment("Processing mixing service purchase", {
              type: "mixingService",
              id: productId,
              amount: parseInt(totalPrice || "0") / 100,
            });

            const { fetchMutation: fetchMutationService, fetchQuery: fetchQueryService } = await import("convex/nextjs");
            const { api: apiService } = await import("@/convex/_generated/api");

            try {
              // Parse the selected tier from JSON string
              const tierData = JSON.parse(selectedTier);

              // Create the service order
              const orderId = await fetchMutationService(
                apiService.serviceOrders.createServiceOrder,
                {
                  customerId: userId,
                  creatorId,
                  productId: productId as any,
                  storeId: storeId || "",
                  serviceType: (serviceType as "mixing" | "mastering" | "mix-and-master" | "stem-mixing") || "mixing",
                  selectedTier: {
                    id: tierData.id || "basic",
                    name: tierData.name || "Basic Mix",
                    stemCount: tierData.stemCount || "Up to 30 stems",
                    price: tierData.price || parseInt(basePrice || "0"),
                    turnaroundDays: tierData.turnaroundDays || 7,
                    revisions: tierData.revisions || 2,
                  },
                  basePrice: parseInt(basePrice || "0"),
                  rushFee: isRush === "true" ? parseInt(rushFee || "0") : undefined,
                  totalPrice: parseInt(totalPrice || "0"),
                  isRush: isRush === "true",
                  customerNotes: customerNotes || undefined,
                  transactionId: session.payment_intent as string,
                }
              );

              serverLogger.info("Mixing Service", "Order created successfully");

              // Send mixing service confirmation email
              try {
                const { sendMixingServiceEmail } = await import("@/lib/email");

                // Get product details for email
                const product = await fetchQueryService(
                  apiService.digitalProducts.getProductById,
                  { productId: productId as any }
                );

                const serviceTypeLabel = {
                  'mixing': 'Mixing',
                  'mastering': 'Mastering',
                  'mix-and-master': 'Mix & Master',
                  'stem-mixing': 'Stem Mixing',
                }[serviceType as string] || 'Mixing';

                await sendMixingServiceEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Customer",
                  serviceTitle: serviceTitle || product?.title || "Mixing Service",
                  serviceType: serviceTypeLabel,
                  tierName: tierData.name || "Basic Mix",
                  turnaroundDays: tierData.turnaroundDays || 7,
                  revisions: tierData.revisions || 2,
                  isRush: isRush === "true",
                  amount: parseInt(totalPrice || "0") / 100,
                  currency: session.currency || "usd",
                  customerNotes: customerNotes || undefined,
                });
                serverLogger.debug("Email", "Mixing service confirmation email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send mixing service email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create mixing service order", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "mixingService" },
                extra: { userId, productId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle coaching session purchases
        if (session.metadata?.productType === "coaching") {
          const {
            productId,
            scheduledDate,
            startTime,
            customerEmail,
            customerName,
            userId,
            notes,
            amount,
            currency,
            sessionTitle,
            duration,
          } = session.metadata;

          if (userId && productId && scheduledDate && startTime) {
            serverLogger.payment("Processing coaching session purchase", {
              type: "coaching",
              id: productId,
              amount: parseInt(amount || "0") / 100,
            });

            const { fetchMutation: fetchMutationCoaching, fetchQuery: fetchQueryCoaching } = await import("convex/nextjs");
            const { api: apiCoaching } = await import("@/convex/_generated/api");

            try {
              // Book the coaching session
              const result = await fetchMutationCoaching(
                apiCoaching.coachingProducts.bookCoachingSession,
                {
                  productId: productId as any,
                  studentId: userId,
                  scheduledDate: parseInt(scheduledDate),
                  startTime,
                  notes: notes || undefined,
                }
              );

              if (result.success) {
                serverLogger.info("Coaching", "Session booked successfully");

                // Create a purchase record for the coaching session with correct productType
                const product = await fetchQueryCoaching(
                  apiCoaching.digitalProducts.getProductById,
                  { productId: productId as any }
                );

                if (product) {
                  // Use internal mutation to create coaching-specific purchase
                  await fetchMutationCoaching(
                    apiCoaching.purchases.createCoachingPurchase,
                    {
                      userId,
                      productId: productId as any,
                      coachingSessionId: result.sessionId!,
                      amount: parseInt(amount || "0"),
                      currency: currency || "USD",
                      paymentMethod: "stripe",
                      transactionId: session.payment_intent as string,
                    }
                  );
                  serverLogger.info("Coaching", "Purchase record created");

                  // Send coaching confirmation email
                  try {
                    const { sendCoachingConfirmationEmail } = await import("@/lib/email");
                    const dateObj = new Date(parseInt(scheduledDate));
                    await sendCoachingConfirmationEmail({
                      customerEmail: customerEmail || session.customer_details?.email || "",
                      customerName: customerName || session.customer_details?.name || "Student",
                      sessionTitle: sessionTitle || product.title || "Coaching Session",
                      scheduledDate: dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
                      scheduledTime: startTime,
                      duration: duration || "60 minutes",
                      amount: parseInt(amount || "0") / 100,
                      currency: currency || "USD",
                    });
                    serverLogger.debug("Email", "Coaching confirmation email sent");
                  } catch (emailError) {
                    serverLogger.error("Failed to send coaching confirmation email", emailError);
                  }
                }
              } else {
                serverLogger.error("Failed to book coaching session", result.error);
              }
            } catch (error) {
              serverLogger.error("Failed to process coaching purchase", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "coaching" },
                extra: { userId, productId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        // Handle tip jar purchases
        if (session.metadata?.productType === "tip") {
          const { userId, tipJarId, tipJarTitle, amount, currency, customerEmail, customerName, message, storeId } =
            session.metadata;

          if (userId && tipJarId && amount) {
            serverLogger.payment("Processing tip purchase", {
              type: "tip",
              id: tipJarId,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
            });

            const { fetchMutation: fetchMutationTip } = await import("convex/nextjs");
            const { api: apiTip } = await import("@/convex/_generated/api");

            try {
              // Create the tip purchase record using digital product purchase mutation
              const purchaseId = await fetchMutationTip(
                apiTip.library.createDigitalProductPurchase,
                {
                  userId,
                  productId: tipJarId as any,
                  amount: parseInt(amount),
                  currency: currency || "USD",
                  paymentMethod: "stripe",
                  transactionId: session.payment_intent as string,
                }
              );

              serverLogger.info("Tip", "Purchase created successfully");

              // Send tip confirmation email
              try {
                const { sendTipConfirmationEmail } = await import("@/lib/email");
                await sendTipConfirmationEmail({
                  customerEmail: customerEmail || session.customer_details?.email || "",
                  customerName: customerName || session.customer_details?.name || "Supporter",
                  tipJarTitle: tipJarTitle || "Tip Jar",
                  amount: parseInt(amount) / 100,
                  currency: currency || "USD",
                  message: message || undefined,
                });
                serverLogger.debug("Email", "Tip confirmation email sent");
              } catch (emailError) {
                serverLogger.error("Failed to send tip confirmation email", emailError);
              }
            } catch (error) {
              serverLogger.error("Failed to create tip purchase", error);
              Sentry.captureException(error, {
                tags: { component: "stripe-webhook", eventType: event.type, productType: "tip" },
                extra: { userId, tipJarId, stripeEventId: event.id, stripeSessionId: session.id },
              });
            }
          }
        }

        break;

      case "customer.subscription.updated":
        // Handle subscription status changes
        const updatedSubscription = event.data.object as any;
        serverLogger.payment("Subscription updated", {
          id: updatedSubscription.id,
          type: "subscription",
          status: updatedSubscription.status,
        });

        const { fetchMutation: fetchMutationUpdate } = await import("convex/nextjs");
        const { api: apiUpdate } = await import("@/convex/_generated/api");

        // Check if this is a PPR Pro subscription
        if (updatedSubscription.metadata?.productType === "ppr_pro") {
          const planInterval = updatedSubscription.items?.data?.[0]?.price?.recurring?.interval;
          await fetchMutationUpdate(apiUpdate.pprPro.updateSubscriptionStatus, {
            stripeSubscriptionId: updatedSubscription.id,
            status: updatedSubscription.status === "canceled"
              ? "cancelled" as const
              : updatedSubscription.status as "active" | "past_due" | "expired" | "trialing",
            currentPeriodStart: updatedSubscription.current_period_start
              ? updatedSubscription.current_period_start * 1000
              : undefined,
            currentPeriodEnd: updatedSubscription.current_period_end
              ? updatedSubscription.current_period_end * 1000
              : undefined,
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end || false,
            plan: planInterval === "year" ? "yearly" as const : "monthly" as const,
          });
          serverLogger.info("PPR Pro", "Subscription updated");
        }
        // Check if this is a creator plan subscription
        else if (updatedSubscription.metadata?.storeId && updatedSubscription.metadata?.plan) {
          await fetchMutationUpdate(apiUpdate.creatorPlans.updateSubscriptionStatus, {
            storeId: updatedSubscription.metadata.storeId as any,
            subscriptionStatus: updatedSubscription.status as
              | "active"
              | "trialing"
              | "past_due"
              | "canceled"
              | "incomplete",
          });
        } else {
          // Handle content subscriptions (existing)
          await fetchMutationUpdate(apiUpdate.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: updatedSubscription.id,
            status: updatedSubscription.status as "active" | "canceled" | "past_due" | "expired",
          });
        }
        break;

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        const deletedSubscription = event.data.object as Stripe.Subscription;
        serverLogger.payment("Subscription cancelled", {
          id: deletedSubscription.id,
          type: "subscription",
          status: "cancelled",
        });

        const { fetchMutation: fetchMutationDelete } = await import("convex/nextjs");
        const { api: apiDelete } = await import("@/convex/_generated/api");

        // Check if this is a PPR Pro subscription
        if (deletedSubscription.metadata?.productType === "ppr_pro") {
          await fetchMutationDelete(apiDelete.pprPro.expireSubscription, {
            stripeSubscriptionId: deletedSubscription.id,
          });
          serverLogger.info("PPR Pro", "Subscription expired/cancelled");

          // Send cancellation email
          try {
            const { sendPprProCancelledEmail } = await import("@/lib/email");
            const userId = deletedSubscription.metadata?.userId;
            if (userId) {
              const { fetchQuery: fetchQueryUser } = await import("convex/nextjs");
              const { api: apiUser } = await import("@/convex/_generated/api");
              const user = await fetchQueryUser(apiUser.users.getUserFromClerk, { clerkId: userId });
              if (user?.email) {
                await sendPprProCancelledEmail({
                  customerEmail: user.email,
                  customerName: user.name || "Member",
                  accessEndDate: (deletedSubscription as any).current_period_end
                    ? new Date((deletedSubscription as any).current_period_end * 1000).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "soon",
                });
              }
            }
          } catch (emailError) {
            serverLogger.error("Failed to send PPR Pro cancellation email", emailError);
          }
        }
        // Check if this is a creator plan subscription
        else if (deletedSubscription.metadata?.storeId) {
          await fetchMutationDelete(apiDelete.creatorPlans.updateSubscriptionStatus, {
            storeId: deletedSubscription.metadata.storeId as any,
            subscriptionStatus: "canceled",
            downgradeToPlan: "free",
          });
        } else {
          // Handle content subscriptions (existing)
          await fetchMutationDelete(apiDelete.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: deletedSubscription.id,
            status: "canceled",
          });
        }
        break;

      case "invoice.payment_succeeded":
        // Handle successful subscription renewal
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          serverLogger.payment("Subscription payment succeeded", {
            id: invoice.subscription,
            type: "invoice",
            amount: invoice.amount_paid / 100,
          });

          // Optionally track revenue here
        }
        break;

      case "invoice.payment_failed":
        // Handle failed subscription payment
        const failedInvoice = event.data.object as any;
        if (failedInvoice.subscription) {
          serverLogger.error("Subscription payment failed", {
            subscriptionId: failedInvoice.subscription,
            attemptCount: failedInvoice.attempt_count,
          });

          // Check if this is a PPR Pro subscription
          try {
            const failedSub = await stripe.subscriptions.retrieve(failedInvoice.subscription);
            if (failedSub.metadata?.productType === "ppr_pro") {
              const { fetchMutation: fetchMutationFailed } = await import("convex/nextjs");
              const { api: apiFailed } = await import("@/convex/_generated/api");

              await fetchMutationFailed(apiFailed.pprPro.updateSubscriptionStatus, {
                stripeSubscriptionId: failedInvoice.subscription,
                status: "past_due",
              });

              // Send payment failed email
              const failedUserId = failedSub.metadata?.userId;
              if (failedUserId) {
                const { fetchQuery: fetchQueryFailedUser } = await import("convex/nextjs");
                const { api: apiFailedUser } = await import("@/convex/_generated/api");
                const failedUser = await fetchQueryFailedUser(apiFailedUser.users.getUserFromClerk, {
                  clerkId: failedUserId,
                });
                if (failedUser?.email) {
                  const { sendPprProPaymentFailedEmail } = await import("@/lib/email");
                  await sendPprProPaymentFailedEmail({
                    customerEmail: failedUser.email,
                    customerName: failedUser.name || "Member",
                  });
                }
              }
            }
          } catch (pprProError) {
            serverLogger.error("Failed to handle PPR Pro payment failure", pprProError);
          }
        }
        break;

      case "payment_intent.payment_failed":
        // Handle failed payments
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        serverLogger.error("Payment failed", {
          id: failedPayment.id,
          metadata: failedPayment.metadata,
        });

        // Send payment failure notification
        try {
          const metadata = failedPayment.metadata || {};
          const { customerEmail, customerName, courseTitle, productType } = metadata;

          if (customerEmail) {
            // Import and send the actual email
            const { sendPaymentFailureEmail } = await import("@/lib/email");
            await sendPaymentFailureEmail({
              customerEmail,
              customerName: customerName || "Customer",
              productName: courseTitle || "your purchase",
              amount: failedPayment.amount / 100,
              currency: failedPayment.currency || "usd",
              failureReason: failedPayment.last_payment_error?.message || "Payment declined",
            });

          }
        } catch (error) {
          serverLogger.error("Failed to send payment failure notification", error);
        }

        break;

      case "transfer.created":
        // When money is transferred to a Connect account
        const transfer = event.data.object as Stripe.Transfer;
        serverLogger.payment("Transfer created", {
          id: transfer.id,
          amount: transfer.amount / 100,
          type: "transfer",
        });
        break;

      default:
        if ((event.type as string) === "transfer.paid") {
          // When transfer is completed
          const paidTransfer = event.data.object as Stripe.Transfer;

        } else {

        }
    }

    // Record successful processing for idempotency
    try {
      const { fetchMutation: fetchMutationRecord } = await import("convex/nextjs");
      const { api: apiRecord } = await import("@/convex/_generated/api");
      const successMetadata = (event.data.object as any)?.metadata;
      await fetchMutationRecord(apiRecord.webhookEvents.recordWebhookEvent, {
        stripeEventId: event.id,
        eventType: event.type,
        productType: successMetadata?.productType || "unknown",
        status: "processed" as const,
      });
    } catch (recordError) {
      serverLogger.error("Failed to record webhook event success", recordError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // CRITICAL: Return 200 even on processing errors to prevent Stripe retries
    // that could cause duplicate processing. Errors are logged for investigation.
    serverLogger.error("Webhook handler error", {
      eventType: event.type,
      eventId: event.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const metadata = (event.data.object as any)?.metadata;
    Sentry.captureException(error, {
      tags: {
        component: "stripe-webhook",
        eventType: event.type,
        productType: metadata?.productType || "unknown",
      },
      extra: {
        stripeEventId: event.id,
        userId: metadata?.userId,
        productId: metadata?.productId || metadata?.courseId || metadata?.bundleId,
      },
    });

    // Record failed processing for idempotency (allows retry)
    try {
      const { fetchMutation: fetchMutationFail } = await import("convex/nextjs");
      const { api: apiFail } = await import("@/convex/_generated/api");
      await fetchMutationFail(apiFail.webhookEvents.recordWebhookEvent, {
        stripeEventId: event.id,
        eventType: event.type,
        productType: metadata?.productType || "unknown",
        status: "failed" as const,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } catch (recordError) {
      serverLogger.error("Failed to record webhook event failure", recordError);
    }

    return NextResponse.json({ received: true, error: "Processing error logged" });
  }
}
