import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Star } from "lucide-react";

interface PricingProps {}

export const Pricing: FC<PricingProps> = () => {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-background">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Choose your plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start learning for free, or become a creator. Join thousands of students and educators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 bg-background border-border shadow-lg shadow-black/5 relative">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Student</h3>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </div>

              <div className="space-y-2">
                <div className="text-4xl font-bold text-foreground">$0</div>
                <div className="text-sm text-muted-foreground">Free forever</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Browse all creators</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Access free courses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Community access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Basic support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Pay per creator</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="lg" 
                className="w-full rounded-xl border-border hover:bg-muted"
              >
                Start Learning
              </Button>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 bg-gradient-to-b from-[#6356FF]/5 to-[#5273FF]/5 border-[#6356FF]/20 shadow-lg shadow-black/5 relative">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="inline-flex items-center px-3 py-1 bg-gradient-to-b from-[#6356FF] to-[#5273FF] text-white text-sm font-medium rounded-full">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Creator</h3>
                <p className="text-muted-foreground">For educators & creators</p>
              </div>

              <div className="space-y-2">
                <div className="text-4xl font-bold text-foreground">$29</div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Unlimited courses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Student analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Priority support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">10% platform fee</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Custom branding</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Live coaching tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-foreground">Custom store page</span>
                </div>
              </div>

              <Button 
                variant="default" 
                size="lg" 
                className="w-full rounded-xl bg-gradient-to-b from-[#6356FF] to-[#5273FF] hover:from-[#5a4beb] hover:to-[#4a68eb]"
              >
                Become a Creator
              </Button>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <span>✓ SSL Security</span>
            <span>✓ 99.9% Uptime</span>
            <span>✓ 24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}; 