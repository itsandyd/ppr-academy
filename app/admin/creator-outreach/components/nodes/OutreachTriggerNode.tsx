"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Zap } from "lucide-react";

function OutreachTriggerNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-green-500 ring-2 ring-green-500/20" : "border-green-500/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
          <Zap className="h-4 w-4 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
            Trigger
          </div>
          <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
            Sequence Start
          </div>
        </div>
      </div>
      {data.fromName && (
        <div className="mt-2 truncate text-xs text-muted-foreground">
          From: {data.fromName} &lt;{data.fromEmail}&gt;
        </div>
      )}
      {data.stopOnProductUpload && (
        <div className="mt-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          Auto-stop on product
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(OutreachTriggerNode);
