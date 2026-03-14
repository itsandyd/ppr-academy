"use client";

import { DragEvent } from "react";
import {
  Zap,
  Mail,
  Clock,
  GitBranch,
  StopCircle,
  LucideIcon,
} from "lucide-react";

interface NodeType {
  type: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
}

const nodeTypes: NodeType[] = [
  {
    type: "outreachTrigger",
    label: "Trigger",
    icon: Zap,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Sequence start",
  },
  {
    type: "sendEmail",
    label: "Send Email",
    icon: Mail,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Send admin email",
  },
  {
    type: "delay",
    label: "Delay",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Wait X days",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Check creator status",
  },
  {
    type: "stop",
    label: "Stop",
    icon: StopCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "End sequence",
  },
];

interface OutreachNodeSidebarProps {
  onAddNode?: (type: string) => void;
}

export default function OutreachNodeSidebar({ onAddNode }: OutreachNodeSidebarProps) {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-64 flex-shrink-0 overflow-y-auto border-r bg-white p-4 dark:bg-zinc-950 md:block">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Node Palette
        </h3>
        <div className="space-y-2">
          {nodeTypes.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                className="flex cursor-grab items-center gap-3 rounded-lg border bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${node.bgColor}`}>
                  <Icon className={`h-4 w-4 ${node.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{node.label}</p>
                  <p className="text-xs text-muted-foreground">{node.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="flex gap-2 overflow-x-auto border-t bg-white p-2 dark:bg-zinc-950 md:hidden">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <button
              key={node.type}
              onClick={() => onAddNode?.(node.type)}
              className="flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <Icon className={`h-4 w-4 ${node.color}`} />
              {node.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
