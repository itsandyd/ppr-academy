"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Clock, Users } from "lucide-react";

function DelayNode({ data, selected }: NodeProps) {
  const formatDelay = () => {
    if (!data.delayValue) return "No delay set";
    const unit = data.delayUnit || "hours";
    return `Wait ${data.delayValue} ${unit}`;
  };

  const waitingCount = data.waitingCount || 0;

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-orange-500 ring-2 ring-orange-500/20" : "border-orange-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-orange-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
          <Clock className="h-4 w-4 text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Delay
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">{formatDelay()}</div>
        </div>
        {waitingCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 dark:bg-orange-900/30">
            <Users className="h-3 w-3 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              {waitingCount}
            </span>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-orange-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(DelayNode);
