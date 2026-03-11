import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { C, F } from "../../theme";
import { LogoIcon } from "../../components";

// ═══════════════════════════════════════════════════════════════════════════
// TWO STEPS AHEAD — 85s Promo (1080×1920, 60fps, 5100 frames)
//
// Color mapping from globals.css dark-mode tokens → remotion/theme.ts:
//   --background       (0 0% 7%)     → C.bg       #0a0a0a
//   --card             (240 10% 13%) → C.darkGray  #1e293b  (surface)
//   --muted-foreground (218 11% 65%) → C.gray      #94a3b8
//   --foreground       (214 32% 91%) → C.white     #ffffff
//   --chart-5          (27 98% 49%)  → C.orange    #f97316  (brand accent)
//   --destructive      (0 81% 62%)   → C.red       #ef4444
//   --font-sans        Outfit        → F           system-ui (Remotion-safe)
// ═══════════════════════════════════════════════════════════════════════════

const FPS = 60;
const sec = (t: number) => Math.round(t * FPS);

// ─── DAW Grid Texture (Ableton-style, blurred, 10% opacity) ────────────
const DAWGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      filter: "blur(3px)",
      backgroundImage: `
        linear-gradient(${C.gray}18 1px, transparent 1px),
        linear-gradient(90deg, ${C.gray}18 1px, transparent 1px)
      `,
      backgroundSize: "60px 40px",
    }}
  />
);

// ─── Chat Bubble ────────────────────────────────────────────────────────
const ChatBubble: React.FC<{
  delay: number;
  width?: number;
  lineWidth?: number;
}> = ({ delay, width = 420, lineWidth = 200 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - delay, config: { damping: 50, stiffness: 160 } });
  const x = interpolate(sp, [0, 1], [300, 0]);
  const op = interpolate(sp, [0, 1], [0, 1]);
  const pulse = Math.sin(frame * 0.05) * 0.15 + 0.85; // 0.7→1→0.7

  return (
    <div
      style={{
        transform: `translateX(${x}px)`,
        opacity: op * pulse,
        background: C.darkGray,
        borderRadius: 16,
        padding: "20px 24px",
        width,
        marginBottom: 12,
      }}
    >
      <div style={{ width: lineWidth, height: 10, borderRadius: 5, background: `${C.gray}50` }} />
    </div>
  );
};

// ─── Stat Card (icon + label + red diagonal strikethrough) ──────────────
const StatCard: React.FC<{
  icon: "trophy" | "person";
  label: string;
  delay: number;
  strikeDelay: number;
}> = ({ icon, label, delay, strikeDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - delay, config: { damping: 55, stiffness: 170 } });
  const sc = interpolate(sp, [0, 1], [0.95, 1]);
  const op = interpolate(sp, [0, 1], [0, 1]);

  // Red strikethrough draws diagonally over 0.5s
  const strike = interpolate(frame, [strikeDelay, strikeDelay + sec(0.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `scale(${sc})`,
        opacity: op,
        background: C.darkGray,
        borderRadius: 16,
        padding: "28px 24px",
        width: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {icon === "trophy" ? (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ) : (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      )}
      <div style={{ fontSize: 14, color: C.gray, fontFamily: F, fontWeight: 600 }}>{label}</div>

      {/* Red diagonal strikethrough */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <line
          x1="0"
          y1="100%"
          x2={`${strike * 100}%`}
          y2={`${100 - strike * 100}%`}
          stroke={C.red}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// ─── Progress Bar (circle-capped, orange marker dot) ────────────────────
const ProgressBar: React.FC<{
  enterDelay: number;
  leftLabel: string;
  rightLabel: string;
  markerPos: number;
}> = ({ enterDelay, leftLabel, rightLabel, markerPos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - enterDelay, config: { damping: 50, stiffness: 160 } });
  const barW = interpolate(sp, [0, 1], [0, 1]);
  const op = interpolate(sp, [0, 1], [0, 1]);
  const pulse = Math.sin(frame * 0.08) * 0.1 + 1; // 1→1.1→1

  return (
    <div style={{ opacity: op, width: "85%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", position: "relative" }}>
        {/* Left cap */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: C.gray }} />
          <div style={{ fontSize: 12, color: C.gray, fontFamily: F, fontWeight: 600, marginTop: 8 }}>{leftLabel}</div>
        </div>
        {/* Track */}
        <div style={{ flex: 1, height: 3, background: `${C.gray}40`, position: "relative", margin: "0 16px", marginBottom: 20 }}>
          <div style={{ width: `${barW * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.gray}60, ${C.orange})` }} />
          <div
            style={{
              position: "absolute",
              left: `${markerPos * 100}%`,
              top: "50%",
              transform: `translate(-50%, -50%) scale(${pulse})`,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: C.orange,
              boxShadow: `0 0 20px ${C.orange}80, 0 0 40px ${C.orange}40`,
              opacity: barW,
            }}
          />
        </div>
        {/* Right cap */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: C.gray }} />
          <div style={{ fontSize: 12, color: C.gray, fontFamily: F, fontWeight: 600, marginTop: 8 }}>{rightLabel}</div>
        </div>
      </div>
    </div>
  );
};

// ─── Staircase (2-step, white lines, person icons, orange glow) ─────────
const Staircase: React.FC<{ enterDelay: number; scaleVal?: number }> = ({
  enterDelay,
  scaleVal = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - enterDelay, config: { damping: 50, stiffness: 160 } });
  const op = interpolate(sp, [0, 1], [0, 1]);
  const sc = interpolate(sp, [0, 1], [0.95, 1]) * scaleVal;
  const glow = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <div style={{ opacity: op, transform: `scale(${sc})`, width: 260, height: 200 }}>
      <svg width="260" height="200" viewBox="0 0 260 200">
        {/* Step 1 — bottom left */}
        <line x1="30" y1="160" x2="130" y2="160" stroke={C.white} strokeWidth="2" />
        <line x1="130" y1="160" x2="130" y2="80" stroke={C.white} strokeWidth="2" />
        {/* Step 2 — top right */}
        <line x1="130" y1="80" x2="230" y2="80" stroke={C.white} strokeWidth="2" />
        {/* Person on step 1 (white) */}
        <circle cx="80" cy="138" r="12" fill={C.white} />
        <circle cx="80" cy="131" r="5" fill={C.bg} />
        <path d="M73 143 a7 7 0 0 1 14 0" fill={C.bg} />
        {/* Person on step 2 (orange) */}
        <circle cx="180" cy="58" r="12" fill={C.orange} />
        <circle cx="180" cy="51" r="5" fill={C.bg} />
        <path d="M173 63 a7 7 0 0 1 14 0" fill={C.bg} />
        {/* Orange glow */}
        <circle cx="180" cy="58" r="36" fill="none" stroke={C.orange} strokeWidth="2" opacity={glow * 0.3} />
        <circle cx="180" cy="58" r="52" fill="none" stroke={C.orange} strokeWidth="1" opacity={glow * 0.15} />
      </svg>
    </div>
  );
};

// ─── Timeline Bar (marker animates L→R) ─────────────────────────────────
const Timeline: React.FC<{
  enterDelay: number;
  markerStart: number;
  markerDuration: number;
  leftLabel: string;
  rightLabel: string;
}> = ({ enterDelay, markerStart, markerDuration, leftLabel, rightLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - enterDelay, config: { damping: 55, stiffness: 170 } });
  const op = interpolate(sp, [0, 1], [0, 1]);
  const pos = interpolate(frame, [markerStart, markerStart + markerDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity: op, width: "85%", display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.gray }} />
        <div style={{ fontSize: 11, color: C.gray, fontFamily: F, fontWeight: 600, marginTop: 6 }}>{leftLabel}</div>
      </div>
      <div style={{ flex: 1, height: 3, background: `${C.gray}30`, position: "relative", margin: "0 16px", marginBottom: 18 }}>
        <div style={{ width: `${pos * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.gray}60, ${C.orange})` }} />
        <div
          style={{
            position: "absolute",
            left: `${pos * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: C.orange,
            boxShadow: `0 0 16px ${C.orange}80`,
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.gray }} />
        <div style={{ fontSize: 11, color: C.gray, fontFamily: F, fontWeight: 600, marginTop: 6 }}>{rightLabel}</div>
      </div>
    </div>
  );
};

// ─── Pill Badge (surface bg + orange border) ────────────────────────────
const PillBadge: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - delay, config: { damping: 55, stiffness: 170 } });
  const sc = interpolate(sp, [0, 1], [0.95, 1]);
  const op = interpolate(sp, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `scale(${sc})`,
        opacity: op,
        background: C.darkGray,
        border: `1.5px solid ${C.orange}`,
        borderRadius: 24,
        padding: "12px 28px",
        fontSize: 16,
        fontWeight: 600,
        color: C.white,
        fontFamily: F,
        textAlign: "center" as const,
      }}
    >
      {label}
    </div>
  );
};

// ─── Two-Column Stat ────────────────────────────────────────────────────
const TwoColStat: React.FC<{
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  enterDelay: number;
}> = ({ leftLabel, leftValue, rightLabel, rightValue, enterDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - enterDelay, config: { damping: 55, stiffness: 170 } });
  const op = interpolate(sp, [0, 1], [0, 1]);
  const sc = interpolate(sp, [0, 1], [0.95, 1]);

  return (
    <div style={{ opacity: op, transform: `scale(${sc})`, display: "flex", alignItems: "center", gap: 40 }}>
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: F, fontWeight: 600, marginBottom: 8 }}>{leftLabel}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.gray, fontFamily: F }}>{leftValue}</div>
      </div>
      <div style={{ width: 1, height: 60, background: `${C.gray}40` }} />
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: F, fontWeight: 600, marginBottom: 8 }}>{rightLabel}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.orange, fontFamily: F }}>{rightValue}</div>
      </div>
    </div>
  );
};

// ─── Comment Bubble (surface fill, optional tail, configurable text) ────
const MsgBubble: React.FC<{
  text: string;
  enterDelay: number;
  from?: "right" | "bottom";
  textColor?: string;
}> = ({ text, enterDelay, from = "right", textColor = C.gray }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - enterDelay, config: { damping: 50, stiffness: 160 } });
  const val = interpolate(sp, [0, 1], [200, 0]);
  const op = interpolate(sp, [0, 1], [0, 1]);
  const transform = from === "right" ? `translateX(${val}px)` : `translateY(${val}px)`;

  return (
    <div style={{ transform, opacity: op, position: "relative" }}>
      {/* Tail (left-side, only for bottom-enter variant) */}
      {from === "bottom" && (
        <div
          style={{
            position: "absolute",
            left: 24,
            top: -8,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: `8px solid ${C.darkGray}`,
          }}
        />
      )}
      <div
        style={{
          background: C.darkGray,
          borderRadius: 16,
          padding: "20px 32px",
          fontSize: 18,
          fontWeight: 600,
          color: textColor,
          fontFamily: F,
          textAlign: "center" as const,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ─── Product Chip ───────────────────────────────────────────────────────
const Chip: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - delay, config: { damping: 55, stiffness: 170 } });
  const sc = interpolate(sp, [0, 1], [0.95, 1]);
  const op = interpolate(sp, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `scale(${sc})`,
        opacity: op,
        background: C.darkGray,
        border: `1.5px solid ${C.orange}`,
        borderRadius: 20,
        padding: "10px 24px",
        fontSize: 15,
        fontWeight: 600,
        color: C.white,
        fontFamily: F,
        textAlign: "center" as const,
      }}
    >
      {label}
    </div>
  );
};

// ─── Icon + Label Pair ──────────────────────────────────────────────────
const IconLabel: React.FC<{
  icon: React.ReactNode;
  label: string;
  delay: number;
}> = ({ icon, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ fps, frame: frame - delay, config: { damping: 55, stiffness: 170 } });
  const op = interpolate(sp, [0, 1], [0, 1]);
  const sc = interpolate(sp, [0, 1], [0.95, 1]);

  return (
    <div style={{ opacity: op, transform: `scale(${sc})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {icon}
      <div style={{ fontSize: 12, color: C.gray, fontFamily: F, fontWeight: 600 }}>{label}</div>
    </div>
  );
};

// ─── Animated Horizontal Line (draws L→R) ───────────────────────────────
const HLine: React.FC<{ start: number; duration: number; color: string }> = ({
  start,
  duration,
  color,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: "70%", height: 3 }}>
      <div
        style={{
          width: `${p * 100}%`,
          height: "100%",
          background: color,
          boxShadow: `0 0 12px ${color}80`,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 1 — THE PAIN POINT (0–20s = 1200 frames)
// ═══════════════════════════════════════════════════════════════════════════
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  // Chat bubbles fade group
  const bubblesOut = interpolate(frame, [sec(8), sec(10)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stat cards fade group
  const cardsOut = interpolate(frame, [sec(10), sec(12)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Italic text at bottom third
  const textIn = interpolate(frame, [sec(15), sec(16)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOut = interpolate(frame, [sec(18.5), sec(20)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <DAWGrid opacity={0.1} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 56px", zIndex: 1 }}>
        {/* Three chat bubbles — float in from right, 0.1s stagger */}
        <div style={{ opacity: bubblesOut, marginBottom: 60 }}>
          <ChatBubble delay={sec(1)} width={380} lineWidth={180} />
          <ChatBubble delay={sec(1.1)} width={420} lineWidth={240} />
          <ChatBubble delay={sec(1.2)} width={350} lineWidth={160} />
        </div>

        {/* Two stat cards side by side */}
        <div style={{ opacity: cardsOut, display: "flex", gap: 24, marginBottom: 80 }}>
          <StatCard icon="trophy" label="Achievements" delay={sec(5)} strikeDelay={sec(7)} />
          <StatCard icon="person" label="Community" delay={sec(5.2)} strikeDelay={sec(7.2)} />
        </div>

        {/* Italic muted text — bottom third */}
        <div
          style={{
            opacity: textIn * textOut,
            fontSize: 22,
            fontStyle: "italic",
            color: C.gray,
            fontFamily: F,
            fontWeight: 500,
            textAlign: "center" as const,
            lineHeight: 1.5,
          }}
        >
          scattered tools, no real progress
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 2 — THE SHIFT (20–34s = 840 frames)
// ═══════════════════════════════════════════════════════════════════════════
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  // DAW texture fades out over 0.5s
  const dawOp = interpolate(frame, [0, sec(0.5)], [0.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress bar group fade
  const barOut = interpolate(frame, [sec(6), sec(7)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Staircase group fade
  const stairOut = interpolate(frame, [sec(12), sec(13)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <DAWGrid opacity={dawOp} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 56px", zIndex: 1, gap: 80 }}>
        <div style={{ opacity: barOut, width: "100%", display: "flex", justifyContent: "center" }}>
          <ProgressBar enterDelay={sec(2)} leftLabel="STUCK" rightLabel="GROWING" markerPos={0.35} />
        </div>

        <div style={{ opacity: stairOut }}>
          <Staircase enterDelay={sec(8)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 3 — THE PROOF (34–56s = 1320 frames)
// ═══════════════════════════════════════════════════════════════════════════
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();

  const timelineOut = interpolate(frame, [sec(4), sec(5)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pillsOut = interpolate(frame, [sec(10), sec(11)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const colsOut = interpolate(frame, [sec(15), sec(16)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stairIn = interpolate(frame, [sec(16.5), sec(17)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stairOut = interpolate(frame, [sec(17.5), sec(18)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chatOut = interpolate(frame, [sec(20.5), sec(21.5)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 56px", zIndex: 1 }}>
        {/* Timeline bar — marker animates L→R over 1s */}
        <div style={{ opacity: timelineOut, width: "100%", display: "flex", justifyContent: "center", marginBottom: 60 }}>
          <Timeline enterDelay={sec(1)} markerStart={sec(2)} markerDuration={sec(1)} leftLabel="DAY 1" rightLabel="LAUNCH" />
        </div>

        {/* Four pill badges in 2×2 grid, 0.2s stagger */}
        <div style={{ opacity: pillsOut, display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: 16, maxWidth: 500, marginBottom: 60 }}>
          <PillBadge label="Courses" delay={sec(7)} />
          <PillBadge label="Beats" delay={sec(7.2)} />
          <PillBadge label="Sample Packs" delay={sec(7.4)} />
          <PillBadge label="Presets" delay={sec(7.6)} />
        </div>

        {/* Two-column stat */}
        <div style={{ opacity: colsOut, marginBottom: 60 }}>
          <TwoColStat leftLabel="BEFORE" leftValue="$0" rightLabel="AFTER" rightValue="$2.4k" enterDelay={sec(12)} />
        </div>

        {/* Staircase at 60% scale */}
        <div style={{ opacity: stairIn * stairOut, marginBottom: 40 }}>
          <Staircase enterDelay={sec(16.5)} scaleVal={0.6} />
        </div>

        {/* Chat bubble — slides in from right over 0.3s */}
        <div style={{ opacity: chatOut }}>
          <MsgBubble text="first sale feels unreal" enterDelay={sec(19)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 4 — THE PPR REVEAL (56–72s = 960 frames)
// ═══════════════════════════════════════════════════════════════════════════
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo fade in over 0.4s at 1s
  const logoOp = interpolate(frame, [sec(1), sec(1.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Branded card at 3s — scale 0.8→1 spring
  const cardSp = spring({ fps, frame: frame - sec(3), config: { damping: 50, stiffness: 160 } });
  const cardSc = interpolate(cardSp, [0, 1], [0.8, 1]);
  const cardOp = interpolate(cardSp, [0, 1], [0, 1]);
  const cardOut = interpolate(frame, [sec(14), sec(15.5)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Chips at 6s, out at 9.5s
  const chipsOut = interpolate(frame, [sec(9), sec(9.5)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Icon row at 10s, out at 14s
  const iconsOut = interpolate(frame, [sec(13), sec(14)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const bookSVG = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
  const musicSVG = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="18" r="4" />
      <path d="M12 18V2l7 4" />
    </svg>
  );
  const usersSVG = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Branded card with LogoIcon inside */}
      <div
        style={{
          opacity: cardOp * cardOut,
          transform: `scale(${cardSc})`,
          background: C.darkGray,
          border: `1px solid ${C.orange}`,
          borderRadius: 12,
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 60,
        }}
      >
        <div style={{ opacity: logoOp }}>
          <LogoIcon
            delay={sec(1)}
            size={90}
            gradientFrom={C.orange}
            gradientTo={C.warmOrange}
            gradientVia={C.orange}
            glowColor={C.orange}
          />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.white, fontFamily: F, letterSpacing: 2 }}>
          PausePlayRepeat
        </div>
      </div>

      {/* Product chips (3, staggered 0.15s) */}
      <div style={{ opacity: chipsOut, display: "flex", gap: 12, marginBottom: 40 }}>
        <Chip label="Courses" delay={sec(6)} />
        <Chip label="Beats" delay={sec(6.15)} />
        <Chip label="Presets" delay={sec(6.3)} />
      </div>

      {/* Icon + label pairs (3, staggered 0.15s) */}
      <div style={{ opacity: iconsOut, display: "flex", gap: 56 }}>
        <IconLabel icon={bookSVG} label="Teach" delay={sec(10)} />
        <IconLabel icon={musicSVG} label="Sell" delay={sec(10.15)} />
        <IconLabel icon={usersSVG} label="Grow" delay={sec(10.3)} />
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 5 — CTA + CLOSE (72–85s = 780 frames)
// ═══════════════════════════════════════════════════════════════════════════
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  // Comment bubble: enter 1s, pulse ~3s, out 5.5s
  const bubbleOut = interpolate(frame, [sec(5), sec(6)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bubblePulse =
    frame > sec(3) && frame < sec(4)
      ? 1 + Math.sin((frame - sec(3)) * 0.15) * 0.05
      : 1;

  // Staircase: enter 6.5s, hold 2s, out 9s
  const stairOut = interpolate(frame, [sec(8.5), sec(9)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Orange line: draws 9.5s over 0.4s, fades 10.5s
  const lineOut = interpolate(frame, [sec(10.2), sec(11)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 56px", zIndex: 1 }}>
        {/* Social comment bubble from bottom */}
        <div style={{ opacity: bubbleOut, transform: `scale(${bubblePulse})`, marginBottom: 80 }}>
          <MsgBubble text="start building today" enterDelay={sec(1)} from="bottom" textColor={C.orange} />
        </div>

        {/* Staircase — full scale, orange glow */}
        <div style={{ opacity: stairOut, marginBottom: 60 }}>
          <Staircase enterDelay={sec(6.5)} scaleVal={1} />
        </div>

        {/* Orange horizontal line draws L→R */}
        <div style={{ opacity: lineOut, width: "100%", display: "flex", justifyContent: "center" }}>
          <HLine start={sec(9.5)} duration={sec(0.4)} color={C.orange} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════
export const TwoStepsAheadVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={sec(20)}>
      <Scene1 />
    </Sequence>
    <Sequence from={sec(20)} durationInFrames={sec(14)}>
      <Scene2 />
    </Sequence>
    <Sequence from={sec(34)} durationInFrames={sec(22)}>
      <Scene3 />
    </Sequence>
    <Sequence from={sec(56)} durationInFrames={sec(16)}>
      <Scene4 />
    </Sequence>
    <Sequence from={sec(72)} durationInFrames={sec(13)}>
      <Scene5 />
    </Sequence>
  </AbsoluteFill>
);
