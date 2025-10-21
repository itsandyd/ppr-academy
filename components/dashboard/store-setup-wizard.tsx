"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Store, 
  User, 
  Sparkles, 
  ArrowRight, 
  Music,
  Loader2,
  CheckCircle
} from "lucide-react";

interface StoreSetupWizardProps {
  onStoreCreated?: () => void;
}

export function StoreSetupWizard({ onStoreCreated }: StoreSetupWizardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: "",
    storeSlug: "",
    description: "",
  });

  const createStore = useMutation(api.stores.createStore);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
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
      });

      toast({
        title: "Success! 🎉",
        description: "Your creator store has been set up successfully",
      });

      setStep(3); // Success step
      
      // Call the callback after a short delay to show success
      setTimeout(() => {
        onStoreCreated?.();
      }, 2000);

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

  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Store Created! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              Your creator store is ready. Redirecting to your dashboard...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Setting up your workspace...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Store className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Welcome to PPR Academy! 🎵</h1>
          <p className="text-lg text-muted-foreground">
            Let's set up your creator store so you can start sharing your music knowledge
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-purple-500' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <Store className="w-4 h-4" />
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-purple-500' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Ready to Share Your Music Knowledge?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Music className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Create Courses</h3>
                    <p className="text-sm text-muted-foreground">
                      Share your production techniques and knowledge
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Sell Products</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload sample packs, presets, and beats
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Offer Coaching</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide 1-on-1 mentoring and feedback
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg">
                  <h4 className="font-semibold mb-2">What you'll get:</h4>
                  <ul className="space-y-2 text-sm">
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
                  </ul>
                </div>

                <Button 
                  onClick={() => setStep(2)} 
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

        {/* Step 2: Store Setup */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Set Up Your Creator Store
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
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be displayed as your brand name
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="storeSlug">Store URL</Label>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                        {process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'academy.pauseplayrepeat.com'}/
                      </span>
                      <Input
                        id="storeSlug"
                        value={formData.storeSlug}
                        onChange={(e) => setFormData(prev => ({ ...prev, storeSlug: e.target.value }))}
                        className="rounded-l-none"
                        placeholder="your-store-name"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your unique store URL
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Store Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell your audience what you're all about..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateStore}
                    disabled={!formData.storeName.trim() || isLoading}
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
