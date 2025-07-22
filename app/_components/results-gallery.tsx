import { FC } from "react";

interface ResultsGalleryProps {}

export const ResultsGallery: FC<ResultsGalleryProps> = () => {
  const results = [
    {
      creator: "BEATS by Marcus",
      achievement: "Earning $8.5K/month",
      description: "Teaching 340+ students hip-hop production",
    },
    {
      creator: "ElectraVibes",
      achievement: "580 subscribers",
      description: "Making $12.2K/month from EDM courses",
    },
    {
      creator: "TrapLord Studios",
      achievement: "720 students",
      description: "Top-earning creator at $15.8K/month",
    },
    {
      creator: "Sarah Johnson",
      achievement: "Got signed to Monstercat",
      description: "After 2 months of learning on platform",
    },
    {
      creator: "Mike Chen",
      achievement: "Released with Spinnin'",
      description: "Student turned professional artist",
    },
    {
      creator: "David Kim",
      achievement: "Beatport #1 Producer",
      description: "Now teaching 200+ students",
    },
  ];

  return (
    <section id="results" className="py-24 md:py-32 bg-muted/40">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Success Stories from Our Community
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how students and creators are achieving their music production goals through our platform
          </p>
        </div>

        {/* Masonry Layout */}
        <div className="columns-2 md:columns-3 gap-6 space-y-6">
          {results.map((result, index) => (
            <div key={index} className="break-inside-avoid mb-6">
              <div className="bg-background rounded-xl border border-border shadow-lg shadow-black/5 overflow-hidden">
                {/* Phone Mockup */}
                <div className="aspect-[3/4] bg-black p-3">
                  <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                    {/* todo: Replace with actual success screenshot */}
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-lg font-bold text-foreground mb-2">
                          {result.achievement}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.creator}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Caption */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    {result.achievement}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.description}
                  </p>
                  <div className="text-sm font-medium text-primary">
                    {result.creator}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-foreground font-medium mb-4">
            Ready to write your success story?
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-b from-[#6356FF] to-[#5273FF] text-white rounded-xl font-medium hover:from-[#5a4beb] hover:to-[#4a68eb] transition-all cursor-pointer">
            Join 50,000+ creators
          </div>
        </div>
      </div>
    </section>
  );
}; 