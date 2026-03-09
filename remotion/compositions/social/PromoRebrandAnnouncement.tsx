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
// PROMO: REBRAND ANNOUNCEMENT
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — We Are Evolving ────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={250}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          We are
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: F, color: C.cyan, lineHeight: 1, textAlign: "center" }}>
          EVOLVING.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Old Way Gone ───────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={251}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE SHIFT</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          The old way is
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>gone.</span>
        </div>
      </FadeUp>

      <div style={{ fontSize: 80 }}>👋📉</div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — PausePlayRepeat ──────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={252}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Meet <GradientText from={C.primary} to={C.cyan}>PausePlayRepeat.</GradientText>
        </div>
      </FadeUp>

      <div style={{ transform: `scale(${interpolate(reveal, [0, 1], [0.8, 1])})`, opacity: interpolate(reveal, [0, 1], [0, 1]) }}>
        <LogoIcon delay={20} size={150} />
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — The Future ──────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={253}>
      <FadeUp delay={5}>
        <SectionLabel color={C.cyan}>THE VISION</SectionLabel>
      </FadeUp>

      <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.cyan, marginTop: 20 }}>
        The Future
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          of Music Business.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — See New Look ──────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.primary} seed={254}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          See the
          <br />
          <GradientText from={C.primary} to={C.cyan}>New Look.</GradientText>
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
export const PromoRebrandAnnouncement: React.FC = () => {
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
