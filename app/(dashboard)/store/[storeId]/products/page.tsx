"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useValidStoreId } from "@/hooks/useStoreId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Music, BookOpen, Users, Zap, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicOptionCard } from "../components/MusicOptionCard";
import { musicOptions, groupedOptions, popularOptions } from "../components/music-options";

export default function ChooseProductTypePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = useValidStoreId();
  const [activeTab, setActiveTab] = useState("popular");
  const [searchTerm, setSearchTerm] = useState("");

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Store Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The store you're trying to access could not be found or is invalid.
            </p>
            <Button onClick={() => router.push('/store')} variant="outline">
              Go Back to Store Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (!storeId) {
      console.error('No storeId provided');
      return;
    }

    // Enhanced route mapping for music-focused products
    const routeMap: Record<string, string> = {
      // Music Products
      'sample-pack': `/store/${storeId}/products/digital-download/create?type=sample-pack`,
      'preset-pack': `/store/${storeId}/products/digital-download/create?type=preset-pack`,
      'beat-lease': `/store/${storeId}/products/digital-download/create?type=beat-lease`,
      'project-files': `/store/${storeId}/products/digital-download/create?type=project-files`,
      
      // Content & Education
      'ecourse': `/store/${storeId}/course/create`,
      'digital': `/store/${storeId}/products/digital-download/create`,
      
      // Services
      'coaching': `/store/${storeId}/products/coaching-call/create`,
      'mixing-service': `/store/${storeId}/products/coaching-call/create?type=mixing-service`,
      
      // Community
      'emails': `/store/${storeId}/products/lead-magnet`,
      'membership': '#', // TODO: Implement membership creation
      'webinar': '#', // TODO: Implement webinar creation
      
      // Special
      'bundle': `/store/${storeId}/products/bundle/create`,
      'url': `/store/${storeId}/products/url-media/create`,
      'affiliate': '#', // TODO: Implement affiliate program
      
      // Legacy mappings (for backward compatibility)
      'custom': '#',
      'community': '#',
    };

    const route = routeMap[optionId];
    if (route && route !== '#') {
      router.push(route);
    } else {
      console.log(`Route not implemented yet for: ${optionId}`);
      // TODO: Show coming soon message or create placeholder pages
    }
  };

  // Filter options based on search
  const filteredOptions = musicOptions.filter(option =>
    option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-2 rounded-full mb-6">
            <Music className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Music Creator Studio</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            What are you creating today?
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Choose the perfect format for your music content — from sample packs and beats to courses and coaching sessions.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
              <TabsTrigger value="popular" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Popular</span>
              </TabsTrigger>
              <TabsTrigger value="music" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Music</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Services</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === "popular" && (
                <TabsContent key="tab-popular" value="popular" className="space-y-8">
                  <motion.div
                    key="popular-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      🔥 Most Popular Choices
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      The top picks among music creators on our platform
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {popularOptions.map((option, index) => (
                      <MusicOptionCard
                        key={`popular-${option.id}`}
                        title={option.title}
                        subtitle={option.subtitle}
                        icon={option.icon}
                        gradient={option.gradient}
                        iconColor={option.iconColor}
                        isPopular={option.isPopular}
                        isNew={option.isNew}
                        onClick={() => handleOptionClick(option.id)}
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
              )}

              {activeTab === "music" && (
                <TabsContent key="tab-music" value="music" className="space-y-8">
                  <motion.div
                    key="music-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      🎵 Music Products
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Sell your beats, samples, presets, and project files
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedOptions.music.map((option, index) => (
                      <MusicOptionCard
                        key={`music-${option.id}`}
                        title={option.title}
                        subtitle={option.subtitle}
                        icon={option.icon}
                        gradient={option.gradient}
                        iconColor={option.iconColor}
                        isPopular={option.isPopular}
                        isNew={option.isNew}
                        onClick={() => handleOptionClick(option.id)}
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
              )}

              {activeTab === "content" && (
                <TabsContent key="tab-content" value="content" className="space-y-8">
                  <motion.div
                    key="content-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      📚 Educational Content
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Share your knowledge through courses, guides, and tutorials
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedOptions.content.map((option, index) => (
                      <MusicOptionCard
                        key={`content-${option.id}`}
                        title={option.title}
                        subtitle={option.subtitle}
                        icon={option.icon}
                        gradient={option.gradient}
                        iconColor={option.iconColor}
                        isPopular={option.isPopular}
                        isNew={option.isNew}
                        onClick={() => handleOptionClick(option.id)}
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
              )}

              {activeTab === "services" && (
                <TabsContent key="tab-services" value="services" className="space-y-8">
                  <motion.div
                    key="services-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-8"
                  >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      🎧 Services & Community
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Offer coaching, mixing services, and build your community
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...groupedOptions.services, ...groupedOptions.community].map((option, index) => (
                      <MusicOptionCard
                        key={`services-${option.id}`}
                        title={option.title}
                        subtitle={option.subtitle}
                        icon={option.icon}
                        gradient={option.gradient}
                        iconColor={option.iconColor}
                        isPopular={option.isPopular}
                        isNew={option.isNew}
                        onClick={() => handleOptionClick(option.id)}
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>

        {/* Quick Start Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  💡 New to selling music online?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
                  Start with a <strong>Sample Pack</strong> or <strong>Beat Lease</strong> — they're the most popular and easiest to get started with!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    onClick={() => handleOptionClick('sample-pack')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Start with Sample Pack
                  </Button>
                  <Button 
                    onClick={() => handleOptionClick('beat-lease')}
                    variant="outline"
                    className="border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
                  >
                    Try Beat Licensing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}