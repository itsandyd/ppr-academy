"use client";

import { TemplateVariable } from "@/lib/marketing-campaigns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariableFillerProps {
  variables: TemplateVariable[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  showValidation?: boolean;
  compact?: boolean;
  className?: string;
}

export function VariableFiller({
  variables,
  values,
  onChange,
  showValidation = true,
  compact = false,
  className,
}: VariableFillerProps) {
  // Check if a variable is filled
  const isFilled = (variable: TemplateVariable) => {
    const value = values[variable.key];
    return value && value.trim() !== "";
  };

  // Group variables by type for better organization
  const requiredVars = variables.filter((v) => v.required);
  const optionalVars = variables.filter((v) => !v.required);

  const filledCount = variables.filter(isFilled).length;
  const requiredFilledCount = requiredVars.filter(isFilled).length;

  const renderVariable = (variable: TemplateVariable) => {
    const value = values[variable.key] || "";
    const filled = isFilled(variable);
    const showError = showValidation && variable.required && !filled;

    // Determine input type based on variable type
    const isMultiline =
      variable.type === "text" &&
      (variable.label.toLowerCase().includes("story") ||
        variable.label.toLowerCase().includes("description") ||
        variable.label.toLowerCase().includes("body"));

    const isUrl = variable.type === "url";
    const isPrice = variable.type === "price";
    const isDiscount = variable.type === "discount";

    return (
      <div
        key={variable.key}
        className={cn("space-y-2", compact && "space-y-1")}
      >
        <div className="flex items-center justify-between">
          <Label
            htmlFor={variable.key}
            className={cn(
              "flex items-center gap-2",
              compact && "text-xs"
            )}
          >
            {variable.label}
            {variable.required && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                Required
              </Badge>
            )}
          </Label>
          {showValidation && (
            <span className="text-xs">
              {filled ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : variable.required ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : null}
            </span>
          )}
        </div>

        {isMultiline ? (
          <Textarea
            id={variable.key}
            value={value}
            onChange={(e) => onChange(variable.key, e.target.value)}
            placeholder={variable.placeholder || variable.defaultValue || `Enter ${variable.label.toLowerCase()}`}
            className={cn(
              "resize-none",
              showError && "border-red-500",
              compact && "text-sm h-20"
            )}
            rows={compact ? 2 : 3}
          />
        ) : (
          <div className="relative">
            <Input
              id={variable.key}
              type={isUrl ? "url" : "text"}
              value={value}
              onChange={(e) => onChange(variable.key, e.target.value)}
              placeholder={
                variable.placeholder ||
                variable.defaultValue ||
                `Enter ${variable.label.toLowerCase()}`
              }
              className={cn(
                showError && "border-red-500",
                compact && "text-sm h-8",
                (isPrice || isDiscount) && "pl-6"
              )}
            />
            {isPrice && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
            )}
            {isDiscount && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                %
              </span>
            )}
          </div>
        )}

        {variable.defaultValue && !value && (
          <p className="text-xs text-muted-foreground">
            Default: {variable.defaultValue}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress indicator */}
      {showValidation && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            Variables filled: {filledCount}/{variables.length}
          </span>
          <div className="flex items-center gap-2">
            {requiredFilledCount === requiredVars.length ? (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                All required filled
              </Badge>
            ) : (
              <Badge variant="destructive">
                {requiredVars.length - requiredFilledCount} required remaining
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Required variables */}
      {requiredVars.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Required Information
          </h4>
          <div className={cn(
            "grid gap-4",
            !compact && "md:grid-cols-2"
          )}>
            {requiredVars.map(renderVariable)}
          </div>
        </div>
      )}

      {/* Optional variables */}
      {optionalVars.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Optional Information
          </h4>
          <div className={cn(
            "grid gap-4",
            !compact && "md:grid-cols-2"
          )}>
            {optionalVars.map(renderVariable)}
          </div>
        </div>
      )}
    </div>
  );
}
