"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FormError {
  field: string;
  message: string;
}

interface FormErrorBannerProps {
  errors: FormError[];
  onDismiss?: () => void;
  onFieldClick?: (field: string) => void;
  className?: string;
}

export function FormErrorBanner({ 
  errors, 
  onDismiss,
  onFieldClick,
  className 
}: FormErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("sticky top-0 z-50", className)}
      >
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription>
                  <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Please fix the following errors before proceeding:
                  </p>
                  <ul className="space-y-1">
                    {errors.map((error, i) => (
                      <li 
                        key={i}
                        className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2"
                      >
                        <span>•</span>
                        {onFieldClick ? (
                          <button
                            onClick={() => onFieldClick(error.field)}
                            className="hover:underline font-medium"
                          >
                            {error.field}:
                          </button>
                        ) : (
                          <span className="font-medium">{error.field}:</span>
                        )}
                        <span>{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </div>
            </div>
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                onClick={onDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for inline display
export function FormErrorInline({ errors, className }: { errors: FormError[], className?: string }) {
  if (errors.length === 0) return null;

  return (
    <div className={cn("text-sm text-red-600 dark:text-red-400", className)}>
      {errors.length === 1 ? (
        <p className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errors[0].message}
        </p>
      ) : (
        <div>
          <p className="flex items-center gap-2 font-medium mb-2">
            <AlertCircle className="w-4 h-4" />
            {errors.length} errors found:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-6">
            {errors.map((error, i) => (
              <li key={i}>
                <span className="font-medium">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

