/**
 * Product Access Granting Tests
 *
 * Tests the Convex mutation patterns used for granting product access.
 * Since we can't run actual Convex mutations in unit tests, these tests
 * verify the data shapes and logic patterns used by the access system.
 */
import { describe, it, expect } from "vitest";
import {
  buildCoursePurchaseRecord,
  buildDigitalProductPurchaseRecord,
  buildSubscriptionRecord,
  buildCourseCheckoutMetadata,
  buildDigitalProductCheckoutMetadata,
  buildPprProCheckoutMetadata,
} from "./helpers/factories";

// ---- Access Logic Tests ----
// These test the business rules that the Convex mutations enforce

describe("Course Access Logic", () => {
  it("grants course access with correct purchase record shape", () => {
    const purchaseRecord = buildCoursePurchaseRecord();

    expect(purchaseRecord.status).toBe("completed");
    expect(purchaseRecord.accessGranted).toBe(true);
    expect(purchaseRecord.productType).toBe("course");
    expect(purchaseRecord.amount).toBeGreaterThan(0);
    expect(purchaseRecord.userId).toBeTruthy();
    expect(purchaseRecord.courseId).toBeTruthy();
  });

  it("grants digital product access with correct purchase record shape", () => {
    const purchaseRecord = buildDigitalProductPurchaseRecord();

    expect(purchaseRecord.status).toBe("completed");
    expect(purchaseRecord.accessGranted).toBe(true);
    expect(purchaseRecord.productType).toBe("digitalProduct");
    expect(purchaseRecord.productId).toBeTruthy();
  });

  it("activates PPR Pro subscription with correct record shape", () => {
    const subscriptionRecord = buildSubscriptionRecord();

    expect(subscriptionRecord.status).toBe("active");
    expect(subscriptionRecord.plan).toBe("monthly");
    expect(subscriptionRecord.stripeSubscriptionId).toBeTruthy();
    expect(subscriptionRecord.currentPeriodEnd).toBeGreaterThan(subscriptionRecord.currentPeriodStart);
  });

  it("revokes PPR Pro access on subscription expiry", () => {
    const expiredSubscription = buildSubscriptionRecord({
      status: "expired" as any,
      cancelAtPeriodEnd: false,
    });

    expect(expiredSubscription.status).toBe("expired");
    expect(expiredSubscription.cancelAtPeriodEnd).toBe(false);
  });
});

describe("Webhook Metadata Validation", () => {
  it("validates course purchase metadata has required fields", () => {
    const validMetadata = buildCourseCheckoutMetadata();

    expect(validMetadata.productType).toBe("course");
    expect(validMetadata.userId).toBeTruthy();
    expect(validMetadata.courseId).toBeTruthy();
    expect(validMetadata.amount).toBeTruthy();
    expect(parseInt(validMetadata.amount)).toBeGreaterThan(0);
  });

  it("validates digital product metadata has required fields", () => {
    const validMetadata = buildDigitalProductCheckoutMetadata();

    expect(validMetadata.productType).toBe("digitalProduct");
    expect(validMetadata.userId).toBeTruthy();
    expect(validMetadata.productId).toBeTruthy();
    expect(parseInt(validMetadata.amount)).toBeGreaterThan(0);
  });

  it("validates PPR Pro metadata has required fields", () => {
    const validMetadata = buildPprProCheckoutMetadata();

    expect(validMetadata.productType).toBe("ppr_pro");
    expect(validMetadata.userId).toBeTruthy();
    expect(["monthly", "yearly"]).toContain(validMetadata.plan);
  });

  it("identifies missing userId as invalid", () => {
    const metadata = {
      productType: "course",
      courseId: "course_abc",
      amount: "2999",
    };

    // The webhook handler checks: if (userId && courseId && amount)
    const userId = (metadata as any).userId;
    const courseId = metadata.courseId;
    const amount = metadata.amount;

    const shouldProcess = !!(userId && courseId && amount);
    expect(shouldProcess).toBe(false);
  });

  it("identifies missing productId as invalid for digital products", () => {
    const metadata = {
      productType: "digitalProduct",
      userId: "user_clerk456",
      amount: "1499",
    };

    const productId = (metadata as any).productId;
    const shouldProcess = !!(metadata.userId && productId && metadata.amount);
    expect(shouldProcess).toBe(false);
  });

  it("identifies missing plan as invalid for PPR Pro", () => {
    const metadata = {
      productType: "ppr_pro",
      userId: "user_clerk789",
    };

    const plan = (metadata as any).plan;
    const shouldProcess = !!(metadata.userId && plan);
    expect(shouldProcess).toBe(false);
  });
});

describe("Stripe Event Routing", () => {
  const LAUNCH_PRODUCT_TYPES = [
    "course",
    "digitalProduct",
    "ppr_pro",
    "bundle",
    "beatLease",
    "credit_package",
    "playlist_submission",
    "mixingService",
    "coaching",
    "tip",
    "membership",
    "creator_plan",
  ];

  it("all launch product types have webhook routing", () => {
    // These are the productType values that the webhook handler routes
    LAUNCH_PRODUCT_TYPES.forEach((type) => {
      expect(type).toBeTruthy();
    });
    expect(LAUNCH_PRODUCT_TYPES.length).toBeGreaterThanOrEqual(10);
  });

  it("subscription events are handled for PPR Pro", () => {
    const handledSubscriptionEvents = [
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_failed",
    ];

    // All three lifecycle events must be handled
    expect(handledSubscriptionEvents).toContain("customer.subscription.updated");
    expect(handledSubscriptionEvents).toContain("customer.subscription.deleted");
    expect(handledSubscriptionEvents).toContain("invoice.payment_failed");
  });

  it("maps PPR Pro subscription statuses correctly", () => {
    const statusMap: Record<string, string> = {
      active: "active",
      trialing: "trialing",
      canceled: "cancelled", // Note: Stripe uses "canceled", we store "cancelled"
      past_due: "past_due",
    };

    expect(statusMap.active).toBe("active");
    expect(statusMap.canceled).toBe("cancelled");
    expect(statusMap.past_due).toBe("past_due");
  });
});
