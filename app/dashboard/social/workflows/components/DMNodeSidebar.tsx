"use client";

import { DragEvent } from "react";
import {
  Zap,
  MessageCircle,
  Bot,
  GitBranch,
  Mail,
  ShoppingCart,
  ArrowRightLeft,
  Clock,
  Tag,
  StopCircle,
  Plus,
} from "lucide-react";

const nodeCategories = [
  {
    label: "Triggers",
    nodes: [
      {
        type: "trigger",
        label: "Trigger",
        icon: Zap,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        description: "Start workflow",
      },
    ],
  },
  {
    label: "DM Actions",
    nodes: [
      {
        type: "sendDM",
        label: "Send DM",
        icon: MessageCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        description: "Send a direct message",
      },
      {
        type: "aiConversation",
        label: "AI Conversation",
        icon: Bot,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/30",
        description: "AI-powered DM chat",
      },
      {
        type: "captureEmail",
        label: "Capture Email",
        icon: Mail,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        description: "Extract email from reply",
      },
    ],
  },
  {
    label: "Conditions",
    nodes: [
      {
        type: "dmCondition",
        label: "DM Condition",
        icon: GitBranch,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        description: "Branch on DM content",
      },
      {
        type: "checkDMPurchase",
        label: "Check Purchase",
        icon: ShoppingCart,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        description: "Check if purchased",
      },
    ],
  },
  {
    label: "Bridge",
    nodes: [
      {
        type: "enterEmailWorkflow",
        label: "Email Workflow",
        icon: ArrowRightLeft,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/30",
        description: "Enter email sequence",
      },
    ],
  },
  {
    label: "Shared",
    nodes: [
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
        type: "action",
        label: "Action",
        icon: Tag,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
        description: "Add/remove tags",
      },
      {
        type: "stop",
        label: "Stop",
        icon: StopCircle,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        description: "End workflow",
      },
    ],
  },
];

// Flat list for mobile
const allNodes = nodeCategories.flatMap((cat) => cat.nodes);

interface DMNodeSidebarProps {
  onAddNode?: (type: string) => void;
}

export default function DMNodeSidebar({ onAddNode }: DMNodeSidebarProps) {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      {/* Desktop: Left sidebar with categories */}
      <div className="hidden h-full w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">DM Nodes</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Drag nodes onto the canvas
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {nodeCategories.map((category) => (
            <div key={category.label} className="mb-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {category.label}
              </div>
              <div className="space-y-2">
                {category.nodes.map((node) => (
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
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {node.description}
                      </div>
                    </div>
                  </div>
                ))}
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
        {allNodes.map((node) => (
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
