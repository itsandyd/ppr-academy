import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";
import { CenterScene, FadeUp, useExit } from "../components";

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 1 — THE HOOK (0-5s, frames 0-150)
// "Someone downloads your free sample pack. You get their email.
//  Then nothing happens."
//
// Pulls: Real trigger type "tag_added" and tag name "free-pack-download"
//        from convex/schema.ts and workflow data
// ═══════════════════════════════════════════════════════════════════════════

export const WorkflowSceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(130, 150);

  // Notification card springs in at frame 10
  const cardSpring = spring({
    fps,
    frame: frame - 10,
    config: { damping: 60, stiffness: 180 },
  });
  const cardY = interpolate(cardSpring, [0, 1], [60, 0]);
  const cardOp = interpolate(cardSpring, [0, 1], [0, 1]);

  // Card glow pulse — alive for a moment, then dims
  const glowPulse = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowFade = interpolate(frame, [60, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowOp = glowPulse * glowFade;

  // Silence — the card dims after appearing
  const cardDim = interpolate(frame, [70, 95], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Then nothing happens" text
  const nothingSpring = spring({
    fps,
    frame: frame - 100,
    config: { damping: 200 },
  });
  const nothingOp = interpolate(nothingSpring, [0, 1], [0, 1]);

  return (
    <CenterScene opacity={op} translateY={y} tint="#22c55e">
      {/* Notification card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          opacity: cardOp * cardDim,
          width: "85%",
          maxWidth: 420,
          padding: "24px 28px",
          borderRadius: 16,
          backgroundColor: "#18181b",
          border: "1px solid #3f3f46",
          boxShadow: `0 0 ${30 * glowOp}px ${C.green}40`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: C.green,
              boxShadow: `0 0 8px ${C.green}`,
            }}
          />
          <span
            style={{
              fontSize: 13,
              color: C.green,
              fontWeight: 600,
              fontFamily: F,
              letterSpacing: 1,
              textTransform: "uppercase" as const,
            }}
          >
            New Lead
          </span>
        </div>

        {/* Trigger type + tag from real codebase */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.white,
            fontFamily: F,
          }}
        >
          Tag Added: <span style={{ color: C.green }}>free-pack-download</span>
        </div>

        {/* Meta info */}
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 13,
            color: "#71717a",
            fontFamily: F,
          }}
        >
          <span>trigger: tag_added</span>
          <span>•</span>
          <span>emailContacts</span>
        </div>
      </div>

      {/* "Then nothing happens" */}
      <div
        style={{
          opacity: nothingOp,
          fontSize: 32,
          fontWeight: 700,
          color: "#71717a",
          fontFamily: F,
          letterSpacing: -0.5,
        }}
      >
        Then nothing happens.
      </div>
    </CenterScene>
  );
};
