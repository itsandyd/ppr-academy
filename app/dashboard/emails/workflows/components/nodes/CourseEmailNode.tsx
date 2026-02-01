"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { BookOpen, Mail, Target } from "lucide-react";

function CourseEmailNode({ data, selected }: NodeProps) {
  const emailPhase = data.emailPhase || "nurture";
  const isNurture = emailPhase === "nurture";

  return (
    <div
      className={`min-w-[180px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
        selected
          ? isNurture
            ? "border-sky-500 ring-2 ring-sky-500/20"
            : "border-orange-500 ring-2 ring-orange-500/20"
          : isNurture
          ? "border-sky-500/50"
          : "border-orange-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!h-3 !w-3 !border-2 !bg-white dark:!bg-zinc-900 ${
          isNurture ? "!border-sky-500" : "!border-orange-500"
        }`}
      />
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isNurture ? "bg-sky-500/10" : "bg-orange-500/10"
          }`}
        >
          {isNurture ? (
            <BookOpen className="h-4 w-4 text-sky-500" />
          ) : (
            <Target className="h-4 w-4 text-orange-500" />
          )}
        </div>
        <div>
          <div
            className={`text-[10px] font-medium uppercase tracking-wide ${
              isNurture
                ? "text-sky-600 dark:text-sky-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            Course Email
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-white">
            {isNurture ? "Nurture" : "Pitch"} Email
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <Mail className="h-3 w-3" />
        <span>
          {isNurture
            ? "Value-focused tips from course"
            : "Sales email with CTA"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!h-3 !w-3 !border-2 !bg-white dark:!bg-zinc-900 ${
          isNurture ? "!border-sky-500" : "!border-orange-500"
        }`}
      />
    </div>
  );
}

export default memo(CourseEmailNode);
