"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link, 
  Youtube, 
  Music, 
  Globe, 
  Save, 
  ArrowRight, 
  ExternalLink,
  Play,
  Eye,
  Loader2,
  Edit3
} from "lucide-react";
import { z } from "zod";

const urlMediaSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  displayStyle: z.enum(["embed", "card", "button"]),
});

type UrlMediaSchema = z.infer<typeof urlMediaSchema>;

interface MediaInfo {
  type: "youtube" | "spotify" | "website" | "social" | "unknown";
  title?: string;
  description?: string;
  thumbnail?: string;
  embedCode?: string;
  isEmbeddable: boolean;
}

interface FormSectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function FormSection({ index, title, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-sm">
          {index}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="ml-11">{children}</div>
    </div>
  );
}

// Media detection utility
function detectMediaType(url: string): MediaInfo {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.toLowerCase();

  // YouTube detection
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    return {
      type: "youtube",
      isEmbeddable: true,
      embedCode: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
    };
  }

  // Spotify detection
  if (domain.includes('spotify.com')) {
    return {
      type: "spotify",
      isEmbeddable: true,
      embedCode: url.replace('open.spotify.com', 'open.spotify.com/embed'),
    };
  }

  // Social media detection
  if (domain.includes('twitter.com') || domain.includes('instagram.com') || domain.includes('tiktok.com')) {
    return {
      type: "social",
      isEmbeddable: false, // Most social embeds require special handling
    };
  }

  // Default website
  return {
    type: "website",
    isEmbeddable: false,
  };
}

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export function UrlMediaForm() {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const storeId = params.storeId as string;

  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Convex mutations
  const createUrlMedia = useMutation(api.digitalProducts.createUrlMediaProduct);

  const form = useForm<UrlMediaSchema>({
    resolver: zodResolver(urlMediaSchema),
    defaultValues: { 
      url: searchParams.get("url") || "", 
      title: searchParams.get("title") || "", 
      description: searchParams.get("description") || "",
      displayStyle: (searchParams.get("displayStyle") as "embed" | "card" | "button") || "card"
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;
  
  const watchedUrl = watch("url");

  // Update URL params when form values change for real-time preview
  const updatePreview = (values: Partial<UrlMediaSchema>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Analyze URL when it changes
  useEffect(() => {
    const analyzeUrl = async () => {
      if (!watchedUrl) {
        setMediaInfo(null);
        return;
      }

      try {
        new URL(watchedUrl); // Validate URL format
        setIsAnalyzing(true);
        
        // Detect media type
        const detected = detectMediaType(watchedUrl);
        setMediaInfo(detected);

        // Auto-fill title if not set
        if (!watch("title") && detected.title) {
          setValue("title", detected.title);
        }

        // Auto-fill description if not set
        if (!watch("description") && detected.description) {
          setValue("description", detected.description);
        }

      } catch (error) {
        setMediaInfo(null);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const debounceTimer = setTimeout(analyzeUrl, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedUrl, setValue, watch]);

  const onSubmit = async (data: UrlMediaSchema) => {
    if (!user?.id || !mediaInfo) {
      alert("Please ensure you're logged in and have entered a valid URL");
      return;
    }

    try {
      const urlMediaId = await createUrlMedia({
        title: data.title,
        description: data.description || undefined,
        url: data.url,
        displayStyle: data.displayStyle,
        mediaType: mediaInfo.type as any,
        storeId,
        userId: user.id,
        buttonLabel: "Visit Link",
      });

      console.log("✅ URL/Media product created:", urlMediaId);
      
      // Navigate to products page or show success message
      router.push(`/store/${storeId}/products`);
      
    } catch (error) {
      console.error("Failed to create URL/Media product:", error);
      alert("Failed to create URL/Media product. Please try again.");
    }
  };

  const handleSaveAsDraft = async () => {
    if (!user?.id || !watch("url") || !watch("title") || !mediaInfo) {
      alert("Please fill in the URL and title before saving");
      return;
    }

    try {
      const data = form.getValues();
      
      const urlMediaId = await createUrlMedia({
        title: data.title,
        description: data.description || undefined,
        url: data.url,
        displayStyle: data.displayStyle,
        mediaType: mediaInfo.type as any,
        storeId,
        userId: user.id,
        buttonLabel: "Visit Link",
      });

      console.log("✅ URL/Media product saved as draft:", urlMediaId);
      alert("URL/Media product saved as draft!");
      
    } catch (error) {
      console.error("Failed to save URL/Media product:", error);
      alert("Failed to save URL/Media product. Please try again.");
    }
  };

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case "youtube": return <Youtube className="w-5 h-5 text-red-600" />;
      case "spotify": return <Music className="w-5 h-5 text-green-600" />;
      case "social": return <ExternalLink className="w-5 h-5 text-blue-600" />;
      default: return <Globe className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMediaTypeBadge = (type?: string) => {
    switch (type) {
      case "youtube": return <Badge className="bg-red-100 text-red-800">YouTube Video</Badge>;
      case "spotify": return <Badge className="bg-green-100 text-green-800">Spotify Content</Badge>;
      case "social": return <Badge className="bg-blue-100 text-blue-800">Social Media</Badge>;
      case "website": return <Badge className="bg-gray-100 text-gray-800">Website</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const steps = [
    { 
      label: "URL Input", 
      href: "?step=url", 
      icon: Link, 
      active: true
    },
    { 
      label: "Customize", 
      href: "?step=customize", 
      icon: Edit3, 
      active: false
    },
    { 
      label: "Style", 
      href: "?step=style", 
      icon: Eye, 
      active: false
    },
  ];

  return (
    <div className="max-w-[640px]">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <Tabs value="url" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.label}
                  value={step.label.toLowerCase()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step.active
                      ? "bg-white border border-blue-500 text-blue-600 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600"
                      : "text-[#4B4E68] hover:text-blue-600 data-[state=active]:bg-transparent"
                  }`}
                  disabled={!step.active}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {step.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
        {/* Step 1 - URL Input */}
        <FormSection index={1} title="Enter URL">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                URL or Link
              </label>
              <Input
                {...register("url")}
                placeholder="https://youtube.com/watch?v=... or https://open.spotify.com/..."
                className="h-12 rounded-xl border-blue-200 px-4 focus:border-blue-500"
                onChange={(e) => {
                  register("url").onChange(e);
                  updatePreview({ url: e.target.value });
                }}
              />
              {formState.errors.url && (
                <p className="text-red-600 text-sm mt-1">{formState.errors.url.message}</p>
              )}
            </div>

            {/* URL Analysis */}
            {isAnalyzing && (
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Analyzing URL...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media Type Detection */}
            {mediaInfo && watchedUrl && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getMediaIcon(mediaInfo.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-blue-800">Media Detected</span>
                        {getMediaTypeBadge(mediaInfo.type)}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">Embeddable:</span>
                          <span className={mediaInfo.isEmbeddable ? "text-green-600" : "text-orange-600"}>
                            {mediaInfo.isEmbeddable ? "Yes" : "Link only"}
                          </span>
                        </div>
                        {mediaInfo.embedCode && (
                          <div className="text-blue-600">
                            <span>Embed URL: </span>
                            <code className="bg-white px-2 py-1 rounded text-xs">
                              {mediaInfo.embedCode}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </FormSection>

        {/* Step 2 - Customization */}
        <FormSection index={2} title="Customize Display">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Display Title
              </label>
              <Input
                {...register("title")}
                placeholder="e.g., How to Use EQ3 in Ableton Live"
                className="h-12 rounded-xl border-blue-200 px-4 focus:border-blue-500"
                onChange={(e) => {
                  register("title").onChange(e);
                  updatePreview({ title: e.target.value });
                }}
              />
              {formState.errors.title && (
                <p className="text-red-600 text-sm mt-1">{formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description (Optional)
              </label>
              <Textarea
                {...register("description")}
                placeholder="Describe what visitors will find when they click this link..."
                className="min-h-[100px] rounded-xl border-blue-200 px-4 focus:border-blue-500"
                onChange={(e) => {
                  register("description").onChange(e);
                  updatePreview({ description: e.target.value });
                }}
              />
            </div>
          </div>
        </FormSection>

        {/* Step 3 - Display Style */}
        <FormSection index={3} title="Choose Display Style">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Embed Style */}
              <Card 
                className={`cursor-pointer transition-all ${
                  watch("displayStyle") === "embed" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => {
                  setValue("displayStyle", "embed");
                  updatePreview({ displayStyle: "embed" });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Play className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Embed</h4>
                      <p className="text-sm text-muted-foreground">
                        Show content directly (YouTube videos, Spotify players)
                      </p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      {watch("displayStyle") === "embed" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Style */}
              <Card 
                className={`cursor-pointer transition-all ${
                  watch("displayStyle") === "card" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => {
                  setValue("displayStyle", "card");
                  updatePreview({ displayStyle: "card" });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Card</h4>
                      <p className="text-sm text-muted-foreground">
                        Preview card with title, description, and thumbnail
                      </p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      {watch("displayStyle") === "card" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button Style */}
              <Card 
                className={`cursor-pointer transition-all ${
                  watch("displayStyle") === "button" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => {
                  setValue("displayStyle", "button");
                  updatePreview({ displayStyle: "button" });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Button</h4>
                      <p className="text-sm text-muted-foreground">
                        Simple button that opens link in new tab
                      </p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      {watch("displayStyle") === "button" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </FormSection>

        {/* URL Preview */}
        {watchedUrl && mediaInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watch("displayStyle") === "embed" && mediaInfo.isEmbeddable && mediaInfo.embedCode ? (
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">Embed Preview:</p>
                  <div className="bg-white rounded-lg p-4 border">
                    {mediaInfo.type === "youtube" ? (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Youtube className="w-12 h-12 text-red-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">YouTube video will embed here</p>
                        </div>
                      </div>
                    ) : mediaInfo.type === "spotify" ? (
                      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Music className="w-12 h-12 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Spotify player will embed here</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">Link Card Preview:</p>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center gap-3">
                      {getMediaIcon(mediaInfo.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {watch("title") || "Link Title"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {watch("description") || "Link description"}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Create your link
          </span>
          <Button 
            variant="outline" 
            type="button"
            onClick={handleSaveAsDraft}
            className="flex items-center gap-2 h-10 rounded-lg px-4"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-lg px-8 flex items-center gap-2"
            disabled={!formState.isValid || !mediaInfo}
          >
            <ArrowRight size={16} />
            Create Link
          </Button>
        </div>
      </form>
    </div>
  );
}
