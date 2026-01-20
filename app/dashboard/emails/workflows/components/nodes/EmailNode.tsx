"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Mail, FileText, PenLine, FlaskConical, Trophy, TrendingUp } from "lucide-react";

interface ABVariantStats {
  id: string;
  name: string;
  openRate: number;
  clickRate: number;
  sent: number;
}

interface EmailNodeData {
  mode?: "custom" | "template";
  subject?: string;
  templateName?: string;
  previewText?: string;
  abTestEnabled?: boolean;
  abVariants?: ABVariantStats[];
  abWinner?: string | null;
  abTotalSent?: number;
  abSampleSize?: number;
}

function EmailNode({ data, selected }: NodeProps<EmailNodeData>) {
  const mode = data.mode || "custom";
  const isTemplate = mode === "template";
  const hasABTest = data.abTestEnabled && data.abVariants && data.abVariants.length > 1;
  const isABComplete = hasABTest && data.abWinner;

  // Get winning variant for display
  const winningVariant = hasABTest && data.abWinner
    ? data.abVariants?.find((v) => v.id === data.abWinner)
    : null;

  // Get best performing variant for live comparison
  const bestVariant = hasABTest && !data.abWinner && data.abVariants
    ? [...data.abVariants].sort((a, b) => b.openRate - a.openRate)[0]
    : null;

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-500/50"
      } ${hasABTest ? "border-l-4 border-l-purple-500" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-white dark:!bg-zinc-900"
      />

      {/* Main content */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
          <Mail className="h-4 w-4 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Send Email
            </span>
            {isTemplate ? (
              <FileText className="h-3 w-3 text-zinc-400" />
            ) : (
              <PenLine className="h-3 w-3 text-zinc-400" />
            )}
            {hasABTest && (
              <span className="ml-1 flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <FlaskConical className="h-2.5 w-2.5" />
                A/B
              </span>
            )}
          </div>
          <div className="max-w-[160px] truncate text-sm font-medium text-zinc-900 dark:text-white">
            {isABComplete && winningVariant
              ? winningVariant.name
              : data.subject || "No subject"}
          </div>
        </div>
      </div>

      {/* Template indicator */}
      {isTemplate && data.templateName && !hasABTest && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <FileText className="h-3 w-3" />
          {data.templateName}
        </div>
      )}

      {/* Preview text */}
      {!isTemplate && data.previewText && !hasABTest && (
        <div className="mt-2 max-w-[180px] truncate text-xs text-zinc-500 dark:text-zinc-400">
          {data.previewText}
        </div>
      )}

      {/* A/B Test Stats */}
      {hasABTest && data.abVariants && (
        <div className="mt-3 space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          {/* Winner badge */}
          {isABComplete && winningVariant && (
            <div className="flex items-center gap-1.5 rounded bg-green-50 px-2 py-1 text-xs dark:bg-green-900/20">
              <Trophy className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-700 dark:text-green-300">
                Winner: {winningVariant.name}
              </span>
            </div>
          )}

          {/* Live test stats */}
          {!isABComplete && (
            <div className="space-y-1">
              {data.abVariants.slice(0, 3).map((variant, idx) => (
                <div
                  key={variant.id}
                  className={`flex items-center justify-between text-[10px] ${
                    bestVariant?.id === variant.id
                      ? "font-medium text-purple-700 dark:text-purple-300"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {bestVariant?.id === variant.id && (
                      <TrendingUp className="h-2.5 w-2.5" />
                    )}
                    {variant.name}
                  </span>
                  <span>
                    {variant.openRate}% open
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress indicator */}
          {!isABComplete && data.abTotalSent !== undefined && data.abSampleSize && (
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-zinc-400">
                <span>Testing progress</span>
                <span>{data.abTotalSent}/{data.abSampleSize}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{
                    width: `${Math.min(100, (data.abTotalSent / data.abSampleSize) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(EmailNode);
