"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { RotateCcw, BookOpen } from "lucide-react";

function CourseCycleNode({ data, selected }: NodeProps) {
  const courseCount = data.courseCount || 0;
  const configName = data.configName || "Course Cycle";

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected ? "border-violet-500 ring-2 ring-violet-500/20" : "border-violet-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-violet-500 !bg-white dark:!bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
          <RotateCcw className="h-4 w-4 text-violet-500" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Course Cycle
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[140px]">
            {configName}
          </div>
        </div>
      </div>
      {courseCount > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <BookOpen className="h-3 w-3" />
          <span>{courseCount} courses in rotation</span>
        </div>
      )}
      {!data.courseCycleConfigId && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Click to configure cycle
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-violet-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(CourseCycleNode);
