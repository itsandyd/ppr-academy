"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
  Wand2,
  FileText,
  Search,
  Tag,
  Languages,
  MessageSquare,
  HelpCircle,
  Loader2,
  Check,
  Copy,
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  List,
} from "lucide-react";
import { toast } from "sonner";

interface ProductAIAssistantProps {
  title: string;
  description: string;
  category: string;
  price?: number;
  onDescriptionUpdate?: (description: string) => void;
  onTagsUpdate?: (tags: string[]) => void;
  onTitleUpdate?: (title: string) => void;
}

type ToneType = "professional" | "casual" | "hype" | "minimal" | "storytelling" | "technical";

export function ProductAIAssistant({
  title,
  description,
  category,
  price,
  onDescriptionUpdate,
  onTagsUpdate,
  onTitleUpdate,
}: ProductAIAssistantProps) {
  const [activeTab, setActiveTab] = useState("description");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ToneType>("professional");
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [generatedContent, setGeneratedContent] = useState<{
    description?: { description: string; shortDescription: string };
    seo?: {
      metaTitle: string;
      metaDescription: string;
      keywords: string[];
      ogTitle: string;
      ogDescription: string;
    };
    salesCopy?: {
      headline: string;
      subheadline: string;
      bulletPoints: string[];
      ctaText: string;
      urgencyText?: string;
      socialProof: string;
    };
    tags?: { tags: string[]; genres: string[]; moods: string[]; instruments: string[] };
    translation?: { title: string; description: string; language: string };
    rewrite?: { rewritten: string; tone: string };
    bulletPoints?: { features: string[]; benefits: string[]; whatsIncluded: string[] };
    faqs?: { faqs: { question: string; answer: string }[] };
  }>({});

  const generateDescription = useAction(api.productAI.generateProductDescription);
  const generateSEO = useAction(api.productAI.generateSEO);
  const generateSalesCopy = useAction(api.productAI.generateSalesCopy);
  const suggestTags = useAction(api.productAI.suggestTags);
  const translateContent = useAction(api.productAI.translateContent);
  const rewriteInTone = useAction(api.productAI.rewriteInTone);
  const generateBulletPoints = useAction(api.productAI.generateBulletPoints);
  const generateFAQ = useAction(api.productAI.generateFAQ);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = async (type: string) => {
    if (!title.trim()) {
      toast.error("Please enter a product title first");
      return;
    }

    setIsGenerating(true);
    try {
      switch (type) {
        case "description": {
          const result = await generateDescription({
            title,
            category,
            existingDescription: description || undefined,
          });
          setGeneratedContent((prev) => ({ ...prev, description: result }));
          break;
        }
        case "seo": {
          const result = await generateSEO({
            title,
            description: description || title,
            category,
          });
          setGeneratedContent((prev) => ({ ...prev, seo: result }));
          break;
        }
        case "salesCopy": {
          const result = await generateSalesCopy({
            title,
            description: description || title,
            category,
            price,
          });
          setGeneratedContent((prev) => ({ ...prev, salesCopy: result }));
          break;
        }
        case "tags": {
          const result = await suggestTags({
            title,
            description: description || title,
            category,
          });
          setGeneratedContent((prev) => ({ ...prev, tags: result }));
          break;
        }
        case "translate": {
          const result = await translateContent({
            title,
            description: description || "",
            targetLanguage: selectedLanguage,
          });
          setGeneratedContent((prev) => ({ ...prev, translation: result }));
          break;
        }
        case "rewrite": {
          const result = await rewriteInTone({
            text: description || title,
            tone: selectedTone,
            textType: "description",
          });
          setGeneratedContent((prev) => ({ ...prev, rewrite: result }));
          break;
        }
        case "bulletPoints": {
          const result = await generateBulletPoints({
            title,
            description: description || title,
            category,
          });
          setGeneratedContent((prev) => ({ ...prev, bulletPoints: result }));
          break;
        }
        case "faqs": {
          const result = await generateFAQ({
            title,
            description: description || title,
            category,
            price,
          });
          setGeneratedContent((prev) => ({ ...prev, faqs: result }));
          break;
        }
      }
      toast.success("Content generated!");
    } catch (error) {
      toast.error("Failed to generate content. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleCopy(text, field)}
      className="h-8 w-8 p-0"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const ApplyButton = ({ onClick, label = "Apply" }: { onClick: () => void; label?: string }) => (
    <Button size="sm" onClick={onClick} className="h-8">
      <ChevronRight className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Writing Assistant
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto bg-white dark:bg-black sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Writing Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 grid grid-cols-4">
              <TabsTrigger value="description" className="text-xs">
                <FileText className="mr-1 h-3 w-3" />
                Write
              </TabsTrigger>
              <TabsTrigger value="optimize" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                Optimize
              </TabsTrigger>
              <TabsTrigger value="enhance" className="text-xs">
                <Wand2 className="mr-1 h-3 w-3" />
                Enhance
              </TabsTrigger>
              <TabsTrigger value="more" className="text-xs">
                <Zap className="mr-1 h-3 w-3" />
                More
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Generate Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Generate a compelling product description based on your title and category.
                  </p>
                  <Button
                    onClick={() => handleGenerate("description")}
                    disabled={isGenerating || !title}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate Description
                  </Button>

                  {generatedContent.description && (
                    <div className="space-y-3 border-t pt-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Full Description</span>
                          <div className="flex gap-1">
                            <CopyButton
                              text={generatedContent.description.description}
                              field="desc"
                            />
                            {onDescriptionUpdate && (
                              <ApplyButton
                                onClick={() =>
                                  onDescriptionUpdate(generatedContent.description!.description)
                                }
                              />
                            )}
                          </div>
                        </div>
                        <p className="rounded-lg bg-muted p-3 text-sm">
                          {generatedContent.description.description}
                        </p>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Short Description</span>
                          <CopyButton
                            text={generatedContent.description.shortDescription}
                            field="shortDesc"
                          />
                        </div>
                        <p className="rounded-lg bg-muted p-3 text-sm">
                          {generatedContent.description.shortDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <List className="h-4 w-4" />
                    Generate Bullet Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleGenerate("bulletPoints")}
                    disabled={isGenerating || !title}
                    className="w-full"
                    variant="outline"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <List className="mr-2 h-4 w-4" />
                    )}
                    Generate Bullet Points
                  </Button>

                  {generatedContent.bulletPoints && (
                    <div className="space-y-3 border-t pt-3">
                      {["features", "benefits", "whatsIncluded"].map((key) => (
                        <div key={key}>
                          <span className="mb-2 block text-xs font-medium capitalize">
                            {key === "whatsIncluded" ? "What's Included" : key}
                          </span>
                          <ul className="space-y-1">
                            {(generatedContent.bulletPoints as any)[key]?.map(
                              (item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 rounded bg-muted p-2 text-sm"
                                >
                                  <span className="text-primary">•</span>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimize" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Search className="h-4 w-4" />
                    SEO Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleGenerate("seo")}
                    disabled={isGenerating || !title}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Generate SEO Content
                  </Button>

                  {generatedContent.seo && (
                    <div className="space-y-3 border-t pt-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Meta Title</span>
                          <CopyButton text={generatedContent.seo.metaTitle} field="metaTitle" />
                        </div>
                        <p className="rounded bg-muted p-2 text-sm">
                          {generatedContent.seo.metaTitle}
                        </p>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Meta Description</span>
                          <CopyButton
                            text={generatedContent.seo.metaDescription}
                            field="metaDesc"
                          />
                        </div>
                        <p className="rounded bg-muted p-2 text-sm">
                          {generatedContent.seo.metaDescription}
                        </p>
                      </div>
                      <div>
                        <span className="mb-2 block text-xs font-medium">Keywords</span>
                        <div className="flex flex-wrap gap-1">
                          {generatedContent.seo.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4" />
                    Tag Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleGenerate("tags")}
                    disabled={isGenerating || !title}
                    className="w-full"
                    variant="outline"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="mr-2 h-4 w-4" />
                    )}
                    Suggest Tags
                  </Button>

                  {generatedContent.tags && (
                    <div className="space-y-3 border-t pt-3">
                      {["tags", "genres", "moods", "instruments"].map((key) => (
                        <div key={key}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium capitalize">{key}</span>
                            {key === "tags" && onTagsUpdate && (
                              <ApplyButton
                                onClick={() => onTagsUpdate(generatedContent.tags!.tags)}
                                label="Apply All"
                              />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(generatedContent.tags as any)[key]?.map((tag: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                                onClick={() => {
                                  if (onTagsUpdate) {
                                    handleCopy(tag, `tag-${key}-${i}`);
                                  }
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enhance" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Sales Copy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleGenerate("salesCopy")}
                    disabled={isGenerating || !title}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="mr-2 h-4 w-4" />
                    )}
                    Generate Sales Copy
                  </Button>

                  {generatedContent.salesCopy && (
                    <div className="space-y-3 border-t pt-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Headline</span>
                          <CopyButton text={generatedContent.salesCopy.headline} field="headline" />
                        </div>
                        <p className="rounded bg-muted p-2 text-lg font-bold">
                          {generatedContent.salesCopy.headline}
                        </p>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Subheadline</span>
                          <CopyButton
                            text={generatedContent.salesCopy.subheadline}
                            field="subheadline"
                          />
                        </div>
                        <p className="rounded bg-muted p-2 text-sm">
                          {generatedContent.salesCopy.subheadline}
                        </p>
                      </div>
                      <div>
                        <span className="mb-2 block text-xs font-medium">Bullet Points</span>
                        <ul className="space-y-1">
                          {generatedContent.salesCopy.bulletPoints.map((point, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 rounded bg-muted p-2 text-sm"
                            >
                              <span className="text-green-500">✓</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">{generatedContent.salesCopy.ctaText}</Badge>
                        {generatedContent.salesCopy.urgencyText && (
                          <Badge variant="destructive">
                            {generatedContent.salesCopy.urgencyText}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-4 w-4" />
                    Rewrite in Different Tone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={selectedTone}
                    onValueChange={(v) => setSelectedTone(v as ToneType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="hype">Hype & Exciting</SelectItem>
                      <SelectItem value="minimal">Minimal & Clean</SelectItem>
                      <SelectItem value="storytelling">Storytelling</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleGenerate("rewrite")}
                    disabled={isGenerating || !description}
                    className="w-full"
                    variant="outline"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Rewrite Description
                  </Button>

                  {generatedContent.rewrite && (
                    <div className="border-t pt-3">
                      <div className="mb-1 flex items-center justify-between">
                        <Badge variant="outline">{generatedContent.rewrite.tone}</Badge>
                        <div className="flex gap-1">
                          <CopyButton text={generatedContent.rewrite.rewritten} field="rewrite" />
                          {onDescriptionUpdate && (
                            <ApplyButton
                              onClick={() =>
                                onDescriptionUpdate(generatedContent.rewrite!.rewritten)
                              }
                            />
                          )}
                        </div>
                      </div>
                      <p className="mt-2 rounded-lg bg-muted p-3 text-sm">
                        {generatedContent.rewrite.rewritten}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="more" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Languages className="h-4 w-4" />
                    Translate Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleGenerate("translate")}
                    disabled={isGenerating || !title}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Languages className="mr-2 h-4 w-4" />
                    )}
                    Translate
                  </Button>

                  {generatedContent.translation && (
                    <div className="space-y-3 border-t pt-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Translated Title</span>
                          <CopyButton
                            text={generatedContent.translation.title}
                            field="transTitle"
                          />
                        </div>
                        <p className="rounded bg-muted p-2 text-sm">
                          {generatedContent.translation.title}
                        </p>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium">Translated Description</span>
                          <CopyButton
                            text={generatedContent.translation.description}
                            field="transDesc"
                          />
                        </div>
                        <p className="rounded-lg bg-muted p-3 text-sm">
                          {generatedContent.translation.description}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <HelpCircle className="h-4 w-4" />
                    FAQ Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleGenerate("faqs")}
                    disabled={isGenerating || !title}
                    className="w-full"
                    variant="outline"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <HelpCircle className="mr-2 h-4 w-4" />
                    )}
                    Generate FAQs
                  </Button>

                  {generatedContent.faqs && (
                    <div className="max-h-80 space-y-2 overflow-y-auto border-t pt-3">
                      {generatedContent.faqs.faqs.map((faq, i) => (
                        <div key={i} className="rounded-lg bg-muted p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{faq.question}</p>
                            <CopyButton
                              text={`Q: ${faq.question}\nA: ${faq.answer}`}
                              field={`faq-${i}`}
                            />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
