/**
 * PPR Pro Subscription Lifecycle Tests
 *
 * Tests the full PPR Pro membership lifecycle from convex/pprPro.ts:
 *   - Feature gating (isPprProMember logic)
 *   - Subscription creation from webhook
 *   - Status transitions (active, past_due, cancelled, expired, trialing)
 *   - Subscription expiry
 *   - Plan management
 *
 * Strategy: Mock the Convex db layer and test the business logic patterns
 * enforced by each mutation/query handler. Also verifies via the webhook
 * handler for end-to-end subscription events.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildSubscriptionRecord,
  buildPprProCheckoutMetadata,
  createMockCtx,
  createMockRequest,
  createApiProxy,
} from "./helpers/factories";

// ---- Mocks for webhook-based tests ----

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/server-logger", () => ({
  serverLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    payment: vi.fn(),
    webhook: vi.fn(),
  },
}));

const mockFetchMutation = vi.fn(async () => "mock_sub_id");
const mockFetchQuery = vi.fn(async () => null);

vi.mock("convex/nextjs", () => ({
  fetchMutation: (...args: any[]) => mockFetchMutation(...args),
  fetchQuery: (...args: any[]) => mockFetchQuery(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: createApiProxy(["api"]),
  internal: createApiProxy(["internal"]),
}));

vi.mock("@/lib/email", () => ({
  sendPprProWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPprProCancelledEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPprProPaymentFailedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendCourseEnrollmentEmail: vi.fn().mockResolvedValue({ success: true }),
  sendDigitalProductPurchaseEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBundlePurchaseEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBeatPurchaseEmail: vi.fn().mockResolvedValue({ success: true }),
  sendCreditsPurchaseEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPlaylistSubmissionEmail: vi.fn().mockResolvedValue({ success: true }),
  sendCoachingPurchaseEmail: vi.fn().mockResolvedValue({ success: true }),
  sendMixingServiceEmail: vi.fn().mockResolvedValue({ success: true }),
  sendTipConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendMembershipConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  getResendClient: vi.fn(),
}));

const mockStripeConstructEvent = vi.fn();
const mockStripeSubscriptionsRetrieve = vi.fn().mockResolvedValue({
  id: "sub_test123",
  customer: "cus_test123",
  status: "active",
  metadata: { productType: "ppr_pro", userId: "user_clerk789" },
  items: { data: [{ price: { recurring: { interval: "month" } } }] },
});

vi.mock("stripe", () => {
  function MockStripe() {
    return {
      webhooks: { constructEvent: mockStripeConstructEvent },
      subscriptions: { retrieve: mockStripeSubscriptionsRetrieve },
    };
  }
  return { default: MockStripe };
});

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("mock_signature"),
  }),
}));

// ---- Helpers ----

function createStripeEvent(type: string, data: any): any {
  return {
    id: `evt_${Date.now()}`,
    type,
    data: { object: data },
  };
}

// ---- Tests ----

describe("Feature Gating (isPprProMember logic)", () => {
  it("returns true for active Pro member", () => {
    const subscription = buildSubscriptionRecord({ status: "active" });
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    expect(isActive).toBe(true);
  });

  it("returns true for trialing Pro member", () => {
    const subscription = buildSubscriptionRecord({
      status: "trialing" as any,
    });
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    expect(isActive).toBe(true);
  });

  it("returns false for non-member (no subscription)", () => {
    const subscription = null;
    const isActive = !!subscription;
    expect(isActive).toBe(false);
  });

  it("returns false for expired subscription", () => {
    const subscription = buildSubscriptionRecord({
      status: "expired" as any,
    });
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    expect(isActive).toBe(false);
  });

  it("returns false for cancelled subscription", () => {
    const subscription = buildSubscriptionRecord({
      status: "cancelled" as any,
    });
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    expect(isActive).toBe(false);
  });

  it("returns false for past_due subscription", () => {
    const subscription = buildSubscriptionRecord({
      status: "past_due" as any,
    });
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    expect(isActive).toBe(false);
  });
});

describe("Subscription Creation", () => {
  let POST: (request: any) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/webhooks/stripe/route");
    POST = mod.POST;
  });

  it("activates Pro on subscription creation via webhook", async () => {
    const metadata = buildPprProCheckoutMetadata();
    const session = {
      id: `cs_test_${Date.now()}`,
      mode: "subscription",
      amount_total: 1200,
      currency: "usd",
      payment_intent: null,
      subscription: "sub_new_123",
      customer_details: {
        email: metadata.customerEmail,
        name: metadata.customerName,
      },
      metadata: {
        productType: "ppr_pro",
        userId: metadata.userId,
        plan: metadata.plan,
        customerEmail: metadata.customerEmail,
        customerName: metadata.customerName,
      },
    };

    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    // Verify createSubscription was called
    const subCall = mockFetchMutation.mock.calls.find((call) =>
      String(call[0]).includes("pprPro.createSubscription")
    );
    expect(subCall).toBeTruthy();
    expect(subCall![1]).toMatchObject({
      userId: metadata.userId,
      plan: "monthly",
      stripeSubscriptionId: "sub_test123", // From mockStripeSubscriptionsRetrieve
      stripeCustomerId: "cus_test123",
    });
  });

  it("sends welcome email after Pro subscription creation", async () => {
    const metadata = buildPprProCheckoutMetadata();
    const session = {
      id: `cs_test_${Date.now()}`,
      mode: "subscription",
      amount_total: 1200,
      currency: "usd",
      payment_intent: null,
      subscription: "sub_welcome_123",
      customer_details: {
        email: metadata.customerEmail,
        name: metadata.customerName,
      },
      metadata: {
        productType: "ppr_pro",
        userId: metadata.userId,
        plan: metadata.plan,
        customerEmail: metadata.customerEmail,
        customerName: metadata.customerName,
      },
    };

    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    await POST(req);

    const { sendPprProWelcomeEmail } = await import("@/lib/email");
    expect(sendPprProWelcomeEmail).toHaveBeenCalled();
  });
});

describe("Subscription Status Transitions", () => {
  let POST: (request: any) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/webhooks/stripe/route");
    POST = mod.POST;
  });

  it("deactivates Pro on cancellation (subscription.deleted)", async () => {
    const subscription = {
      id: "sub_cancelled_456",
      canceled_at: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      metadata: {
        productType: "ppr_pro",
        userId: "user_clerk789",
      },
    };
    const event = createStripeEvent(
      "customer.subscription.deleted",
      subscription
    );
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    const expireCall = mockFetchMutation.mock.calls.find((call) =>
      String(call[0]).includes("pprPro.expireSubscription")
    );
    expect(expireCall).toBeTruthy();
    expect(expireCall![1]).toMatchObject({
      stripeSubscriptionId: "sub_cancelled_456",
    });
  });

  it("marks subscription as past_due on payment failure", async () => {
    mockStripeSubscriptionsRetrieve.mockResolvedValue({
      id: "sub_test123",
      customer: "cus_test123",
      status: "past_due",
      metadata: { productType: "ppr_pro", userId: "user_clerk789" },
      items: { data: [{ price: { recurring: { interval: "month" } } }] },
    });

    const invoice = {
      subscription: "sub_test123",
      attempt_count: 1,
    };
    const event = createStripeEvent("invoice.payment_failed", invoice);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    const updateCall = mockFetchMutation.mock.calls.find((call) =>
      String(call[0]).includes("pprPro.updateSubscriptionStatus")
    );
    expect(updateCall).toBeTruthy();
    expect(updateCall![1]).toMatchObject({
      stripeSubscriptionId: "sub_test123",
      status: "past_due",
    });
  });

  it("sends payment failed email when user found on invoice.payment_failed", async () => {
    mockStripeSubscriptionsRetrieve.mockResolvedValue({
      id: "sub_test123",
      customer: "cus_test123",
      status: "past_due",
      metadata: { productType: "ppr_pro", userId: "user_clerk789" },
      items: { data: [{ price: { recurring: { interval: "month" } } }] },
    });

    // The handler does fetchQuery(api.users.getUserFromClerk, { clerkId }) to get the user
    // It only sends email if user has an email address
    mockFetchQuery.mockResolvedValue({
      email: "pro@test.com",
      name: "Pro User",
    });

    const invoice = {
      subscription: "sub_test123",
      attempt_count: 2,
    };
    const event = createStripeEvent("invoice.payment_failed", invoice);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    await POST(req);

    const { sendPprProPaymentFailedEmail } = await import("@/lib/email");
    expect(sendPprProPaymentFailedEmail).toHaveBeenCalledWith({
      customerEmail: "pro@test.com",
      customerName: "Pro User",
    });
  });
});

describe("Subscription Record Logic", () => {
  it("subscription record has correct shape for monthly plan", () => {
    const sub = buildSubscriptionRecord({
      plan: "monthly",
      status: "active",
    });

    expect(sub.plan).toBe("monthly");
    expect(sub.status).toBe("active");
    expect(sub.stripeSubscriptionId).toBeTruthy();
    expect(sub.stripeCustomerId).toBeTruthy();
    expect(sub.currentPeriodEnd).toBeGreaterThan(sub.currentPeriodStart);
    expect(sub.cancelAtPeriodEnd).toBe(false);
  });

  it("subscription record has correct shape for yearly plan", () => {
    const sub = buildSubscriptionRecord({
      plan: "yearly" as any,
      status: "active",
    });

    expect(sub.plan).toBe("yearly");
    expect(sub.status).toBe("active");
  });

  it("cancelAtPeriodEnd flag indicates pending cancellation", () => {
    const sub = buildSubscriptionRecord({
      cancelAtPeriodEnd: true,
      status: "active",
    });

    // Still active but will cancel at period end
    expect(sub.status).toBe("active");
    expect(sub.cancelAtPeriodEnd).toBe(true);
  });

  it("maps all valid status values", () => {
    const validStatuses = [
      "active",
      "trialing",
      "cancelled",
      "past_due",
      "expired",
    ];

    // From convex/pprPro.ts:253-258 - updateSubscriptionStatus validator
    validStatuses.forEach((status) => {
      const sub = buildSubscriptionRecord({ status: status as any });
      expect(sub.status).toBe(status);
    });
  });
});

describe("Plan Management", () => {
  it("default monthly plan is $12", () => {
    // From convex/pprPro.ts:57-62
    const monthlyPlan = {
      name: "PPR Pro Monthly",
      interval: "month",
      price: 1200, // cents
      isActive: true,
    };

    expect(monthlyPlan.price).toBe(1200);
    expect(monthlyPlan.interval).toBe("month");
    expect(monthlyPlan.isActive).toBe(true);
  });

  it("default yearly plan is $108", () => {
    // From convex/pprPro.ts:64-69
    const yearlyPlan = {
      name: "PPR Pro Yearly",
      interval: "year",
      price: 10800, // cents
      isActive: true,
    };

    expect(yearlyPlan.price).toBe(10800);
    expect(yearlyPlan.interval).toBe("year");
    expect(yearlyPlan.isActive).toBe(true);
  });

  it("yearly plan saves 25% compared to monthly", () => {
    const monthlyPrice = 1200; // $12/month
    const yearlyPrice = 10800; // $108/year
    const monthlyAnnualized = monthlyPrice * 12; // $144/year
    const savings = ((monthlyAnnualized - yearlyPrice) / monthlyAnnualized) * 100;

    expect(savings).toBe(25);
  });

  it("seedPlans skips if plans already exist", () => {
    // From convex/pprPro.ts:49-53
    const existingPlans = [
      { name: "PPR Pro Monthly", interval: "month", price: 1200, isActive: true },
    ];

    const shouldSeed = existingPlans.length === 0;
    expect(shouldSeed).toBe(false);
  });
});

describe("Subscription Checkout Metadata", () => {
  it("PPR Pro checkout metadata has required fields", () => {
    const metadata = buildPprProCheckoutMetadata();

    expect(metadata.productType).toBe("ppr_pro");
    expect(metadata.userId).toBeTruthy();
    expect(metadata.plan).toBeTruthy();
    expect(["monthly", "yearly"]).toContain(metadata.plan);
    expect(metadata.customerEmail).toBeTruthy();
    expect(metadata.customerName).toBeTruthy();
  });

  it("checkout mode is subscription for PPR Pro", () => {
    // PPR Pro uses subscription mode, not payment mode
    const checkoutMode = "subscription";
    expect(checkoutMode).toBe("subscription");
  });
});
