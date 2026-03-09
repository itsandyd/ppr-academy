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
// GAMIFICATION: "Addictive Learning"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Addictive Learning ─────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={80}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Make learning
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.purple, lineHeight: 1, textAlign: "center" }}>
          ADDICTIVE.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Low Completion ─────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={81}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE PROBLEM</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          Most courses have
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>3% completion rates.</span>
        </div>
      </FadeUp>

      <div style={{ width: 300, height: 20, background: C.darkGray, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: "3%", height: "100%", background: C.red }} />
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Gamification ─────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const xp = Math.min(100, Math.floor(interpolate(frame, [20, 100], [0, 100])));
  const level = Math.floor(xp / 20) + 1;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={82}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Use <GradientText from={C.gold} to={C.orange}>Gamification.</GradientText>
        </div>
      </FadeUp>

      <div style={{ width: 400, padding: 20, background: C.darkGray, borderRadius: 20, border: `1px solid ${C.gold}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: F }}>Level {level}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: F }}>{xp} XP</div>
        </div>
        <div style={{ width: "100%", height: 20, background: `${C.gold}20`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ width: `${xp}%`, height: "100%", background: C.gold, transition: "width 0.1s linear" }} />
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Engagement ──────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const engagement = Math.min(10, Math.floor(interpolate(frame, [20, 80], [1, 10])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={83}>
      <FadeUp delay={5}>
        <SectionLabel color={C.purple}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.purple }}>{engagement}x</div>
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Engagement.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Gamify Now ────────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.gold} seed={84}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Gamify your
          <br />
          <GradientText from={C.gold} to={C.orange}>Course.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.gold} gradientTo={C.orange} glowColor={C.gold}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const ExcalidrawGamificationVideo: React.FC = () => {
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
