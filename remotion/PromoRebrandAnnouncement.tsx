import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { C, F } from "./theme";
import {
  BG,
  CenterScene,
  FadeUp,
  GradientText,
  SectionLabel,
  CTAButton,
  LogoIcon,
  WaveformVisual,
  useExit,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — You Know the Tips (0s–7s, 210 frames)
// Voiceover: "So you probably know PausePlayRepeat from the daily
//  tips. The production tricks, the mixing breakdowns."
// Emotional beat: Recognition. "Yeah, I follow them."
// ═══════════════════════════════════════════════════════════════════════
const SceneYouKnowUs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(185, 210);

  // Instagram-style post mockups — the content they know
  const posts = [
    { text: "Stop boosting 3kHz on every vocal", icon: "🎤", color: C.pink },
    { text: "The sidechain trick nobody talks about", icon: "🔊", color: C.cyan },
    { text: "Why your low end is muddy (and the fix)", icon: "🎚️", color: C.orange },
    { text: "3 reverb mistakes killing your mix", icon: "🎛️", color: C.purple },
  ];

  // "But now..." transition text
  const butNowSpring = spring({
    fps,
    frame: frame - 140,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.instagram} seed={1}>
      <FadeUp delay={3}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.instagram,
            fontFamily: F,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          YOU KNOW THE TIPS
        </div>
      </FadeUp>

      {/* Instagram-style post stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          marginBottom: 24,
        }}
      >
        {posts.map((post, i) => {
          const postDelay = 12 + i * 20;
          const postSpring = spring({
            fps,
            frame: frame - postDelay,
            config: { damping: 55, stiffness: 175 },
          });
          const postOp = interpolate(postSpring, [0, 1], [0, 1]);
          const postX = interpolate(postSpring, [0, 1], [50, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: postOp,
                transform: `translateX(${postX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${post.color}25`,
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{post.icon}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: F,
                  lineHeight: 1.3,
                }}
              >
                {post.text}
              </div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={90}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          The daily production tips.{"\n"}The mixing breakdowns.
        </div>
      </FadeUp>

      {/* "But now..." transition */}
      <div
        style={{
          opacity: interpolate(butNowSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(butNowSpring, [0, 1], [25, 0])}px)`,
          marginTop: 28,
        }}
      >
        <GradientText from={C.primary} to={C.cyan}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: F,
              textAlign: "center",
            }}
          >
            Now there's more.
          </div>
        </GradientText>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — We Built a Website (7s–11s, 120 frames)
// Voiceover: "We built an actual website. Like, a real platform."
// Emotional beat: Reveal. The Instagram account got a home.
// ═══════════════════════════════════════════════════════════════════════
const SceneWeBuiltIt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(95, 120);

  // Logo pulse on entrance
  const logoSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 40, stiffness: 160 },
  });

  // URL typing
  const url = "pauseplayrepeat.com";
  const charsVisible = Math.min(
    url.length,
    Math.floor(
      interpolate(frame, [30, 70], [0, url.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const cursorBlink = Math.sin(frame * 0.15) > 0 ? 1 : 0;

  // "A real platform." text
  const platformSpring = spring({
    fps,
    frame: frame - 72,
    config: { damping: 50, stiffness: 170 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={2}>
      <FadeUp delay={3}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            lineHeight: 1.25,
            marginBottom: 28,
          }}
        >
          We built{"\n"}
          <GradientText from={C.primary} to={C.cyan}>
            an actual website.
          </GradientText>
        </div>
      </FadeUp>

      {/* Browser-like URL bar */}
      <FadeUp delay={20}>
        <div
          style={{
            width: "100%",
            padding: "16px 20px",
            borderRadius: 18,
            background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
            border: `1px solid ${C.primary}25`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.green,
              }}
            />
            <div
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: 10,
                background: `${C.bg}cc`,
                fontSize: 18,
                fontFamily: "monospace",
                fontWeight: 700,
                color: C.white,
                letterSpacing: 0.5,
              }}
            >
              {url.slice(0, charsVisible)}
              <span
                style={{
                  opacity: charsVisible < url.length ? cursorBlink : 0,
                  color: C.primary,
                }}
              >
                |
              </span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* "A real platform." */}
      <div
        style={{
          opacity: interpolate(platformSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(platformSpring, [0, 1], [20, 0])}px)`,
          marginTop: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.gray,
            fontFamily: F,
          }}
        >
          A real{" "}
          <span style={{ color: C.white }}>platform.</span>
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — Sell Your Stuff (11s–21s, 300 frames)
// Voiceover: "If you make beats, presets, sample packs, courses —
//  you can sell them on it."
// Emotional beat: The core value prop. Each product type gets a moment.
// ═══════════════════════════════════════════════════════════════════════
const SceneSellYourStuff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(275, 300);

  // Header text
  const headerSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 55, stiffness: 170 },
  });

  const products = [
    { name: "Courses", icon: "🎓", color: C.primary },
    { name: "Beat Leases", icon: "🎵", color: C.pink },
    { name: "Preset Packs", icon: "🎛️", color: C.cyan },
    { name: "Sample Packs", icon: "🥁", color: C.orange },
    { name: "MIDI Packs", icon: "🎹", color: C.purple },
    { name: "Coaching", icon: "📅", color: C.gold },
    { name: "Mixing Templates", icon: "🎚️", color: C.green },
    { name: "Effect Chains", icon: "⚡", color: C.warmOrange },
  ];

  // Tagline at bottom
  const tagOp = interpolate(frame, [240, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagSpring = spring({
    fps,
    frame: frame - 245,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.pink} seed={3}>
      <div
        style={{
          opacity: interpolate(headerSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(headerSpring, [0, 1], [30, 0])}px)`,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            marginBottom: 6,
          }}
        >
          And on it, you can
        </div>
        <GradientText from={C.pink} to={C.primary}>
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.15,
            }}
          >
            sell your stuff.
          </div>
        </GradientText>
      </div>

      {/* Subtle waveform divider */}
      <div style={{ width: "100%", marginBottom: 8, opacity: 0.3 }}>
        <WaveformVisual delay={10} />
      </div>

      {/* Product grid — 2 columns, staggered entrance */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          width: "100%",
        }}
      >
        {products.map((prod, i) => {
          const cardDelay = 30 + i * 22;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 55, stiffness: 180 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterScale = interpolate(enterSpring, [0, 1], [0.7, 1]);

          // Highlight effect — active for ~20 frames after appearing
          const localFrame = frame - cardDelay;
          const isActive = localFrame >= 0 && localFrame < 30;

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `scale(${enterScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px",
                borderRadius: 14,
                background: isActive
                  ? `linear-gradient(135deg, ${C.darkGray}ee, ${prod.color}12)`
                  : `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${isActive ? prod.color + "40" : prod.color + "20"}`,
                boxShadow: isActive ? `0 0 20px ${prod.color}15` : "none",
              }}
            >
              <div style={{ fontSize: 28 }}>{prod.icon}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: prod.color,
                  fontFamily: F,
                  textAlign: "center",
                }}
              >
                {prod.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          opacity: tagOp,
          transform: `translateY(${interpolate(tagSpring, [0, 1], [20, 0])}px)`,
          marginTop: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.3,
          }}
        >
          Every product type a producer{" "}
          <GradientText from={C.pink} to={C.primary}>actually sells.</GradientText>
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — Built for Producers (21s–27s, 180 frames)
// Voiceover: "And it's built for how producers actually sell.
//  Not for people selling candles."
// Emotional beat: Differentiation. Music-specific credibility.
// ═══════════════════════════════════════════════════════════════════════
const SceneBuiltForProducers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(155, 180);

  // Beat licensing tiers
  const tiers = [
    { name: "Basic", price: "$29", streams: "5K streams", color: C.gray },
    { name: "Premium", price: "$79", streams: "Unlimited", color: C.cyan },
    { name: "Exclusive", price: "$299", streams: "Full rights", color: C.gold },
  ];

  // Music metadata tags
  const tags = [
    { label: "140 BPM", color: C.pink },
    { label: "G Minor", color: C.purple },
    { label: "Trap", color: C.orange },
    { label: "Ableton", color: C.cyan },
    { label: "FL Studio", color: C.green },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={4}>
      <FadeUp delay={3}>
        <SectionLabel color={C.orange}>BUILT FOR THIS</SectionLabel>
      </FadeUp>

      {/* Beat licensing mockup */}
      <FadeUp delay={10}>
        <div
          style={{
            width: "100%",
            padding: "20px",
            borderRadius: 18,
            background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
            border: `1px solid ${C.orange}25`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.orange,
              fontFamily: F,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            BEAT LICENSING TIERS
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tiers.map((tier, i) => {
              const tierDelay = 20 + i * 16;
              const tierOp = interpolate(frame, [tierDelay, tierDelay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity: tierOp,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: `${C.bg}cc`,
                    border: `1px solid ${tier.color}20`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: tier.color,
                        fontFamily: F,
                      }}
                    >
                      {tier.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.gray,
                        fontFamily: F,
                      }}
                    >
                      {tier.streams}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: C.white,
                      fontFamily: "monospace",
                    }}
                  >
                    {tier.price}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* Music metadata tags */}
      <FadeUp delay={65}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {tags.map((tag, i) => {
            const tagDelay = 70 + i * 8;
            const tagSpring = spring({
              fps,
              frame: frame - tagDelay,
              config: { damping: 50, stiffness: 180 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: interpolate(tagSpring, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(tagSpring, [0, 1], [0.7, 1])})`,
                  padding: "8px 16px",
                  borderRadius: 20,
                  background: `${tag.color}15`,
                  border: `1px solid ${tag.color}30`,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: tag.color,
                    fontFamily: F,
                  }}
                >
                  {tag.label}
                </div>
              </div>
            );
          })}
        </div>
      </FadeUp>

      <FadeUp delay={110}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: F,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          <GradientText from={C.orange} to={C.gold}>
            Built for this.
          </GradientText>
          <div style={{ color: C.gray, fontSize: 18, marginTop: 4 }}>
            Not adapted for it.
          </div>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — Your Storefront (27s–34s, 210 frames)
// Voiceover: "You get your own storefront. Your products, your brand.
//  And as you grow, it scales with you."
// Emotional beat: Ownership. This is yours.
// ═══════════════════════════════════════════════════════════════════════
const SceneStorefront: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(185, 210);

  // Typing animation for custom domain
  const domain = "www.yourname.com";
  const charsVisible = Math.min(
    domain.length,
    Math.floor(
      interpolate(frame, [25, 60], [0, domain.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const cursorBlink = Math.sin(frame * 0.15) > 0 ? 1 : 0;

  const products = [
    { name: "Mixing Course", icon: "🎓", price: "$49" },
    { name: "Lo-Fi Sample Pack", icon: "🥁", price: "$25" },
    { name: "Serum Presets", icon: "🎛️", price: "$19" },
  ];

  // Growth features appear after storefront
  const growthOp = interpolate(frame, [140, 158], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={5}>
      <FadeUp delay={3}>
        <SectionLabel color={C.purple}>YOUR STORE</SectionLabel>
      </FadeUp>

      {/* Browser mockup with storefront */}
      <div
        style={{
          width: "100%",
          borderRadius: 20,
          background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
          border: `1px solid ${C.purple}20`,
          overflow: "hidden",
        }}
      >
        {/* URL bar with typing domain */}
        <div
          style={{
            padding: "12px 18px",
            background: `${C.bg}cc`,
            borderBottom: `1px solid ${C.purple}15`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.green,
            }}
          />
          <div
            style={{
              flex: 1,
              padding: "6px 14px",
              borderRadius: 8,
              background: `${C.darkGray}80`,
              fontSize: 14,
              fontFamily: "monospace",
              color: C.white,
            }}
          >
            {domain.slice(0, charsVisible)}
            <span
              style={{
                opacity: charsVisible < domain.length ? cursorBlink : 0,
                color: C.purple,
              }}
            >
              |
            </span>
          </div>
        </div>

        {/* Store content */}
        <div style={{ padding: "18px 18px 22px" }}>
          <FadeUp delay={55}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 20,
                }}
              >
                🎵
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                Your Store
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={65}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {products.map((prod, i) => {
                const prodDelay = 70 + i * 12;
                const prodOp = interpolate(frame, [prodDelay, prodDelay + 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={i}
                    style={{
                      opacity: prodOp,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: `${C.bg}cc`,
                      border: `1px solid ${C.purple}15`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{prod.icon}</span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.white,
                          fontFamily: F,
                        }}
                      >
                        {prod.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.purple,
                        fontFamily: F,
                      }}
                    >
                      {prod.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Growth hint */}
      <div
        style={{
          opacity: growthOp,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            lineHeight: 1.4,
          }}
        >
          Custom domain. Your brand.{"\n"}
          <span style={{ color: C.white, fontWeight: 800 }}>
            And as you grow, it scales.
          </span>
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — The Toolkit (34s–40s, 180 frames)
// Voiceover: "Email campaigns, analytics, AI tools, scheduling —
//  everything you need, one place."
// Emotional beat: "Oh, and there's also all this." Quick showcase.
// ═══════════════════════════════════════════════════════════════════════
const SceneToolkit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(155, 180);

  const tools = [
    {
      icon: "📧",
      title: "Email Campaigns",
      desc: "Drip sequences & automations",
      color: C.cyan,
    },
    {
      icon: "📊",
      title: "Analytics",
      desc: "Revenue, students, conversions",
      color: C.green,
    },
    {
      icon: "🤖",
      title: "AI Tools",
      desc: "Social scripts, cheat sheets, emails",
      color: C.purple,
    },
    {
      icon: "📱",
      title: "Social Scheduling",
      desc: "Plan & schedule your content",
      color: C.pink,
    },
    {
      icon: "🔗",
      title: "Link-in-Bio",
      desc: "Your links, your page",
      color: C.primary,
    },
    {
      icon: "📅",
      title: "Coaching Bookings",
      desc: "Calendar & session management",
      color: C.gold,
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={6}>
      <FadeUp delay={3}>
        <SectionLabel color={C.cyan}>EVERYTHING ELSE</SectionLabel>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 1.25,
          }}
        >
          One place.{" "}
          <GradientText from={C.cyan} to={C.green}>
            All the tools.
          </GradientText>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        {tools.map((tool, i) => {
          const toolDelay = 18 + i * 16;
          const enterSpring = spring({
            fps,
            frame: frame - toolDelay,
            config: { damping: 55, stiffness: 175 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterX = interpolate(enterSpring, [0, 1], [50, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 12,
                background: `${C.darkGray}88`,
                border: `1px solid ${tool.color}15`,
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{tool.icon}</div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {tool.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: tool.color,
                    fontFamily: F,
                    lineHeight: 1.3,
                  }}
                >
                  {tool.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — The Invitation (40s–45s, 150 frames)
// Voiceover: "It's free to start. Link's in my bio if you want to
//  check it out."
// Emotional beat: Invitation, not hard sell. Casual close.
// ═══════════════════════════════════════════════════════════════════════
const SceneInvitation: React.FC = () => {
  // Particle burst effect
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const speed = 1.5 + (i % 4);
    const progress = Math.max(0, frame - 8) / 35;
    const dist = progress * speed * 40;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: Math.max(0, 1 - progress),
      size: 3 + (i % 3) * 2,
    };
  });

  return (
    <CenterScene>
      {/* Particle burst behind logo */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + p.x - p.size / 2,
            top: 820 + p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: [C.primary, C.pink, C.cyan, C.purple][i % 4],
            opacity: p.opacity * 0.35,
            boxShadow: `0 0 ${p.size * 3}px ${[C.primary, C.pink, C.cyan, C.purple][i % 4]}`,
            zIndex: 0,
          }}
        />
      ))}

      <LogoIcon delay={5} size={100} />

      <FadeUp delay={18}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          Free to start.
        </div>
      </FadeUp>

      <FadeUp delay={28}>
        <GradientText from={C.primary} to={C.pink}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Built to grow.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={42}>
        <div style={{ marginTop: 16 }}>
          <CTAButton delay={42}>Check It Out →</CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={58}>
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            color: C.gray,
            fontFamily: "monospace",
            letterSpacing: 1.5,
          }}
        >
          pauseplayrepeat.com
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION — "PausePlayRepeat: From Tips to Platform" (~45s)
//
// Narrative: IG tips account → we built an actual website → sell your
// music products on it → here's what makes it different → your store →
// all the tools → come check it out
//
// Timing breakdown:
//   0.5s  buffer                 15 fr
//   7.0s  Scene 1 You Know Us   210 fr
//   4.0s  Scene 2 We Built It   120 fr
//  10.0s  Scene 3 Sell Stuff    300 fr
//   6.0s  Scene 4 Producers     180 fr
//   7.0s  Scene 5 Storefront    210 fr
//   6.0s  Scene 6 Toolkit       180 fr
//   5.0s  Scene 7 Invitation    150 fr
//   0.5s  buffer                 15 fr
//   ─────────────────────────────
//  46.0s  total                  1380 fr
// ═══════════════════════════════════════════════════════════════════════
export const PromoRebrandAnnouncement: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={15} durationInFrames={210}>
        <SceneYouKnowUs />
      </Sequence>
      <Sequence from={225} durationInFrames={120}>
        <SceneWeBuiltIt />
      </Sequence>
      <Sequence from={345} durationInFrames={300}>
        <SceneSellYourStuff />
      </Sequence>
      <Sequence from={645} durationInFrames={180}>
        <SceneBuiltForProducers />
      </Sequence>
      <Sequence from={825} durationInFrames={210}>
        <SceneStorefront />
      </Sequence>
      <Sequence from={1035} durationInFrames={180}>
        <SceneToolkit />
      </Sequence>
      <Sequence from={1215} durationInFrames={150}>
        <SceneInvitation />
      </Sequence>
    </AbsoluteFill>
  );
};
