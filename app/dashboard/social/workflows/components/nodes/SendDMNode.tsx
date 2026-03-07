"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { MessageCircle, Link2 } from "lucide-react";

function SendDMNode({ data, selected }: NodeProps) {
  const message = data.messageText || data.message || "";
  const truncated = message.length > 60 ? message.slice(0, 60) + "..." : message;

  return (
    <div
      className={`min-w-[200px] max-w-[240px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <MessageCircle className="h-4 w-4 text-blue-500" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Send DM
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {truncated || "No message set"}
          </div>
        </div>
      </div>
      {data.includeLink && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Link2 className="h-3 w-3" />
          <span className="truncate">{data.includeLink}</span>
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

export default memo(SendDMNode);
