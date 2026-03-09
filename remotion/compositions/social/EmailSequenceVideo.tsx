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
// EMAIL SEQUENCE: "Automate Your Sales"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Dead List ──────────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const opacity = Math.sin(frame * 0.2) * 0.5 + 0.5;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={30}>
      <FadeUp delay={5}>
        <div style={{ fontSize: 50, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Your email list is
          <br />
          <span style={{ color: C.gray, opacity }}>dead.</span>
        </div>
      </FadeUp>
      
      <div style={{ fontSize: 80, marginTop: 20 }}>💀</div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Boring Newsletters ─────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={31}>
      <FadeUp delay={5}>
        <SectionLabel color={C.red}>THE MISTAKE</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", lineHeight: 1.3 }}>
          You send newsletters
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>nobody opens.</span>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40, display: "flex", gap: 10 }}>
        <div style={{ padding: "10px 20px", background: C.darkGray, borderRadius: 8, color: C.gray }}>Subject: Update...</div>
        <div style={{ padding: "10px 20px", background: C.darkGray, borderRadius: 8, color: C.gray }}>Subject: News...</div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Automated Flows ──────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flows = [
    { name: "Welcome Series", icon: "👋", color: C.green },
    { name: "Abandoned Cart", icon: "🛒", color: C.orange },
    { name: "Post-Purchase", icon: "🎁", color: C.purple },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={32}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Switch to <GradientText from={C.cyan} to={C.primary}>Flows.</GradientText>
        </div>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 500 }}>
        {flows.map((f, i) => {
          const delay = 30 + i * 20;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 15 } });
          const scale = interpolate(spr, [0, 1], [0.8, 1]);
          const o = interpolate(spr, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale})`,
                opacity: o,
                background: `linear-gradient(135deg, ${C.darkGray}, ${C.bg})`,
                border: `1px solid ${f.color}40`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                boxShadow: `0 0 20px ${f.color}10`,
              }}
            >
              <div style={{ fontSize: 30 }}>{f.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: F, color: C.white }}>{f.name}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — Results ─────────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const openRate = Math.min(52, Math.floor(interpolate(frame, [20, 80], [10, 52])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={33}>
      <FadeUp delay={5}>
        <SectionLabel color={C.green}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.green }}>{openRate}%</div>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: F, color: C.white }}>Open Rate</div>
      </div>
      
      <FadeUp delay={60}>
        <div style={{ fontSize: 24, color: C.gray, fontFamily: F, marginTop: 20 }}>
          Sales on Autopilot.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Automate Now ──────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.cyan} seed={34}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Automate your
          <br />
          <GradientText from={C.cyan} to={C.green}>Business.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.cyan} gradientTo={C.green} glowColor={C.cyan}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const EmailSequenceVideo: React.FC = () => {
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
