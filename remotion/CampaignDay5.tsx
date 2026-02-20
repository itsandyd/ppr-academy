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
  useExit,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN DAY 5: "Your Brand, Not Ours"
// Narrative: Kill the biggest objection — "I don't want my audience
//            on someone else's site."
// AIDA: Attention → Interest → Desire → Action (30s total)
// ═══════════════════════════════════════════════════════════════════════

// ─── ATTENTION (0:00–0:05) — Competitor branding exposed ──────────────
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const platforms = [
    { name: "Powered by Gumroad", color: "#FF90E8" },
    { name: "Hosted on Teachable", color: "#FF6B6B" },
    { name: "Made with Linktree", color: "#43E660" },
  ];

  const swipeOut = interpolate(frame, [90, 110], [0, -1200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const swipeOp = interpolate(frame, [90, 105], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headOp = interpolate(frame, [110, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headSpring = spring({
    fps,
    frame: frame - 112,
    config: { damping: 45, stiffness: 190 },
  });

  return (
    <CenterScene tint={C.red}>
      <FadeUp delay={3}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.red,
            fontFamily: F,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 22,
          }}
        >
          LOOK FAMILIAR?
        </div>
      </FadeUp>

      {/* Competitor branding bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          opacity: swipeOp,
          transform: `translateX(${swipeOut}px)`,
        }}
      >
        {platforms.map((plat, i) => {
          const cardDelay = 10 + i * 18;
          const cardOp = interpolate(frame, [cardDelay, cardDelay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          // Red circle animation
          const circleDelay = cardDelay + 14;
          const circleSpring = spring({
            fps,
            frame: frame - circleDelay,
            config: { damping: 40, stiffness: 200 },
          });
          return (
            <div
              key={i}
              style={{
                opacity: cardOp,
                position: "relative",
                padding: "16px 20px",
                borderRadius: 12,
                background: `${C.darkGray}cc`,
                border: `1px solid ${plat.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: plat.color,
                  fontFamily: F,
                }}
              >
                {plat.name}
              </div>
              {/* Red circle */}
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 16,
                  border: `3px solid ${C.red}`,
                  opacity: interpolate(circleSpring, [0, 1], [0, 0.9]),
                  transform: `scale(${interpolate(circleSpring, [0, 1], [1.3, 1])})`,
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Text after swipe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 5,
          opacity: headOp,
          padding: "0 48px",
        }}
      >
        <div
          style={{
            transform: `scale(${interpolate(headSpring, [0, 1], [1.3, 1])})`,
            fontSize: 34,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          Your customers see{"\n"}
          <GradientText from={C.red} to={C.orange}>
            their brand.
          </GradientText>
          {"\n"}Not yours.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── INTEREST (0:05–0:13) — Custom storefront showcase ────────────────
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(218, 240);

  // Typing animation for custom domain
  const domainText = "www.dylanbeats.com";
  const typedChars = Math.min(
    domainText.length,
    Math.floor(interpolate(frame, [30, 80], [0, domainText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }))
  );

  // REAL storefront features from codebase
  const storeFeatures = [
    { icon: "🎨", text: "Custom logo & banner" },
    { icon: "🌈", text: "Your brand colors" },
    { icon: "🔗", text: "Custom domain" },
    { icon: "👤", text: "Zero PPR branding" },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={4}>
      <FadeUp delay={0}>
        <SectionLabel color={C.primary}>YOUR STOREFRONT</SectionLabel>
      </FadeUp>

      {/* URL bar mockup */}
      <FadeUp delay={8}>
        <div
          style={{
            width: "100%",
            padding: "12px 18px",
            borderRadius: 12,
            background: `${C.darkGray}ee`,
            border: `1px solid ${C.primary}30`,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: C.green,
            }}
          />
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.white,
              fontFamily: "monospace",
            }}
          >
            {domainText.substring(0, typedChars)}
            <span
              style={{
                opacity: Math.sin(frame * 0.15) > 0 ? 1 : 0,
                color: C.primary,
              }}
            >
              |
            </span>
          </div>
        </div>
      </FadeUp>

      {/* Storefront mockup */}
      <FadeUp delay={20}>
        <div
          style={{
            width: "100%",
            padding: "20px 18px",
            borderRadius: 16,
            background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
            border: `1px solid ${C.primary}20`,
            marginBottom: 16,
          }}
        >
          {/* Creator header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                Dylan Beats
              </div>
              <div style={{ fontSize: 11, color: C.gray, fontFamily: F }}>
                Producer • Beat Maker
              </div>
            </div>
          </div>

          {/* Products */}
          {[
            { name: "Serum Preset Pack", price: "$25", icon: "🎛️" },
            { name: "Lo-Fi Beat Lease", price: "$35", icon: "🎵" },
            { name: "Mixing Masterclass", price: "$49", icon: "🎓" },
          ].map((prod, i) => {
            const pDelay = 40 + i * 14;
            const pOp = interpolate(frame, [pDelay, pDelay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity: pOp,
                  padding: "8px 0",
                  borderBottom: i < 2 ? `1px solid ${C.primary}15` : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{prod.icon}</span>
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
                    color: C.primary,
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

      {/* Domain diagram */}
      <FadeUp delay={90}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.primary,
              fontFamily: "monospace",
            }}
          >
            dylanbeats.com
          </div>
          <div style={{ fontSize: 16, color: C.gray }}>→</div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.gray,
              fontFamily: F,
            }}
          >
            PPR (invisible)
          </div>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── DESIRE (0:13–0:22) — Complete ecosystem in 4 quadrants ───────────
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(248, 270);

  // REAL features from codebase
  const quadrants = [
    {
      icon: "🏪",
      label: "Branded Storefront",
      desc: "Custom domain + logo",
      color: C.primary,
    },
    {
      icon: "🔗",
      label: "Link-in-Bio",
      desc: "Drag & drop links",
      color: C.pink,
    },
    {
      icon: "📧",
      label: "Email Campaigns",
      desc: "Your logo, your brand",
      color: C.cyan,
    },
    {
      icon: "📱",
      label: "Social Content",
      desc: "AI-generated scripts",
      color: C.gold,
    },
  ];

  const centerOp = interpolate(frame, [180, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const centerSpring = spring({
    fps,
    frame: frame - 185,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={5}>
      <FadeUp delay={0}>
        <SectionLabel color={C.primary}>YOUR ECOSYSTEM</SectionLabel>
      </FadeUp>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          width: "100%",
          marginBottom: 24,
        }}
      >
        {quadrants.map((q, i) => {
          const qDelay = 10 + i * 25;
          const qSpring = spring({
            fps,
            frame: frame - qDelay,
            config: { damping: 55, stiffness: 170 },
          });
          const qOp = interpolate(qSpring, [0, 1], [0, 1]);
          const qScale = interpolate(qSpring, [0, 1], [0.8, 1]);

          // Shrink at end
          const shrinkScale = interpolate(frame, [160, 180], [1, 0.88], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity: qOp,
                transform: `scale(${qScale * shrinkScale})`,
                padding: "18px 14px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${q.color}30`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                boxShadow: `0 0 20px ${q.color}10`,
              }}
            >
              <div style={{ fontSize: 28 }}>{q.icon}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: q.color,
                  fontFamily: F,
                  textAlign: "center",
                }}
              >
                {q.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.gray,
                  fontFamily: F,
                  textAlign: "center",
                }}
              >
                {q.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center text */}
      <div
        style={{
          opacity: centerOp,
          transform: `scale(${interpolate(centerSpring, [0, 1], [0.9, 1])})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.3,
          }}
        >
          <GradientText from={C.primary} to={C.pink}>
            One platform.
          </GradientText>
          <div style={{ color: C.white, marginTop: 4, fontSize: 22 }}>
            Entirely yours.
          </div>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── ACTION (0:22–0:30) — CTA ─────────────────────────────────────────
const Action: React.FC = () => {
  return (
    <CenterScene>
      <LogoIcon
        delay={6}
        size={90}
        gradientFrom={C.primary}
        gradientVia={C.purple}
        gradientTo={C.pink}
        glowColor={C.primary}
      />

      <FadeUp delay={16}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          Build{" "}
          <GradientText from={C.primary} to={C.pink}>
            your brand,
          </GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={24}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          not someone else's.
        </div>
      </FadeUp>

      <FadeUp delay={38}>
        <div style={{ marginTop: 14 }}>
          <CTAButton delay={38}>Start Free →</CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={50}>
        <div
          style={{
            marginTop: 24,
            fontSize: 17,
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
// MAIN COMPOSITION — Campaign Day 5: "Your Brand, Not Ours" (30s)
//
// Timing breakdown:
//   0.5s  buffer          15 fr
//   5.0s  Attention       150 fr  (competitor branding → swipe)
//   8.0s  Interest        240 fr  (custom storefront + domain)
//   9.0s  Desire          270 fr  (4 quadrants → center text)
//   7.0s  Action          210 fr  (CTA)
//   0.5s  buffer          15 fr
//   ─────────────────────────────
//   30.0s total           900 fr
// ═══════════════════════════════════════════════════════════════════════
export const CampaignDay5: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={15} durationInFrames={150}>
        <Attention />
      </Sequence>
      <Sequence from={165} durationInFrames={240}>
        <Interest />
      </Sequence>
      <Sequence from={405} durationInFrames={270}>
        <Desire />
      </Sequence>
      <Sequence from={675} durationInFrames={210}>
        <Action />
      </Sequence>
    </AbsoluteFill>
  );
};
