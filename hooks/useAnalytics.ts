import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useRef } from "react";

interface AnalyticsEvent {
  eventType: "page_view" | "product_view" | "course_view" | "purchase" | "download" | "video_play" | "video_complete" | "lesson_complete" | "course_complete" | "search" | "click" | "signup" | "login";
  resourceId?: string;
  resourceType?: "course" | "digitalProduct" | "lesson" | "chapter" | "page";
  metadata?: {
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
  };
}

export function useAnalytics() {
  const { user } = useUser();
  const trackEvent = useMutation(api.analyticsTracking.trackEvent);
  const trackProductView = useMutation(api.analyticsTracking.trackProductView);
  const trackSession = useMutation(api.analyticsTracking.trackSession);
  
  const sessionId = useRef<string>();
  const pageStartTime = useRef<number>();
  
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
          
          navigator.sendBeacon('/api/analytics/track', data);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id]);
  
  const track = useCallback(async (event: AnalyticsEvent) => {
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
  }, [user?.id, trackEvent]);
  
  const trackView = useCallback(async (resourceId: string, resourceType: "course" | "digitalProduct", storeId: string) => {
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
  }, [user?.id, trackProductView]);
  
  const trackPurchase = useCallback(async (resourceId: string, resourceType: "course" | "digitalProduct", value: number) => {
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
  }, [track]);
  
  const trackSearch = useCallback(async (searchTerm: string) => {
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
  }, [track]);
  
  const trackVideoEvent = useCallback(async (
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
  }, [track]);
  
  return {
    track,
    trackView,
    trackPurchase,
    trackSearch,
    trackVideoEvent,
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
