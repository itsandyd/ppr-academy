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
// EXCALIDRAW EMAIL: "Visual Storytelling"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Why Emails Fail ────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={70}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Why your emails
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: F, color: C.red, lineHeight: 1, textAlign: "center" }}>
          FAIL.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Wall of Text ───────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={71}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE MISTAKE</SectionLabel>
      </FadeUp>

      <div style={{ width: 300, height: 400, background: C.white, padding: 20, borderRadius: 10, opacity: 0.8, position: "relative" }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ height: 10, background: C.darkGray, marginBottom: 10, width: `${Math.random() * 50 + 50}%`, opacity: 0.3 }} />
        ))}
        
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 120, color: C.red, fontWeight: 900, transform: "rotate(-15deg)", textShadow: "0 0 20px rgba(0,0,0,0.5)" }}>
            BORING
          </div>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Visuals ──────────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const draw = spring({ fps, frame: frame - 20, config: { damping: 20 } });
  const pathLength = interpolate(draw, [0, 1], [0, 1000]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={72}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Use <GradientText from={C.cyan} to={C.primary}>Visuals.</GradientText>
        </div>
      </FadeUp>

      <svg width="400" height="300" style={{ overflow: "visible" }}>
        <rect x="50" y="50" width="300" height="200" fill="none" stroke={C.cyan} strokeWidth="4" rx="20" strokeDasharray="1000" strokeDashoffset={1000 - pathLength} />
        <circle cx="200" cy="150" r="50" fill="none" stroke={C.cyan} strokeWidth="4" strokeDasharray="1000" strokeDashoffset={1000 - pathLength} />
        <path d="M 150,200 L 250,200" stroke={C.cyan} strokeWidth="4" strokeDasharray="1000" strokeDashoffset={1000 - pathLength} />
      </svg>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Click Rate ──────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rate = Math.min(300, Math.floor(interpolate(frame, [20, 80], [100, 300])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={73}>
      <FadeUp delay={5}>
        <SectionLabel color={C.green}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.green }}>+{rate}%</div>
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Click Rate.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Learn More ────────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.cyan} seed={74}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Master
          <br />
          <GradientText from={C.cyan} to={C.primary}>Email.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.cyan} gradientTo={C.primary} glowColor={C.cyan}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const ExcalidrawEmailVideo: React.FC = () => {
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
