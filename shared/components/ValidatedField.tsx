"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFieldValidation,
  ValidationRule,
} from "@/hooks/useFieldValidation";

interface ValidatedFieldProps {
  // Field identification
  id: string;
  label: string;

  // Value management
  value: string;
  onChange: (value: string) => void;

  // Field type
  type?: "text" | "textarea" | "email" | "number" | "url" | "password";

  // Validation
  required?: boolean;
  rules?: ValidationRule[];
  requiredMessage?: string;

  // UI customization
  placeholder?: string;
  description?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

export function ValidatedField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  rules = [],
  requiredMessage,
  placeholder,
  description,
  rows = 4,
  className,
  disabled = false,
  maxLength,
  showCharCount = false,
}: ValidatedFieldProps) {
  const { validation, handlers } = useFieldValidation(value, {
    required,
    rules,
    requiredMessage,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handlers.onChange();
    onChange(e.target.value);
  };

  const inputClassName = cn(
    "transition-colors",
    validation.showError && "border-destructive focus-visible:ring-destructive",
    validation.showSuccess && "border-green-500 focus-visible:ring-green-500",
    className
  );

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handlers.onFocus}
          onBlur={handlers.onBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClassName}
        />
      );
    }

    return (
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handlers.onFocus}
        onBlur={handlers.onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={inputClassName}
      />
    );
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className={cn(
            "flex items-center gap-2",
            validation.showError && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive">*</span>}
          {validation.showSuccess && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </Label>

        {/* Character count */}
        {showCharCount && maxLength && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              value.length > maxLength * 0.9 && "text-amber-500",
              value.length >= maxLength && "text-destructive"
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="relative">
        {renderInput()}

        {/* Validation icon inside input */}
        {validation.showError && (
          <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
        )}
      </div>

      {/* Error message */}
      {validation.showError && validation.error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validation.error}
        </p>
      )}

      {/* Description */}
      {description && !validation.showError && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Compound component for custom validation layouts
export function ValidatedFieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
