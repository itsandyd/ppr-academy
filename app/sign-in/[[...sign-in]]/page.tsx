import { SignIn } from "@clerk/nextjs";
import { Music, Sparkles, TrendingUp, Users, Headphones, Zap, Shield, ChevronRight, Play, Award } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string; intent?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const isCreator = params.intent === 'creator';

  // Fetch real platform statistics
  const stats = await fetchQuery(api.stats.getPlatformStats);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global background - gradient bleed from left panel */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient that bleeds from left to right */}
        <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-chart-1/8 via-chart-2/5 to-transparent" />
        {/* Subtle orbs on right side */}
        <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] bg-chart-1/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-[20%] w-[300px] h-[300px] bg-chart-2/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding & Features (Desktop) */}
        <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3">
            {/* Animated blobs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-white/20 rounded-full blur-[80px] animate-pulse-soft" />
              <div className="absolute bottom-[20%] right-[5%] w-80 h-80 bg-white/15 rounded-full blur-[100px] animate-float-slow" />
              <div className="absolute top-[50%] left-[40%] w-48 h-48 bg-chart-4/20 rounded-full blur-[60px] animate-float" />
            </div>
            {/* Subtle noise texture */}
            <div className="absolute inset-0 opacity-[0.015]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative z-10 flex flex-col text-white p-10 xl:p-12 h-full w-full">
            {/* Logo */}
            <a href="/" className="inline-flex items-center gap-3 group mb-auto">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">PPR Academy</span>
            </a>

            {/* Main Content - Centered */}
            <div className="flex-1 flex flex-col justify-center max-w-lg py-8">
              <h2 className="text-4xl xl:text-5xl font-bold mb-4 leading-[1.1] tracking-tight">
                {isCreator
                  ? <>Create. Share.<br/>Earn.</>
                  : <>Master Your<br/>Sound</>}
              </h2>
              <p className="text-lg text-white/85 leading-relaxed mb-10">
                {isCreator
                  ? 'Join thousands of creators sharing their music production knowledge and earning from their expertise.'
                  : 'Learn music production from industry professionals. Access courses, sample packs, and exclusive tools.'}
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  {
                    icon: TrendingUp,
                    title: 'Industry-Leading Content',
                    desc: 'Premium courses and sample packs from top producers'
                  },
                  {
                    icon: Users,
                    title: 'Vibrant Community',
                    desc: 'Connect with fellow producers worldwide'
                  },
                  {
                    icon: Zap,
                    title: 'Instant Access',
                    desc: 'Download and use content immediately'
                  }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-white/70">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats - Bottom */}
            <div className="mt-auto pt-6 border-t border-white/20">
              <div className="flex items-center gap-8">
                {[
                  { value: stats.totalUsers, label: 'Users' },
                  { value: stats.totalCourses, label: 'Courses' },
                  { value: stats.totalCreators, label: 'Creators' }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold tabular-nums">
                      {stat.value > 0 ? stat.value.toLocaleString() : '—'}
                    </div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-20 backdrop-blur-xl bg-background/90 border-b border-border/50">
            <div className="flex items-center justify-between px-5 py-4">
              <a href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center shadow-md">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">PPR Academy</span>
              </a>
              <a
                href={isCreator ? "/sign-up?intent=creator" : "/sign-up"}
                className="text-sm font-medium text-chart-1 hover:text-chart-2 transition-colors flex items-center gap-1"
              >
                Create account
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center px-5 py-8 md:px-8 lg:px-16 xl:px-24">
            <div className="w-full max-w-[400px]">
              {/* Mobile Hero Section */}
              <div className="lg:hidden mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-chart-1/10 rounded-full mb-4">
                  <Headphones className="w-4 h-4 text-chart-1" />
                  <span className="text-xs font-medium text-chart-1">Music Production Platform</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground">
                  {isCreator
                    ? 'Sign in to your creator dashboard'
                    : 'Continue your music production journey'}
                </p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground">
                  {isCreator
                    ? 'Sign in to your creator dashboard'
                    : 'Continue your music production journey'}
                </p>
              </div>

              {/* Creator Badge */}
              {isCreator && (
                <div className="mb-5 inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-chart-1/10 to-chart-2/10 border border-chart-1/20 rounded-full">
                  <div className="w-2 h-2 bg-chart-1 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-chart-1">Creator Account</span>
                </div>
              )}

              {/* Sign In Component - No wrapper card, let Clerk handle it */}
              <SignIn
                fallbackRedirectUrl={params.redirect_url || "/dashboard"}
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-card border border-border rounded-2xl p-6 shadow-xl w-full",
                    formButtonPrimary:
                      "bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-chart-1/25 hover:shadow-xl hover:shadow-chart-1/30 min-h-[48px]",
                    formFieldInput:
                      "rounded-xl border border-border bg-muted/50 focus:border-chart-1 focus:ring-2 focus:ring-chart-1/20 transition-all py-3 min-h-[48px] text-base placeholder:text-muted-foreground/60",
                    footerActionLink:
                      "text-chart-1 hover:text-chart-2 font-semibold transition-colors",
                    identityPreviewText: "text-foreground",
                    formFieldLabel: "text-foreground font-medium mb-1.5 text-sm",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border border-border bg-transparent hover:bg-muted/50 hover:border-chart-1/30 transition-all duration-200 rounded-xl py-3 min-h-[48px]",
                    socialButtonsBlockButtonText: "font-medium text-foreground",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground text-sm",
                    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                    footer: "hidden",
                    form: "gap-4",
                    socialButtons: "gap-3",
                  },
                }}
                signUpUrl="/sign-up"
              />

              {/* Footer Links */}
              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <a
                    href={isCreator ? "/sign-up?intent=creator" : "/sign-up"}
                    className="text-chart-1 hover:text-chart-2 font-semibold transition-colors"
                  >
                    {isCreator ? 'Become a Creator' : 'Sign up for free'}
                  </a>
                </p>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <a href="/marketplace" className="hover:text-foreground transition-colors">
                    Marketplace
                  </a>
                  <span className="text-border">•</span>
                  <a href="/marketplace/creators" className="hover:text-foreground transition-colors">
                    Creators
                  </a>
                  <span className="text-border">•</span>
                  <a href="/" className="hover:text-foreground transition-colors">
                    Home
                  </a>
                </div>
              </div>

              {/* Trust Section - Desktop */}
              <div className="hidden lg:block mt-10 pt-8 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[
                        'from-chart-1 to-chart-2',
                        'from-chart-2 to-chart-3',
                        'from-chart-3 to-chart-4'
                      ].map((gradient, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-card`}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {stats.totalUsers > 0
                          ? `${stats.totalUsers.toLocaleString()}+ producers`
                          : 'Growing community'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        trust PPR Academy
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Secure sign-in</span>
                  </div>
                </div>
              </div>

              {/* Trust Badge - Mobile */}
              <div className="lg:hidden mt-8">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 flex-shrink-0">
                      {[
                        'from-chart-1 to-chart-2',
                        'from-chart-2 to-chart-3',
                        'from-chart-3 to-chart-4'
                      ].map((gradient, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-background`}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {stats.totalUsers > 0
                          ? `Trusted by ${stats.totalUsers.toLocaleString()}+ producers`
                          : 'Join our growing community'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalCourses + stats.totalProducts > 0
                          ? `Access ${(stats.totalCourses + stats.totalProducts).toLocaleString()}+ resources`
                          : 'Start learning today'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Features */}
              <div className="lg:hidden mt-6 space-y-3">
                {[
                  { icon: Shield, text: 'Secure & encrypted', color: 'chart-1' },
                  { icon: Zap, text: 'Instant access', color: 'chart-2' },
                  { icon: Sparkles, text: 'Sync across devices', color: 'chart-3' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className={`w-8 h-8 rounded-lg bg-${item.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-4 h-4 text-${item.color}`} />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Bottom Stats */}
          <div className="lg:hidden sticky bottom-0 z-20 px-5 py-4 bg-gradient-to-t from-background via-background to-background/80">
            <div className="flex justify-around py-3 px-4 bg-muted/50 backdrop-blur-sm rounded-xl border border-border/50">
              {[
                { value: stats.totalUsers, label: 'Users' },
                { value: stats.totalCourses, label: 'Courses' },
                { value: stats.totalCreators, label: 'Creators' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold text-foreground tabular-nums">
                    {stat.value > 0 ? stat.value.toLocaleString() : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
