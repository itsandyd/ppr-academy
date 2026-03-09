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
// EMAIL AUTOMATION: "The Engine"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Passive Income Secret ──────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={60}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          The secret to
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.gold, lineHeight: 1, textAlign: "center" }}>
          PASSIVE INCOME?
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Manual Work ────────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={61}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE PROBLEM</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          You can't DM everyone
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>manually.</span>
        </div>
      </FadeUp>

      <div style={{ fontSize: 60, opacity: 0.5 }}>📱✋</div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — The Engine ───────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const r = 150;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });

  const merge = spring({ fps, frame: frame - 60, config: { damping: 20 } });
  const scale = interpolate(merge, [0, 1], [1, 0.2]);
  const opacity = interpolate(merge, [0, 1], [1, 0]);
  const buttonScale = interpolate(merge, [0, 1], [0, 1]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={62}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Build <GradientText from={C.cyan} to={C.primary}>The Engine.</GradientText>
        </div>
      </FadeUp>

      <div style={{ position: "relative", width: 400, height: 400 }}>
        {/* Nodes */}
        <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, opacity }}>
          {nodes.map((n, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 200 + n.x,
                top: 200 + n.y,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: C.cyan,
                boxShadow: `0 0 20px ${C.cyan}`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          {/* Connections */}
          <svg width="400" height="400" style={{ position: "absolute", inset: 0 }}>
            {nodes.map((n, i) => (
              <line
                key={i}
                x1="200"
                y1="200"
                x2={200 + n.x}
                y2={200 + n.y}
                stroke={C.cyan}
                strokeWidth="2"
                opacity="0.5"
              />
            ))}
          </svg>
        </div>

        {/* Button */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${buttonScale})`,
            padding: "20px 40px",
            background: `linear-gradient(135deg, ${C.cyan}, ${C.primary})`,
            borderRadius: 30,
            boxShadow: `0 0 40px ${C.cyan}`,
            fontSize: 24,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
          }}
        >
          AUTO
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (20-28s) — 24/7 Machine ────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spin = frame * 2;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={63}>
      <FadeUp delay={5}>
        <SectionLabel color={C.purple}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ position: "relative", width: 200, height: 200, margin: "40px auto" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `10px solid ${C.purple}`,
            borderTopColor: "transparent",
            transform: `rotate(${spin}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
          }}
        >
          24/7
        </div>
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          Sales Machine.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (28-35s) — Turn It On ────────────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.cyan} seed={64}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Turn it
          <br />
          <GradientText from={C.cyan} to={C.purple}>On.</GradientText>
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
export const EmailAutomationVideo: React.FC = () => {
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
