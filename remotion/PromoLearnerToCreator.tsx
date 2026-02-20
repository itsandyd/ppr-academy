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
// ATTENTION — "Generic platforms, generic products" (0s–5s, frames 0–150)
// ═══════════════════════════════════════════════════════════════════════
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(125, 150);

  const genericLabels = [
    "Digital Product",
    "Online Course",
    "Download Item",
    "File Upload",
  ];

  const smashFrame = 75;
  const genericOp = interpolate(frame, [smashFrame - 5, smashFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const boldSpring = spring({
    fps,
    frame: frame - smashFrame,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gray}>
      {/* Generic platform mockup */}
      <div style={{ opacity: genericOp }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            marginBottom: 28,
          }}
        >
          {genericLabels.map((label, i) => {
            const delay = 8 + i * 12;
            const labelOp = interpolate(frame, [delay, delay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity: labelOp,
                  padding: "16px 22px",
                  borderRadius: 10,
                  background: `${C.darkGray}60`,
                  border: `1px solid ${C.gray}15`,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: `${C.gray}99`,
                    fontFamily: F,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <FadeUp delay={55}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: C.gray,
              fontFamily: F,
              lineHeight: 1.3,
              textAlign: "center",
            }}
          >
            Generic platforms sell{"\n"}generic products.
          </div>
        </FadeUp>
      </div>

      {/* Bold statement */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 5,
          opacity: interpolate(boldSpring, [0, 1], [0, 1]),
          padding: "0 56px",
        }}
      >
        <div
          style={{
            transform: `translateY(${interpolate(boldSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            You don't make
          </div>
          <GradientText from={C.orange} to={C.pink}>
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                fontFamily: F,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              generic products.
            </div>
          </GradientText>
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// INTEREST — Music-specific product types (5s–13s, frames 150–390)
// ═══════════════════════════════════════════════════════════════════════
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(215, 240);

  const products = [
    {
      icon: "🎓",
      title: "Mixing Courses",
      desc: "Teach mixing with video lessons",
      color: C.primary,
      start: 10,
    },
    {
      icon: "🎹",
      title: "Beats + Licensing",
      desc: "Sell beats with auto-generated contracts",
      color: C.pink,
      start: 40,
    },
    {
      icon: "🎛️",
      title: "Preset Packs",
      desc: "Serum, Vital, any DAW — any format",
      color: C.cyan,
      start: 70,
    },
    {
      icon: "🔊",
      title: "Sample Packs",
      desc: "Loops, one-shots, with waveform previews",
      color: C.green,
      start: 100,
    },
    {
      icon: "📅",
      title: "1-on-1 Coaching",
      desc: "Book sessions directly on your store",
      color: C.gold,
      start: 130,
    },
    {
      icon: "📂",
      title: "Mixing Templates",
      desc: "DAW sessions, FX chains, project files",
      color: C.orange,
      start: 160,
    },
  ];

  const taglineOp = interpolate(frame, [195, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={10}>
      <FadeUp delay={0}>
        <SectionLabel color={C.orange}>BUILT FOR MUSIC</SectionLabel>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          marginTop: 8,
        }}
      >
        {products.map((prod, i) => {
          const localFrame = frame - prod.start;
          const enterSpring = spring({
            fps,
            frame: localFrame,
            config: { damping: 55, stiffness: 170 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterX = interpolate(enterSpring, [0, 1], [60, 0]);
          const isActive = localFrame >= 0 && localFrame < 40;

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderRadius: 14,
                background: isActive
                  ? `linear-gradient(135deg, ${C.darkGray}ee, ${prod.color}10)`
                  : `${C.darkGray}88`,
                border: `1px solid ${isActive ? prod.color + "35" : prod.color + "10"}`,
              }}
            >
              <div style={{ fontSize: 28, flexShrink: 0 }}>{prod.icon}</div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {prod.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: isActive ? prod.color : C.gray,
                    fontFamily: F,
                    lineHeight: 1.3,
                  }}
                >
                  {prod.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          opacity: taglineOp,
          marginTop: 20,
          padding: "10px 24px",
          borderRadius: 10,
          background: `${C.orange}10`,
          border: `1px solid ${C.orange}25`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.orange,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          Every product type a music producer sells.
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE A — "AI that speaks your language" (frames 0–90)
// ═══════════════════════════════════════════════════════════════════════
const DesireAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(70, 90);

  const captionText = `🔥 Stop boosting your high-mids at 3kHz — here's why your vocals sound harsh.\n\nMost producers crank the presence shelf without checking the bus. Instead:\n\n1. Cut 2-4kHz on competing elements\n2. Use a dynamic EQ on the vocal bus\n3. Let the compressor shape the attack\n\nFull breakdown in my new course ↗️`;

  const charsVisible = Math.min(
    captionText.length,
    Math.floor(
      interpolate(frame, [15, 65], [0, captionText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={11}>
      <FadeUp delay={3}>
        <SectionLabel color={C.cyan}>AI-GENERATED</SectionLabel>
      </FadeUp>

      <div
        style={{
          width: "100%",
          padding: "20px",
          borderRadius: 16,
          background: `${C.darkGray}ee`,
          border: `1px solid ${C.cyan}20`,
          marginTop: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 22 }}>📱</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.instagram,
              fontFamily: F,
            }}
          >
            Instagram Caption
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: C.gray,
              fontFamily: F,
            }}
          >
            🤖 AI Generated
          </div>
        </div>
        <div
          style={{
            fontSize: 14,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            minHeight: 200,
          }}
        >
          {captionText.slice(0, charsVisible)}
        </div>
      </div>

      <FadeUp delay={60}>
        <div
          style={{
            marginTop: 20,
            fontSize: 24,
            fontWeight: 900,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          <GradientText from={C.cyan} to={C.primary}>
            AI that speaks your language.
          </GradientText>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE B — "Tools your students use" (frames 0–90)
// ═══════════════════════════════════════════════════════════════════════
const DesireTools: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(70, 90);

  const cheatsheetRows = [
    { label: "Reverb Type", value: "Plate", color: C.purple },
    { label: "Decay", value: "1.8s", color: C.cyan },
    { label: "Pre-delay", value: "35ms", color: C.green },
    { label: "High Cut", value: "8kHz", color: C.gold },
    { label: "Mix", value: "22%", color: C.pink },
    { label: "EQ After", value: "Cut 200Hz", color: C.orange },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={12}>
      <FadeUp delay={3}>
        <SectionLabel color={C.gold}>AI CHEAT SHEET</SectionLabel>
      </FadeUp>

      <div
        style={{
          width: "100%",
          padding: "20px",
          borderRadius: 16,
          background: `${C.darkGray}ee`,
          border: `1px solid ${C.gold}20`,
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            marginBottom: 16,
          }}
        >
          📋 Reverb Quick Reference
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cheatsheetRows.map((row, i) => {
            const rowDelay = 12 + i * 8;
            const rowOp = interpolate(frame, [rowDelay, rowDelay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity: rowOp,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: `${C.bg}cc`,
                  border: `1px solid ${row.color}15`,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: C.gray,
                    fontFamily: F,
                    fontWeight: 500,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: row.color,
                    fontFamily: "monospace",
                  }}
                >
                  {row.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FadeUp delay={65}>
        <div
          style={{
            marginTop: 20,
            fontSize: 24,
            fontWeight: 900,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          <GradientText from={C.gold} to={C.orange}>
            Tools your students actually use.
          </GradientText>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE C — Side-by-side comparison (frames 0–90)
// ═══════════════════════════════════════════════════════════════════════
const DesireCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(70, 90);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: op,
        transform: `translateY(${y}px)`,
      }}
    >
      <BG seed={13} tint={C.orange} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "80px 32px 80px",
        }}
      >
        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          {/* Generic side */}
          <div style={{ flex: 1 }}>
            <FadeUp delay={5}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.gray,
                  fontFamily: F,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                GENERIC
              </div>
            </FadeUp>
            <FadeUp delay={12}>
              <div
                style={{
                  padding: "20px 16px",
                  borderRadius: 14,
                  background: `${C.darkGray}60`,
                  border: `1px solid ${C.gray}15`,
                  height: 400,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: "80%",
                    height: 12,
                    borderRadius: 6,
                    background: `${C.gray}20`,
                  }}
                />
                <div
                  style={{
                    width: "60%",
                    height: 10,
                    borderRadius: 5,
                    background: `${C.gray}15`,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    background: `${C.gray}10`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: `${C.gray}60`,
                      fontFamily: F,
                    }}
                  >
                    File download
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    background: `${C.gray}15`,
                    textAlign: "center",
                    fontSize: 14,
                    color: `${C.gray}80`,
                    fontFamily: F,
                  }}
                >
                  Buy — $29
                </div>
              </div>
            </FadeUp>
          </div>

          {/* PPR side */}
          <div style={{ flex: 1 }}>
            <FadeUp delay={5}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.orange,
                  fontFamily: F,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                PPR ACADEMY
              </div>
            </FadeUp>
            <FadeUp delay={18}>
              <div
                style={{
                  padding: "20px 16px",
                  borderRadius: 14,
                  background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
                  border: `1px solid ${C.orange}25`,
                  height: 400,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
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
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
                      fontSize: 14,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    🎵
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: C.white,
                      fontFamily: F,
                    }}
                  >
                    Mixing Masterclass
                  </div>
                </div>

                {/* Waveform decoration */}
                <svg viewBox="0 0 200 30" style={{ width: "100%", height: 30 }}>
                  {Array.from({ length: 40 }, (_, i) => {
                    const h = 5 + Math.sin(i * 0.4 + frame * 0.05) * 10;
                    return (
                      <rect
                        key={i}
                        x={i * 5}
                        y={15 - h / 2}
                        width={3}
                        height={h}
                        rx={1.5}
                        fill={C.orange}
                        opacity={0.6}
                      />
                    );
                  })}
                </svg>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  {["12 Video Lessons", "AI Cheat Sheets", "Certificate"].map(
                    (item, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: C.gray,
                          fontFamily: F,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ color: C.green, fontSize: 11 }}>✓</span>
                        {item}
                      </div>
                    )
                  )}
                </div>

                <div
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  Enroll — $29
                </div>
              </div>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={40}>
          <div
            style={{
              textAlign: "center",
              marginTop: 28,
              fontSize: 26,
              fontWeight: 900,
              fontFamily: F,
            }}
          >
            <GradientText from={C.orange} to={C.pink}>
              Built for this. Not adapted for it.
            </GradientText>
          </div>
        </FadeUp>
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
      <LogoIcon delay={8} size={90} gradientFrom={C.orange} gradientVia={C.pink} gradientTo={C.primary} glowColor={C.orange} />

      <FadeUp delay={18}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
          }}
        >
          The platform built for
        </div>
        <GradientText from={C.orange} to={C.pink}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            music producers.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={30}>
        <div
          style={{
            marginTop: 12,
            fontSize: 22,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
          }}
        >
          Not adapted.{" "}
          <span style={{ color: C.white }}>Built.</span>
        </div>
      </FadeUp>

      <FadeUp delay={40}>
        <div style={{ marginTop: 16 }}>
          <CTAButton delay={40} gradientFrom={C.orange} gradientTo={C.pink} glowColor={C.orange}>
            Start Free →
          </CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={52}>
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
// MAIN COMPOSITION — "Made for Music Producers" (28s)
// ═══════════════════════════════════════════════════════════════════════
export const PromoLearnerToCreator: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={150}>
        <Attention />
      </Sequence>
      <Sequence from={150} durationInFrames={240}>
        <Interest />
      </Sequence>
      <Sequence from={390} durationInFrames={90}>
        <DesireAI />
      </Sequence>
      <Sequence from={480} durationInFrames={90}>
        <DesireTools />
      </Sequence>
      <Sequence from={570} durationInFrames={90}>
        <DesireCompare />
      </Sequence>
      <Sequence from={660} durationInFrames={180}>
        <Action />
      </Sequence>
    </AbsoluteFill>
  );
};
