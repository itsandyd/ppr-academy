import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";

/**
 * Computes creator onboarding checklist status from existing data.
 * Steps:
 * 1. Set up your profile — bio + avatar present on store
 * 2. Customize your store — slug customized, accentColor or genreTags set
 * 3. Connect payments — Stripe connected on user record
 * 4. Create your first product — at least one product or course exists
 * 5. Share your store — store link has been copied (tracked via localStorage on client)
 */
export const getOnboardingStatus = query({
  args: { storeId: v.id("stores"), clerkId: v.string() },
  returns: v.object({
    dismissed: v.boolean(),
    steps: v.object({
      profileSetUp: v.boolean(),
      storeCustomized: v.boolean(),
      paymentsConnected: v.boolean(),
      firstProductCreated: v.boolean(),
    }),
    completedCount: v.number(),
    totalSteps: v.number(),
    storeSlug: v.string(),
    isNewCreator: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return {
        dismissed: true,
        steps: {
          profileSetUp: false,
          storeCustomized: false,
          paymentsConnected: false,
          firstProductCreated: false,
        },
        completedCount: 0,
        totalSteps: 5,
        storeSlug: "",
        isNewCreator: false,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // Step 1: Profile set up — has bio AND avatar (on store or user)
    const hasAvatar = !!(store.avatar || user?.imageUrl);
    const profileSetUp = !!(store.bio && store.bio.trim().length > 0 && hasAvatar);

    // Step 2: Store customized — has genreTags or accentColor or tagline set
    const storeCustomized = !!(
      (store.genreTags && store.genreTags.length > 0) ||
      store.accentColor ||
      (store.tagline && store.tagline.trim().length > 0)
    );

    // Step 3: Payments connected — Stripe is connected and fully enabled
    // Accept either stripeOnboardingComplete flag OR stripeAccountStatus === "enabled"
    // to handle cases where one was set by the webhook and the other by the client.
    const paymentsConnected = !!(
      user?.stripeConnectAccountId &&
      (user?.stripeOnboardingComplete || user?.stripeAccountStatus === "enabled")
    );

    // Step 4: First product created — check both digital products and courses
    // digitalProducts.storeId is v.string(), so convert the Id
    const storeIdStr = args.storeId as string;
    const hasDigitalProduct = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", storeIdStr))
      .first();

    const hasCourse = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .first();

    const firstProductCreated = !!(hasDigitalProduct || hasCourse);

    // Step 5 (Share your store) is tracked client-side via localStorage
    // It's included in the total count but computed on the client

    const steps = {
      profileSetUp,
      storeCustomized,
      paymentsConnected,
      firstProductCreated,
    };

    // Count server-side completed steps (client adds shareStore)
    const completedCount = Object.values(steps).filter(Boolean).length;

    // Determine if this is a new creator (store created within last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const isNewCreator = store._creationTime > thirtyDaysAgo;

    return {
      dismissed: !!store.onboardingDismissedAt,
      steps,
      completedCount,
      totalSteps: 5, // 4 server-side + 1 client-side (share store)
      storeSlug: store.slug,
      isNewCreator,
    };
  },
});

export const dismissOnboarding = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.storeId, {
      onboardingDismissedAt: Date.now(),
    });
  },
});
