"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Tag, UserPlus, Bell } from "lucide-react";

const actionIcons: Record<string, typeof Tag> = {
  add_tag: Tag,
  remove_tag: Tag,
  add_to_list: UserPlus,
  notify: Bell,
};

const actionLabels: Record<string, string> = {
  add_tag: "Add Tag",
  remove_tag: "Remove Tag",
  add_to_list: "Add to List",
  notify: "Send Notification",
};

function ActionNode({ data, selected }: NodeProps) {
  const Icon = actionIcons[data.actionType] || Tag;
  const label = actionLabels[data.actionType] || "Action";

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-cyan-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-cyan-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10">
          <Icon className="h-4 w-4 text-cyan-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
            Action
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">{label}</div>
        </div>
      </div>
      {data.value && (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{data.value}</div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-cyan-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(ActionNode);
