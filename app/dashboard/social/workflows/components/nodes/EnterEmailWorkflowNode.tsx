"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ArrowRightLeft, Mail } from "lucide-react";

function EnterEmailWorkflowNode({ data, selected }: NodeProps) {
  const workflowName = data.targetWorkflowName || "Select workflow";

  return (
    <div
      className={`min-w-[200px] max-w-[240px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-indigo-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-indigo-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
          <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Email Bridge
          </div>
          <div className="truncate text-sm font-medium text-zinc-900 dark:text-white">
            {workflowName}
          </div>
        </div>
      </div>
      {data.tags && data.tags.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Mail className="h-3 w-3" />
          <span>Tags: {data.tags.join(", ")}</span>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-indigo-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(EnterEmailWorkflowNode);
