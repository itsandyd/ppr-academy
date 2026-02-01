"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ShoppingCart, Check, X } from "lucide-react";

function PurchaseCheckNode({ data, selected }: NodeProps) {
  const tagPrefix = data.purchaseTagPrefix || "purchased_course_";

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
          <ShoppingCart className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Purchase Check
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            Bought Course?
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Checks if user purchased current course
      </div>
      <div className="mt-3 flex justify-between text-[10px] font-medium">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" />
          <span>Purchased</span>
        </div>
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <X className="h-3 w-3" />
          <span>Not Yet</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="purchased"
        className="!h-3 !w-3 !-translate-x-6 !border-2 !border-emerald-500 !bg-white dark:!bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="not_purchased"
        className="!h-3 !w-3 !translate-x-6 !border-2 !border-red-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(PurchaseCheckNode);
