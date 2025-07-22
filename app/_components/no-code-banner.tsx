import { FC } from "react";
import { Code, Zap } from "lucide-react";

interface NoCodeBannerProps {}

export const NoCodeBanner: FC<NoCodeBannerProps> = () => {
  return (
    <section className="py-24 md:py-32 bg-pink-50/50 dark:bg-pink-950/10 relative overflow-hidden">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm font-medium">
                <Zap className="w-4 h-4 mr-2" />
                No Code Required
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Create beautiful courses
                <span className="block">without touching code</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Build engaging course pages with our intuitive editor. Add videos, audio, text, and interactive elements in minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">Visual course builder</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">Interactive lesson templates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">Custom branding & certificates</span>
              </div>
            </div>
          </div>

          {/* Right Column - Floating UI Snippet */}
          <div className="relative">
            <div className="relative z-10 bg-background rounded-lg shadow-xl shadow-black/10 border border-border p-6 transform rotate-2">
              {/* Code Editor Header */}
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-border">
                <Code className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Visual Editor</span>
              </div>
              
              {/* Mock UI Elements */}
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded border-l-4 border-pink-500">
                  <div className="text-xs text-muted-foreground mb-1">Video Lesson</div>
                  <div className="text-sm font-medium text-foreground">Add chapter markers</div>
                </div>
                <div className="p-3 bg-muted rounded border-l-4 border-blue-500">
                  <div className="text-xs text-muted-foreground mb-1">Audio Examples</div>
                  <div className="text-sm font-medium text-foreground">Upload beat samples</div>
                </div>
                <div className="p-3 bg-muted rounded border-l-4 border-green-500">
                  <div className="text-xs text-muted-foreground mb-1">Course Page</div>
                  <div className="text-sm font-medium text-foreground">Customize layout</div>
                </div>
              </div>
              
              {/* Apply Button */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="inline-flex items-center px-3 py-1 bg-gradient-to-b from-[#6356FF] to-[#5273FF] text-white rounded text-sm font-medium">
                  Apply Changes
                </div>
              </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-200/50 dark:bg-pink-800/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-200/50 dark:bg-purple-800/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}; 