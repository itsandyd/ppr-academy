"use client";

import { DragEvent } from "react";
import { Zap, Mail, Clock, GitBranch, Tag, Plus } from "lucide-react";

const nodeTypes = [
  {
    type: "trigger",
    label: "Trigger",
    icon: Zap,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    description: "Start workflow",
  },
  {
    type: "email",
    label: "Send Email",
    icon: Mail,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    description: "Send an email",
  },
  {
    type: "delay",
    label: "Wait",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    description: "Add a delay",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    description: "Split based on condition",
  },
  {
    type: "action",
    label: "Action",
    icon: Tag,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    description: "Add/remove tags",
  },
];

interface NodeSidebarProps {
  onAddNode?: (type: string) => void;
}

export default function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      {/* Desktop: Left sidebar */}
      <div className="hidden h-full w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Nodes</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Drag nodes onto the canvas
          </p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {nodeTypes.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className={`flex cursor-grab items-center gap-3 rounded-lg border ${node.borderColor} bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing dark:bg-zinc-900`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${node.bgColor}`}
              >
                <node.icon className={`h-5 w-5 ${node.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-white">
                  {node.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Bottom bar - tap to add */}
      <div className="order-last flex shrink-0 items-center gap-2 overflow-x-auto border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950 md:order-none md:hidden">
        <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Plus className="inline h-3 w-3" /> Add:
        </span>
        {nodeTypes.map((node) => (
          <button
            key={node.type}
            type="button"
            onClick={() => onAddNode?.(node.type)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border ${node.borderColor} bg-white px-2.5 py-1.5 shadow-sm transition-transform active:scale-95 dark:bg-zinc-900`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded ${node.bgColor}`}>
              <node.icon className={`h-3.5 w-3.5 ${node.color}`} />
            </div>
            <span className="text-xs font-medium text-zinc-900 dark:text-white">{node.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
