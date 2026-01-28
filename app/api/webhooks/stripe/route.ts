import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

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
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // console.log(...);

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
          const user = await fetchQueryAccount(apiAccount.users.getUserByStripeAccountId, {
            stripeConnectAccountId: account.id,
          });

          if (user && user.clerkId) {
            // Determine account status
            let status: "pending" | "restricted" | "enabled" = "pending";
            if (account.charges_enabled && account.payouts_enabled) {
              status = "enabled";
            } else if (account.details_submitted) {
              status = "restricted"; // Submitted but not fully enabled
            }

            await fetchMutationAccount(apiAccount.users.updateUserByClerkId, {
              clerkId: user.clerkId as string,
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
            // console.log(...);
          }
        } catch (error) {
          console.error("❌ Failed to update user Stripe status:", error);
          // Don't throw - we still want to acknowledge the webhook
        }

        break;

      case "account.application.authorized":
        // When a user completes Connect onboarding
        const application = event.data.object as any;
        // console.log(...);
        break;

      case "payment_intent.succeeded":
        // Log successful payment (enrollment is handled in checkout.session.completed)
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("💰 Payment succeeded:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        });
        // Note: Course enrollment is created in checkout.session.completed handler
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

            // console.log(...);
          }
          // Handle membership subscriptions
          else if (productType === "membership" && userId) {
            const { tierId, creatorId, tierName, membershipName, customerEmail, customerName } = session.metadata || {};

            console.log("⭐ Creating membership subscription:", {
              userId,
              tierId,
              creatorId,
              stripeSubscriptionId: session.subscription,
              billingCycle,
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

              console.log("✅ Membership subscription created");

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
                console.log("✅ Membership confirmation email sent");
              } catch (emailError) {
                console.error("❌ Failed to send membership confirmation email:", emailError);
              }
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

            // console.log(...);
          }
        }

        // Handle course purchases
        if (session.metadata?.productType === "course") {
          const { userId, courseId, amount, currency, courseTitle, customerEmail, customerName } = session.metadata;

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
                console.log("✅ Course enrollment email sent");
              } catch (emailError) {
                console.error("❌ Failed to send course enrollment email:", emailError);
              }
            } catch (error) {
              console.error("❌ Failed to create course enrollment:", error);
            }
          }
        }

        // Handle digital product purchases
        if (session.metadata?.productType === "digitalProduct") {
          const { userId, productId, amount, currency, productTitle, customerEmail, customerName } = session.metadata;

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
                console.log("✅ Digital product purchase email sent");
              } catch (emailError) {
                console.error("❌ Failed to send digital product purchase email:", emailError);
              }
            } catch (error) {
              console.error("❌ Failed to create digital product purchase:", error);
            }
          }
        }

        if (session.metadata?.productType === "bundle") {
          const { userId, bundleId, amount, currency, bundleTitle, itemCount, customerEmail, customerName } = session.metadata;

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
                console.log("✅ Bundle purchase email sent");
              } catch (emailError) {
                console.error("❌ Failed to send bundle purchase email:", emailError);
              }
            } catch (error) {
              console.error("❌ Failed to create bundle purchase:", error);
            }
          }
        }

        // Handle beat lease purchases
        if (session.metadata?.productType === "beatLease") {
          const { userId, beatId, tierType, tierName, storeId, amount, currency, customerEmail, customerName } = session.metadata;

          if (userId && beatId && tierType && storeId && amount) {
            console.log("🎵 Processing beat lease purchase:", {
              userId,
              beatId,
              tierType,
              tierName,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
              sessionId: session.id,
              paymentIntentId: session.payment_intent,
            });

            const { fetchMutation: fetchMutationBeatLease, fetchQuery: fetchQueryBeat } = await import("convex/nextjs");
            const { api: apiBeatLease, internal: internalBeatLease } = await import("@/convex/_generated/api");

            try {
              // Get beat details for email
              const beat = await fetchQueryBeat(apiBeatLease.digitalProducts.getProductById, {
                productId: beatId as any,
              });

              // Create the beat license purchase
              const result = await fetchMutationBeatLease(
                apiBeatLease.beatLeases.createBeatLicensePurchase,
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

              console.log("✅ Beat license purchase created:", {
                purchaseId: result.purchaseId,
                beatLicenseId: result.beatLicenseId,
                userId,
                beatId,
                tierType,
              });

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
                console.log("✅ Beat purchase email sent");
              } catch (emailError) {
                console.error("❌ Failed to send beat purchase email:", emailError);
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
                  console.log("✅ Beat marked as exclusively sold:", { beatId });
                } catch (exclusiveError) {
                  console.error("❌ Failed to mark beat as exclusively sold:", exclusiveError);
                }
              }
            } catch (error) {
              console.error("❌ Failed to create beat license purchase:", error);
            }
          }
        }

        // Handle credit package purchases
        if (session.metadata?.productType === "credit_package") {
          const { userId, packageId, credits, bonusCredits, packageName, customerEmail, customerName } = session.metadata;
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

              console.log("✅ Credits added successfully:", {
                userId,
                purchased: creditsAmount,
                bonus: bonusAmount,
                total: totalCredits,
              });

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
                console.log("✅ Credits purchase email sent");
              } catch (emailError) {
                console.error("❌ Failed to send credits purchase email:", emailError);
              }
            } catch (error) {
              console.error("❌ Failed to add credits:", error);
            }
          }
        }

        // Handle playlist submission payments
        if (session.metadata?.productType === "playlist_submission") {
          const { submitterId, creatorId, trackId, playlistId, message, amount, trackName, playlistName, customerEmail, customerName } =
            session.metadata;

          if (submitterId && creatorId && trackId && playlistId) {
            console.log("🎵 Processing playlist submission payment:", {
              submitterId,
              creatorId,
              playlistId,
              trackId,
              amount: parseInt(amount || "0") / 100,
              sessionId: session.id,
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

              console.log("✅ Playlist submission created:", {
                submissionId,
                submitterId,
                playlistId,
              });

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
                console.log("✅ Playlist submission confirmation email sent");
              } catch (emailError) {
                console.error("❌ Failed to send playlist submission email:", emailError);
              }
            } catch (error) {
              console.error("❌ Failed to create playlist submission:", error);
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
            console.log("🎚️ Processing mixing service purchase:", {
              userId,
              creatorId,
              productId,
              serviceType,
              totalPrice: parseInt(totalPrice || "0"),
              sessionId: session.id,
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

              console.log("✅ Mixing service order created:", {
                orderId,
                userId,
                creatorId,
                productId,
              });

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
                console.log("✅ Mixing service confirmation email sent");
              } catch (emailError) {
                console.error("❌ Failed to send mixing service email:", emailError);
              }
            } catch (error) {
              console.error("❌ Failed to create mixing service order:", error);
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
            console.log("💬 Processing coaching session purchase:", {
              userId,
              productId,
              scheduledDate,
              startTime,
              amount: parseInt(amount || "0") / 100,
              sessionId: session.id,
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
                console.log("✅ Coaching session booked:", {
                  sessionId: result.sessionId,
                  userId,
                  productId,
                  scheduledDate: new Date(parseInt(scheduledDate)).toISOString(),
                });

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
                  console.log("✅ Coaching purchase record created");

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
                    console.log("✅ Coaching confirmation email sent");
                  } catch (emailError) {
                    console.error("❌ Failed to send coaching confirmation email:", emailError);
                  }
                }
              } else {
                console.error("❌ Failed to book coaching session:", result.error);
              }
            } catch (error) {
              console.error("❌ Failed to process coaching purchase:", error);
            }
          }
        }

        // Handle tip jar purchases
        if (session.metadata?.productType === "tip") {
          const { userId, tipJarId, tipJarTitle, amount, currency, customerEmail, customerName, message, storeId } =
            session.metadata;

          if (userId && tipJarId && amount) {
            console.log("💝 Processing tip purchase:", {
              userId,
              tipJarId,
              tipJarTitle,
              amount: parseInt(amount) / 100,
              currency: currency || "USD",
              sessionId: session.id,
              paymentIntentId: session.payment_intent,
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

              console.log("✅ Tip purchase created:", {
                purchaseId,
                userId,
                tipJarId,
                amount: parseInt(amount) / 100,
              });

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
                console.log("✅ Tip confirmation email sent");
              } catch (emailError) {
                console.error("❌ Failed to send tip confirmation email:", emailError);
                // Don't fail the webhook if email fails
              }
            } catch (error) {
              console.error("❌ Failed to create tip purchase:", error);
            }
          }
        }

        break;

      case "customer.subscription.updated":
        // Handle subscription status changes
        const updatedSubscription = event.data.object as any;
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
          // console.log(...);
        } else {
          // Handle content subscriptions (existing)
          await fetchMutationUpdate(apiUpdate.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: updatedSubscription.id,
            status: updatedSubscription.status as "active" | "canceled" | "past_due" | "expired",
          });
          // console.log(...);
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
          // console.log(...);
        } else {
          // Handle content subscriptions (existing)
          await fetchMutationDelete(apiDelete.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: deletedSubscription.id,
            status: "canceled",
          });
          // console.log(...);
        }
        break;

      case "invoice.payment_succeeded":
        // Handle successful subscription renewal
        const invoice = event.data.object as any;
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
        const failedInvoice = event.data.object as any;
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
            // console.log(...);
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

      default:
        if ((event.type as string) === "transfer.paid") {
          // When transfer is completed
          const paidTransfer = event.data.object as Stripe.Transfer;
          // console.log(...);
        } else {
          // console.log(...);
        }
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
