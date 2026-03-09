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
// SATURATION COURSE V2: "Loudness Secrets"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Loud Mixes ─────────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={95}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          The secret to
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.purple, lineHeight: 1, textAlign: "center", textShadow: `0 0 20px ${C.purple}` }}>
          LOUD MIXES?
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Limiters ───────────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={96}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE MYTH</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          Limiters
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>crush your dynamics.</span>
        </div>
      </FadeUp>

      <div style={{ width: 300, height: 100, background: C.darkGray, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 40 }}>🥞</div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Soft Clipping ────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={97}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Use <GradientText from={C.cyan} to={C.blue}>Soft Clipping.</GradientText>
        </div>
      </FadeUp>

      <svg width="400" height="200" style={{ overflow: "visible" }}>
        <path d="M 0,100 Q 100,0 200,100 T 400,100" fill="none" stroke={C.cyan} strokeWidth="4" />
        <path d="M 0,100 Q 100,20 200,100 T 400,100" fill="none" stroke={C.blue} strokeWidth="4" strokeDasharray="10 10" />
      </svg>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Loud & Clean ────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lufs = Math.max(-14, Math.floor(interpolate(frame, [20, 80], [-20, -7])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={98}>
      <FadeUp delay={5}>
        <SectionLabel color={C.green}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.green }}>{lufs}</div>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: F, color: C.white }}>LUFS</div>
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Zero Distortion.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Get the Course ────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.purple} seed={99}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Get the
          <br />
          <GradientText from={C.purple} to={C.cyan}>Course.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.purple} gradientTo={C.cyan} glowColor={C.purple}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const SaturationCourseV2: React.FC = () => {
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
