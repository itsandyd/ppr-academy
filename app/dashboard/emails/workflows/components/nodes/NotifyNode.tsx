"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Bell } from "lucide-react";

function NotifyNode({ data, selected }: NodeProps) {
  const notifyMethod = data.notifyMethod || "email";
  const methodLabels: Record<string, string> = {
    email: "Email Owner",
    slack: "Slack",
    discord: "Discord",
    push: "Push Notification",
  };

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
          <Bell className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Notify Team
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {methodLabels[notifyMethod] || "Notify"}
          </div>
        </div>
      </div>
      {data.message && <div className="mt-2 truncate text-xs text-zinc-500">{data.message}</div>}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-amber-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(NotifyNode);
