import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";
import { CenterScene, FadeUp, useExit } from "../components";

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 2 — THE PROBLEM (5-12s, frames 150-360)
// "That email just sits in a database. No follow-up. No sequence. Nothing."
//
// Pulls: Real table name "workflowExecutions" and field names from
//        convex/schema.ts line 681
// ═══════════════════════════════════════════════════════════════════════════

export const WorkflowSceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(190, 210);

  // Table header
  const headerSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 200 },
  });

  // Rows appear one by one
  const rows = [
    { email: "alex@gmail.com", tag: "free-pack-download", date: "2 min ago" },
    { email: "jordan@hotmail.com", tag: "free-pack-download", date: "5 min ago" },
    { email: "sam@proton.me", tag: "free-pack-download", date: "12 min ago" },
    { email: "riley@yahoo.com", tag: "free-pack-download", date: "28 min ago" },
    { email: "casey@icloud.com", tag: "free-pack-download", date: "1 hr ago" },
  ];

  // Counter ticking up — "Uncontacted" count
  const counterStart = 80;
  const counterVal = Math.min(
    Math.floor(
      interpolate(frame, [counterStart, counterStart + 90], [1, 500], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    ),
    500
  );

  return (
    <CenterScene opacity={op} translateY={y} seed={2} tint="#ef4444">
      {/* Section label */}
      <FadeUp delay={3} style={{ marginBottom: 20 }}>
        <span
          style={{
            fontSize: 13,
            color: "#ef4444",
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            fontFamily: F,
          }}
        >
          The Problem
        </span>
      </FadeUp>

      {/* Database table visualization */}
      <div
        style={{
          width: "92%",
          maxWidth: 480,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #3f3f46",
          backgroundColor: "#18181b",
          opacity: interpolate(headerSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(headerSpring, [0, 1], [30, 0])}px)`,
        }}
      >
        {/* Table name */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#71717a",
              fontFamily: "monospace",
            }}
          >
            workflowExecutions
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#ef4444",
              fontFamily: F,
              fontWeight: 600,
            }}
          >
            status: pending
          </span>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            padding: "8px 16px",
            borderBottom: "1px solid #27272a",
            gap: 8,
          }}
        >
          <span style={{ flex: 2, fontSize: 11, color: "#52525b", fontFamily: F, fontWeight: 600 }}>
            customerEmail
          </span>
          <span style={{ flex: 1.5, fontSize: 11, color: "#52525b", fontFamily: F, fontWeight: 600 }}>
            tag
          </span>
          <span style={{ flex: 0.8, fontSize: 11, color: "#52525b", fontFamily: F, fontWeight: 600, textAlign: "right" as const }}>
            scheduledFor
          </span>
        </div>

        {/* Data rows */}
        {rows.map((row, i) => {
          const delay = 15 + i * 14;
          const rowSpring = spring({
            fps,
            frame: frame - delay,
            config: { damping: 200 },
          });
          const rowOp = interpolate(rowSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                padding: "10px 16px",
                borderBottom: i < rows.length - 1 ? "1px solid #1e1e21" : "none",
                gap: 8,
                opacity: rowOp,
              }}
            >
              <span style={{ flex: 2, fontSize: 13, color: C.white, fontFamily: "monospace" }}>
                {row.email}
              </span>
              <span style={{ flex: 1.5, fontSize: 12, color: "#71717a", fontFamily: "monospace" }}>
                {row.tag}
              </span>
              <span style={{ flex: 0.8, fontSize: 12, color: "#52525b", fontFamily: F, textAlign: "right" as const }}>
                {row.date}
              </span>
            </div>
          );
        })}
      </div>

      {/* Uncontacted counter */}
      {frame > counterStart && (
        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            opacity: interpolate(frame, [counterStart, counterStart + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: "#ef4444",
              fontFamily: F,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {counterVal.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 18,
              color: "#71717a",
              fontFamily: F,
              fontWeight: 500,
            }}
          >
            uncontacted
          </span>
        </div>
      )}
    </CenterScene>
  );
};
