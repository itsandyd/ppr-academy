import { SignIn } from "@clerk/nextjs";
import { Music, Sparkles, TrendingUp, Users } from "lucide-react";
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
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3 p-12">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between text-white h-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Music className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold">PPR Academy</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {isCreator 
                ? 'Create. Share. Earn.' 
                : 'Master Your Sound'}
            </h2>
            <p className="text-lg text-white/90 max-w-md leading-relaxed">
              {isCreator
                ? 'Join thousands of creators sharing their music production knowledge and earning from their expertise.'
                : 'Learn music production from industry professionals. Access courses, sample packs, and exclusive tools.'}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Industry-Leading Content</h3>
                <p className="text-sm text-white/80">
                  Premium courses, sample packs, and Ableton racks from top producers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Vibrant Community</h3>
                <p className="text-sm text-white/80">
                  Connect with fellow producers and get feedback on your work
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant Access</h3>
                <p className="text-sm text-white/80">
                  Download and start using content immediately after purchase
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold">
                {stats.totalUsers > 0 ? `${stats.totalUsers.toLocaleString()}` : '—'}
              </div>
              <div className="text-sm text-white/80">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {stats.totalCourses > 0 ? `${stats.totalCourses.toLocaleString()}` : '—'}
              </div>
              <div className="text-sm text-white/80">Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {stats.totalCreators > 0 ? `${stats.totalCreators.toLocaleString()}` : '—'}
              </div>
              <div className="text-sm text-white/80">Creators</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">PPR Academy</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-lg">
              {isCreator 
                ? 'Sign in to your creator dashboard' 
                : 'Continue your music production journey'}
            </p>
          </div>
          
          {/* Creator Badge */}
          {isCreator && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-chart-1/10 to-chart-2/10 border border-chart-1/20 rounded-full">
              <div className="w-2 h-2 bg-chart-1 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-chart-1">Creator Account</span>
            </div>
          )}

          {/* Clerk Sign In Component */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <SignIn 
              fallbackRedirectUrl={params.redirect_url || "/home"}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none w-full",
                  formButtonPrimary: 
                    "bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]",
                  formFieldInput: 
                    "rounded-xl border-2 border-border bg-background focus:border-chart-1 focus:ring-2 focus:ring-chart-1/20 transition-all py-3",
                  footerActionLink: 
                    "text-chart-1 hover:text-chart-2 font-semibold transition-colors",
                  identityPreviewText: "text-foreground",
                  formFieldLabel: "text-foreground font-semibold mb-2",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: 
                    "border-2 border-border hover:border-chart-1/50 hover:bg-muted/50 transition-all rounded-xl py-3",
                  socialButtonsBlockButtonText: "font-semibold text-foreground",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground font-medium",
                  formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                  footer: "hidden", // Hide the footer to add custom one
                },
              }}
              signUpUrl="/sign-up"
            />
          </div>

          {/* Custom Footer */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a 
                href={isCreator ? "/sign-up?intent=creator" : "/sign-up"} 
                className="text-chart-1 hover:text-chart-2 font-semibold transition-colors"
              >
                {isCreator ? 'Become a Creator' : 'Sign up for free'}
              </a>
            </p>

            {/* Additional Links */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <a href="/marketplace" className="hover:text-foreground transition-colors">
                Browse Marketplace
              </a>
              <span>•</span>
              <a href="/marketplace/creators" className="hover:text-foreground transition-colors">
                Meet Creators
              </a>
              <span>•</span>
              <a href="/" className="hover:text-foreground transition-colors">
                Home
              </a>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-1 to-chart-2 border-2 border-background"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 border-2 border-background"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-3 to-chart-4 border-2 border-background"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {stats.totalUsers > 0 
                    ? `Trusted by ${stats.totalUsers.toLocaleString()}+ producers worldwide`
                    : 'Join our growing community of producers'}
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
      </div>
    </div>
  );
} 