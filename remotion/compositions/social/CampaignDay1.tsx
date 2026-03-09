import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
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
// CAMPAIGN DAY 1: "The New Standard"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-3s) — The Shift ──────────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(80, 90);

  const glitch = Math.sin(frame * 0.8) * (frame < 20 ? 10 : 0);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={10}>
      <div style={{ transform: `translateX(${glitch}px)` }}>
        <FadeUp delay={5}>
          <div style={{ fontSize: 50, fontWeight: 900, fontFamily: F, lineHeight: 1.1, color: C.white, textAlign: "center" }}>
            Music production
            <br />
            <GradientText from={C.purple} to={C.cyan}>has changed.</GradientText>
          </div>
        </FadeUp>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (3-10s) — Stuck in the Past ──────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(200, 210);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const oldTech = [
    { text: "Ugly Linktrees", x: -150, y: -100, rot: -5 },
    { text: "Manual DMs", x: 150, y: -50, rot: 5 },
    { text: "Paypal Invoices", x: -100, y: 100, rot: -3 },
    { text: "Google Drive Links", x: 120, y: 150, rot: 4 },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={11}>
      <FadeUp delay={5}>
        <SectionLabel color={C.red}>THE REALITY</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.gray, fontFamily: F, marginBottom: 40, textAlign: "center" }}>
          But your business is
          <br />
          <span style={{ color: C.white, fontWeight: 900 }}>stuck in 2015.</span>
        </div>
      </FadeUp>

      <div style={{ position: "relative", width: 500, height: 400 }}>
        {oldTech.map((item, i) => {
          const delay = 40 + i * 10;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 12 } });
          const scale = interpolate(spr, [0, 1], [0, 1]);
          
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 250 + item.x,
                top: 200 + item.y,
                transform: `translate(-50%, -50%) rotate(${item.rot}deg) scale(${scale})`,
                background: C.darkGray,
                padding: "12px 20px",
                borderRadius: 8,
                border: `1px solid ${C.red}`,
                color: C.red,
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: 18,
                opacity: 0.8,
              }}
            >
              ⚠️ {item.text}
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — The New Standard ─────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(290, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });
  const glow = interpolate(reveal, [0, 1], [0, 50]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={12}>
      <div style={{ transform: `scale(${interpolate(reveal, [0, 1], [0.9, 1])})` }}>
        <FadeUp delay={10}>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 20 }}>
            Meet the <GradientText from={C.cyan} to={C.primary}>New Standard.</GradientText>
          </div>
        </FadeUp>

        <div
          style={{
            width: 500,
            height: 300,
            background: `linear-gradient(135deg, ${C.darkGray}, #000)`,
            borderRadius: 20,
            border: `1px solid ${C.primary}40`,
            boxShadow: `0 0 ${glow}px ${C.primary}30`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginTop: 30,
            opacity: interpolate(reveal, [0, 1], [0, 1]),
          }}
        >
          {/* Mock Dashboard UI */}
          <div style={{ height: 40, borderBottom: `1px solid ${C.primary}20`, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.red }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.green }} />
          </div>
          <div style={{ flex: 1, padding: 20, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
            <div style={{ background: `${C.primary}10`, borderRadius: 10 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ height: 80, background: `${C.primary}20`, borderRadius: 10 }} />
              <div style={{ height: 80, background: `${C.primary}20`, borderRadius: 10 }} />
            </div>
          </div>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-30s) — Features ────────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(290, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { text: "AI-Powered", color: C.purple },
    { text: "Fully Automated", color: C.cyan },
    { text: "Beautiful Design", color: C.pink },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={13}>
      <FadeUp delay={5}>
        <SectionLabel color={C.cyan}>WHY SWITCH?</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 30 }}>
        {features.map((f, i) => {
          const delay = 20 + i * 20;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 15 } });
          const x = interpolate(spr, [0, 1], [100, 0]);
          const o = interpolate(spr, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                transform: `translateX(${x}px)`,
                opacity: o,
                fontSize: 36,
                fontWeight: 800,
                fontFamily: F,
                color: C.white,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: f.color, boxShadow: `0 0 10px ${f.color}` }} />
              {f.text}
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (30-35s) — Invite ────────────────────────────────────
const Scene5_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  
  return (
    <CenterScene tint={C.gold} seed={14}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Claim your
          <br />
          <GradientText from={C.gold} to={C.primary}>Invite.</GradientText>
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
export const CampaignDay1: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={90}>
        <Scene1_Hook />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <Scene2_Problem />
      </Sequence>
      <Sequence from={300} durationInFrames={300}>
        <Scene3_Solution />
      </Sequence>
      <Sequence from={600} durationInFrames={300}>
        <Scene4_Proof />
      </Sequence>
      <Sequence from={900} durationInFrames={150}>
        <Scene5_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
