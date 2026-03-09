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
// FOLLOW GATES: "Stop Giving It Away"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Stop Free Downloads ────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={50}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Stop giving music away for
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: F, color: C.red, lineHeight: 1, textAlign: "center" }}>
          FREE.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Empty Stats ────────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={51}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE PROBLEM</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          SoundCloud downloads
          <br />
          <span style={{ color: C.gray }}>give you nothing.</span>
        </div>
      </FadeUp>

      <div style={{ display: "flex", gap: 20, opacity: 0.5 }}>
        <div style={{ fontSize: 60 }}>☁️</div>
        <div style={{ fontSize: 60 }}>📉</div>
        <div style={{ fontSize: 60 }}>🗑️</div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — The Exchange ─────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exchange = spring({ fps, frame: frame - 20, config: { damping: 20 } });
  const xLeft = interpolate(exchange, [0, 1], [-100, 0]);
  const xRight = interpolate(exchange, [0, 1], [100, 0]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.pink} seed={52}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Use <GradientText from={C.pink} to={C.purple}>Follow Gates.</GradientText>
        </div>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ transform: `translateX(${xLeft}px)`, opacity: interpolate(exchange, [0, 1], [0, 1]), textAlign: "center" }}>
          <div style={{ fontSize: 60 }}>🎵</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: F }}>Download</div>
        </div>

        <div style={{ fontSize: 40, color: C.gray, opacity: interpolate(exchange, [0, 1], [0, 1]) }}>⇄</div>

        <div style={{ transform: `translateX(${xRight}px)`, opacity: interpolate(exchange, [0, 1], [0, 1]), textAlign: "center" }}>
          <div style={{ fontSize: 60 }}>📧</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: F }}>Email + Follow</div>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Lead Generation ─────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leads = Math.min(1000, Math.floor(interpolate(frame, [20, 80], [0, 1000])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={53}>
      <FadeUp delay={5}>
        <SectionLabel color={C.purple}>THE MATH</SectionLabel>
      </FadeUp>

      <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.purple, marginTop: 20 }}>
        {leads}
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          New Leads.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Grow Fanbase ──────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.pink} seed={54}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Grow your
          <br />
          <GradientText from={C.pink} to={C.purple}>Fanbase.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.pink} gradientTo={C.purple} glowColor={C.pink}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const FollowGatesVideo: React.FC = () => {
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
