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
// ATTENTION — "Their brand, not yours" (0s–5s, frames 0–150)
// ═══════════════════════════════════════════════════════════════════════
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(125, 150);

  const platforms = [
    { name: "Powered by Gumroad", color: "#FF90E8" },
    { name: "Hosted on Teachable", color: "#FF6B6B" },
    { name: "Made with Linktree", color: "#43E660" },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red}>
      <FadeUp delay={3}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.red,
            fontFamily: F,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          LOOK FAMILIAR?
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: "100%",
          marginBottom: 36,
        }}
      >
        {platforms.map((plat, i) => {
          const delay = 15 + i * 25;
          const enterOp = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const shake =
            frame > delay + 10 && frame < delay + 22
              ? Math.sin((frame - delay - 10) * 2) * 4
              : 0;
          const swipeX = interpolate(
            frame,
            [delay + 25, delay + 35],
            [0, -500],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const swipeOp = interpolate(
            frame,
            [delay + 25, delay + 35],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                opacity: enterOp * swipeOp,
                transform: `translateX(${shake + swipeX}px)`,
                padding: "18px 24px",
                borderRadius: 14,
                background: `${C.darkGray}cc`,
                border: `1px solid ${C.red}20`,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {plat.name}
              </div>
              {/* Red circle highlight */}
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 18,
                  border: `2px solid ${C.red}60`,
                  opacity: interpolate(
                    frame,
                    [delay + 8, delay + 14],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                }}
              />
            </div>
          );
        })}
      </div>

      <FadeUp delay={80}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
          }}
        >
          Your customers see
        </div>
        <GradientText from={C.red} to={C.orange}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            their brand. Not yours.
          </div>
        </GradientText>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// INTEREST — Custom domain storefront (5s–12s, frames 150–360)
// ═══════════════════════════════════════════════════════════════════════
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(185, 210);

  const domain = "www.dylanbeats.com";
  const charsVisible = Math.min(
    domain.length,
    Math.floor(
      interpolate(frame, [20, 55], [0, domain.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );
  const cursorBlink = Math.sin(frame * 0.15) > 0 ? 1 : 0;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={3}>
      <FadeUp delay={3}>
        <SectionLabel color={C.purple}>YOUR BRAND</SectionLabel>
      </FadeUp>

      {/* Storefront mockup */}
      <div
        style={{
          width: "100%",
          borderRadius: 20,
          background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
          border: `1px solid ${C.purple}20`,
          overflow: "hidden",
        }}
      >
        {/* URL bar */}
        <div
          style={{
            padding: "12px 20px",
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
              fontSize: 15,
              fontFamily: "monospace",
              color: C.white,
            }}
          >
            {domain.slice(0, charsVisible)}
            <span style={{ opacity: charsVisible < domain.length ? cursorBlink : 0, color: C.purple }}>
              |
            </span>
          </div>
        </div>

        {/* Store content */}
        <div style={{ padding: "20px 20px 24px" }}>
          <FadeUp delay={50}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 22,
                }}
              >
                🎵
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                DylanBeats
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={60}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Mixing Course", "Beat Pack", "Preset Bundle"].map((name, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: `${C.bg}cc`,
                    border: `1px solid ${C.purple}15`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.white, fontFamily: F }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.purple, fontFamily: F }}>
                    {["$49", "$19", "$15"][i]}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={80}>
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: C.gray,
                fontFamily: F,
                textAlign: "center",
                fontWeight: 500,
                opacity: 0.6,
              }}
            >
              Zero PPR Academy branding visible
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Domain connection */}
      <FadeUp delay={100}>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: "monospace" }}>
            dylanbeats.com
          </div>
          <div style={{ fontSize: 16, color: C.purple }}>→</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>
            PPR Academy
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          Custom domain. Your identity.{"\n"}Our infrastructure.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE — Creator ecosystem quadrants (12s–22s, frames 360–660)
// ═══════════════════════════════════════════════════════════════════════
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(275, 300);

  const scenes = [
    { label: "Your Storefront", icon: "🏪", color: C.purple, start: 0 },
    { label: "Your Link-in-Bio", icon: "🔗", color: C.pink, start: 60 },
    { label: "Your Emails", icon: "📧", color: C.cyan, start: 120 },
    { label: "Your Content", icon: "📱", color: C.green, start: 180 },
  ];

  const quadrantStart = 240;
  const allInQuadrant = frame >= quadrantStart;

  const centerTextSpring = spring({
    fps,
    frame: frame - (quadrantStart + 10),
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: op,
        transform: `translateY(${y}px)`,
      }}
    >
      <BG seed={7} tint={C.purple} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 40px",
        }}
      >
        {!allInQuadrant ? (
          // Sequential full-screen cards
          scenes.map((scene, i) => {
            const localFrame = frame - scene.start;
            const isVisible = localFrame >= 0 && localFrame < 60;
            const enterSpring = spring({
              fps,
              frame: localFrame,
              config: { damping: 55, stiffness: 170 },
            });
            const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
            const enterScale = interpolate(enterSpring, [0, 1], [0.9, 1]);
            const exitOp = interpolate(localFrame, [45, 58], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            if (!isVisible && localFrame < 0) return null;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: enterOp * exitOp,
                  transform: `scale(${enterScale})`,
                  padding: "0 56px",
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 24 }}>{scene.icon}</div>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    fontFamily: F,
                    lineHeight: 1.2,
                  }}
                >
                  <GradientText from={scene.color} to={C.white}>
                    {scene.label}
                  </GradientText>
                </div>
              </div>
            );
          })
        ) : (
          // Quadrant layout
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                width: "100%",
                justifyContent: "center",
              }}
            >
              {scenes.map((scene, i) => {
                const quadSpring = spring({
                  fps,
                  frame: frame - quadrantStart - i * 4,
                  config: { damping: 50, stiffness: 160 },
                });
                const quadScale = interpolate(quadSpring, [0, 1], [0.5, 1]);
                const quadOp = interpolate(quadSpring, [0, 1], [0, 1]);

                return (
                  <div
                    key={i}
                    style={{
                      width: "46%",
                      opacity: quadOp,
                      transform: `scale(${quadScale})`,
                      padding: "20px 16px",
                      borderRadius: 16,
                      background: `${C.darkGray}cc`,
                      border: `1px solid ${scene.color}25`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{scene.icon}</div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: scene.color,
                        fontFamily: F,
                      }}
                    >
                      {scene.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 32,
                opacity: interpolate(centerTextSpring, [0, 1], [0, 1]),
                transform: `scale(${interpolate(centerTextSpring, [0, 1], [0.85, 1])})`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: C.white,
                  fontFamily: F,
                  lineHeight: 1.2,
                }}
              >
                One platform.
              </div>
              <GradientText from={C.purple} to={C.pink}>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    fontFamily: F,
                    lineHeight: 1.2,
                  }}
                >
                  Entirely yours.
                </div>
              </GradientText>
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ACTION — CTA (22s–28s, frames 660–840)
// ═══════════════════════════════════════════════════════════════════════
const Action: React.FC = () => {
  return (
    <CenterScene>
      <LogoIcon delay={8} size={90} gradientFrom={C.purple} gradientVia={C.pink} gradientTo={C.warmOrange} glowColor={C.purple} />

      <FadeUp delay={18}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
          }}
        >
          Build your brand,
        </div>
        <GradientText from={C.purple} to={C.pink}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            not someone else's.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={32}>
        <div style={{ marginTop: 10 }}>
          <CTAButton delay={32} gradientFrom={C.purple} gradientTo={C.pink} glowColor={C.purple}>
            Start Free →
          </CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={45}>
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            color: C.gray,
            fontFamily: "monospace",
            letterSpacing: 1.5,
          }}
        >
          academy.pauseplayrepeat.com
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION — "Your Brand, Not Ours" (28s)
// ═══════════════════════════════════════════════════════════════════════
export const PromoStorefront: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={150}>
        <Attention />
      </Sequence>
      <Sequence from={150} durationInFrames={210}>
        <Interest />
      </Sequence>
      <Sequence from={360} durationInFrames={300}>
        <Desire />
      </Sequence>
      <Sequence from={660} durationInFrames={180}>
        <Action />
      </Sequence>
    </AbsoluteFill>
  );
};
