"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Split } from "lucide-react";

function SplitNode({ data, selected }: NodeProps) {
  const splitPercentage = data.splitPercentage || 50;

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-pink-500 ring-2 ring-pink-500/20" : "border-pink-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-pink-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10">
          <Split className="h-4 w-4 text-pink-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-pink-600 dark:text-pink-400">
            A/B Split
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {splitPercentage}% / {100 - splitPercentage}%
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
        <span>Path A</span>
        <span>Path B</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="!left-[25%] !h-3 !w-3 !border-2 !border-pink-500 !bg-white dark:!bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        className="!left-[75%] !h-3 !w-3 !border-2 !border-pink-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(SplitNode);
