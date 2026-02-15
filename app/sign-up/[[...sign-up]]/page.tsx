import { SignUp } from "@clerk/nextjs";
import { ReferralCapture } from "./referral-capture";
import { Music, Sparkles, Users, Zap, Shield, ChevronRight, Check, Gift, Headphones, TrendingUp, Store, CreditCard, Mail } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SignUpPageProps {
  searchParams: Promise<{ intent?: string; redirect_url?: string; ref?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const isCreator = params.intent === 'creator';
  const referralCode = params.ref;

  // Fetch real platform statistics
  const stats = await fetchQuery(api.stats.getPlatformStats);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Capture referral code in localStorage */}
      {referralCode && <ReferralCapture code={referralCode} />}

      {/* Background decorative elements - visible on all screen sizes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 md:w-[500px] md:h-[500px] bg-gradient-to-br from-chart-1/20 via-chart-2/15 to-transparent rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 md:w-[500px] md:h-[500px] bg-gradient-to-tr from-chart-3/20 via-chart-4/15 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-radial from-chart-1/5 to-transparent rounded-full" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding & Features (Desktop) */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative">
          {/* Gradient background with animated mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-[100px] animate-pulse-soft" />
              <div className="absolute bottom-40 right-20 w-96 h-96 bg-white/50 rounded-full blur-[120px] animate-float-slow" />
              <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-chart-4/30 rounded-full blur-[80px] animate-float" />
            </div>
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative z-10 flex flex-col justify-between text-white p-10 xl:p-14 h-full w-full">
            {/* Logo & Title */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <a href="/" className="inline-flex items-center gap-3 mb-10 group">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Music className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">PPR Academy</span>
              </a>

              <h2 className="text-4xl xl:text-5xl font-bold mb-5 leading-[1.1] tracking-tight">
                {isCreator
                  ? <>Start Creating<br/><span className="text-white/90">Today</span></>
                  : <>Join the<br/><span className="text-white/90">Community</span></>}
              </h2>
              <p className="text-lg text-white/85 max-w-md leading-relaxed">
                {isCreator
                  ? 'Share your music production expertise with thousands of learners and earn from your knowledge.'
                  : 'Access premium courses, sample packs, and tools from industry professionals.'}
              </p>
            </div>

            {/* Features with improved design */}
            <div className="space-y-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {(isCreator ? [
                {
                  icon: Store,
                  title: 'Your Professional Storefront',
                  desc: 'Get your own branded page to showcase and sell your content'
                },
                {
                  icon: CreditCard,
                  title: 'Keep 90% of Sales',
                  desc: 'Industry-leading revenue share with instant payouts'
                },
                {
                  icon: Mail,
                  title: 'Built-in Marketing Tools',
                  desc: 'Email campaigns, analytics, and promotion features included'
                }
              ] : [
                {
                  icon: TrendingUp,
                  title: 'Industry-Leading Content',
                  desc: 'Premium courses, sample packs, and Ableton racks from top producers'
                },
                {
                  icon: Users,
                  title: 'Vibrant Community',
                  desc: 'Connect with fellow producers and get feedback on your work'
                },
                {
                  icon: Zap,
                  title: 'Instant Access',
                  desc: 'Download and start using content immediately after purchase'
                }
              ]).map((feature, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-default">
                  <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-0.5 group-hover:translate-x-1 transition-transform duration-300">{feature.title}</h3>
                    <p className="text-sm text-white/75 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats with glowing cards */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="grid grid-cols-3 gap-3 pt-8 border-t border-white/20">
                {[
                  { value: stats.totalUsers, label: 'Active Users' },
                  { value: stats.totalCourses, label: 'Courses' },
                  { value: stats.totalCreators, label: 'Creators' }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
                    <div className="text-2xl xl:text-3xl font-bold tabular-nums">
                      {stat.value > 0 ? stat.value.toLocaleString() : '—'}
                    </div>
                    <div className="text-xs text-white/70 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header with gradient */}
          <div className="lg:hidden sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
            <div className="flex items-center justify-between px-5 py-4">
              <a href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center shadow-md">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">PPR Academy</span>
              </a>
              <a
                href="/sign-in"
                className="text-sm font-medium text-chart-1 hover:text-chart-2 transition-colors flex items-center gap-1"
              >
                Sign in
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center px-5 py-8 md:px-8 lg:px-12">
            <div className="w-full max-w-[420px]">
              {/* Referral Banner */}
              {referralCode && (
                <div className="mb-6 p-4 bg-gradient-to-r from-chart-1/10 via-chart-2/10 to-chart-3/10 border border-chart-1/20 rounded-xl animate-scale-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        You were referred by a friend!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You'll receive <strong className="text-chart-1">500 credits</strong> after signing up
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Hero Section */}
              <div className="lg:hidden mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-chart-1/10 rounded-full mb-4">
                  <Headphones className="w-4 h-4 text-chart-1" />
                  <span className="text-xs font-medium text-chart-1">
                    {isCreator ? 'Creator Platform' : 'Music Production Platform'}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  {isCreator ? 'Start Creating Today' : 'Create Your Account'}
                </h1>
                <p className="text-muted-foreground">
                  {isCreator
                    ? 'Share your expertise and earn'
                    : 'Join PPR Academy and start learning'}
                </p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block mb-8 animate-slide-up">
                <h1 className="text-3xl xl:text-4xl font-bold text-foreground mb-2 tracking-tight">
                  {isCreator ? 'Start Creating Today' : 'Create Your Account'}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {isCreator
                    ? 'Share your expertise and earn'
                    : 'Join PPR Academy and start learning'}
                </p>
              </div>

              {/* Creator Badge */}
              {isCreator && (
                <div className="mb-6 inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-chart-1/10 to-chart-2/10 border border-chart-1/20 rounded-full animate-scale-in">
                  <Zap className="w-4 h-4 text-chart-1" />
                  <span className="text-sm font-semibold text-chart-1">Creator Account</span>
                </div>
              )}

              {/* Sign Up Card */}
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl animate-scale-in">
                <SignUp
                  fallbackRedirectUrl={params.redirect_url || "/dashboard"}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none w-full",
                      formButtonPrimary:
                        "bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-chart-1/20 transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px]",
                      formFieldInput:
                        "rounded-xl border-2 border-border bg-background/50 focus:border-chart-1 focus:ring-2 focus:ring-chart-1/20 transition-all py-3.5 min-h-[48px] text-base",
                      footerActionLink:
                        "text-chart-1 hover:text-chart-2 font-semibold transition-colors",
                      identityPreviewText: "text-foreground",
                      formFieldLabel: "text-foreground font-semibold mb-2 text-sm",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-2 border-border hover:border-chart-1/40 hover:bg-muted/30 transition-all duration-300 rounded-xl py-3 min-h-[48px]",
                      socialButtonsBlockButtonText: "font-semibold text-foreground",
                      dividerLine: "bg-border/50",
                      dividerText: "text-muted-foreground font-medium text-sm",
                      formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                      footer: "hidden",
                    },
                  }}
                  signInUrl="/sign-in"
                />
              </div>

              {/* Custom Footer */}
              <div className="mt-6 text-center space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <a
                    href="/sign-in"
                    className="text-chart-1 hover:text-chart-2 font-semibold transition-colors inline-flex items-center gap-0.5"
                  >
                    Sign in
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </p>

                {/* Quick Links */}
                <div className="flex items-center justify-center gap-3 md:gap-4 text-xs text-muted-foreground flex-wrap">
                  <a href="/marketplace" className="hover:text-foreground transition-colors py-1">
                    Marketplace
                  </a>
                  <span className="text-border">•</span>
                  <a href="/marketplace/creators" className="hover:text-foreground transition-colors py-1">
                    Creators
                  </a>
                  <span className="text-border">•</span>
                  <a href="/" className="hover:text-foreground transition-colors py-1">
                    Home
                  </a>
                </div>
              </div>

              {/* Creator Benefits - Mobile */}
              {isCreator && (
                <div className="lg:hidden mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <div className="p-4 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/50">
                    <h3 className="font-semibold text-foreground mb-3 text-sm">What you'll get:</h3>
                    <ul className="space-y-2.5">
                      {[
                        'Your own professional storefront',
                        'Keep 90% of your sales',
                        'Built-in payment processing',
                        'Email marketing tools included'
                      ].map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-chart-1/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-chart-1" />
                          </div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Trust Badge */}
              <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="p-4 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/50 hover:border-chart-1/20 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2 flex-shrink-0">
                      {[
                        'from-chart-1 to-chart-2',
                        'from-chart-2 to-chart-3',
                        'from-chart-3 to-chart-4'
                      ].map((gradient, i) => (
                        <div
                          key={i}
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} border-2 border-background shadow-md`}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {stats.totalUsers > 0
                          ? `Join ${stats.totalUsers.toLocaleString()}+ producers`
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

              {/* Mobile Features Preview - Non-creator */}
              {!isCreator && (
                <div className="lg:hidden mt-8 space-y-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-chart-1" />
                    </div>
                    <span>Free to sign up, no credit card required</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-chart-2" />
                    </div>
                    <span>Instant access to free content</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-chart-3" />
                    </div>
                    <span>Sync progress across all devices</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Navigation Area */}
          <div className="lg:hidden sticky bottom-0 z-20 px-5 py-4 bg-gradient-to-t from-background via-background to-background/80">
            {/* Mobile Stats */}
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
