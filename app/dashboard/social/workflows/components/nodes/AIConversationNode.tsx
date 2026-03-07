"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Bot, MessageSquare } from "lucide-react";

function AIConversationNode({ data, selected }: NodeProps) {
  const goal = data.goalDescription || data.prompt || "";
  const truncated = goal.length > 50 ? goal.slice(0, 50) + "..." : goal;
  const waitForReply = data.waitForReply !== false;

  return (
    <div
      className={`min-w-[200px] max-w-[240px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-violet-500 ring-2 ring-violet-500/20" : "border-violet-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-violet-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
          <Bot className="h-4 w-4 text-violet-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
              AI Conversation
            </span>
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {truncated || "No goal set"}
          </div>
        </div>
      </div>
      {waitForReply && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <MessageSquare className="h-3 w-3" />
          <span>Waits for reply</span>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-violet-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(AIConversationNode);
