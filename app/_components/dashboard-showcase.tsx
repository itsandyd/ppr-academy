import { FC } from "react";
import { Card } from "@/components/ui/card";

interface DashboardShowcaseProps {}

export const DashboardShowcase: FC<DashboardShowcaseProps> = () => {
  return (
    <section className="py-24 md:py-32 bg-muted/40">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Creator Dashboard Built for Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage your courses, track student progress, handle subscriptions, and analyze your earnings from one powerful dashboard designed specifically for music educators.
            </p>
          </div>

          {/* Browser Frame */}
          <Card className="mx-auto max-w-4xl bg-background shadow-lg shadow-black/5 overflow-hidden">
            {/* Browser Header */}
            <div className="flex items-center space-x-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 max-w-md mx-auto">
                <div className="px-3 py-1 bg-background rounded-md text-sm text-muted-foreground border border-border">
                  musicacademy.com/creator-dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="aspect-[16/10] bg-background">
              {/* todo: Replace with actual dashboard screenshot */}
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-lg font-semibold text-muted-foreground">
                    Producer Dashboard Preview
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Real-time sales analytics</div>
                    <div>• Beat library management</div>
                    <div>• Fan engagement metrics</div>
                    <div>• Revenue tracking</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-b from-[#6356FF] to-[#5273FF] rounded-xl mx-auto flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Instant Analytics</h3>
              <p className="text-sm text-muted-foreground">Track your performance with real-time insights and detailed revenue breakdowns.</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-b from-[#6356FF] to-[#5273FF] rounded-xl mx-auto flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Smart Automation</h3>
              <p className="text-sm text-muted-foreground">Automate your workflow with AI-powered tools that handle the boring stuff for you.</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-b from-[#6356FF] to-[#5273FF] rounded-xl mx-auto flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Global Reach</h3>
              <p className="text-sm text-muted-foreground">Sell your beats worldwide with built-in payment processing and international support.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 