import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { C, F } from "../theme";
import { BG } from "../components/Background";
import { NODE_COLORS } from "../workflowData";

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 3 — THE WORKFLOW (12-35s, frames 360-1050)  [690 frames local]
// "Here's what I built instead. A five-email sequence that runs itself."
//
// Hero scene: Animates the actual workflow graph from the PPR codebase.
// Pulls real node types, subjects, delays, conditions, and tags from
// convex/emailTemplates.ts and convex/schema.ts
// ═══════════════════════════════════════════════════════════════════════════

// ─── Workflow node data (from real codebase) ────────────────────────────
type FlowNode = {
  id: string;
  type: string;
  label: string;
  subject?: string;
  detail?: string;
  yPos: number; // relative Y position in the graph
};

const FLOW_NODES: FlowNode[] = [
  {
    id: "trigger",
    type: "trigger",
    label: "Tag Added",
    detail: "free-pack-download",
    yPos: 0,
  },
  {
    id: "cond-1",
    type: "condition",
    label: "Has purchased?",
    detail: "purchaseCheck",
    yPos: 100,
  },
  {
    id: "email-1",
    type: "email",
    label: "Email 1",
    subject: "Your free pack is ready! 🎁",
    yPos: 200,
  },
  {
    id: "tag-1",
    type: "action",
    label: "sent-welcome-email",
    yPos: 285,
  },
  {
    id: "delay-1",
    type: "delay",
    label: "Wait 24h",
    detail: "1 day",
    yPos: 355,
  },
  {
    id: "cond-2",
    type: "condition",
    label: "Has purchased?",
    detail: "purchaseCheck",
    yPos: 440,
  },
  {
    id: "email-2",
    type: "email",
    label: "Email 2",
    subject: "3 ways to use your samples in beats",
    yPos: 540,
  },
  {
    id: "tag-2",
    type: "action",
    label: "sent-tips-email",
    yPos: 625,
  },
  {
    id: "delay-2",
    type: "delay",
    label: "Wait 3 days",
    detail: "3 days",
    yPos: 695,
  },
  {
    id: "cond-3",
    type: "condition",
    label: "Has purchased?",
    detail: "purchaseCheck",
    yPos: 780,
  },
  {
    id: "email-3",
    type: "email",
    label: "Email 3",
    subject: "Here's what's NOT in the free pack...",
    yPos: 880,
  },
];

// Icons per node type — simple inline SVGs
const NodeIcon: React.FC<{ type: string; size?: number }> = ({
  type,
  size = 18,
}) => {
  const color = "#fff";
  if (type === "trigger")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={color} />
      </svg>
    );
  if (type === "email")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2" />
        <path d="M3 7l9 5 9-5" stroke={color} strokeWidth="2" />
      </svg>
    );
  if (type === "condition")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3l9 9-9 9-9-9z" stroke={color} strokeWidth="2" />
      </svg>
    );
  if (type === "delay")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (type === "action")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 9h4v12H4z" fill={color} opacity={0.6} />
        <path d="M9 4l7 4-7 4V4z" fill={color} />
      </svg>
    );
  return null;
};

// ─── Single flow node component ─────────────────────────────────────────
const FlowNodeCard: React.FC<{
  node: FlowNode;
  progress: number; // 0→1, how "revealed" this node is
  glowIntensity?: number;
}> = ({ node, progress, glowIntensity = 0 }) => {
  const accent = NODE_COLORS[node.type] || C.primary;
  const isEmail = node.type === "email";
  const isSmall = node.type === "action";

  const nodeHeight = isEmail ? 68 : isSmall ? 40 : 50;
  const nodeWidth = isEmail ? 380 : isSmall ? 220 : 300;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: node.yPos,
        transform: `translateX(-50%) scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
        opacity: progress,
        width: nodeWidth,
        minHeight: nodeHeight,
        borderRadius: isSmall ? 8 : 12,
        backgroundColor: "#18181b",
        border: `1.5px solid ${accent}50`,
        boxShadow: glowIntensity > 0 ? `0 0 ${20 * glowIntensity}px ${accent}30` : "none",
        display: "flex",
        alignItems: "center",
        padding: isSmall ? "6px 14px" : "10px 16px",
        gap: 12,
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: isSmall ? 28 : 34,
          height: isSmall ? 28 : 34,
          borderRadius: "50%",
          backgroundColor: `${accent}30`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <NodeIcon type={node.type} size={isSmall ? 14 : 16} />
      </div>

      {/* Text content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
        <div
          style={{
            fontSize: isSmall ? 12 : 13,
            color: accent,
            fontWeight: 600,
            fontFamily: F,
            textTransform: "uppercase" as const,
            letterSpacing: 0.5,
          }}
        >
          {node.type === "action" ? "Tag" : node.type}
          {node.detail && node.type === "delay" ? ` · ${node.detail}` : ""}
        </div>
        {isEmail && node.subject ? (
          <div
            style={{
              fontSize: 15,
              color: C.white,
              fontWeight: 600,
              fontFamily: F,
              whiteSpace: "nowrap" as const,
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 300,
            }}
          >
            {node.subject}
          </div>
        ) : (
          <div
            style={{
              fontSize: isSmall ? 13 : 14,
              color: C.white,
              fontWeight: 500,
              fontFamily: F,
            }}
          >
            {node.label}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Arrow connector between nodes ──────────────────────────────────────
const Arrow: React.FC<{
  fromY: number;
  toY: number;
  progress: number;
  fromHeight?: number;
  isBranch?: boolean;
  branchLabel?: string;
  branchX?: number;
}> = ({ fromY, toY, progress, fromHeight = 50, isBranch, branchLabel, branchX = 0 }) => {
  const startY = fromY + fromHeight;
  const length = toY - startY;
  const visibleLength = length * progress;

  if (isBranch) {
    return (
      <div
        style={{
          position: "absolute",
          left: `calc(50% + ${branchX}px)`,
          top: startY,
          opacity: progress,
        }}
      >
        {/* Horizontal branch line */}
        <div
          style={{
            width: Math.abs(branchX) > 0 ? 60 : 0,
            height: 2,
            backgroundColor: "#3f3f46",
          }}
        />
        {branchLabel && (
          <span
            style={{
              position: "absolute",
              top: -16,
              left: branchX > 0 ? 8 : -30,
              fontSize: 11,
              color: "#52525b",
              fontFamily: F,
              fontWeight: 600,
            }}
          >
            {branchLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: startY,
        transform: "translateX(-50%)",
        width: 2,
        height: visibleLength,
        backgroundColor: "#3f3f46",
        overflow: "hidden",
      }}
    >
      {/* Animated dot traveling down the arrow */}
      {progress > 0.3 && (
        <div
          style={{
            position: "absolute",
            top: visibleLength - 6,
            left: -3,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: C.primary,
            boxShadow: `0 0 8px ${C.primary}`,
            opacity: progress > 0.95 ? 0 : 1,
          }}
        />
      )}
    </div>
  );
};

// ─── "Yes → Exit" branch indicator (shown on conditions) ────────────────
const ExitBranch: React.FC<{
  condY: number;
  progress: number;
}> = ({ condY, progress }) => {
  const op = interpolate(progress, [0, 0.5, 1], [0, 0, 0.5]);
  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top: condY + 14,
        opacity: op,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div style={{ width: 30, height: 2, backgroundColor: "#22c55e40" }} />
      <div
        style={{
          padding: "3px 10px",
          borderRadius: 6,
          backgroundColor: "#22c55e15",
          border: "1px solid #22c55e30",
        }}
      >
        <span style={{ fontSize: 11, color: "#22c55e", fontFamily: F, fontWeight: 600 }}>
          Yes → Exit
        </span>
      </div>
    </div>
  );
};

// ─── "..." continuation indicator ───────────────────────────────────────
const ContinuationDots: React.FC<{ progress: number; yPos: number }> = ({
  progress,
  yPos,
}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: yPos,
      transform: "translateX(-50%)",
      opacity: progress,
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "#52525b",
        }}
      />
    ))}
    <span style={{ fontSize: 13, color: "#52525b", fontFamily: F, marginLeft: 4 }}>
      2 more emails
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
export const WorkflowSceneWorkflow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene title
  const titleSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 200 },
  });

  // The graph scrolls up as nodes appear (to fit in view)
  const graphOffset = interpolate(frame, [0, 120, 350, 550], [0, 0, -150, -420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Each node appears with a staggered delay
  const nodeDelays = [30, 65, 100, 140, 170, 210, 260, 300, 330, 380, 430];

  // Continuation dots
  const dotsProgress = interpolate(frame, [500, 540], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit transition
  const exitOp = interpolate(frame, [660, 690], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: exitOp,
      }}
    >
      <BG seed={3} tint={C.primary} orbColors={["#7c3aed", "#6366f1"]} />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center" as const,
          zIndex: 10,
          opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: C.primary,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            fontFamily: F,
            marginBottom: 8,
          }}
        >
          The Workflow
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
          }}
        >
          5 emails that run themselves
        </div>
      </div>

      {/* Workflow graph container */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          transform: `translateY(${graphOffset}px)`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: 1200 }}>
          {/* Render arrows first (behind nodes) */}
          {FLOW_NODES.map((node, i) => {
            if (i === 0) return null;
            const prev = FLOW_NODES[i - 1];
            const prevDelay = nodeDelays[i - 1] || 0;
            const currDelay = nodeDelays[i] || 0;
            const arrowProgress = interpolate(
              frame,
              [prevDelay + 10, currDelay],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const prevHeight =
              prev.type === "email" ? 68 : prev.type === "action" ? 40 : 50;

            return (
              <Arrow
                key={`arrow-${i}`}
                fromY={prev.yPos}
                toY={node.yPos}
                progress={arrowProgress}
                fromHeight={prevHeight}
              />
            );
          })}

          {/* Exit branches on condition nodes */}
          {FLOW_NODES.filter((n) => n.type === "condition").map((node, i) => {
            const nodeIdx = FLOW_NODES.indexOf(node);
            const delay = nodeDelays[nodeIdx] || 0;
            const progress = interpolate(frame, [delay, delay + 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <ExitBranch
                key={`exit-${i}`}
                condY={node.yPos}
                progress={progress}
              />
            );
          })}

          {/* Render nodes */}
          {FLOW_NODES.map((node, i) => {
            const delay = nodeDelays[i] || 0;
            const nodeSpring = spring({
              fps,
              frame: frame - delay,
              config: { damping: 60, stiffness: 180 },
            });

            // Email nodes pulse/glow briefly when appearing
            const isEmail = node.type === "email";
            const glowIntensity = isEmail
              ? interpolate(frame, [delay + 5, delay + 15, delay + 40], [0, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0;

            return (
              <FlowNodeCard
                key={node.id}
                node={node}
                progress={nodeSpring}
                glowIntensity={glowIntensity}
              />
            );
          })}

          {/* Continuation dots */}
          <ContinuationDots
            progress={dotsProgress}
            yPos={FLOW_NODES[FLOW_NODES.length - 1].yPos + 80}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
