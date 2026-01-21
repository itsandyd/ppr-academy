import { useState, useCallback, useMemo } from "react";

export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export interface FieldValidation {
  isValid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  error: string | null;
  showError: boolean;
  showSuccess: boolean;
}

export interface UseFieldValidationOptions {
  rules?: ValidationRule[];
  required?: boolean;
  requiredMessage?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFieldValidation<T>(
  value: T,
  options: UseFieldValidationOptions = {}
) {
  const {
    rules = [],
    required = false,
    requiredMessage = "This field is required",
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [isTouched, setIsTouched] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  const validate = useCallback(
    (val: T): { isValid: boolean; error: string | null } => {
      // Check required
      if (required) {
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          return { isValid: false, error: requiredMessage };
        }
      }

      // Check custom rules
      for (const rule of rules) {
        if (!rule.validate(val)) {
          return { isValid: false, error: rule.message };
        }
      }

      return { isValid: true, error: null };
    },
    [required, requiredMessage, rules]
  );

  const validation = useMemo(() => {
    const { isValid, error } = validate(value);
    const showError = (hasBlurred || isDirty) && !isValid && isTouched;
    const showSuccess = isValid && isDirty && isTouched;

    return {
      isValid,
      isTouched,
      isDirty,
      error,
      showError,
      showSuccess,
    };
  }, [value, validate, isTouched, isDirty, hasBlurred]);

  const handlers = useMemo(
    () => ({
      onFocus: () => {
        setIsTouched(true);
      },
      onBlur: () => {
        setHasBlurred(true);
      },
      onChange: () => {
        setIsDirty(true);
        if (!isTouched) setIsTouched(true);
      },
    }),
    [isTouched]
  );

  const reset = useCallback(() => {
    setIsTouched(false);
    setIsDirty(false);
    setHasBlurred(false);
  }, []);

  return {
    validation,
    handlers,
    reset,
    validate: () => validate(value),
  };
}

// Common validation rules
export const validationRules = {
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === "string" && value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === "string" && value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => typeof value === "string" && regex.test(value),
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === "number" && value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === "number" && value <= max,
    message: message || `Must be at most ${max}`,
  }),

  email: (message?: string): ValidationRule => ({
    validate: (value) =>
      typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: message || "Please enter a valid email address",
  }),

  url: (message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== "string" || !value) return true; // Allow empty
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: message || "Please enter a valid URL",
  }),
};
