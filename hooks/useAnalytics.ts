import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useRef } from "react";

interface AnalyticsEvent {
  eventType: // Existing events
  | "page_view"
    | "product_view"
    | "course_view"
    | "purchase"
    | "download"
    | "video_play"
    | "video_complete"
    | "lesson_complete"
    | "course_complete"
    | "search"
    | "click"
    | "signup"
    | "login"
    // NEW: Creator funnel events
    | "creator_started"
    | "creator_profile_completed"
    | "creator_published"
    | "first_sale"
    // NEW: Learner activation events
    | "enrollment"
    | "return_week_2"
    // NEW: Email & campaign events
    | "email_sent"
    | "email_delivered"
    | "email_opened"
    | "email_clicked"
    | "email_bounced"
    | "email_complained"
    // NEW: Campaign & outreach events
    | "dm_sent"
    | "cta_clicked"
    | "campaign_view"
    // NEW: System events
    | "error"
    | "webhook_failed";
  resourceId?: string;
  resourceType?: "course" | "digitalProduct" | "lesson" | "chapter" | "page";
  metadata?: {
    // Existing metadata
    page?: string;
    referrer?: string;
    searchTerm?: string;
    duration?: number;
    progress?: number;
    value?: number;
    country?: string;
    city?: string;
    device?: string;
    browser?: string;
    os?: string;
    // NEW: Campaign tracking
    source?: string;
    campaign_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    // NEW: Creator-specific
    daw?: string;
    audience_size?: number;
    // NEW: Product/revenue specific
    product_id?: string;
    amount_cents?: number;
    currency?: string;
    // NEW: Experiment tracking
    experiment_id?: string;
    variant?: string;
    // NEW: Error tracking
    error_code?: string;
    error_message?: string;
  };
}

export function useAnalytics() {
  const { user } = useUser();
  const trackEvent = useMutation(api.analyticsTracking.trackEvent);
  const trackProductView = useMutation(api.analyticsTracking.trackProductView);
  const trackSession = useMutation(api.analyticsTracking.trackSession);

  const sessionId = useRef<string | undefined>(undefined);
  const pageStartTime = useRef<number | undefined>(undefined);

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Track page views automatically
  useEffect(() => {
    if (user?.id && typeof window !== "undefined") {
      pageStartTime.current = Date.now();

      const deviceInfo = getDeviceInfo();

      trackEvent({
        userId: user.id,
        eventType: "page_view",
        metadata: {
          page: window.location.pathname,
          referrer: document.referrer,
          ...deviceInfo,
        },
        sessionId: sessionId.current,
        userAgent: navigator.userAgent,
      }).catch(console.error);

      // Track session
      trackSession({
        userId: user.id,
        sessionId: sessionId.current!,
        startTime: Date.now(),
        pageViews: 1,
        events: 1,
        ...deviceInfo,
        referrer: document.referrer,
        landingPage: window.location.pathname,
      }).catch(console.error);
    }
  }, [user?.id, trackEvent, trackSession]);

  // Track page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id && pageStartTime.current && sessionId.current) {
        const duration = Date.now() - pageStartTime.current;

        // Use sendBeacon for reliable tracking on page unload
        if (navigator.sendBeacon) {
          const data = JSON.stringify({
            userId: user.id,
            eventType: "page_view",
            metadata: {
              page: window.location.pathname,
              duration: Math.floor(duration / 1000),
            },
            sessionId: sessionId.current,
          });

          navigator.sendBeacon("/api/analytics/track", data);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user?.id]);

  const track = useCallback(
    async (event: AnalyticsEvent) => {
      if (!user?.id) return;

      try {
        await trackEvent({
          userId: user.id,
          ...event,
          metadata: {
            ...getDeviceInfo(),
            ...event.metadata,
          },
          sessionId: sessionId.current,
          userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
        });
      } catch (error) {
        console.error("Analytics tracking error:", error);
      }
    },
    [user?.id, trackEvent]
  );

  const trackView = useCallback(
    async (resourceId: string, resourceType: "course" | "digitalProduct", storeId: string) => {
      if (!user?.id) return;

      try {
        await trackProductView({
          userId: user.id,
          storeId,
          resourceId,
          resourceType,
          ...getDeviceInfo(),
          referrer: typeof window !== "undefined" ? document.referrer : undefined,
          sessionId: sessionId.current,
        });
      } catch (error) {
        console.error("Product view tracking error:", error);
      }
    },
    [user?.id, trackProductView]
  );

  const trackPurchase = useCallback(
    async (resourceId: string, resourceType: "course" | "digitalProduct", value: number) => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "purchase",
          resourceId,
          resourceType,
          metadata: {
            value,
          },
        });
      } catch (error) {
        console.error("Purchase tracking error:", error);
      }
    },
    [track]
  );

  const trackSearch = useCallback(
    async (searchTerm: string) => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "search",
          metadata: {
            searchTerm,
          },
        });
      } catch (error) {
        console.error("Search tracking error:", error);
      }
    },
    [track]
  );

  const trackVideoEvent = useCallback(
    async (
      eventType: "video_play" | "video_complete",
      resourceId: string,
      progress?: number,
      duration?: number
    ) => {
      if (!user?.id) return;

      try {
        await track({
          eventType,
          resourceId,
          resourceType: "lesson",
          metadata: {
            progress,
            duration,
          },
        });
      } catch (error) {
        console.error("Video event tracking error:", error);
      }
    },
    [track]
  );

  // NEW: Track creator funnel events
  const trackCreatorStarted = useCallback(
    async (metadata?: { daw?: string; audience_size?: number }) => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "creator_started",
          metadata,
        });
      } catch (error) {
        console.error("Creator started tracking error:", error);
      }
    },
    [track]
  );

  const trackCreatorPublished = useCallback(
    async (resourceId: string, resourceType: "course" | "digitalProduct") => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "creator_published",
          resourceId,
          resourceType,
        });
      } catch (error) {
        console.error("Creator published tracking error:", error);
      }
    },
    [track]
  );

  const trackFirstSale = useCallback(
    async (resourceId: string, amountCents: number, currency: string = "USD") => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "first_sale",
          resourceId,
          metadata: {
            amount_cents: amountCents,
            currency,
            value: amountCents / 100,
          },
        });
      } catch (error) {
        console.error("First sale tracking error:", error);
      }
    },
    [track]
  );

  // NEW: Track campaign events
  const trackCampaignView = useCallback(
    async (campaignId: string, variant?: string) => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "campaign_view",
          metadata: {
            campaign_id: campaignId,
            variant,
          },
        });
      } catch (error) {
        console.error("Campaign view tracking error:", error);
      }
    },
    [track]
  );

  const trackCTAClick = useCallback(
    async (campaignId: string, ctaUrl: string, variant?: string) => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "cta_clicked",
          metadata: {
            campaign_id: campaignId,
            variant,
            page: ctaUrl,
          },
        });
      } catch (error) {
        console.error("CTA click tracking error:", error);
      }
    },
    [track]
  );

  // NEW: Track email events
  const trackEmailEvent = useCallback(
    async (
      eventType:
        | "email_sent"
        | "email_delivered"
        | "email_opened"
        | "email_clicked"
        | "email_bounced"
        | "email_complained",
      campaignId?: string
    ) => {
      if (!user?.id) return;

      try {
        await track({
          eventType,
          metadata: {
            campaign_id: campaignId,
          },
        });
      } catch (error) {
        console.error("Email event tracking error:", error);
      }
    },
    [track]
  );

  // NEW: Track error events
  const trackError = useCallback(
    async (errorCode: string, errorMessage: string) => {
      if (!user?.id) return;

      try {
        await track({
          eventType: "error",
          metadata: {
            error_code: errorCode,
            error_message: errorMessage,
            page: typeof window !== "undefined" ? window.location.pathname : undefined,
          },
        });
      } catch (error) {
        console.error("Error tracking error:", error);
      }
    },
    [track]
  );

  return {
    track,
    trackView,
    trackPurchase,
    trackSearch,
    trackVideoEvent,
    // NEW methods
    trackCreatorStarted,
    trackCreatorPublished,
    trackFirstSale,
    trackCampaignView,
    trackCTAClick,
    trackEmailEvent,
    trackError,
  };
}

function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {};
  }

  const userAgent = navigator.userAgent;

  // Simple device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);

  let device = "Desktop";
  if (isTablet) device = "Tablet";
  else if (isMobile) device = "Mobile";

  // Simple browser detection
  let browser = "Unknown";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  // Simple OS detection
  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  return {
    device,
    browser,
    os,
  };
}
