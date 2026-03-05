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
// SCENE 4 — THE SMART PART (35-45s, frames 1050-1350)  [300 frames local]
// "And if someone buys? They stop getting sales emails immediately."
//
// Shows a condition node evaluating → "Yes" path → skip remaining emails.
// Pulls: Real condition check logic (has_purchased) from
//        convex/emailWorkflowActions.ts evaluateWorkflowCondition
// ═══════════════════════════════════════════════════════════════════════════

// Simplified workflow nodes for the zoomed-out view
type MiniNode = {
  id: string;
  type: string;
  label: string;
  yPos: number;
};

const MINI_NODES: MiniNode[] = [
  { id: "email-2", type: "email", label: "Email 2", yPos: 0 },
  { id: "delay", type: "delay", label: "3 days", yPos: 65 },
  { id: "cond", type: "condition", label: "Has purchased?", yPos: 130 },
  { id: "email-3", type: "email", label: "Email 3", yPos: 220 },
  { id: "delay-2", type: "delay", label: "3 days", yPos: 285 },
  { id: "email-4", type: "email", label: "Email 4", yPos: 350 },
];

const MiniIcon: React.FC<{ type: string }> = ({ type }) => {
  const color = "#fff";
  const s = 12;
  if (type === "email")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2.5" />
        <path d="M3 7l9 5 9-5" stroke={color} strokeWidth="2.5" />
      </svg>
    );
  if (type === "condition")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 3l9 9-9 9-9-9z" stroke={color} strokeWidth="2.5" />
      </svg>
    );
  if (type === "delay")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" />
        <path d="M12 7v5l3 3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  return null;
};

export const WorkflowSceneSmartPart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Phase 1 (frames 0-80): Show the mini workflow ────────────────
  const miniGraphOp = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 2 (frames 80-140): Condition highlights and evaluates ──
  const condHighlight = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Check mark appears on condition
  const checkSpring = spring({
    fps,
    frame: frame - 100,
    config: { damping: 12, stiffness: 200 },
  });

  // "Yes" label pulse
  const yesLabelOp = interpolate(frame, [105, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 3 (frames 140-200): Skipped emails dim/strikethrough ───
  const skipProgress = interpolate(frame, [130, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit badge appears
  const exitSpring = spring({
    fps,
    frame: frame - 160,
    config: { damping: 60, stiffness: 180 },
  });

  // ─── Phase 4 (frames 200-260): Reset — show "No" path ────────────
  const resetProgress = interpolate(frame, [210, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "No" path lights up
  const noPathGlow = interpolate(frame, [235, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scene exit
  const exitOp = interpolate(frame, [275, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Is this the "Yes" evaluation phase or the "No" reset?
  const isYesPhase = frame < 210;
  const isNoPhase = frame >= 210;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: exitOp,
      }}
    >
      <BG seed={4} tint="#f59e0b" orbColors={["#f59e0b", C.primary]} />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center" as const,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#f59e0b",
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            fontFamily: F,
            marginBottom: 8,
          }}
        >
          The Smart Part
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            padding: "0 40px",
          }}
        >
          If they buy, the emails stop.
        </div>
      </div>

      {/* Mini workflow graph */}
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: miniGraphOp,
          zIndex: 5,
        }}
      >
        <div style={{ position: "relative", width: 340, height: 460 }}>
          {/* Vertical connection lines */}
          {MINI_NODES.map((node, i) => {
            if (i === 0) return null;
            const prev = MINI_NODES[i - 1];
            const prevH = prev.type === "condition" ? 55 : 42;
            const startY = prev.yPos + prevH;
            const endY = node.yPos;

            // Skip line dims for skipped nodes
            const isSkipped =
              isYesPhase && skipProgress > 0 && i > 2;

            return (
              <div
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: startY,
                  width: 2,
                  height: endY - startY,
                  backgroundColor: isSkipped
                    ? `#3f3f4640`
                    : isNoPhase && i > 2
                      ? C.primary
                      : "#3f3f46",
                  transform: "translateX(-50%)",
                  transition: "none",
                }}
              />
            );
          })}

          {/* Nodes */}
          {MINI_NODES.map((node, i) => {
            const accent = NODE_COLORS[node.type] || C.primary;
            const isCondNode = node.id === "cond";
            const isSkipped =
              isYesPhase && skipProgress > 0 && i > 2;
            const isNoActive = isNoPhase && noPathGlow > 0 && i > 2;

            const width = node.type === "condition" ? 260 : 220;
            const height = node.type === "condition" ? 55 : 42;

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: node.yPos,
                  transform: "translateX(-50%)",
                  width,
                  height,
                  borderRadius: 10,
                  backgroundColor: "#18181b",
                  border: `1.5px solid ${
                    isCondNode && condHighlight > 0
                      ? `#f59e0b`
                      : isSkipped
                        ? "#27272a"
                        : isNoActive
                          ? C.primary
                          : `${accent}50`
                  }`,
                  boxShadow:
                    isCondNode && condHighlight > 0
                      ? `0 0 ${20 * condHighlight}px #f59e0b30`
                      : isNoActive
                        ? `0 0 12px ${C.primary}30`
                        : "none",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  gap: 10,
                  opacity: isSkipped ? 0.25 : 1,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: `${accent}30`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexShrink: 0,
                    opacity: isSkipped ? 0.3 : 1,
                  }}
                >
                  <MiniIcon type={node.type} />
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isSkipped ? "#3f3f46" : C.white,
                    fontFamily: F,
                    textDecoration: isSkipped ? "line-through" : "none",
                  }}
                >
                  {node.label}
                </span>

                {/* Checkmark on condition during "Yes" phase */}
                {isCondNode && checkSpring > 0 && isYesPhase && (
                  <div
                    style={{
                      position: "absolute",
                      right: -50,
                      top: "50%",
                      transform: `translateY(-50%) scale(${checkSpring})`,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12l5 5L20 7"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* "Yes → Purchased" label */}
          {yesLabelOp > 0 && isYesPhase && (
            <div
              style={{
                position: "absolute",
                right: -10,
                top: 130,
                opacity: yesLabelOp,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ width: 40, height: 2, backgroundColor: "#22c55e60" }} />
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  backgroundColor: "#22c55e15",
                  border: "1px solid #22c55e40",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#22c55e",
                    fontWeight: 700,
                    fontFamily: F,
                  }}
                >
                  Purchased ✓
                </span>
              </div>
            </div>
          )}

          {/* Exit badge */}
          {exitSpring > 0 && isYesPhase && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 420,
                transform: `translateX(-50%) scale(${exitSpring})`,
                padding: "8px 20px",
                borderRadius: 20,
                backgroundColor: "#22c55e20",
                border: "1px solid #22c55e40",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  color: "#22c55e",
                  fontWeight: 700,
                  fontFamily: F,
                }}
              >
                Workflow Complete — Exit
              </span>
            </div>
          )}

          {/* "No" path indicator during reset phase */}
          {isNoPhase && (
            <div
              style={{
                position: "absolute",
                right: -10,
                top: 130,
                opacity: resetProgress,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ width: 40, height: 2, backgroundColor: `${C.primary}60` }} />
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  backgroundColor: `${C.primary}15`,
                  border: `1px solid ${C.primary}40`,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: C.primary,
                    fontWeight: 700,
                    fontFamily: F,
                  }}
                >
                  Not yet → Continue
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom caption */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 0,
          right: 0,
          textAlign: "center" as const,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#52525b",
            fontFamily: "monospace",
            opacity: interpolate(frame, [120, 140], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          evaluateWorkflowCondition → conditionType: "has_purchased"
        </div>
      </div>
    </AbsoluteFill>
  );
};
