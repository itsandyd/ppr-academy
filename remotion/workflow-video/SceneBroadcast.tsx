import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";
import { CenterScene, FadeUp, useExit } from "../components";
import { ENGINE } from "../workflowData";

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 5 — THE BROADCAST REVELATION (45-53s, frames 1350-1590)
// "This used to send 26,000 individual emails. Now it sends one broadcast."
//
// Pulls: Real function name sendWorkflowBroadcast from
//        convex/emailWorkflowActions.ts line 1151, and the real
//        Resend Broadcasts API integration
// ═══════════════════════════════════════════════════════════════════════════

export const WorkflowSceneBroadcast: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(220, 240);

  // ─── BEFORE state: Counter ticking painfully ───────────────────────
  const beforeVisible = frame < 120;
  const counterProgress = interpolate(frame, [10, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const counterVal = Math.floor(counterProgress * 847); // Stops partway to show slowness
  const totalRecipients = 26750;

  // ─── Transition: Before fades out, After fades in ─────────────────
  const transitionOp = interpolate(frame, [110, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const afterOp = interpolate(frame, [125, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── AFTER state: Single pulse radiates ───────────────────────────
  const pulseSpring = spring({
    fps,
    frame: frame - 145,
    config: { damping: 15, stiffness: 60 },
  });
  const pulseScale = interpolate(pulseSpring, [0, 1], [0, 1]);
  const pulseRing1 = interpolate(frame, [155, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseRing2 = interpolate(frame, [165, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Recipient count reveals
  const recipientSpring = spring({
    fps,
    frame: frame - 175,
    config: { damping: 200 },
  });

  return (
    <CenterScene opacity={op} translateY={y} seed={5} tint={C.primary}>
      {/* BEFORE state */}
      <div
        style={{
          opacity: transitionOp,
          display: beforeVisible || transitionOp > 0 ? "flex" : "none",
          flexDirection: "column",
          alignItems: "center",
          position: "absolute",
          width: "85%",
          zIndex: 1,
        }}
      >
        <FadeUp delay={5} style={{ marginBottom: 24 }}>
          <span
            style={{
              fontSize: 13,
              color: "#71717a",
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase" as const,
              fontFamily: F,
            }}
          >
            Before
          </span>
        </FadeUp>

        {/* Transactional API badge */}
        <FadeUp delay={12} style={{ marginBottom: 20 }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              backgroundColor: "#27272a",
              border: "1px solid #3f3f46",
            }}
          >
            <span style={{ fontSize: 12, color: "#71717a", fontFamily: "monospace" }}>
              Transactional API
            </span>
          </div>
        </FadeUp>

        {/* Painful counter */}
        <FadeUp delay={20} style={{ textAlign: "center" as const }}>
          <div style={{ fontSize: 14, color: "#52525b", fontFamily: F, marginBottom: 8 }}>
            Sending...
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              fontFamily: F,
              fontVariantNumeric: "tabular-nums",
              color: "#ef4444",
            }}
          >
            {counterVal.toLocaleString()}
          </div>
          <div style={{ fontSize: 16, color: "#52525b", fontFamily: F }}>
            / {totalRecipients.toLocaleString()}
          </div>

          {/* Progress bar — barely moving */}
          <div
            style={{
              width: 300,
              height: 4,
              backgroundColor: "#27272a",
              borderRadius: 2,
              marginTop: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${counterProgress * 3.2}%`,
                height: "100%",
                backgroundColor: "#ef4444",
                borderRadius: 2,
              }}
            />
          </div>
        </FadeUp>
      </div>

      {/* AFTER state */}
      <div
        style={{
          opacity: afterOp,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "absolute",
          width: "85%",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: C.primary,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            fontFamily: F,
            marginBottom: 30,
          }}
        >
          After
        </span>

        {/* Broadcast pulse visualization */}
        <div
          style={{
            position: "relative",
            width: 200,
            height: 200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          {/* Radiating rings */}
          {[pulseRing1, pulseRing2].map((ring, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: `2px solid ${C.primary}`,
                opacity: (1 - ring) * 0.6,
                transform: `scale(${0.5 + ring * 1.5})`,
              }}
            />
          ))}

          {/* Center circle */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: C.primary,
              transform: `scale(${pulseScale})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `0 0 40px ${C.primary}60`,
            }}
          >
            {/* Broadcast icon — simple signal lines */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"
                fill="white"
              />
              <path
                d="M7.5 7.5a6.36 6.36 0 0 1 9 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16.5 16.5a6.36 6.36 0 0 1-9 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4.5 4.5a11.31 11.31 0 0 1 15 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M19.5 19.5a11.31 11.31 0 0 1-15 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Function name badge */}
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            backgroundColor: "#27272a",
            border: `1px solid ${C.primary}40`,
            marginBottom: 20,
            opacity: interpolate(recipientSpring, [0, 1], [0, 1]),
          }}
        >
          <span style={{ fontSize: 12, color: C.primary, fontFamily: "monospace" }}>
            {ENGINE.broadcastFn}()
          </span>
        </div>

        {/* Result */}
        <div
          style={{
            opacity: interpolate(recipientSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(recipientSpring, [0, 1], [20, 0])}px)`,
            textAlign: "center" as const,
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              fontFamily: F,
              color: C.white,
            }}
          >
            1 broadcast
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#71717a",
              fontFamily: F,
              marginTop: 4,
            }}
          >
            → {totalRecipients.toLocaleString()} recipients
          </div>
        </div>

        {/* Resend Broadcasts API label */}
        <div
          style={{
            marginTop: 24,
            opacity: interpolate(frame, [200, 215], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#52525b",
              fontFamily: F,
            }}
          >
            Resend Broadcasts API · Marketing Plan
          </span>
        </div>
      </div>
    </CenterScene>
  );
};
