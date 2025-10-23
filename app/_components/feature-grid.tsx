import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Users, Play, MessageCircle, BookOpen } from "lucide-react";

interface FeatureGridProps {}

export const FeatureGrid: FC<FeatureGridProps> = () => {
  const features = [
    {
      icon: Users,
      title: "Creator Communities",
      description: "Connect with other producers, share knowledge, and collaborate on projects with built-in community features.",
    },
    {
      icon: Play,
      title: "Interactive Learning",
      description: "Learn through hands-on tutorials, project-based lessons, and real-time feedback from industry professionals.",
    },
    {
      icon: MessageCircle,
      title: "Direct Mentorship",
      description: "Get personalized guidance through 1-on-1 coaching sessions and direct messaging with your favorite creators.",
    },
    {
      icon: BookOpen,
      title: "Course Library",
      description: "Access hundreds of courses covering everything from beat making to music business and marketing strategies.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-muted/40">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Connecting Creators & Students
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our marketplace brings together the best producers to share their knowledge through courses, coaching, and exclusive content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-background border-border shadow-lg shadow-black/5 hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-b from-primary to-chart-1 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            And much more... <span className="font-medium text-foreground">Browse creators to discover your perfect learning path</span>
          </p>
        </div>
      </div>
    </section>
  );
}; 