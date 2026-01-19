"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Zap } from "lucide-react";

const triggerLabels: Record<string, string> = {
  lead_signup: "Lead Signs Up",
  product_purchase: "Product Purchased",
  tag_added: "Tag Added to Contact",
  manual: "Manual Enrollment",
  time_delay: "Time Delay",
  date_time: "Date/Time",
  customer_action: "Customer Action",
};

function TriggerNode({ data, selected }: NodeProps) {
  const label = triggerLabels[data.triggerType] || "Trigger";

  // Build subtitle based on trigger configuration
  let subtitle = "";
  if (data.triggerType === "product_purchase") {
    if (data.productName) {
      subtitle = data.productName;
    } else if (data.courseName) {
      subtitle = data.courseName;
    } else if (data.productId || data.courseId) {
      subtitle = "Specific item";
    } else {
      subtitle = "Any purchase";
    }
  } else if (data.triggerType === "tag_added") {
    if (data.tagName) {
      subtitle = data.tagName;
    } else if (data.tagId) {
      subtitle = "Specific tag";
    } else {
      subtitle = "Any tag";
    }
  }

  return (
    <div
      className={`min-w-[180px] max-w-[220px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-green-500 ring-2 ring-green-500/20" : "border-green-500/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <Zap className="h-4 w-4 text-green-500" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
            Trigger
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">{label}</div>
          {subtitle && (
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>
          )}
        </div>
      </div>
      {data.description && (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{data.description}</div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(TriggerNode);
