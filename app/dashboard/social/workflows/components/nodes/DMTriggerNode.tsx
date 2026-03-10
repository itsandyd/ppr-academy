"use client";

import { memo } from "react";
import Image from "next/image";
import { Handle, Position, NodeProps } from "reactflow";
import { Zap, Instagram, Globe, Image as ImageIcon } from "lucide-react";

const triggerLabels: Record<string, string> = {
  comment_keyword: "Comment Keyword",
  dm_received: "DM Received",
  story_reply: "Story Reply",
};

function DMTriggerNode({ data, selected }: NodeProps) {
  const label = triggerLabels[data.triggerType] || "Trigger";

  let subtitle = "";
  if (data.triggerType === "comment_keyword") {
    if (data.keywords?.length > 0) {
      subtitle = data.keywords.join(", ");
    } else {
      subtitle = "Set keywords";
    }
  } else if (data.triggerType === "dm_received") {
    if (data.keywords?.length > 0) {
      subtitle = data.keywords.join(", ");
    } else {
      subtitle = "Any incoming DM";
    }
  } else if (data.triggerType === "story_reply") {
    if (data.keywords?.length > 0) {
      subtitle = data.keywords.join(", ");
    } else {
      subtitle = "Reply to your story";
    }
  }

  const accountLabel = data.socialAccountUsername
    ? `@${data.socialAccountUsername}`
    : null;

  const postLabel = data.selectedPostId === "ALL_POSTS_AND_FUTURE"
    ? "All Posts"
    : data.selectedPostCaption
      ? data.selectedPostCaption.slice(0, 30) + (data.selectedPostCaption.length > 30 ? "..." : "")
      : null;

  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded-lg border-2 bg-white px-4 py-3 shadow-md dark:bg-zinc-900 ${
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

      {/* Account + Post info */}
      {(accountLabel || postLabel) && (
        <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
          {accountLabel && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              <Instagram className="h-3 w-3 text-pink-500" />
              <span className="truncate">{accountLabel}</span>
            </div>
          )}
          {postLabel && data.triggerType === "comment_keyword" && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              {data.selectedPostId === "ALL_POSTS_AND_FUTURE" ? (
                <Globe className="h-3 w-3 text-blue-500" />
              ) : (
                <>
                  {data.selectedPostMediaUrl ? (
                    <Image src={data.selectedPostMediaUrl} alt="" width={12} height={12} className="rounded-sm object-cover" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                </>
              )}
              <span className="truncate">{postLabel}</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-white dark:!bg-zinc-900"
      />
    </div>
  );
}

export default memo(DMTriggerNode);
