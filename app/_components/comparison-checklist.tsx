import { FC } from "react";
import { Card } from "@/components/ui/card";
import { X, Check } from "lucide-react";

interface ComparisonChecklistProps {}

export const ComparisonChecklist: FC<ComparisonChecklistProps> = () => {
  const comparisons = [
    {
      current: "YouTube tutorials & random blogs",
      producerpro: "Structured courses from pros"
    },
    {
      current: "No direct access to instructors",
      producerpro: "1-on-1 coaching & mentorship"
    },
    {
      current: "Generic, outdated content",
      producerpro: "Fresh, industry-relevant lessons"
    },
    {
      current: "No progress tracking",
      producerpro: "Track your learning journey"
    },
    {
      current: "Learning alone",
      producerpro: "Active community support"
    },
    {
      current: "No certificates or credentials",
      producerpro: "Completion certificates"
    },
    {
      current: "Hard to find quality content",
      producerpro: "Curated, high-quality courses"
    },
    {
      current: "No personalized feedback",
      producerpro: "Direct feedback from experts"
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-muted/40">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Why choose our platform?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop learning from scattered sources. See how our platform transforms music education.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto bg-background border-border shadow-lg shadow-black/5">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Current Stack Column */}
              <div className="border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Traditional Learning</h3>
                  <div className="text-4xl">😵‍💫</div>
                </div>
                <div className="space-y-4">
                  {comparisons.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item.current}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ProducerPro Column */}
              <div className="pt-6 md:pt-0 md:pl-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Music Academy</h3>
                  <div className="text-4xl">🚀</div>
                </div>
                <div className="space-y-4">
                  {comparisons.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">{item.producerpro}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="border-t border-border pt-8 mt-8 text-center">
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Ready to transform your music learning?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Join thousands of producers who've already made the switch
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-b from-[#6356FF] to-[#5273FF] text-white rounded-xl font-medium hover:from-[#5a4beb] hover:to-[#4a68eb] transition-all cursor-pointer">
                Start Free Trial
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Social Proof */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">2,340+ producers</span> switched to ProducerPro last month
          </p>
        </div>
      </div>
    </section>
  );
}; 