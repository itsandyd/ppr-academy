"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Clock } from "lucide-react";

function DelayNode({ data, selected }: NodeProps) {
  const formatDelay = () => {
    if (!data.delayValue) return "No delay set";
    const unit = data.delayUnit || "hours";
    return `Wait ${data.delayValue} ${unit}`;
  };

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
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Delay
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">{formatDelay()}</div>
        </div>
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
