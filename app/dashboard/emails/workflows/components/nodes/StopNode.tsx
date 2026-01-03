"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { StopCircle } from "lucide-react";

function StopNode({ selected }: NodeProps) {
  return (
    <div
      className={`min-w-[140px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-red-500 ring-2 ring-red-500/20" : "border-red-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-red-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
          <StopCircle className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
            End
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">Stop</div>
        </div>
      </div>
    </div>
  );
}

export default memo(StopNode);
