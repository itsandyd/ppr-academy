"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Mail } from "lucide-react";

function EmailNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
          <Mail className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Send Email
          </div>
          <div className="max-w-[140px] truncate text-sm font-medium text-zinc-900 dark:text-white">
            {data.subject || "No subject"}
          </div>
        </div>
      </div>
      {data.templateName && (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Template: {data.templateName}
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
