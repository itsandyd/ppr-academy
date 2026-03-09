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
  WaveformVisual,
} from "../../components";

// ═══════════════════════════════════════════════════════════════════════
// SATURATION COURSE: "Fix Thin Mixes"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Thin Mixes ─────────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={90}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Your mix sounds
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: F, color: C.cyan, lineHeight: 1, textAlign: "center", letterSpacing: 10 }}>
          THIN.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Digital Clipping ───────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={91}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE CULPRIT</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          Digital clipping
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>ruins your tracks.</span>
        </div>
      </FadeUp>

      <div style={{ width: 400, height: 100, background: C.darkGray, borderRadius: 10, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: `repeating-linear-gradient(90deg, ${C.red} 0, ${C.red} 2px, transparent 2px, transparent 10px)`, opacity: 0.5 }} />
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Saturation ───────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={92}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Master <GradientText from={C.orange} to={C.red}>Saturation.</GradientText>
        </div>
      </FadeUp>

      <div style={{ transform: `scale(${interpolate(reveal, [0, 1], [0.8, 1])})`, opacity: interpolate(reveal, [0, 1], [0, 1]) }}>
        <div style={{ width: 300, height: 300, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, borderRadius: 20, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 0 50px ${C.orange}50` }}>
          <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.white }}>WARMTH</div>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Before/After ────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isAfter = frame > 60;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={93}>
      <FadeUp delay={5}>
        <SectionLabel color={C.cyan}>THE DIFFERENCE</SectionLabel>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: isAfter ? C.orange : C.gray, textAlign: "center", marginBottom: 20 }}>
          {isAfter ? "AFTER (THICK)" : "BEFORE (THIN)"}
        </div>
        <WaveformVisual delay={0} />
      </div>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Enroll Now ────────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.orange} seed={94}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Fix your
          <br />
          <GradientText from={C.orange} to={C.red}>Mixes.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.orange} gradientTo={C.red} glowColor={C.orange}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const SaturationCourseVideo: React.FC = () => {
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
