import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/library(.*)",
  "/home(.*)",
  "/courses/create(.*)",
  "/api/courses/create(.*)",
  "/api/user(.*)",
  "/profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl;
  
  // Check if Clerk is properly configured
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    // During build time or when Clerk is not configured, allow all requests
    return NextResponse.next();
  }

  // 🔄 UNIFIED DASHBOARD REDIRECTS
  // Redirect /home → /dashboard?mode=create
  if (url.pathname === '/home') {
    return NextResponse.redirect(new URL('/dashboard?mode=create', req.url));
  }

  // Redirect course pages to dashboard (preserve query params for chapters)
  if (url.pathname.startsWith('/library/courses/') && url.pathname !== '/library/courses') {
    const newPath = url.pathname.replace('/library/courses', '/dashboard/courses');
    const newUrl = new URL(newPath, req.url);
    newUrl.search = url.search; // Preserve ?chapter=xyz params
    return NextResponse.redirect(newUrl);
  }

  // 🌐 CUSTOM DOMAIN ROUTING
  // Check if this is a custom domain (not main platform domain)
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'ppr-academy.com';
  const isCustomDomain = !hostname.includes('localhost') && 
                         !hostname.includes(mainDomain) && 
                         !hostname.includes('vercel.app') &&
                         !url.pathname.startsWith('/api') &&
                         !url.pathname.startsWith('/_next');

  if (isCustomDomain) {
    try {
      const customDomain = hostname.replace('www.', '');
      
      // Fetch store by custom domain from Convex
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        const response = await fetch(`${convexUrl}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'customDomains:getStoreByCustomDomain',
            args: { domain: customDomain },
            format: 'json',
          }),
        });

        const data = await response.json();
        const store = data.value;

        if (store?.slug) {
          // Rewrite to slug page (keeps custom domain in URL bar)
          const slugPath = `/${store.slug}${url.pathname === '/' ? '' : url.pathname}`;
          console.log(`🌐 Custom domain routing: ${customDomain} → ${slugPath}`);
          
          return NextResponse.rewrite(new URL(slugPath, req.url));
        }
      }
    } catch (error) {
      console.error('Custom domain routing error:', error);
    }
  }

  // ✅ SECURITY: Configure CORS for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || '*';
    
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
    
    // Protect API routes if needed
    if (isProtectedRoute(req)) await auth.protect();
    
    return response;
  }

  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 