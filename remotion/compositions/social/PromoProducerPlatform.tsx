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
// PROMO: YOUR PLATFORM. YOUR EMPIRE.
// A high-impact promotional video for music producers.
// 7 scenes, ~45 seconds, vertical (1080x1920), 30fps
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-5s) — Your Music Deserves More ─────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(120, 150);

  const titleScale = spring({
    fps,
    frame: frame - 8,
    config: { damping: 14, stiffness: 200 },
  });

  // Pulsing waveform glow
  const pulse = Math.sin(frame * 0.08) * 0.4 + 0.6;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={500}>
      <FadeUp delay={3}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            fontFamily: F,
            color: C.gray,
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 30,
          }}
        >
          Attention Producers
        </div>
      </FadeUp>

      <div style={{ transform: `scale(${titleScale})`, marginBottom: 40 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.1,
            color: C.white,
            textAlign: "center",
          }}
        >
          Your music
          <br />
          deserves more than
          <br />
          <GradientText from={C.orange} to={C.warmOrange}>
            SoundCloud links.
          </GradientText>
        </div>
      </div>

      <div style={{ opacity: pulse, width: 500 }}>
        <WaveformVisual delay={20} />
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PAIN (5-10s) — The Producer's Struggle ─────────────────
const Scene2_Pain: React.FC = () => {
  const { op, y } = useExit(120, 150);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const problems = [
    { icon: "💸", text: "No storefront", delay: 10 },
    { icon: "📉", text: "No email list", delay: 25 },
    { icon: "🤷", text: "No brand", delay: 40 },
    { icon: "😤", text: "No recurring revenue", delay: 55 },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={501}>
      <FadeUp delay={3}>
        <SectionLabel color={C.red}>THE STRUGGLE</SectionLabel>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            fontFamily: F,
            color: C.white,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          You make the beats.
          <br />
          <span style={{ color: C.red }}>But who sells them?</span>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
        }}
      >
        {problems.map((p, i) => {
          const spr = spring({
            fps,
            frame: frame - p.delay,
            config: { damping: 15 },
          });
          const sc = interpolate(spr, [0, 1], [0.6, 1]);
          const o = interpolate(spr, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: `${C.darkGray}99`,
                border: `1px solid ${C.red}30`,
                borderRadius: 16,
                padding: "16px 24px",
                transform: `scale(${sc})`,
                opacity: o,
              }}
            >
              <div style={{ fontSize: 36 }}>{p.icon}</div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {p.text}
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3: INTRO (10-17s) — Enter PPR ────────────────────────────
const Scene3_Intro: React.FC = () => {
  const { op, y } = useExit(180, 210);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoReveal = spring({
    fps,
    frame: frame - 5,
    config: { damping: 20 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={502}>
      <div
        style={{
          transform: `scale(${interpolate(logoReveal, [0, 1], [0.5, 1])})`,
          opacity: interpolate(logoReveal, [0, 1], [0, 1]),
        }}
      >
        <LogoIcon delay={5} size={130} />
      </div>

      <FadeUp delay={25}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.1,
            color: C.white,
            textAlign: "center",
          }}
        >
          <GradientText from={C.primary} to={C.cyan}>
            PausePlayRepeat
          </GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={45}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          The all-in-one platform
          <br />
          built for music producers.
        </div>
      </FadeUp>

      <FadeUp delay={70}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: C.orange,
            fontFamily: F,
            marginTop: 30,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          By producers. For producers.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 4: SELL (17-25s) — What You Can Sell ──────────────────────
const Scene4_Sell: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const products = [
    { icon: "🎵", name: "Beats & Beat Tapes", color: C.orange },
    { icon: "🎓", name: "Courses & Tutorials", color: C.primary },
    { icon: "🥁", name: "Sample Packs & Drums", color: C.cyan },
    { icon: "🎛️", name: "Presets & Racks", color: C.purple },
    { icon: "🎤", name: "Coaching & Mentorship", color: C.pink },
    { icon: "⭐", name: "Memberships", color: C.gold },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={503}>
      <FadeUp delay={5}>
        <SectionLabel color={C.cyan}>YOUR STOREFRONT</SectionLabel>
      </FadeUp>

      <FadeUp delay={15}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            fontFamily: F,
            color: C.white,
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          Sell <GradientText from={C.cyan} to={C.green}>everything</GradientText> you create.
        </div>
      </FadeUp>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
        }}
      >
        {products.map((p, i) => {
          const delay = 30 + i * 12;
          const spr = spring({
            fps,
            frame: frame - delay,
            config: { damping: 14 },
          });
          const sc = interpolate(spr, [0, 1], [0.5, 1]);
          const o = interpolate(spr, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                transform: `scale(${sc})`,
                opacity: o,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${p.color}40`,
                borderRadius: 16,
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 36 }}>{p.icon}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: F,
                  textAlign: "center",
                }}
              >
                {p.name}
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 5: TOOLS (25-33s) — Built-In Power Tools ─────────────────
const Scene5_Tools: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tools = [
    {
      icon: "🤖",
      title: "Master AI",
      desc: "Mixing & mastering chat",
      color: C.purple,
    },
    {
      icon: "📧",
      title: "Email Marketing",
      desc: "Automated sequences",
      color: C.cyan,
    },
    {
      icon: "📱",
      title: "Social Automation",
      desc: "DMs, follow gates, funnels",
      color: C.pink,
    },
    {
      icon: "📊",
      title: "Analytics",
      desc: "Track everything",
      color: C.green,
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={504}>
      <FadeUp delay={5}>
        <SectionLabel color={C.purple}>BUILT-IN TOOLS</SectionLabel>
      </FadeUp>

      <FadeUp delay={15}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            fontFamily: F,
            color: C.white,
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          Not just a store.
          <br />
          <GradientText from={C.purple} to={C.pink}>
            A full business engine.
          </GradientText>
        </div>
      </FadeUp>

      <div
        style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}
      >
        {tools.map((t, i) => {
          const delay = 30 + i * 18;
          const spr = spring({
            fps,
            frame: frame - delay,
            config: { damping: 15 },
          });
          const slideX = interpolate(spr, [0, 1], [100, 0]);
          const o = interpolate(spr, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                transform: `translateX(${slideX}px)`,
                opacity: o,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${t.color}40`,
                borderRadius: 20,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  width: 60,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${t.color}20`,
                  borderRadius: 14,
                  flexShrink: 0,
                }}
              >
                {t.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: C.gray,
                    fontFamily: F,
                    marginTop: 2,
                  }}
                >
                  {t.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 6: GAMIFICATION (33-40s) — Level Up ──────────────────────
const Scene6_Gamification: React.FC = () => {
  const { op, y } = useExit(180, 210);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // XP bar animation
  const barProgress = spring({
    fps,
    frame: frame - 30,
    config: { damping: 30, stiffness: 80 },
  });
  const barWidth = interpolate(barProgress, [0, 1], [0, 85]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={505}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gold}>GAMIFIED LEARNING</SectionLabel>
      </FadeUp>

      <FadeUp delay={15}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            fontFamily: F,
            color: C.white,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          Learn. Earn XP.
          <br />
          <GradientText from={C.gold} to={C.orange}>
            Level up your craft.
          </GradientText>
        </div>
      </FadeUp>

      {/* XP Progress Bar */}
      <FadeUp delay={35}>
        <div
          style={{
            width: "100%",
            background: `${C.darkGray}`,
            borderRadius: 12,
            height: 32,
            overflow: "hidden",
            border: `1px solid ${C.gold}30`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.gold}, ${C.orange})`,
              borderRadius: 12,
              boxShadow: `0 0 20px ${C.gold}50`,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: F,
            fontSize: 16,
            color: C.gray,
          }}
        >
          <span>Level 12</span>
          <span style={{ color: C.gold, fontWeight: 700 }}>8,500 XP</span>
        </div>
      </FadeUp>

      {/* Achievement badges */}
      <FadeUp delay={55}>
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 40,
            justifyContent: "center",
          }}
        >
          {["🏆", "🎖️", "🏅"].map((badge, i) => {
            const badgeSpr = spring({
              fps,
              frame: frame - 65 - i * 10,
              config: { damping: 12 },
            });
            return (
              <div
                key={i}
                style={{
                  transform: `scale(${interpolate(badgeSpr, [0, 1], [0, 1])})`,
                  fontSize: 56,
                  background: `${C.darkGray}`,
                  border: `2px solid ${C.gold}40`,
                  borderRadius: 20,
                  width: 90,
                  height: 90,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {badge}
              </div>
            );
          })}
        </div>
      </FadeUp>

      <FadeUp delay={80}>
        <div
          style={{
            fontSize: 22,
            color: C.gray,
            fontFamily: F,
            marginTop: 30,
            textAlign: "center",
          }}
        >
          Certificates. Leaderboards. Community.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 7: CTA (40-47s) — Build Your Empire ──────────────────────
const Scene7_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame: frame - 5,
    config: { damping: 14 },
  });

  return (
    <CenterScene tint={C.orange} seed={506}>
      <div
        style={{
          transform: `scale(${interpolate(scale, [0, 1], [0.8, 1])})`,
        }}
      >
        <LogoIcon
          delay={5}
          size={120}
          gradientFrom={C.orange}
          gradientVia={C.warmOrange}
          gradientTo={C.gold}
          glowColor={C.orange}
        />
      </div>

      <FadeUp delay={20}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.1,
            color: C.white,
            textAlign: "center",
          }}
        >
          Build your
          <br />
          <GradientText from={C.orange} to={C.gold}>
            producer empire.
          </GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={45}>
        <div
          style={{
            fontSize: 24,
            color: C.gray,
            fontFamily: F,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Storefront. Courses. Email. AI.
          <br />
          All in one place.
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton
          delay={60}
          gradientFrom={C.orange}
          gradientTo={C.gold}
          glowColor={C.orange}
        >
          Start Free Today →
        </CTAButton>
      </div>

      <FadeUp delay={80}>
        <div
          style={{
            fontSize: 20,
            color: C.gray,
            fontFamily: "monospace",
            marginTop: 40,
            letterSpacing: 2,
          }}
        >
          pauseplayrepeat.com
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ────────────────────────────────────────────────
// Total: 1350 frames = 45 seconds @ 30fps
export const PromoProducerPlatform: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Scene 1: Hook (0-5s) */}
      <Sequence from={0} durationInFrames={150}>
        <Scene1_Hook />
      </Sequence>
      {/* Scene 2: Pain (5-10s) */}
      <Sequence from={150} durationInFrames={150}>
        <Scene2_Pain />
      </Sequence>
      {/* Scene 3: Intro PPR (10-17s) */}
      <Sequence from={300} durationInFrames={210}>
        <Scene3_Intro />
      </Sequence>
      {/* Scene 4: What you can sell (17-25s) */}
      <Sequence from={510} durationInFrames={240}>
        <Scene4_Sell />
      </Sequence>
      {/* Scene 5: Built-in tools (25-33s) */}
      <Sequence from={750} durationInFrames={240}>
        <Scene5_Tools />
      </Sequence>
      {/* Scene 6: Gamification (33-40s) */}
      <Sequence from={990} durationInFrames={210}>
        <Scene6_Gamification />
      </Sequence>
      {/* Scene 7: CTA (40-47s) */}
      <Sequence from={1200} durationInFrames={210}>
        <Scene7_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
