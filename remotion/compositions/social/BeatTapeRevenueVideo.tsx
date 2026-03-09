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
import {
  CenterScene,
  FadeUp,
  GradientText,
  SectionLabel,
  CTAButton,
  LogoIcon,
  useExit,
} from "../../components";

// ═══════════════════════════════════════════════════════════════════════
// BEAT TAPE REVENUE: "Stop Selling for $30"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Stop Selling Cheap ─────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={20}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Stop selling beats for
        </div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.red, lineHeight: 1 }}>
            $30
          </div>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: -20,
              right: -20,
              height: 8,
              background: C.white,
              transform: "rotate(-10deg) translateY(-50%)",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-12s) — Leases are Dead ────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  
  // Flatline graph animation
  const points = Array.from({ length: 20 }, (_, i) => {
    const x = i * 30;
    const y = 200 + Math.sin(i * 0.5 + frame * 0.1) * 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={21}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE HARD TRUTH</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 40 }}>
          Leases are <span style={{ color: C.gray }}>dead money.</span>
        </div>
      </FadeUp>

      <svg width="600" height="300" style={{ overflow: "visible" }}>
        <path
          d={`M 0,200 L ${points}`}
          fill="none"
          stroke={C.red}
          strokeWidth="4"
          strokeDasharray="10 10"
        />
        <text x="300" y="250" fill={C.red} fontFamily={F} fontSize="24" textAnchor="middle">Revenue Flatline</text>
      </svg>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (12-22s) — The Ecosystem ────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const products = [
    { name: "Beat Lease", val: "$30", color: C.gray },
    { name: "Stems", val: "+$50", color: C.cyan },
    { name: "Project File", val: "+$100", color: C.purple },
    { name: "Exclusive", val: "+$500", color: C.gold },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={22}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Sell the <GradientText from={C.green} to={C.cyan}>Ecosystem.</GradientText>
        </div>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 500 }}>
        {products.map((p, i) => {
          const delay = 30 + i * 15;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 15 } });
          const x = interpolate(spr, [0, 1], [-50, 0]);
          const o = interpolate(spr, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                transform: `translateX(${x}px)`,
                opacity: o,
                background: `linear-gradient(90deg, ${C.darkGray}, transparent)`,
                borderLeft: `4px solid ${p.color}`,
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: F, color: C.white }}>{p.name}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: F, color: p.color }}>{p.val}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (22-30s) — The Math ────────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const count = Math.min(680, Math.floor(interpolate(frame, [20, 80], [30, 680])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={23}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gold}>THE MATH</SectionLabel>
      </FadeUp>

      <div style={{ fontSize: 140, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 20 }}>
        ${count}
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 24, color: C.gray, fontFamily: F, marginTop: 10 }}>
          Revenue per beat tape.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (30-35s) — Start Selling ─────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.primary} seed={24}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Start selling
          <br />
          <GradientText from={C.primary} to={C.cyan}>Smarter.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.primary} gradientTo={C.cyan} glowColor={C.primary}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const BeatTapeRevenueVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={120}>
        <Scene1_Hook />
      </Sequence>
      <Sequence from={120} durationInFrames={240}>
        <Scene2_Problem />
      </Sequence>
      <Sequence from={360} durationInFrames={300}>
        <Scene3_Solution />
      </Sequence>
      <Sequence from={660} durationInFrames={240}>
        <Scene4_Proof />
      </Sequence>
      <Sequence from={900} durationInFrames={150}>
        <Scene5_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
