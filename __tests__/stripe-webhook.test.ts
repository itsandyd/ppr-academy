/**
 * Stripe Webhook Handler Tests
 *
 * Tests the webhook POST handler at app/api/webhooks/stripe/route.ts
 *
 * Strategy: Since the webhook handler has many dynamic imports that are
 * difficult to fully mock in vitest, we use a hybrid approach:
 * - Integration tests for the handler itself (signature verification, error handling)
 * - Logic tests for the business rules that the handler enforces
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildCheckoutSession,
  buildCourseCheckoutMetadata,
  buildDigitalProductCheckoutMetadata,
  buildPprProCheckoutMetadata,
  buildBundleCheckoutMetadata,
  buildStripeSubscription,
  createMockRequest,
  createApiProxy,
} from "./helpers/factories";

// ---- Mocks ----

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// Mock serverLogger
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

// Track all Convex mutations/queries called
const mockFetchMutation = vi.fn(async () => "mock_purchase_id");
const mockFetchQuery = vi.fn(async () => null);

// Mock convex/nextjs
vi.mock("convex/nextjs", () => ({
  fetchMutation: (...args: any[]) => mockFetchMutation(...args),
  fetchQuery: (...args: any[]) => mockFetchQuery(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: createApiProxy(["api"]),
  internal: createApiProxy(["internal"]),
}));

// Mock email functions — use explicit exports to avoid Proxy issues with dynamic import
vi.mock("@/lib/email", () => ({
  sendCourseEnrollmentEmail: vi.fn().mockResolvedValue({ success: true }),
  sendDigitalProductPurchaseEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPprProWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPprProCancelledEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPprProPaymentFailedEmail: vi.fn().mockResolvedValue({ success: true }),
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

// Mock Stripe
const mockSubscription = buildStripeSubscription();

const mockStripeConstructEvent = vi.fn();
const mockStripeSubscriptionsRetrieve = vi.fn().mockResolvedValue(mockSubscription);

vi.mock("stripe", () => {
  function MockStripe() {
    return {
      webhooks: {
        constructEvent: mockStripeConstructEvent,
      },
      subscriptions: {
        retrieve: mockStripeSubscriptionsRetrieve,
      },
    };
  }
  return { default: MockStripe };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("mock_signature"),
  }),
}));

// ---- Test helpers ----

function createStripeEvent(type: string, data: any): any {
  return {
    id: `evt_${Date.now()}`,
    type,
    data: { object: data },
  };
}

function createCheckoutSessionWithMetadata(
  productType: string,
  metadata: Record<string, string>,
  overrides: any = {}
): any {
  return buildCheckoutSession({
    ...overrides,
    metadata: {
      productType,
      ...metadata,
    },
  });
}

// ---- Tests ----

describe("Stripe Webhook Handler", () => {
  let POST: (request: any) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Re-import the handler fresh each test
    const mod = await import("@/app/api/webhooks/stripe/route");
    POST = mod.POST;
  });

  // ---- Signature Verification ----

  it("returns 400 for invalid webhook signature", async () => {
    mockStripeConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid signature");
  });

  // ---- checkout.session.completed: Course ----

  it("handles checkout.session.completed for course purchase", async () => {
    const metadata = buildCourseCheckoutMetadata();
    const session = createCheckoutSessionWithMetadata("course", metadata);
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    // Verify Convex mutation was called to grant course access
    expect(mockFetchMutation).toHaveBeenCalled();
    const enrollmentCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("library.createCourseEnrollment")
    );
    expect(enrollmentCall).toBeTruthy();
    expect(enrollmentCall![1]).toMatchObject({
      userId: metadata.userId,
      courseId: metadata.courseId,
      amount: 2999,
      paymentMethod: "stripe",
    });
  });

  // ---- checkout.session.completed: Digital Product ----

  it("handles checkout.session.completed for digital product purchase", async () => {
    const metadata = buildDigitalProductCheckoutMetadata();
    const session = createCheckoutSessionWithMetadata("digitalProduct", metadata);
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    // Verify digital product purchase mutation was called
    const productCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("library.createDigitalProductPurchase")
    );
    expect(productCall).toBeTruthy();
    expect(productCall![1]).toMatchObject({
      userId: metadata.userId,
      productId: metadata.productId,
      amount: 1499,
      paymentMethod: "stripe",
    });
  });

  // ---- checkout.session.completed: PPR Pro Subscription ----

  it("handles checkout.session.completed for PPR Pro subscription", async () => {
    const metadata = buildPprProCheckoutMetadata();
    const session = createCheckoutSessionWithMetadata("ppr_pro", metadata, {
      mode: "subscription",
      subscription: "sub_test123",
    });
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    // Verify PPR Pro subscription was created
    const subCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("pprPro.createSubscription")
    );
    expect(subCall).toBeTruthy();
    expect(subCall![1]).toMatchObject({
      userId: metadata.userId,
      plan: "monthly",
      stripeSubscriptionId: "sub_test123",
      stripeCustomerId: "cus_test123",
    });
  });

  // ---- customer.subscription.deleted: PPR Pro Cancellation ----

  it("handles customer.subscription.deleted for PPR Pro cancellation", async () => {
    const subscription = {
      id: "sub_cancelled123",
      canceled_at: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      metadata: {
        productType: "ppr_pro",
        userId: "user_clerk789",
      },
    };
    const event = createStripeEvent("customer.subscription.deleted", subscription);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    // Verify subscription was expired
    const expireCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("pprPro.expireSubscription")
    );
    expect(expireCall).toBeTruthy();
    expect(expireCall![1]).toMatchObject({
      stripeSubscriptionId: "sub_cancelled123",
    });
  });

  // ---- invoice.payment_failed: PPR Pro ----

  it("handles invoice.payment_failed for PPR Pro", async () => {
    mockStripeSubscriptionsRetrieve.mockResolvedValue(
      buildStripeSubscription({
        metadata: { productType: "ppr_pro", userId: "user_clerk789" },
      })
    );

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

    // Verify subscription was marked as past_due
    const updateCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("pprPro.updateSubscriptionStatus")
    );
    expect(updateCall).toBeTruthy();
    expect(updateCall![1]).toMatchObject({
      stripeSubscriptionId: "sub_test123",
      status: "past_due",
    });
  });

  // ---- Unhandled Events ----

  it("returns 200 for unhandled event types", async () => {
    const event = createStripeEvent("charge.refunded", { id: "ch_test" });
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);
  });

  // ---- Missing Metadata ----

  it("handles missing metadata gracefully for course purchase", async () => {
    const session = createCheckoutSessionWithMetadata("course", {
      // Missing required fields: userId, courseId, amount
    });
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    // Should still return 200, just skip processing
    expect(body.received).toBe(true);

    // Enrollment mutation should NOT have been called (missing required metadata)
    const enrollmentCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("library.createCourseEnrollment")
    );
    expect(enrollmentCall).toBeUndefined();
  });

  it("handles missing metadata gracefully for digital product purchase", async () => {
    const session = createCheckoutSessionWithMetadata("digitalProduct", {
      // Missing userId, productId, amount
    });
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    const productCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("library.createDigitalProductPurchase")
    );
    expect(productCall).toBeUndefined();
  });

  // ---- Bundle Purchase ----

  it("handles checkout.session.completed for bundle purchase", async () => {
    const metadata = buildBundleCheckoutMetadata();
    const session = createCheckoutSessionWithMetadata("bundle", metadata);
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);
    const body = await res.json();

    expect(body.received).toBe(true);

    const bundleCall = mockFetchMutation.mock.calls.find(
      (call) => String(call[0]).includes("library.createBundlePurchase")
    );
    expect(bundleCall).toBeTruthy();
    expect(bundleCall![1]).toMatchObject({
      userId: metadata.userId,
      bundleId: metadata.bundleId,
      amount: 4999,
      paymentMethod: "stripe",
    });
  });

  // ---- Processing Error Returns 200 ----

  it("returns 200 even when processing fails (prevents Stripe retries)", async () => {
    // Force the handler to throw by making Convex mutation fail
    mockFetchMutation.mockRejectedValueOnce(new Error("Convex mutation failed"));

    const metadata = buildCourseCheckoutMetadata();
    const session = createCheckoutSessionWithMetadata("course", metadata);
    const event = createStripeEvent("checkout.session.completed", session);
    mockStripeConstructEvent.mockReturnValue(event);

    const req = createMockRequest("{}");
    const res = await POST(req);

    // Should return 200 (not 500) to prevent Stripe retries
    // The inner try/catch catches mutation errors, so this tests the flow
    expect(res.status).toBe(200);
  });
});
