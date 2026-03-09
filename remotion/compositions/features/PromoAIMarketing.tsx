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
// PROMO: AI MARKETING
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Marketing is Hard ──────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={200}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Marketing is
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: F, color: C.red, lineHeight: 1, textAlign: "center" }}>
          HARD.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Writing Copy ───────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={201}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE STRUGGLE</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          You hate
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>writing copy.</span>
        </div>
      </FadeUp>

      <div style={{ fontSize: 80 }}>📝😫</div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — AI Marketing ─────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={202}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Use <GradientText from={C.cyan} to={C.purple}>AI Marketing.</GradientText>
        </div>
      </FadeUp>

      <div style={{ transform: `scale(${interpolate(reveal, [0, 1], [0.8, 1])})`, opacity: interpolate(reveal, [0, 1], [0, 1]) }}>
        <div style={{ fontSize: 80 }}>🤖✨</div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — One Click ───────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={203}>
      <FadeUp delay={5}>
        <SectionLabel color={C.purple}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.purple, marginTop: 20 }}>
        1-Click
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Campaigns.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Try It ────────────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.cyan} seed={204}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Try it
          <br />
          <GradientText from={C.cyan} to={C.purple}>Free.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.cyan} gradientTo={C.purple} glowColor={C.cyan}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const PromoAIMarketing: React.FC = () => {
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
