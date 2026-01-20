"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UseFormStepOptions<TData> {
  /** Current step ID */
  stepId: string;
  /** Base path for navigation (e.g., '/dashboard/create/pack') */
  basePath: string;
  /** URL parameter name for step (default: 'step') */
  stepParam?: string;
  /** Additional URL params to preserve */
  preserveParams?: string[];
  /** Function to get current data from context */
  getData: () => TData;
  /** Function to update data in context */
  updateData: (stepId: string, data: Partial<TData>) => void;
  /** Function to save data (for auto-save) */
  onSave?: () => Promise<void>;
  /** Auto-save delay in ms (default: 5000) */
  autoSaveDelay?: number;
  /** Enable auto-save (default: true) */
  enableAutoSave?: boolean;
  /** Available steps in order */
  steps: string[];
  /** Validation function for current step */
  validateStep?: () => boolean;
}

interface UseFormStepReturn<TData> {
  /** Navigate to a specific step */
  goToStep: (stepId: string) => void;
  /** Navigate to next step */
  goToNextStep: () => void;
  /** Navigate to previous step */
  goToPreviousStep: () => void;
  /** Check if on first step */
  isFirstStep: boolean;
  /** Check if on last step */
  isLastStep: boolean;
  /** Current step index */
  currentStepIndex: number;
  /** Update a field and trigger auto-save */
  updateField: <K extends keyof TData>(field: K, value: TData[K]) => void;
  /** Update multiple fields and trigger auto-save */
  updateFields: (fields: Partial<TData>) => void;
  /** Is currently auto-saving */
  isAutoSaving: boolean;
  /** Last auto-save timestamp */
  lastAutoSaved: Date | null;
  /** Force immediate save */
  saveNow: () => Promise<void>;
  /** Is current step valid */
  isStepValid: boolean;
}

export function useFormStep<TData extends object>({
  stepId,
  basePath,
  stepParam = "step",
  preserveParams = [],
  getData,
  updateData,
  onSave,
  autoSaveDelay = 5000,
  enableAutoSave = true,
  steps,
  validateStep,
}: UseFormStepOptions<TData>): UseFormStepReturn<TData> {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const currentStepIndex = steps.indexOf(stepId);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isStepValid = validateStep ? validateStep() : true;

  // Build URL with preserved params
  const buildUrl = useCallback((targetStep: string) => {
    const params = new URLSearchParams();
    params.set(stepParam, targetStep);

    // Preserve specified params from current URL
    preserveParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        params.set(param, value);
      }
    });

    return `${basePath}?${params.toString()}`;
  }, [basePath, stepParam, preserveParams, searchParams]);

  // Navigation functions
  const goToStep = useCallback((targetStepId: string) => {
    if (steps.includes(targetStepId)) {
      router.push(buildUrl(targetStepId));
    }
  }, [steps, buildUrl, router]);

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      const nextStep = steps[currentStepIndex + 1];
      goToStep(nextStep);
    }
  }, [isLastStep, steps, currentStepIndex, goToStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      const prevStep = steps[currentStepIndex - 1];
      goToStep(prevStep);
    }
  }, [isFirstStep, steps, currentStepIndex, goToStep]);

  // Auto-save logic
  const performAutoSave = useCallback(async () => {
    if (!onSave || !enableAutoSave || !hasUnsavedChanges) return;

    setIsAutoSaving(true);
    try {
      await onSave();
      if (isMountedRef.current) {
        setLastAutoSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      if (isMountedRef.current) {
        setIsAutoSaving(false);
      }
    }
  }, [onSave, enableAutoSave, hasUnsavedChanges]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (!enableAutoSave || !onSave) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule new auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, autoSaveDelay);
  }, [enableAutoSave, onSave, autoSaveDelay, performAutoSave]);

  // Update field with auto-save trigger
  const updateField = useCallback(<K extends keyof TData>(field: K, value: TData[K]) => {
    updateData(stepId, { [field]: value } as unknown as Partial<TData>);
    setHasUnsavedChanges(true);
    scheduleAutoSave();
  }, [updateData, stepId, scheduleAutoSave]);

  // Update multiple fields
  const updateFields = useCallback((fields: Partial<TData>) => {
    updateData(stepId, fields);
    setHasUnsavedChanges(true);
    scheduleAutoSave();
  }, [updateData, stepId, scheduleAutoSave]);

  // Force immediate save
  const saveNow = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await performAutoSave();
  }, [performAutoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveNow();
      }
      // Cmd/Ctrl + Enter to go to next step
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isLastStep && isStepValid) {
        e.preventDefault();
        goToNextStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveNow, goToNextStep, isLastStep, isStepValid]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save on step change if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && onSave) {
        onSave();
      }
    };
  }, [stepId]); // Only run when step changes

  return {
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isFirstStep,
    isLastStep,
    currentStepIndex,
    updateField,
    updateFields,
    isAutoSaving,
    lastAutoSaved,
    saveNow,
    isStepValid,
  };
}
