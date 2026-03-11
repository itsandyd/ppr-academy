import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  CalculateMetadataFunction,
} from "remotion";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// ═══════════════════════════════════════════════════════════════════════════
// BEAT LEASE WARNING — Adaptive Duration
// Cyberpunk-styled educational video about beat licensing tiers.
// 9:16 vertical (1080×1920) @ 30fps, ~55s total
// ═══════════════════════════════════════════════════════════════════════════

// ─── Fonts ──────────────────────────────────────────────────────────────
const { fontFamily: orbitron } = loadOrbitron("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

// ─── Cyberpunk Color Palette ────────────────────────────────────────────
const CY = {
  bg1: "#0a0015",
  bg2: "#1a0033",
  text: "#e0f7ff",
  cyan: "#00f0ff",
  pink: "#ff00aa",
  purple: "#a855f7",
  white: "#ffffff",
  dimText: "#8ba8c0",
};

// ─── Safe Zone Layout (TikTok/IG/Reels overlay protection) ─────────────
// 12% top/bottom, 10% sides → keeps content within 10–85% vertical range
const SAFE_ZONE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "12% 10%",
} as const;

// ─── Scene Timing (in seconds) ─────────────────────────────────────────
const TIMING = {
  hook: 7.5,
  glitch: 0.3,
  tierBasic: 8,
  tierPremium: 8,
  tierExclusive: 9,
  tierHold: 2,
  reinforcement: 10,
  cta: 10,
};

const TOTAL_SECONDS =
  TIMING.hook +
  TIMING.glitch +
  TIMING.tierBasic +
  TIMING.tierPremium +
  TIMING.tierExclusive +
  TIMING.tierHold +
  TIMING.reinforcement +
  TIMING.cta;

// ─── Props ──────────────────────────────────────────────────────────────
export type BeatLeaseWarningProps = {
  pacingMultiplier?: number;
};

// ─── calculateMetadata ─────────────────────────────────────────────────
export const calculateBeatLeaseWarningMetadata: CalculateMetadataFunction<
  BeatLeaseWarningProps
> = async ({ props }) => {
  const multiplier = props.pacingMultiplier ?? 1;
  const estimatedSeconds = Math.max(35, Math.min(80, TOTAL_SECONDS * multiplier));
  return {
    durationInFrames: Math.ceil(estimatedSeconds * 30),
    fps: 30,
    width: 1080,
    height: 1920,
  };
};

// ─── Shared Spring Config ───────────────────────────────────────────────
const SPRING_CFG = { stiffness: 220, damping: 18, mass: 0.7 };
const SPRING_SOFT = { stiffness: 160, damping: 22, mass: 0.8 };

// ─── Helper: energetic spring entrance ─────────────────────────────────
function useSlam(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: SPRING_CFG });
  return {
    scale: interpolate(s, [0, 1], [0.8, 1]),
    rotate: interpolate(s, [0, 1], [5, 0]),
    opacity: interpolate(s, [0, 1], [0, 1]),
  };
}

function useSlideUp(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: SPRING_CFG });
  return {
    y: interpolate(s, [0, 1], [120, 0]),
    opacity: interpolate(s, [0, 1], [0, 1]),
  };
}

// ─── Micro-glitch offset ───────────────────────────────────────────────
function useGlitch(delay: number, duration: number = 6) {
  const frame = useCurrentFrame();
  const active = frame >= delay && frame < delay + duration;
  if (!active) return { x: 0, y: 0 };
  const seed = frame * 7919;
  return {
    x: ((seed % 5) - 2) * 1.5,
    y: (((seed * 3) % 5) - 2) * 1,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND: Cyberpunk gradient + drifting orbs
// ═══════════════════════════════════════════════════════════════════════════
const CyberpunkBG: React.FC = () => {
  const frame = useCurrentFrame();

  const orbs = [
    { x: 150, y: 400, size: 500, color: CY.purple, phase: 0 },
    { x: 700, y: 1100, size: 420, color: CY.cyan, phase: 40 },
    { x: 50, y: 1600, size: 380, color: CY.pink, phase: 80 },
  ];

  return (
    <AbsoluteFill>
      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${CY.bg1}, ${CY.bg2})`,
        }}
      />

      {/* Grid lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage: `
            linear-gradient(${CY.purple}20 1px, transparent 1px),
            linear-gradient(90deg, ${CY.purple}20 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Drifting orbs */}
      {orbs.map((orb, i) => {
        const drift = Math.sin((frame + orb.phase) * 0.012) * 35;
        const pulse = Math.sin((frame + orb.phase) * 0.025) * 0.25 + 0.55;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.x,
              top: orb.y + drift,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${orb.color}30, transparent 70%)`,
              opacity: pulse * 0.5,
              filter: `blur(${orb.size * 0.3}px)`,
            }}
          />
        );
      })}

      {/* Scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: (frame * 3) % 2100 - 100,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${CY.purple}20, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 1: DRAMATIC HOOK (0–7.5s / 225 frames)
// ═══════════════════════════════════════════════════════════════════════════
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();

  // Glitch static fade-in (first 15 frames)
  const staticFade = interpolate(frame, [0, 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main title slam at frame 18
  const slam = useSlam(18);
  const glitch1 = useGlitch(18, 8);

  // Subtext reveal at frame 90
  const sub = useSlideUp(90);
  const glitch2 = useGlitch(90, 6);

  // Neon glow pulse on title
  const glowPulse = Math.sin(frame * 0.1) * 0.4 + 0.6;

  return (
    <AbsoluteFill>
      <CyberpunkBG />

      {/* Static noise overlay (fades out) */}
      {staticFade > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: staticFade * 0.7,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              ${CY.cyan}08 2px,
              ${CY.cyan}08 4px
            )`,
            zIndex: 5,
          }}
        />
      )}

      {/* Main hook text — centered in safe zone */}
      <AbsoluteFill
        style={{
          ...SAFE_ZONE,
          zIndex: 10,
        }}
      >
        {/* "Sold a beat for $50." */}
        <div
          style={{
            opacity: slam.opacity,
            transform: `scale(${slam.scale}) rotate(${slam.rotate}deg) translate(${glitch1.x}px, ${glitch1.y}px)`,
            textAlign: "center",
            marginBottom: 50,
          }}
        >
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 100,
              fontWeight: 900,
              color: CY.cyan,
              lineHeight: 1.1,
              textShadow: `0 0 ${30 * glowPulse}px ${CY.cyan}80, 0 0 ${60 * glowPulse}px ${CY.cyan}40`,
              letterSpacing: -2,
            }}
          >
            Sold a beat
          </div>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 110,
              fontWeight: 900,
              color: CY.cyan,
              lineHeight: 1.1,
              textShadow: `0 0 ${30 * glowPulse}px ${CY.cyan}80, 0 0 ${60 * glowPulse}px ${CY.cyan}40`,
              letterSpacing: -2,
            }}
          >
            for $50.
          </div>
        </div>

        {/* Subtext reveal */}
        <div
          style={{
            opacity: sub.opacity,
            transform: `translateY(${sub.y}px) translate(${glitch2.x}px, ${glitch2.y}px)`,
            textAlign: "center",
            maxWidth: "85%",
          }}
        >
          <div
            style={{
              fontFamily: inter,
              fontSize: 46,
              fontWeight: 600,
              color: CY.text,
              lineHeight: 1.35,
            }}
          >
            Three months later:
          </div>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 56,
              fontWeight: 700,
              color: CY.pink,
              lineHeight: 1.2,
              marginTop: 12,
              textShadow: `0 0 20px ${CY.pink}60`,
            }}
          >
            10M streams on Spotify.
          </div>
          <div
            style={{
              fontFamily: inter,
              fontSize: 50,
              fontWeight: 700,
              color: CY.white,
              marginTop: 8,
            }}
          >
            You still got{" "}
            <span style={{ color: CY.pink, textShadow: `0 0 15px ${CY.pink}60` }}>
              $0.
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GLITCH TRANSITION (0.3s / 9 frames)
// ═══════════════════════════════════════════════════════════════════════════
const GlitchTransition: React.FC = () => {
  const frame = useCurrentFrame();

  // RGB split + shake
  const shake = Math.sin(frame * 40) * 8;
  const rgbOffset = (frame % 3) * 6;
  const flash = frame < 3 ? 0.8 : frame < 6 ? 0.4 : 0.1;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: CY.bg1,
          transform: `translateX(${shake}px)`,
        }}
      />
      {/* RGB split bars */}
      <div
        style={{
          position: "absolute",
          top: `${20 + rgbOffset}%`,
          left: 0,
          right: 0,
          height: 4,
          background: CY.cyan,
          opacity: 0.8,
          transform: `translateX(${-rgbOffset * 3}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${50 - rgbOffset}%`,
          left: 0,
          right: 0,
          height: 4,
          background: CY.pink,
          opacity: 0.8,
          transform: `translateX(${rgbOffset * 4}px)`,
        }}
      />
      {/* Flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: CY.white,
          opacity: flash,
        }}
      />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TIER CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const TierCardCyber: React.FC<{
  icon: string;
  name: string;
  price: string;
  features: string[];
  accentColor: string;
  enterDelay: number;
}> = ({ icon, name, price, features, accentColor, enterDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ fps, frame: frame - enterDelay, config: SPRING_CFG });
  const y = interpolate(s, [0, 1], [200, 0]);
  const scale = interpolate(s, [0, 1], [0.85, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  // Border glow pulse after entrance
  const settled = Math.max(0, frame - enterDelay - 15);
  const glowPulse = Math.sin(settled * 0.06) * 0.35 + 0.65;

  return (
    <div
      style={{
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        width: "100%",
        maxWidth: "85%",
        margin: "0 auto",
        padding: "24px 28px 20px",
        border: `2px solid ${CY.purple}`,
        background: `linear-gradient(135deg, ${CY.bg1}ee, ${CY.bg2}ee)`,
        boxShadow: `
          0 0 ${20 * glowPulse}px ${accentColor}25,
          inset 0 0 ${15 * glowPulse}px ${CY.cyan}08
        `,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: glowPulse,
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 44 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 32,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 2,
            }}
          >
            {name}
          </div>
        </div>
        <div
          style={{
            fontFamily: orbitron,
            fontSize: 42,
            fontWeight: 900,
            color: CY.white,
            textShadow: `0 0 12px ${accentColor}50`,
          }}
        >
          {price}
        </div>
      </div>

      {/* Feature bullets — reveal one by one */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((feat, i) => {
          const bulletDelay = enterDelay + 18 + i * 10;
          const bSpring = spring({
            fps,
            frame: frame - bulletDelay,
            config: SPRING_SOFT,
          });
          const bOp = interpolate(bSpring, [0, 1], [0, 1]);
          const bX = interpolate(bSpring, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: bOp,
                transform: `translateX(${bX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}80`,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: inter,
                  fontSize: 32,
                  fontWeight: 500,
                  color: CY.dimText,
                  lineHeight: 1.3,
                }}
              >
                {feat}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 2: TIER EXPLANATION (~27s / 810 frames)
// ═══════════════════════════════════════════════════════════════════════════
const SceneTiers: React.FC = () => {
  // Card stagger delays (in frames within this sequence)
  const basicDelay = 15;
  const premiumDelay = 240 + 15; // after ~8s
  const exclusiveDelay = 480 + 15; // after ~16s

  return (
    <AbsoluteFill>
      <CyberpunkBG />

      {/* Section label — 12% from top */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 0,
          right: 0,
          zIndex: 10,
          textAlign: "center",
        }}
      >
        <FadeInText delay={5}>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 36,
              fontWeight: 700,
              color: CY.purple,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            LICENSE TIERS
          </div>
        </FadeInText>
      </div>

      {/* Cards container — within 10–85% vertical safe zone */}
      <div
        style={{
          position: "absolute",
          top: "17%",
          left: "8%",
          right: "8%",
          bottom: "18%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          zIndex: 10,
        }}
      >
        <TierCardCyber
          icon="🎵"
          name="BASIC"
          price="$30"
          accentColor={CY.cyan}
          enterDelay={basicDelay}
          features={["MP3 only", "5K streams cap", "Credit required"]}
        />
        <TierCardCyber
          icon="🎚️"
          name="PREMIUM"
          price="$75"
          accentColor={CY.purple}
          enterDelay={premiumDelay}
          features={["WAV + stems", "50K streams", "Music video rights"]}
        />
        <TierCardCyber
          icon="👑"
          name="EXCLUSIVE"
          price="$1000+"
          accentColor={CY.pink}
          enterDelay={exclusiveDelay}
          features={[
            "Full ownership + trackouts",
            "Beat removed forever",
            "Unlimited streams",
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Simple fade-in wrapper for label text ──────────────────────────────
const FadeInText: React.FC<{ delay: number; children: React.ReactNode }> = ({
  delay,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: SPRING_SOFT });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [20, 0]);
  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 3: REINFORCEMENT (10s / 300 frames)
// ═══════════════════════════════════════════════════════════════════════════
const SceneReinforcement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text 1: "Most producers leave money on the table..."
  const text1 = useSlideUp(10);

  // Text 2: bold overlay
  const text2 = useSlam(100);
  const glitch = useGlitch(100, 8);

  // Arrow trail
  const arrowProgress = spring({
    fps,
    frame: frame - 150,
    config: { stiffness: 100, damping: 25, mass: 1 },
  });
  const arrowY = interpolate(arrowProgress, [0, 1], [600, 0]);
  const arrowOpacity = interpolate(arrowProgress, [0, 1], [0, 1]);

  // Stat flash
  const stat = useSlam(200);

  return (
    <AbsoluteFill>
      <CyberpunkBG />

      <AbsoluteFill
        style={{
          ...SAFE_ZONE,
          zIndex: 10,
          gap: 32,
        }}
      >
        {/* "Most producers leave money on the table..." */}
        <div
          style={{
            opacity: text1.opacity,
            transform: `translateY(${text1.y}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: inter,
              fontSize: 48,
              fontWeight: 600,
              color: CY.dimText,
              lineHeight: 1.35,
            }}
          >
            Most producers leave money on the table...
          </div>
        </div>

        {/* Bold overlay */}
        <div
          style={{
            opacity: text2.opacity,
            transform: `scale(${text2.scale}) rotate(${text2.rotate}deg) translate(${glitch.x}px, ${glitch.y}px)`,
            textAlign: "center",
            maxWidth: "85%",
          }}
        >
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 52,
              fontWeight: 900,
              color: CY.white,
              lineHeight: 1.2,
              textShadow: `0 0 20px ${CY.cyan}50`,
            }}
          >
            Your beat blows up?
          </div>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 52,
              fontWeight: 900,
              color: CY.pink,
              lineHeight: 1.2,
              textShadow: `0 0 20px ${CY.pink}60`,
              marginTop: 8,
            }}
          >
            You deserve to benefit too.
          </div>
        </div>

        {/* Neon arrow trail */}
        <div
          style={{
            opacity: arrowOpacity,
            transform: `translateY(${arrowY}px)`,
          }}
        >
          <svg width="60" height="200" viewBox="0 0 60 200">
            <defs>
              <linearGradient id="arrowGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={CY.cyan} />
                <stop offset="50%" stopColor={CY.purple} />
                <stop offset="100%" stopColor={CY.pink} />
              </linearGradient>
            </defs>
            <line
              x1="30"
              y1="200"
              x2="30"
              y2="30"
              stroke="url(#arrowGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="15,40 30,5 45,40" fill={CY.pink} />
          </svg>
        </div>

        {/* Stat flash */}
        <div
          style={{
            opacity: stat.opacity,
            transform: `scale(${stat.scale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: inter,
              fontSize: 40,
              fontWeight: 700,
              color: CY.cyan,
              textShadow: `0 0 15px ${CY.cyan}50`,
            }}
          >
            Auto PDF contracts. Tiered rights. No lawyer needed.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 4: CTA (10s / 300 frames)
// ═══════════════════════════════════════════════════════════════════════════
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Center slam entrance
  const slam = useSlam(15);
  const glitch = useGlitch(15, 10);

  // Flash on entrance
  const flash = interpolate(frame, [15, 18, 25], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scale pulse for CTA button
  const pulse = Math.sin(frame * 0.08) * 0.03 + 1;

  // Logo fade-up
  const logoSpring = spring({
    fps,
    frame: frame - 80,
    config: SPRING_SOFT,
  });
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoY = interpolate(logoSpring, [0, 1], [30, 0]);

  // End glow fade (loop-friendly)
  const endFade = interpolate(frame, [240, 300], [1, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <CyberpunkBG />

      {/* Hot pink flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: CY.pink,
          opacity: flash,
          zIndex: 5,
        }}
      />

      <AbsoluteFill
        style={{
          ...SAFE_ZONE,
          zIndex: 10,
          opacity: endFade,
        }}
      >
        {/* Main CTA text */}
        <div
          style={{
            opacity: slam.opacity,
            transform: `scale(${slam.scale * pulse}) rotate(${slam.rotate}deg) translate(${glitch.x}px, ${glitch.y}px)`,
            textAlign: "center",
            marginBottom: 50,
            maxWidth: "85%",
          }}
        >
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 1.15,
              color: CY.white,
              textShadow: `0 0 30px ${CY.pink}60, 0 0 60px ${CY.pink}30`,
            }}
          >
            Professional tiered licensing
          </div>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 58,
              fontWeight: 700,
              color: CY.pink,
              marginTop: 16,
              textShadow: `0 0 25px ${CY.pink}80`,
            }}
          >
            in minutes.
          </div>
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: slam.opacity,
            transform: `scale(${slam.scale * pulse})`,
          }}
        >
          <div
            style={{
              padding: "24px 56px",
              background: `linear-gradient(135deg, ${CY.pink}, ${CY.purple})`,
              color: CY.white,
              fontFamily: orbitron,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 2,
              textAlign: "center",
              boxShadow: `0 0 ${40 * pulse}px ${CY.pink}50, 0 4px 30px rgba(0,0,0,0.4)`,
              border: `2px solid ${CY.pink}80`,
            }}
          >
            Link in bio →
          </div>
        </div>

        {/* PPR Academy logo — within safe zone (18% from bottom) */}
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            right: "10%",
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              background: `linear-gradient(135deg, ${CY.cyan}, ${CY.purple}, ${CY.pink})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `0 0 20px ${CY.cyan}40`,
            }}
          >
            <div style={{ fontSize: 24, color: CY.white }}>▶</div>
          </div>
          <div
            style={{
              fontFamily: orbitron,
              fontSize: 22,
              fontWeight: 700,
              color: CY.text,
              letterSpacing: 3,
            }}
          >
            PPR ACADEMY
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════
export const BeatLeaseWarningAdaptive: React.FC<BeatLeaseWarningProps> = () => {
  // Convert timing to frames
  const fps = 30;
  const hookFrames = Math.ceil(TIMING.hook * fps);
  const glitchFrames = Math.ceil(TIMING.glitch * fps);
  const tierFrames = Math.ceil(
    (TIMING.tierBasic + TIMING.tierPremium + TIMING.tierExclusive + TIMING.tierHold) * fps
  );
  const reinforceFrames = Math.ceil(TIMING.reinforcement * fps);
  const ctaFrames = Math.ceil(TIMING.cta * fps);

  let offset = 0;

  const hookStart = offset;
  offset += hookFrames;

  const glitchStart = offset;
  offset += glitchFrames;

  const tierStart = offset;
  offset += tierFrames;

  const reinforceStart = offset;
  offset += reinforceFrames;

  const ctaStart = offset;

  return (
    <AbsoluteFill style={{ background: CY.bg1 }}>
      <Sequence from={hookStart} durationInFrames={hookFrames} name="Hook">
        <SceneHook />
      </Sequence>

      <Sequence from={glitchStart} durationInFrames={glitchFrames} name="Glitch">
        <GlitchTransition />
      </Sequence>

      <Sequence from={tierStart} durationInFrames={tierFrames} name="Tiers">
        <SceneTiers />
      </Sequence>

      <Sequence from={reinforceStart} durationInFrames={reinforceFrames} name="Reinforcement">
        <SceneReinforcement />
      </Sequence>

      <Sequence from={ctaStart} durationInFrames={ctaFrames} name="CTA">
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
