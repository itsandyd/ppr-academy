"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Store, 
  User, 
  Sparkles, 
  ArrowRight, 
  Music,
  Loader2,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Package,
  ArrowLeft,
  Crown,
  Rocket,
  Target
} from "lucide-react";
import { StepProgressIndicator } from "@/components/ui/step-progress-indicator";
import { ProductTypeSelector } from "@/components/products/product-type-selector";

interface StoreSetupWizardEnhancedProps {
  onStoreCreated?: (storeId: string) => void;
}

export function StoreSetupWizardEnhanced({ onStoreCreated }: StoreSetupWizardEnhancedProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [createdStoreId, setCreatedStoreId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
    description: "",
    logoUrl: "",
    firstProductType: "",
  });

  const createStore = useMutation(api.stores.createStore);

  const steps = [
    { id: "welcome", title: "Welcome", icon: Sparkles },
    { id: "basics", title: "Store Info", icon: Store },
    { id: "branding", title: "Branding", icon: ImageIcon },
    { id: "product", title: "First Product", icon: Package },
    { id: "success", title: "Complete", icon: CheckCircle }
  ];

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      storeName: name,
      storeSlug: generateSlug(name)
    }));
  };

  const handleCreateStore = async () => {
    if (!user?.id || !formData.storeName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const storeId = await createStore({
        name: formData.storeName.trim(),
        slug: formData.storeSlug.trim() || undefined,
        userId: user.id,
        description: formData.description.trim() || undefined,
        logoUrl: formData.logoUrl || undefined,
      });

      setCreatedStoreId(storeId);
      
      // Trigger confetti celebration
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
      });

      toast({
        title: "🎉 Store Created Successfully!",
        description: `Welcome to your creator journey, ${formData.storeName}!`,
        className: "bg-white dark:bg-black",
      });

      setCurrentStep(4); // Success step
      
    } catch (error) {
      console.error("Error creating store:", error);
      toast({
        title: "Error",
        description: `Failed to create store: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success step with confetti
  if (currentStep === 4) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Rocket className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-2">Your Store is Live! 🎉</h2>
              <p className="text-lg text-muted-foreground mb-8">
                {formData.storeName} is ready to share with the world
              </p>

              <div className="bg-white dark:bg-black rounded-lg p-6 mb-8 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-2">Your Store URL:</p>
                <p className="font-mono text-sm text-foreground break-all">
                  ppracademy.com/{formData.storeSlug}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Next Steps:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-black rounded-lg border border-border">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="font-medium text-sm">1. Add Products</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your first product to start earning
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-black rounded-lg border border-border">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-medium text-sm">2. Set Up Payments</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect Stripe to receive earnings
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-black rounded-lg border border-border">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="font-medium text-sm">3. Share Your Link</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Promote your store on social media
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button 
                  size="lg"
                  onClick={() => {
                    if (formData.firstProductType) {
                      // Navigate to product creation
                      window.location.href = `/store/${createdStoreId}/products`;
                    } else {
                      onStoreCreated?.(createdStoreId || "");
                    }
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => onStoreCreated?.(createdStoreId || "")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Progress Indicator */}
        <div className="mb-8">
          <StepProgressIndicator
            steps={steps}
            currentStep={steps[currentStep].id}
            completedSteps={steps.slice(0, currentStep).map(s => s.id)}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Music className="w-6 h-6" />
                    Ready to Share Your Music Knowledge?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg hover:border-purple-300 transition-colors">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Music className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Create Courses</h3>
                      <p className="text-sm text-muted-foreground">
                        Share your production techniques
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg hover:border-purple-300 transition-colors">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Store className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Sell Products</h3>
                      <p className="text-sm text-muted-foreground">
                        Sample packs, presets, beats
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg hover:border-purple-300 transition-colors">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Offer Coaching</h3>
                      <p className="text-sm text-muted-foreground">
                        1-on-1 mentoring and feedback
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      What you'll get:
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Your own branded creator store
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Professional analytics dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Direct fan engagement tools
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        90% revenue share (10% platform fee)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Email & social media integration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Instant payout setup with Stripe
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => setCurrentStep(1)} 
                    className="w-full"
                    size="lg"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Store Basics */}
          {currentStep === 1 && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="storeName">Store Name *</Label>
                      <Input
                        id="storeName"
                        placeholder="e.g., BeatMaker Studios, Producer Pro"
                        value={formData.storeName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="mt-1 h-12 text-base"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This will be displayed as your brand name
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="storeSlug">Store URL</Label>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-muted-foreground bg-muted px-4 py-3 rounded-l-md border border-r-0 h-12">
                          ppracademy.com/
                        </span>
                        <Input
                          id="storeSlug"
                          value={formData.storeSlug}
                          onChange={(e) => setFormData(prev => ({ ...prev, storeSlug: e.target.value }))}
                          className="rounded-l-none h-12"
                          placeholder="your-store-name"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will be your unique store URL
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Store Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell your audience what you're all about and what kind of content you create..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This will appear on your public storefront. Make it engaging!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(0)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.storeName.trim() || !formData.description.trim()}
                      className="flex-1"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Branding (Logo Upload) */}
          {currentStep === 2 && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Brand Your Store
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Store Logo (Optional)</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-purple-300 transition-colors">
                      {formData.logoUrl ? (
                        <div className="space-y-4">
                          <img
                            src={formData.logoUrl}
                            alt="Store logo"
                            className="w-32 h-32 object-cover rounded-lg mx-auto border-4 border-white dark:border-black shadow-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}
                          >
                            Change Logo
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm font-medium mb-2">Upload your store logo</p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Recommended: Square image, min 400x400px
                          </p>
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Image
                          </Button>
                          <p className="text-xs text-muted-foreground mt-4">
                            Or use your profile picture (you can change this later)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      className="flex-1"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: First Product Type Selection */}
          {currentStep === 3 && (
            <motion.div
              key="product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Choose Your First Product
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select what you'd like to create first. Don't worry, you can add more later!
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProductTypeSelector
                    onSelect={(typeId) => setFormData(prev => ({ ...prev, firstProductType: typeId }))}
                    selectedType={formData.firstProductType}
                  />

                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 <strong>Tip:</strong> Start with something you already have! Most creators begin with a sample pack or preset collection they've been working on.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleCreateStore}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Store...
                        </>
                      ) : (
                        <>
                          Create My Store
                          <Sparkles className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    You can skip product selection and add products later from your dashboard
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

