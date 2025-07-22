import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface TrustpilotReviewsProps {}

export const TrustpilotReviews: FC<TrustpilotReviewsProps> = () => {
  const reviews = [
    {
      name: "Alex Rodriguez",
      role: "Student • Now at Atlantic Records",
      rating: 5,
      quote: "The platform completely transformed my understanding of music production. I learned more in 3 months than I did in years of YouTube tutorials. Now I'm working with major artists!",
      avatar: "AR"
    },
    {
      name: "Maya Chen",
      role: "Creator • Making $15K/month", 
      rating: 5,
      quote: "I love how easy it is to create and manage my courses. The platform handles everything - payments, student management, analytics. I can focus on teaching and creating content.",
      avatar: "MC"
    },
    {
      name: "Jordan Taylor",
      role: "Student • Signed to Monstercat",
      rating: 5,
      quote: "The direct access to industry professionals through 1-on-1 coaching is invaluable. My mentor helped me get my first major release. Worth every penny.",
      avatar: "JT"
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-green-500 fill-current" />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">4.9 out of 5 stars</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Loved by students & creators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what real students and educators say about our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <Card key={index} className="p-6 bg-background border-border shadow-lg shadow-black/5">
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex space-x-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-foreground leading-relaxed">
                  "{review.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 bg-gradient-to-b from-[#6356FF] to-[#5273FF] rounded-full flex items-center justify-center text-white font-medium">
                    {review.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{review.name}</div>
                    <div className="text-sm text-muted-foreground">{review.role}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trustpilot Badge */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 px-6 py-3 bg-muted rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="font-semibold text-foreground">Trustpilot</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Rated 4.9/5 from 2,340+ reviews
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 