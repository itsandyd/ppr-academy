"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Mail, Check, X, RotateCcw } from "lucide-react";

function CaptureEmailNode({ data, selected }: NodeProps) {
  const retryEnabled = data.retryOnFail === true;

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-amber-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
          <Mail className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Capture Email
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            Extract Email from DM
          </div>
        </div>
      </div>
      {retryEnabled && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <RotateCcw className="h-3 w-3" />
          <span>Retry enabled</span>
        </div>
      )}
      <div className="mt-3 flex justify-between text-[10px] font-medium">
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Check className="h-3 w-3" />
          <span>Captured</span>
        </div>
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <X className="h-3 w-3" />
          <span>No Email</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!h-3 !w-3 !-translate-x-6 !border-2 !border-green-500 !bg-white dark:!bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!h-3 !w-3 !translate-x-6 !border-2 !border-red-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(CaptureEmailNode);
