import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * PAYMENT PLANS & INSTALLMENTS
 * Allows customers to pay for courses/products over time
 */

// ===== QUERIES =====

export const getUserPaymentPlans = query({
  args: { 
    userId: v.string(),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("defaulted"),
      v.literal("canceled")
    )),
  },
  handler: async (ctx, args) => {
    let plans = await ctx.db
      .query("paymentPlans")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    if (args.status) {
      plans = plans.filter((p) => p.status === args.status);
    }

    // Enrich with item details and installment info
    const enriched = await Promise.all(
      plans.map(async (plan) => {
        const installments = await ctx.db
          .query("installmentPayments")
          .withIndex("by_plan", (q: any) => q.eq("paymentPlanId", plan._id))
          .collect();

        const paidInstallments = installments.filter((i) => i.status === "paid");
        const nextInstallment = installments.find((i) => i.status === "pending");

        return {
          ...plan,
          paidInstallments: paidInstallments.length,
          totalInstallments: installments.length,
          nextPayment: nextInstallment
            ? {
                amount: nextInstallment.amount,
                dueDate: nextInstallment.dueDate,
              }
            : null,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPaymentPlanDetails = query({
  args: { planId: v.id("paymentPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    const installments = await ctx.db
      .query("installmentPayments")
      .withIndex("by_plan", (q: any) => q.eq("paymentPlanId", args.planId))
      .collect();

    return {
      ...plan,
      installments: installments.sort((a, b) => a.installmentNumber - b.installmentNumber),
    };
  },
});

export const getUpcomingPayments = query({
  args: { 
    userId: v.string(),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const futureDate = now + (args.daysAhead || 30) * 24 * 60 * 60 * 1000;

    const installments = await ctx.db
      .query("installmentPayments")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => 
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lte(q.field("dueDate"), futureDate)
        )
      )
      .collect();

    return installments.sort((a, b) => a.dueDate - b.dueDate);
  },
});

// ===== MUTATIONS =====

export const createPaymentPlan = mutation({
  args: {
    userId: v.string(),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),
    bundleId: v.optional(v.id("bundles")),
    totalAmount: v.number(),
    downPayment: v.number(),
    numberOfInstallments: v.number(),
    frequency: v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly")),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.downPayment >= args.totalAmount) {
      throw new Error("Down payment must be less than total amount");
    }

    const now = Date.now();
    const remainingAmount = args.totalAmount - args.downPayment;
    const installmentAmount = Math.round(remainingAmount / args.numberOfInstallments);

    // Calculate next payment date based on frequency
    let nextPaymentDate = now;
    const frequencyDays = 
      args.frequency === "weekly" ? 7 :
      args.frequency === "biweekly" ? 14 :
      30; // monthly

    nextPaymentDate += frequencyDays * 24 * 60 * 60 * 1000;

    const planId = await ctx.db.insert("paymentPlans", {
      userId: args.userId,
      courseId: args.courseId,
      productId: args.productId,
      bundleId: args.bundleId,
      totalAmount: args.totalAmount,
      downPayment: args.downPayment,
      remainingAmount,
      numberOfInstallments: args.numberOfInstallments,
      installmentAmount,
      frequency: args.frequency,
      status: "active",
      nextPaymentDate,
      installmentsPaid: 0,
      installmentsMissed: 0,
      stripeSubscriptionId: args.stripeSubscriptionId,
      createdAt: now,
      updatedAt: now,
    });

    // Create installment records
    for (let i = 1; i <= args.numberOfInstallments; i++) {
      const dueDate = now + i * frequencyDays * 24 * 60 * 60 * 1000;
      
      // Last installment gets any rounding remainder
      const isLast = i === args.numberOfInstallments;
      const amount = isLast 
        ? remainingAmount - (installmentAmount * (args.numberOfInstallments - 1))
        : installmentAmount;

      await ctx.db.insert("installmentPayments", {
        paymentPlanId: planId,
        userId: args.userId,
        installmentNumber: i,
        amount,
        status: "pending",
        dueDate,
        retryAttempts: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, planId };
  },
});

export const recordInstallmentPayment = mutation({
  args: {
    installmentId: v.id("installmentPayments"),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const installment = await ctx.db.get(args.installmentId);
    if (!installment) {
      throw new Error("Installment not found");
    }

    const plan = await ctx.db.get(installment.paymentPlanId);
    if (!plan) {
      throw new Error("Payment plan not found");
    }

    const now = Date.now();

    // Update installment
    await ctx.db.patch(args.installmentId, {
      status: "paid",
      paidAt: now,
      stripePaymentIntentId: args.stripePaymentIntentId,
      updatedAt: now,
    });

    // Update plan
    const newInstallmentsPaid = plan.installmentsPaid + 1;
    const isCompleted = newInstallmentsPaid >= plan.numberOfInstallments;

    await ctx.db.patch(installment.paymentPlanId, {
      installmentsPaid: newInstallmentsPaid,
      remainingAmount: Math.max(0, plan.remainingAmount - installment.amount),
      status: isCompleted ? "completed" : "active",
      nextPaymentDate: isCompleted ? undefined : plan.nextPaymentDate + (
        plan.frequency === "weekly" ? 7 :
        plan.frequency === "biweekly" ? 14 :
        30
      ) * 24 * 60 * 60 * 1000,
      updatedAt: now,
    });

    return { success: true, completed: isCompleted };
  },
});

export const recordFailedPayment = mutation({
  args: {
    installmentId: v.id("installmentPayments"),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    const installment = await ctx.db.get(args.installmentId);
    if (!installment) {
      throw new Error("Installment not found");
    }

    const plan = await ctx.db.get(installment.paymentPlanId);
    if (!plan) {
      throw new Error("Payment plan not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.installmentId, {
      status: "failed",
      failureReason: args.failureReason,
      retryAttempts: installment.retryAttempts + 1,
      updatedAt: now,
    });

    // Update plan - mark as defaulted after 3 failed attempts
    if (installment.retryAttempts + 1 >= 3) {
      await ctx.db.patch(installment.paymentPlanId, {
        status: "defaulted",
        installmentsMissed: plan.installmentsMissed + 1,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

export const cancelPaymentPlan = mutation({
  args: { planId: v.id("paymentPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Payment plan not found");
    }

    // Cancel all pending installments
    const pendingInstallments = await ctx.db
      .query("installmentPayments")
      .withIndex("by_plan", (q: any) => q.eq("paymentPlanId", args.planId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();

    await Promise.all(
      pendingInstallments.map((installment) =>
        ctx.db.delete(installment._id)
      )
    );

    await ctx.db.patch(args.planId, {
      status: "canceled",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});




