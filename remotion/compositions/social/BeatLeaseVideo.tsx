import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise3D } from "@remotion/noise";
import { evolvePath, getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { C, F } from "../../theme";
import { CTAButton, GradientText, SectionLabel } from "../../components";
import { getBeatLeaseTimeline, getBeatLeaseVoiceoverFiles } from "./beatLeaseVoiceover";

type BeatLeaseVideoProps = {
  enableVoiceover?: boolean;
};

const PauseIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const PlayIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M6 4l14 8-14 8z" />
  </svg>
);

const RepeatIcon = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const NoiseOverlay: React.FC<{ seed: string; color: string; opacity?: number }> = ({
  seed,
  color,
  opacity = 0.22,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rows = 14;
  const cols = 9;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "screen" }}
    >
      {new Array(cols).fill(true).map((_, col) =>
        new Array(rows).fill(true).map((__, row) => {
          const x = (col / (cols - 1)) * width;
          const y = (row / (rows - 1)) * height;
          const offsetX = noise3D(`${seed}-x`, col / cols, row / rows, frame * 0.015) * 28;
          const offsetY = noise3D(`${seed}-y`, col / cols, row / rows, frame * 0.015) * 28;
          const alpha = interpolate(
            noise3D(`${seed}-a`, col / cols, row / rows, frame * 0.02),
            [-1, 1],
            [0.08, 0.9],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <circle
              key={`${seed}-${col}-${row}`}
              cx={x + offsetX}
              cy={y + offsetY}
              r={2.3}
              fill={color}
              opacity={alpha}
            />
          );
        }),
      )}
    </svg>
  );
};

const SceneShell: React.FC<{
  tint: string;
  seed: string;
  children: React.ReactNode;
}> = ({ tint, seed, children }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        overflow: "hidden",
        fontFamily: F,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 20%, ${tint}22 0%, transparent 45%), linear-gradient(180deg, ${C.bg} 0%, #050816 100%)`,
        }}
      />
      <NoiseOverlay seed={seed} color={tint} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.42) 55%, rgba(15,23,42,0.88) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "120px 88px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const GlassCard: React.FC<{
  children: React.ReactNode;
  border: string;
  width?: number | string;
  style?: React.CSSProperties;
}> = ({ children, border, width, style }) => (
  <div
    style={{
      width,
      background: "linear-gradient(180deg, rgba(30,41,59,0.96), rgba(15,23,42,0.92))",
      border: `1px solid ${border}`,
      borderRadius: 28,
      boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
      backdropFilter: "blur(18px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  
  const titleSpring = spring({ fps, frame: frame - s(0.2), config: { damping: 14, stiffness: 220 } });
  const subSpring = spring({ fps, frame: frame - s(3.5), config: { damping: 16, stiffness: 190 } });
  const cardSpring = spring({ fps, frame: frame - s(6.5), config: { damping: 18, stiffness: 190 } });

  return (
    <SceneShell tint={C.orange} seed="bl-hook">
      <div
        style={{
          transform: `scale(${interpolate(titleSpring, [0, 1], [1.18, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}) translateY(${interpolate(titleSpring, [0, 1], [50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          opacity: interpolate(titleSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 900, color: C.white, lineHeight: 1.1 }}>
          Sold a beat for $50.
        </div>
      </div>
      
      <div
        style={{
          marginTop: 20,
          transform: `translateY(${interpolate(subSpring, [0, 1], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          opacity: interpolate(subSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 700, color: C.gray }}>
          It landed on a track with 10M streams.
        </div>
      </div>

      <div
        style={{
          marginTop: 60,
          transform: `scale(${interpolate(cardSpring, [0, 1], [0.75, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          opacity: interpolate(cardSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <GlassCard border={`${C.red}55`} style={{ padding: "22px 30px" }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: C.red, textAlign: "center" }}>
            I got nothing.
          </div>
        </GlassCard>
      </div>
    </SceneShell>
  );
};

const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  
  const row1 = spring({ fps, frame: frame - s(1.0), config: { damping: 18, stiffness: 190 } });
  const row2 = spring({ fps, frame: frame - s(6.0), config: { damping: 18, stiffness: 190 } });
  const row3 = spring({ fps, frame: frame - s(12.0), config: { damping: 18, stiffness: 190 } });
  
  const countProgress = interpolate(frame, [s(25.0), s(32.0)], [0, 4750], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const countOpacity = interpolate(frame, [s(25.0), s(25.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  
  const captionSpring = spring({ fps, frame: frame - s(32.0), config: { damping: 16, stiffness: 200 } });

  return (
    <SceneShell tint={C.red} seed="bl-problem">
      <SectionLabel color={C.red}>THE OLD WAY</SectionLabel>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40, width: "100%", maxWidth: 800 }}>
        <GlassCard
          border={`${C.gray}33`}
          style={{
            padding: "24px 32px",
            transform: `scale(${interpolate(row1, [0, 1], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
            opacity: interpolate(row1, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: C.white, textAlign: "center" }}>
            Sell beat on a handshake deal
          </div>
        </GlassCard>
        
        <GlassCard
          border={`${C.gray}33`}
          style={{
            padding: "24px 32px",
            transform: `scale(${interpolate(row2, [0, 1], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
            opacity: interpolate(row2, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: C.white, textAlign: "center" }}>
            No streaming caps. No stems pricing.
          </div>
        </GlassCard>
        
        <GlassCard
          border={`${C.red}55`}
          style={{
            padding: "24px 32px",
            transform: `scale(${interpolate(row3, [0, 1], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
            opacity: interpolate(row3, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 800, color: C.red, textAlign: "center" }}>
            Artist blows up. You see nothing.
          </div>
        </GlassCard>
      </div>

      <div style={{ marginTop: 60, textAlign: "center", opacity: countOpacity }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: C.red }}>
          ${Math.floor(countProgress).toLocaleString()}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.gray, marginTop: 10 }}>
          left on the table per beat sold
        </div>
      </div>

      <div
        style={{
          marginTop: 50,
          transform: `translateY(${interpolate(captionSpring, [0, 1], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          opacity: interpolate(captionSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 800, color: C.white, textAlign: "center" }}>
          Most beatmakers leave 90% on the table.
        </div>
      </div>
    </SceneShell>
  );
};

const Scene3_Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  
  const titleSpring = spring({ fps, frame: frame - s(0.5), config: { damping: 16, stiffness: 200 } });
  const card1 = spring({ fps, frame: frame - s(8.0), config: { damping: 18, stiffness: 190 } });
  const card2 = spring({ fps, frame: frame - s(12.0), config: { damping: 18, stiffness: 190 } });
  const card3 = spring({ fps, frame: frame - s(17.0), config: { damping: 18, stiffness: 190 } });
  const card4 = spring({ fps, frame: frame - s(21.0), config: { damping: 18, stiffness: 190 } });
  const footerOpacity = interpolate(frame, [s(26.0), s(26.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tiers = [
    { name: "BASIC", price: "$25–50", perk: "MP3 · 5K streams", color: C.gray, spring: card1 },
    { name: "PREMIUM", price: "$50–100", perk: "WAV · 50K streams · Video rights", color: C.cyan, spring: card2 },
    { name: "UNLIMITED", price: "$200–500", perk: "WAV + Stems · No caps", color: C.primary, spring: card3 },
    { name: "EXCLUSIVE", price: "$1,000+", perk: "Full rights · Beat removed", color: C.gold, spring: card4, gold: true },
  ];

  return (
    <SceneShell tint={C.primary} seed="bl-solution">
      <SectionLabel color={C.primary}>4-TIER LICENSING</SectionLabel>
      
      <div
        style={{
          marginTop: 20,
          transform: `scale(${interpolate(titleSpring, [0, 1], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}) translateY(${interpolate(titleSpring, [0, 1], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          opacity: interpolate(titleSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 62, fontWeight: 900, color: C.white }}>
          Set once. <GradientText from={C.primary} to={C.cyan}>Scales forever.</GradientText>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40, width: "100%", maxWidth: 860 }}>
        {tiers.map((tier, i) => (
          <GlassCard
            key={i}
            border={`${tier.color}55`}
            style={{
              padding: "20px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: 108,
              transform: `translateY(${interpolate(tier.spring, [0, 1], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
              opacity: interpolate(tier.spring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              ...(tier.gold ? { boxShadow: `0 0 40px ${C.gold}20` } : {}),
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: tier.color, letterSpacing: 1 }}>
                {tier.name}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.white }}>
                {tier.price}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: tier.gold ? C.gold : C.gray, textAlign: "right" }}>
              {tier.perk}
            </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ marginTop: 50, opacity: footerOpacity }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: C.gray, textAlign: "center" }}>
          Contracts auto-generated. Files delivered instantly.
        </div>
      </div>
    </SceneShell>
  );
};

const Scene4_Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  
  const titleSpring = spring({ fps, frame: frame - s(0.5), config: { damping: 16, stiffness: 200 } });
  const stat1 = spring({ fps, frame: frame - s(7.0), config: { damping: 18, stiffness: 200 } });
  const stat2 = spring({ fps, frame: frame - s(10.0), config: { damping: 18, stiffness: 200 } });
  const stat3 = spring({ fps, frame: frame - s(14.0), config: { damping: 18, stiffness: 200 } });
  const stat4 = spring({ fps, frame: frame - s(18.0), config: { damping: 18, stiffness: 200 } });
  
  const pathProgress = interpolate(frame, [s(21.0), s(23.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const saleSpring = spring({ fps, frame: frame - s(23.0), config: { damping: 16, stiffness: 210 } });

  const stats = [
    { val: "$50", label: "Basic buyer paid", color: C.gray, spring: stat1 },
    { val: "$75", label: "Premium buyer paid", color: C.cyan, spring: stat2 },
    { val: "$350", label: "Unlimited buyer paid", color: C.primary, spring: stat3 },
    { val: "$1,500", label: "Exclusive buyer paid", color: C.gold, spring: stat4 },
  ];

  // SVG connector path drawing from the grid down to the result card
  const connectorPath = "M 430 240 C 430 280 430 300 430 350";
  const { strokeDasharray, strokeDashoffset } = evolvePath(pathProgress, connectorPath);
  const connectorLength = getLength(connectorPath);
  const point = getPointAtLength(connectorPath, pathProgress * connectorLength);
  const tangent = getTangentAtLength(connectorPath, pathProgress * connectorLength);
  const angle = Math.atan2(tangent.y, tangent.x);

  return (
    <SceneShell tint={C.purple} seed="bl-proof">
      <SectionLabel color={C.purple}>REAL NUMBERS</SectionLabel>
      
      <div
        style={{
          marginTop: 20,
          transform: `scale(${interpolate(titleSpring, [0, 1], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}) translateY(${interpolate(titleSpring, [0, 1], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          opacity: interpolate(titleSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 900, color: C.white }}>
          One beat. <GradientText from={C.purple} to={C.pink}>Four chances to win.</GradientText>
        </div>
      </div>

      <div style={{ position: "relative", width: 860, height: 600, marginTop: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, position: "relative", zIndex: 1 }}>
          {stats.map((stat, i) => (
            <GlassCard
              key={i}
              border={`${stat.color}55`}
              style={{
                padding: "28px 24px",
                textAlign: "center",
                transform: `scale(${interpolate(stat.spring, [0, 1], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
                opacity: interpolate(stat.spring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              <div style={{ fontSize: 64, fontWeight: 900, color: stat.color }}>{stat.val}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.white, marginTop: 8 }}>{stat.label}</div>
            </GlassCard>
          ))}
        </div>

        <svg
          width={860}
          height={600}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        >
          {pathProgress > 0 && (
            <>
              <path
                d={connectorPath}
                fill="none"
                stroke={`${C.cyan}40`}
                strokeWidth={6}
                strokeDasharray="10 12"
              />
              <path
                d={connectorPath}
                fill="none"
                stroke={C.cyan}
                strokeWidth={6}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ filter: `drop-shadow(0 0 14px ${C.cyan})` }}
              />
              <g
                style={{
                  transform: `translate(${point.x}px, ${point.y}px) rotate(${angle}rad)`,
                  transformOrigin: "0 0",
                }}
              >
                <polygon points="0,0 -20,-12 -20,12" fill={C.cyan} />
              </g>
            </>
          )}
        </svg>

        <GlassCard
          border={`${C.green}70`}
          width="100%"
          style={{
            position: "absolute",
            left: 0,
            bottom: 60,
            padding: "30px 40px",
            zIndex: 2,
            textAlign: "center",
            boxShadow: `0 35px 80px ${C.green}30`,
            transform: `scale(${interpolate(saleSpring, [0, 1], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}) translateY(${interpolate(saleSpring, [0, 1], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            opacity: interpolate(saleSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900, color: C.white }}>
            Total potential: <span style={{ color: C.green }}>$1,975</span> per beat
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.gray, marginTop: 12 }}>
            vs. $50 with no licensing. That's 39x.
          </div>
        </GlassCard>
      </div>
    </SceneShell>
  );
};

const Scene5_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  
  const pauseSpring = spring({ fps, frame: frame - s(0.5), config: { damping: 13, stiffness: 210 } });
  const playSpring = spring({ fps, frame: frame - s(1.0), config: { damping: 13, stiffness: 210 } });
  const repeatSpring = spring({ fps, frame: frame - s(1.5), config: { damping: 13, stiffness: 210 } });
  const textSpring = spring({ fps, frame: frame - s(6.0), config: { damping: 16, stiffness: 200 } });

  return (
    <SceneShell tint={C.orange} seed="bl-cta">
      <div style={{ display: "flex", gap: 26, marginBottom: 48 }}>
        <div style={{ transform: `scale(${interpolate(pauseSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` }}>
          <PauseIcon color={C.pink} size={102} />
        </div>
        <div style={{ transform: `scale(${interpolate(playSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` }}>
          <PlayIcon color={C.cyan} size={102} />
        </div>
        <div style={{ transform: `scale(${interpolate(repeatSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` }}>
          <RepeatIcon color={C.white} size={102} />
        </div>
      </div>

      <div
        style={{
          transform: `scale(${interpolate(textSpring, [0, 1], [0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
          opacity: interpolate(textSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 70, color: C.white, fontWeight: 900, lineHeight: 1.02 }}>
          Comment <GradientText from={C.orange} to={C.red}>BEATS</GradientText>
        </div>
        <div style={{ fontSize: 28, color: C.gray, marginTop: 18, marginBottom: 38 }}>
          I'll DM you the link to check it out.
        </div>
        <CTAButton delay={360} gradientFrom={C.orange} gradientTo={C.red} glowColor={C.orange}>
          pauseplayrepeat.com
        </CTAButton>
      </div>
    </SceneShell>
  );
};

export const BeatLeaseVideo: React.FC<BeatLeaseVideoProps> = ({
  enableVoiceover = false,
}) => {
  const { fps } = useVideoConfig();
  const timeline = getBeatLeaseTimeline(fps);
  const hookDuration = timeline.hook;
  const problemDuration = timeline.problem;
  const solutionDuration = timeline.solution;
  const proofDuration = timeline.proof;
  const ctaDuration = timeline.cta;
  const transitionDuration = timeline.transition;
  const voiceoverFiles = getBeatLeaseVoiceoverFiles();

  const hookStart = 0;
  const problemStart = hookDuration - transitionDuration;
  const solutionStart = problemStart + problemDuration - transitionDuration;
  const proofStart = solutionStart + solutionDuration - transitionDuration;
  const ctaStart = proofStart + proofDuration - transitionDuration;

  const sceneVoiceovers = [
    { from: hookStart, src: voiceoverFiles[0] },
    { from: problemStart, src: voiceoverFiles[1] },
    { from: solutionStart, src: voiceoverFiles[2] },
    { from: proofStart, src: voiceoverFiles[3] },
    { from: ctaStart, src: voiceoverFiles[4] },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {enableVoiceover
        ? sceneVoiceovers.map((voiceover) => (
            <Sequence key={voiceover.src} from={voiceover.from} layout="none">
              <Audio src={staticFile(voiceover.src)} volume={0.95} />
            </Sequence>
          ))
        : null}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={hookDuration} premountFor={1 * fps}>
          <Scene1_Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        
        <TransitionSeries.Sequence durationInFrames={problemDuration} premountFor={1 * fps}>
          <Scene2_Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        
        <TransitionSeries.Sequence durationInFrames={solutionDuration} premountFor={1 * fps}>
          <Scene3_Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        
        <TransitionSeries.Sequence durationInFrames={proofDuration} premountFor={1 * fps}>
          <Scene4_Proof />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        
        <TransitionSeries.Sequence durationInFrames={ctaDuration} premountFor={1 * fps}>
          <Scene5_CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
