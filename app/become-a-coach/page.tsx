import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { 
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Brain,
  Heart,
  Zap,
  Star,
  DollarSign,
  Clock,
  Video
} from "lucide-react";

export default async function BecomeACoachPage() {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  const benefits = [
    {
      icon: Brain,
      title: "Master Through Teaching",
      description: "Teaching forces you to truly understand concepts at a deeper level. When you explain music production to others, you solidify your own knowledge."
    },
    {
      icon: DollarSign,
      title: "Generate Income",
      description: "Turn your expertise into revenue. Successful coaches on our platform earn $500-$5000+ monthly by sharing their music production knowledge."
    },
    {
      icon: Users,
      title: "Build Community",
      description: "Connect with passionate producers worldwide. Build a network of students who become collaborators, fans, and industry connections."
    },
    {
      icon: Zap,
      title: "Stay Current",
      description: "Teaching keeps you sharp. Student questions challenge you to explore new techniques and stay on top of industry trends."
    },
    {
      icon: Heart,
      title: "Make an Impact",
      description: "Shape the next generation of producers. Your guidance can be the difference between someone giving up and becoming the next big artist."
    },
    {
      icon: Target,
      title: "Flexible Schedule",
      description: "Set your own hours and availability. Coach when it works for you, whether that's evenings, weekends, or during your free studio time."
    }
  ];

  const coachingTypes = [
    {
      title: "One-on-One Sessions",
      description: "Personal mentorship sessions tailored to each student's needs",
      price: "$50-150/hour",
      features: ["Screen sharing", "Project review", "Real-time feedback", "Custom lesson plans"]
    },
    {
      title: "Group Workshops",
      description: "Host workshops for multiple students on specific topics",
      price: "$25-75/student",
      features: ["Live streaming", "Interactive Q&A", "Group projects", "Recording available"]
    },
    {
      title: "Project Reviews",
      description: "Detailed feedback on student tracks and productions",
      price: "$25-100/review",
      features: ["Audio analysis", "Written feedback", "Mixing notes", "Next steps guidance"]
    }
  ];

  const requirements = [
    "2+ years of music production experience",
    "Released tracks or commercial work portfolio",
    "Reliable internet connection for video calls",
    "Passion for teaching and helping others grow",
    "Basic communication skills in English"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Become a <span className="text-yellow-300">Music Production</span> Coach
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Share your expertise, build your brand, and earn income by mentoring the next generation of music producers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/coach-application">
                  <Button size="lg" className="bg-white text-primary hover:bg-slate-100 text-lg px-8 py-3">
                    Apply to Become a Coach
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-white text-primary hover:bg-slate-100 text-lg px-8 py-3">
                    Sign Up to Apply
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </SignUpButton>
              )}
              <Link href="#learn-more">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-3"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Become a Coach Section */}
      <div className="py-20" id="learn-more">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Why Become a Coach?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Coaching on PPR Academy isn't just about teaching—it's about growing your career, 
              building your network, and making a real impact on the music industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-dark">{benefit.title}</h3>
                    </div>
                    <p className="text-slate-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coaching Types Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Coaching Opportunities
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose the coaching format that works best for your schedule and teaching style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coachingTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-dark">{type.title}</CardTitle>
                  <p className="text-slate-600">{type.description}</p>
                  <div className="text-2xl font-bold text-primary">{type.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Coach Requirements
            </h2>
            <p className="text-xl text-slate-600">
              We maintain high standards to ensure quality education for our students
            </p>
          </div>

          <Card className="p-8">
            <ul className="space-y-4">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-4" />
                  <span className="text-slate-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Coaching Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join our community of expert coaches and start making an impact today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/coach-application">
                <Button size="lg" className="bg-white text-primary hover:bg-slate-100 text-lg px-8 py-3">
                  Submit Coach Application
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-white text-primary hover:bg-slate-100 text-lg px-8 py-3">
                  Sign Up to Apply
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </SignUpButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 