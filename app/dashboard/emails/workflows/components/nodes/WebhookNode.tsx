"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Webhook } from "lucide-react";

function WebhookNode({ data, selected }: NodeProps) {
  const url = data.webhookUrl || "";
  const displayUrl = url ? new URL(url).hostname : "No URL set";

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-indigo-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-indigo-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
          <Webhook className="h-4 w-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Webhook
          </div>
          <div className="max-w-[120px] truncate text-sm font-medium text-zinc-900 dark:text-white">
            {displayUrl}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-indigo-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(WebhookNode);
