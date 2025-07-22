import { FC } from "react";
import { Youtube, Music, Headphones, Smartphone, Radio, Play } from "lucide-react";

interface IntegrationsSplitProps {}

export const IntegrationsSplit: FC<IntegrationsSplitProps> = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Integrations */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Learn Your Way
              </h2>
              <p className="text-lg text-muted-foreground">
                Access courses across all your devices. Learn at your own pace with mobile apps, desktop access, and offline downloads.
              </p>
            </div>

            {/* Integration Icons Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Mobile App */}
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Mobile App</span>
              </div>

              {/* Video Lessons */}
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Video Lessons</span>
              </div>

              {/* Audio Examples */}
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Audio Examples</span>
              </div>

              {/* Live Coaching */}
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Live Coaching</span>
              </div>

              {/* Discord */}
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Discord</span>
              </div>

              {/* More */}
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">10+ More</span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">Sync progress across all your devices</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">Download courses for offline learning</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">Direct messaging with your instructors</span>
              </div>
            </div>
          </div>

          {/* Right Column - Checkout Phone */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative z-10">
              {/* Phone Mockup */}
              <div className="w-64 h-[500px] bg-black rounded-[2.5rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                  {/* todo: Replace with actual checkout flow screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center">
                    <div className="text-center space-y-4 p-6">
                      <div className="text-sm font-semibold text-muted-foreground">
                        Course Enrollment
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="p-2 bg-background rounded">Course: "Hip-Hop Production" - $49</div>
                        <div className="p-2 bg-background rounded">Creator: BEATS by Marcus</div>
                        <div className="p-2 bg-primary/10 rounded text-primary">Complete Purchase →</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#6356FF]/10 to-[#5273FF]/10 rounded-full blur-3xl transform scale-150"></div>
          </div>
        </div>
      </div>
    </section>
  );
}; 