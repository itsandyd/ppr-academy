"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MusicOptionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  onClick?: () => void;
  isPopular?: boolean;
  isNew?: boolean;
  index?: number;
}

export function MusicOptionCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  gradient, 
  iconColor, 
  onClick,
  isPopular,
  isNew,
  index = 0
}: MusicOptionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800">
        {/* Popular/New Badge */}
        {(isPopular || isNew) && (
          <div className="absolute top-3 right-3 z-10">
            {isPopular && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium px-2 py-1">
                🔥 Popular
              </Badge>
            )}
            {isNew && !isPopular && (
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-medium px-2 py-1">
                ✨ New
              </Badge>
            )}
          </div>
        )}

        <button 
          type="button" 
          onClick={onClick}
          className="w-full h-full p-6 text-left focus:outline-none group"
        >
          <div className="flex items-start gap-4">
            {/* Icon Container with Gradient */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
              <Icon size={24} className={iconColor} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Bottom Border Animation */}
          <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient} w-0 group-hover:w-full transition-all duration-500 ease-out`} />
        </button>
      </Card>
    </motion.div>
  );
}
