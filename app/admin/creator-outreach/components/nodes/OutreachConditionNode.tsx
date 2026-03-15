"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";

const conditionLabels: Record<string, string> = {
  has_products: "Has products?",
  has_stripe: "Has Stripe?",
  is_churned: "Is churned?",
  emails_opened: "Opened email?",
  emails_clicked: "Clicked link?",
};

function OutreachConditionNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-purple-500 ring-2 ring-purple-500/20" : "border-purple-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-purple-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
          <GitBranch className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-purple-600 dark:text-purple-400">
            Condition
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {conditionLabels[data.conditionType] || "Condition"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-[10px] font-medium">
        <span className="text-green-600 dark:text-green-400">Yes</span>
        <span className="text-red-600 dark:text-red-400">No</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!-translate-x-6 !h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!translate-x-6 !h-3 !w-3 !border-2 !border-red-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(OutreachConditionNode);
