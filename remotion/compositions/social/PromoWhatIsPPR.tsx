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
// PROMO VIDEO: "What is PausePlayRepeat?"
// Completely redone with high-quality animation and structure.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-5s) — The Cost of Chaos ──────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(130, 150);

  const tools = [
    { name: "Kajabi", cost: "$149", color: "#0072EF", x: -200, y: -150 },
    { name: "Mailchimp", cost: "$50", color: "#FFE01B", x: 200, y: -150 },
    { name: "Buffer", cost: "$25", color: "#2C4BFF", x: -250, y: 50 },
    { name: "ManyChat", cost: "$45", color: "#0084FF", x: 250, y: 50 },
    { name: "Linktree", cost: "$24", color: "#43E660", x: 0, y: 200 },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={1}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.1, color: C.white, marginBottom: 40 }}>
          Stop paying for
          <br />
          <GradientText from={C.red} to={C.orange}>5 different tools.</GradientText>
        </div>
      </FadeUp>

      <div style={{ position: "relative", width: 600, height: 400 }}>
        {tools.map((t, i) => {
          const delay = 30 + i * 10;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 12 } });
          const scale = interpolate(spr, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 300 + t.x,
                top: 200 + t.y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                background: C.darkGray,
                padding: "16px 24px",
                borderRadius: 16,
                border: `2px solid ${t.color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: F }}>{t.name}</div>
              <div style={{ fontSize: 16, color: C.gray, fontFamily: F }}>{t.cost}/mo</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (5-10s) — Disconnected ───────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(130, 150);
  const frame = useCurrentFrame();
  
  // Shake animation
  const shake = Math.sin(frame * 0.5) * 5 * Math.min(1, frame / 20);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={2}>
      <FadeUp delay={5}>
        <SectionLabel color={C.red}>THE PROBLEM</SectionLabel>
      </FadeUp>
      
      <div style={{ transform: `translateX(${shake}px)`, marginBottom: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🔌💥</div>
      </div>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.white }}>
          They don't talk
          <br />
          to each other.
        </div>
      </FadeUp>

      <FadeUp delay={45}>
        <div style={{ fontSize: 28, color: C.gray, fontFamily: F, marginTop: 20 }}>
          You lose sales in the gaps.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-18s) — One Platform ─────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const merge = spring({ fps, frame: frame - 20, config: { damping: 20 } });
  const scale = interpolate(merge, [0, 1], [0.8, 1]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={3}>
      <div style={{ transform: `scale(${scale})` }}>
        <LogoIcon delay={10} size={120} />
      </div>

      <FadeUp delay={40}>
        <div style={{ fontSize: 52, fontWeight: 900, fontFamily: F, lineHeight: 1.1, color: C.white, marginTop: 40 }}>
          <GradientText from={C.primary} to={C.cyan}>PausePlayRepeat</GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={60}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 20 }}>
          One platform.
          <br />
          <span style={{ color: C.gray }}>Everything connected.</span>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (18-26s) — Features ────────────────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: "🏪", text: "Storefront", color: C.primary },
    { icon: "🎓", text: "Courses", color: C.orange },
    { icon: "📧", text: "Email Marketing", color: C.cyan },
    { icon: "🤖", text: "AI Automation", color: C.purple },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={4}>
      <FadeUp delay={5}>
        <SectionLabel color={C.cyan}>ALL INCLUDED</SectionLabel>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, width: "100%", marginTop: 20 }}>
        {features.map((f, i) => {
          const delay = 20 + i * 15;
          const spr = spring({ fps, frame: frame - delay, config: { damping: 15 } });
          const sc = interpolate(spr, [0, 1], [0.5, 1]);
          const o = interpolate(spr, [0, 1], [0, 1]);
          
          return (
            <div
              key={i}
              style={{
                transform: `scale(${sc})`,
                opacity: o,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${f.color}40`,
                borderRadius: 20,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 40 }}>{f.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: F }}>{f.text}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (26-30s) — Start Free ────────────────────────────────
const Scene5_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene tint={C.green} seed={5}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 56, fontWeight: 900, fontFamily: F, lineHeight: 1.1, color: C.white, marginBottom: 30 }}>
          Start for <GradientText from={C.green} to={C.cyan}>Free.</GradientText>
        </div>
        
        <CTAButton delay={30} gradientFrom={C.green} gradientTo={C.cyan} glowColor={C.green}>
          Link in Bio →
        </CTAButton>

        <FadeUp delay={60}>
          <div style={{ fontSize: 20, color: C.gray, fontFamily: "monospace", marginTop: 40, letterSpacing: 2 }}>
            pauseplayrepeat.com
          </div>
        </FadeUp>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const PromoWhatIsPPR: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={150}>
        <Scene1_Hook />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <Scene2_Problem />
      </Sequence>
      <Sequence from={300} durationInFrames={240}>
        <Scene3_Solution />
      </Sequence>
      <Sequence from={540} durationInFrames={240}>
        <Scene4_Proof />
      </Sequence>
      <Sequence from={780} durationInFrames={120}>
        <Scene5_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
