"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Target } from "lucide-react";

function GoalNode({ data, selected }: NodeProps) {
  const goalType = data.goalType || "purchase";
  const goalLabels: Record<string, string> = {
    purchase: "Made Purchase",
    clicked: "Clicked Link",
    opened: "Opened Email",
    replied: "Replied",
    custom: data.customGoal || "Custom Goal",
  };

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-emerald-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
          <Target className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Goal
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {goalLabels[goalType]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GoalNode);
