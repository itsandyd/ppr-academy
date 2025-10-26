"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check, Eye, Edit3, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LandingPageCopyGeneratorProps {
  courseId?: Id<"courses">;
  userId: string;
  onCopyGenerated?: (copy: any) => void;
}

export function LandingPageCopyGenerator({ courseId, userId, onCopyGenerated }: LandingPageCopyGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedCopy, setEditedCopy] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateCopy = useAction(api.contentGeneration.generateLandingPageCopy);

  const handleGenerate = async () => {
    if (!courseId) {
      alert("Please save your course first before generating landing page copy.");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateCopy({
        courseId,
        userId,
      });

      if (result.success && result.copy) {
        setGeneratedCopy(result.copy);
        setEditedCopy(result.copy);
        if (onCopyGenerated) {
          onCopyGenerated(result.copy);
        }
      } else {
        alert(result.error || "Failed to generate landing page copy");
      }
    } catch (error) {
      console.error("Error generating copy:", error);
      alert("Failed to generate landing page copy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onCopyGenerated && editedCopy) {
      onCopyGenerated(editedCopy);
    }
    setEditMode(false);
  };

  if (!generatedCopy) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle>AI Landing Page Copy</CardTitle>
          </div>
          <CardDescription>
            Generate compelling marketing copy based on your course content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              AI will analyze all your modules, lessons, and chapters to create high-converting landing page copy.
              Make sure you've added course content first!
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will generate:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
              <li>• Compelling headline and subheadline</li>
              <li>• Key benefits and transformations</li>
              <li>• Target audience descriptions</li>
              <li>• Course learning outcomes</li>
              <li>• Urgency and conversion copy</li>
            </ul>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !courseId}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing your course content...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Landing Page Copy
              </>
            )}
          </Button>

          {!courseId && (
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
              Save your course first to enable AI copy generation
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentCopy = editMode ? editedCopy : generatedCopy;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle>Landing Page Copy</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditMode(false);
                    setEditedCopy(generatedCopy);
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Headline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Headline</CardTitle>
            <Badge variant="secondary">Primary Hook</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Input
              value={currentCopy.headline}
              onChange={(e) => setEditedCopy({ ...editedCopy, headline: e.target.value })}
              className="text-lg font-bold"
            />
          ) : (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{currentCopy.headline}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentCopy.headline)}
              >
                {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subheadline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subheadline</CardTitle>
            <Badge variant="secondary">Supporting Copy</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={currentCopy.subheadline}
              onChange={(e) => setEditedCopy({ ...editedCopy, subheadline: e.target.value })}
              rows={3}
              className="text-base"
            />
          ) : (
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">{currentCopy.subheadline}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentCopy.subheadline)}
              >
                {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Key Benefits</CardTitle>
            <Badge variant="secondary">Transformations</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentCopy.keyBenefits.map((benefit: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                {editMode ? (
                  <Input
                    value={benefit}
                    onChange={(e) => {
                      const newBenefits = [...currentCopy.keyBenefits];
                      newBenefits[index] = e.target.value;
                      setEditedCopy({ ...editedCopy, keyBenefits: newBenefits });
                    }}
                  />
                ) : (
                  <span className="text-foreground">{benefit}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Who Is This For */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Who Is This For?</CardTitle>
            <Badge variant="secondary">Target Audience</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentCopy.whoIsThisFor.map((person: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                {editMode ? (
                  <Input
                    value={person}
                    onChange={(e) => {
                      const newWho = [...currentCopy.whoIsThisFor];
                      newWho[index] = e.target.value;
                      setEditedCopy({ ...editedCopy, whoIsThisFor: newWho });
                    }}
                  />
                ) : (
                  <span className="text-foreground">{person}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* What You Will Learn */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">What You'll Learn</CardTitle>
            <Badge variant="secondary">Learning Outcomes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentCopy.whatYouWillLearn.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">📚</span>
                {editMode ? (
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newLearn = [...currentCopy.whatYouWillLearn];
                      newLearn[index] = e.target.value;
                      setEditedCopy({ ...editedCopy, whatYouWillLearn: newLearn });
                    }}
                  />
                ) : (
                  <span className="text-foreground">{item}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Transformation Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transformation Statement</CardTitle>
            <Badge variant="secondary">The "After" Picture</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={currentCopy.transformationStatement}
              onChange={(e) => setEditedCopy({ ...editedCopy, transformationStatement: e.target.value })}
              rows={4}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-foreground leading-relaxed">{currentCopy.transformationStatement}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentCopy.transformationStatement)}
              >
                {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Urgency Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Urgency Statement</CardTitle>
            <Badge variant="secondary">Call to Action Support</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={currentCopy.urgencyStatement}
              onChange={(e) => setEditedCopy({ ...editedCopy, urgencyStatement: e.target.value })}
              rows={3}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-foreground">{currentCopy.urgencyStatement}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentCopy.urgencyStatement)}
              >
                {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

