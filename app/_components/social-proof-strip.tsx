import { FC } from "react";

interface SocialProofStripProps {}

export const SocialProofStrip: FC<SocialProofStripProps> = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Creator Success Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real earnings from producers building sustainable income streams through courses, coaching, and subscriptions
            </p>
          </div>

          {/* Phone Screenshots Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Phone 1 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-64 bg-black rounded-[1.5rem] p-1.5 shadow-lg shadow-black/5">
                <div className="w-full h-full bg-white rounded-[1rem] overflow-hidden">
                  {/* todo: Replace with creator profile screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Creator Profile
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">BEATS by Marcus</p>
                <p className="text-xs text-muted-foreground">$8.5K/month</p>
              </div>
            </div>

            {/* Phone 2 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-64 bg-black rounded-[1.5rem] p-1.5 shadow-lg shadow-black/5">
                <div className="w-full h-full bg-white rounded-[1rem] overflow-hidden">
                  {/* todo: Replace with beat sales screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Beat Sales
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">ElectraVibes</p>
                <p className="text-xs text-muted-foreground">$12.2K/month</p>
              </div>
            </div>

            {/* Phone 3 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-64 bg-black rounded-[1.5rem] p-1.5 shadow-lg shadow-black/5">
                <div className="w-full h-full bg-white rounded-[1rem] overflow-hidden">
                  {/* todo: Replace with analytics dashboard screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Analytics
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">TrapLord Studios</p>
                <p className="text-xs text-muted-foreground">$15.8K/month</p>
              </div>
            </div>

            {/* Phone 4 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-32 h-64 bg-black rounded-[1.5rem] p-1.5 shadow-lg shadow-black/5">
                <div className="w-full h-full bg-white rounded-[1rem] overflow-hidden">
                  {/* todo: Replace with fan engagement screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Fan Engagement
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">MelodySoul</p>
                <p className="text-xs text-muted-foreground">$6.4K/month</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-12 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Active Creators</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-border"></div>
            <div>
              <div className="text-2xl font-bold text-foreground">15,000+</div>
              <div className="text-sm text-muted-foreground">Students Learning</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-border"></div>
            <div>
              <div className="text-2xl font-bold text-foreground">$5.2K</div>
              <div className="text-sm text-muted-foreground">Avg Monthly Revenue</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 