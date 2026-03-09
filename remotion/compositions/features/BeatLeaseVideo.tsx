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
// BEAT LEASE: "Own Your Platform"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Broken System ──────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const glitch = Math.sin(frame * 0.8) * (frame < 20 ? 10 : 0);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={40}>
      <div style={{ transform: `translateX(${glitch}px)` }}>
        <FadeUp delay={5}>
          <div style={{ fontSize: 50, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
            Selling beats is
            <br />
            <span style={{ color: C.red, textDecoration: "underline" }}>broken.</span>
          </div>
        </FadeUp>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Crowded Market ─────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  const platforms = [
    { name: "BeatStars", x: -100, y: -50, rot: -5 },
    { name: "YouTube", x: 100, y: 50, rot: 5 },
    { name: "Airbit", x: 0, y: 150, rot: 0 },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={41}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE REALITY</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          Crowded markets.
          <br />
          <span style={{ color: C.gray }}>Race to the bottom.</span>
        </div>
      </FadeUp>

      <div style={{ position: "relative", width: 400, height: 300 }}>
        {platforms.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 200 + p.x,
              top: 100 + p.y,
              transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
              padding: "12px 24px",
              background: C.darkGray,
              border: `1px solid ${C.gray}`,
              borderRadius: 8,
              color: C.gray,
              fontFamily: F,
              fontWeight: 700,
              fontSize: 24,
              opacity: 0.6,
            }}
          >
            {p.name}
          </div>
        ))}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Own Your Store ───────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { text: "Custom Domain", icon: "🌐", color: C.cyan },
    { text: "Zero Fees", icon: "💸", color: C.green },
    { text: "Full Control", icon: "🎛️", color: C.purple },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={42}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Build <GradientText from={C.primary} to={C.cyan}>Your Own Store.</GradientText>
        </div>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 500 }}>
        {features.map((f, i) => {
          const delay = 30 + i * 20;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 15 } });
          const x = interpolate(spr, [0, 1], [100, 0]);
          const o = interpolate(spr, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                transform: `translateX(${x}px)`,
                opacity: o,
                background: `linear-gradient(135deg, ${C.darkGray}, ${C.bg})`,
                border: `1px solid ${f.color}40`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ fontSize: 30 }}>{f.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: F, color: C.white }}>{f.text}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — 100% Revenue ────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const revenue = Math.min(100, Math.floor(interpolate(frame, [20, 80], [70, 100])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={43}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gold}>THE DIFFERENCE</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 140, fontWeight: 900, fontFamily: F, color: C.gold }}>{revenue}%</div>
      </div>
      
      <FadeUp delay={60}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Keep your revenue.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Build It ──────────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.primary} seed={44}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Build your
          <br />
          <GradientText from={C.primary} to={C.purple}>Empire.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.primary} gradientTo={C.purple} glowColor={C.primary}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const BeatLeaseVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={120}>
        <Scene1_Hook />
      </Sequence>
      <Sequence from={120} durationInFrames={180}>
        <Scene2_Problem />
      </Sequence>
      <Sequence from={300} durationInFrames={300}>
        <Scene3_Solution />
      </Sequence>
      <Sequence from={600} durationInFrames={240}>
        <Scene4_Proof />
      </Sequence>
      <Sequence from={840} durationInFrames={210}>
        <Scene5_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
