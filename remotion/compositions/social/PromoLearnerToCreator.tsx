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
// PROMO: LEARNER TO CREATOR
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Stop Just Learning ─────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={230}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Stop just
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: F, color: C.purple, lineHeight: 1, textAlign: "center" }}>
          LEARNING.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Watching Tutorials ─────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={231}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE TRAP</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          Watching tutorials
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>isn't doing.</span>
        </div>
      </FadeUp>

      <div style={{ fontSize: 80 }}>📺💤</div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Become a Creator ─────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={232}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Become a <GradientText from={C.gold} to={C.orange}>Creator.</GradientText>
        </div>
      </FadeUp>

      <div style={{ transform: `scale(${interpolate(reveal, [0, 1], [0.8, 1])})`, opacity: interpolate(reveal, [0, 1], [0, 1]) }}>
        <div style={{ fontSize: 80 }}>🚀✨</div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Build Legacy ────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={233}>
      <FadeUp delay={5}>
        <SectionLabel color={C.orange}>THE GOAL</SectionLabel>
      </FadeUp>

      <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.orange, marginTop: 20 }}>
        Build Your
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Legacy.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Start Today ───────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.purple} seed={234}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Start
          <br />
          <GradientText from={C.purple} to={C.gold}>Today.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.purple} gradientTo={C.gold} glowColor={C.purple}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const PromoLearnerToCreator: React.FC = () => {
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
