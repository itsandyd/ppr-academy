"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

interface AutoSaveContextValue {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  triggerSave: () => void;
  setError: (error: string | null) => void;
  error: string | null;
}

const AutoSaveContext = createContext<AutoSaveContextValue | undefined>(undefined);

// ============================================================================
// AutoSaveProvider
// ============================================================================

interface AutoSaveProviderProps {
  children: React.ReactNode;
  onSave: () => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * AutoSaveProvider - Provides debounced auto-save functionality for forms
 *
 * Features:
 * - Debounced saves (default 1500ms)
 * - Save status tracking (idle, saving, saved, error, offline)
 * - Offline detection
 * - Error handling with retry
 */
export function AutoSaveProvider({
  children,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: AutoSaveProviderProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus((prev) => (prev === "offline" ? "idle" : prev));
      // Retry pending save when coming back online
      if (pendingSaveRef.current) {
        triggerSave();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setSaveStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback(async () => {
    if (!enabled || !isOnline) {
      if (!isOnline) {
        pendingSaveRef.current = true;
      }
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      await onSave();
      setSaveStatus("saved");
      setLastSaved(new Date());
      pendingSaveRef.current = false;

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 2000);
    } catch (err) {
      console.error("Auto-save failed:", err);
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save");
      pendingSaveRef.current = true; // Mark for retry
    }
  }, [enabled, isOnline, onSave]);

  const triggerSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);
  }, [enabled, debounceMs, executeSave]);

  return (
    <AutoSaveContext.Provider
      value={{
        saveStatus,
        lastSaved,
        triggerSave,
        setError,
        error,
      }}
    >
      {children}
    </AutoSaveContext.Provider>
  );
}

// ============================================================================
// useAutoSave Hook
// ============================================================================

export function useAutoSave() {
  const context = useContext(AutoSaveContext);
  if (context === undefined) {
    throw new Error("useAutoSave must be used within an AutoSaveProvider");
  }
  return context;
}

// ============================================================================
// useAutoSaveOnChange Hook
// ============================================================================

/**
 * Hook that triggers auto-save when a value changes
 */
export function useAutoSaveOnChange<T>(
  value: T,
  options?: { skip?: boolean }
) {
  const { triggerSave } = useAutoSave();
  const isFirstRender = useRef(true);
  const previousValue = useRef(value);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousValue.current = value;
      return;
    }

    // Skip if disabled
    if (options?.skip) return;

    // Check if value actually changed
    if (JSON.stringify(previousValue.current) !== JSON.stringify(value)) {
      previousValue.current = value;
      triggerSave();
    }
  }, [value, options?.skip, triggerSave]);
}

// ============================================================================
// SaveStatusIndicator Component
// ============================================================================

interface SaveStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

/**
 * SaveStatusIndicator - Shows current auto-save status
 *
 * States:
 * - idle: Cloud icon (gray)
 * - saving: Spinner with "Saving..."
 * - saved: Checkmark with "Saved"
 * - error: Alert icon with "Save failed"
 * - offline: Cloud-off icon with "Offline"
 */
export function SaveStatusIndicator({
  className,
  showLabel = true,
  size = "sm",
}: SaveStatusIndicatorProps) {
  const { saveStatus, lastSaved, error } = useAutoSave();

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const renderStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <>
            <Loader2 className={cn(iconSize, "animate-spin text-blue-500")} />
            {showLabel && <span className={cn(textSize, "text-blue-500")}>Saving...</span>}
          </>
        );

      case "saved":
        return (
          <>
            <Check className={cn(iconSize, "text-green-500")} />
            {showLabel && (
              <span className={cn(textSize, "text-green-500")}>
                Saved{lastSaved && ` at ${lastSaved.toLocaleTimeString()}`}
              </span>
            )}
          </>
        );

      case "error":
        return (
          <>
            <AlertCircle className={cn(iconSize, "text-red-500")} />
            {showLabel && (
              <span className={cn(textSize, "text-red-500")} title={error || undefined}>
                Save failed
              </span>
            )}
          </>
        );

      case "offline":
        return (
          <>
            <CloudOff className={cn(iconSize, "text-yellow-500")} />
            {showLabel && <span className={cn(textSize, "text-yellow-500")}>Offline</span>}
          </>
        );

      case "idle":
      default:
        return (
          <>
            <Cloud className={cn(iconSize, "text-muted-foreground")} />
            {showLabel && lastSaved && (
              <span className={cn(textSize, "text-muted-foreground")}>
                Last saved {formatRelativeTime(lastSaved)}
              </span>
            )}
          </>
        );
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>{renderStatus()}</div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return "just now";
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }
  return date.toLocaleDateString();
}

// ============================================================================
// DraftRecoveryModal Component
// ============================================================================

interface DraftRecoveryModalProps {
  draftTitle?: string;
  draftLastModified?: Date;
  onContinue: () => void;
  onStartFresh: () => void;
  isOpen: boolean;
}

/**
 * DraftRecoveryModal - Prompts user to continue or start fresh when a draft exists
 */
export function DraftRecoveryModal({
  draftTitle,
  draftLastModified,
  onContinue,
  onStartFresh,
  isOpen,
}: DraftRecoveryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-2">Continue where you left off?</h2>
        <p className="text-muted-foreground mb-4">
          You have an unsaved draft
          {draftTitle && (
            <>
              : <strong>&ldquo;{draftTitle}&rdquo;</strong>
            </>
          )}
          {draftLastModified && (
            <span className="block text-sm mt-1">
              Last modified: {draftLastModified.toLocaleString()}
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Continue Editing
          </button>
          <button
            onClick={onStartFresh}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
