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
// ATTENTION — "What do I even post today?" (0s–4s, frames 0–120)
// ═══════════════════════════════════════════════════════════════════════
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(95, 120);

  const bubbleSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 55, stiffness: 170 },
  });
  const bubblePop = spring({
    fps,
    frame: frame - 60,
    config: { damping: 30, stiffness: 200 },
  });
  const bubbleScale = interpolate(bubbleSpring, [0, 1], [0, 1]) *
    interpolate(bubblePop, [0, 1], [1, 0]);

  const smashOp = interpolate(frame, [65, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const smashSpring = spring({
    fps,
    frame: frame - 68,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan}>
      {/* Blank post mockup */}
      <div
        style={{
          opacity: interpolate(bubbleSpring, [0, 1], [0, 1]) *
            interpolate(bubblePop, [0, 0.5], [1, 0], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            width: 280,
            height: 180,
            borderRadius: 20,
            background: `${C.darkGray}cc`,
            border: `1px solid ${C.gray}20`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 220,
              height: 14,
              borderRadius: 7,
              background: `${C.gray}25`,
            }}
          />
        </div>

        {/* Thought bubble */}
        <div
          style={{
            transform: `scale(${bubbleScale})`,
            transformOrigin: "center bottom",
            padding: "20px 28px",
            borderRadius: 24,
            background: `${C.darkGray}ee`,
            border: `1px solid ${C.cyan}30`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: C.white,
              fontFamily: F,
              lineHeight: 1.3,
            }}
          >
            "What do I even{"\n"}post today?"
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[12, 8, 6].map((size, i) => (
            <div
              key={i}
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: `${C.darkGray}cc`,
                transform: `scale(${bubbleScale})`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Smash cut */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 5,
          opacity: smashOp,
          padding: "0 56px",
        }}
      >
        <div
          style={{
            opacity: interpolate(smashSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(smashSpring, [0, 1], [30, 0])}px)`,
            fontSize: 36,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          What if AI{"\n"}
          <GradientText from={C.cyan} to={C.primary}>
            already wrote it
          </GradientText>
          {"\n"}for you?
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// INTEREST — AI Pipeline visualization (4s–12s, frames 120–360)
// ═══════════════════════════════════════════════════════════════════════
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(215, 240);

  const branches = [
    {
      icon: "📱",
      label: "Instagram Caption",
      preview: "🔥 5 mixing mistakes killing your low end...",
      color: C.instagram,
      start: 25,
    },
    {
      icon: "📄",
      label: "Lead Magnet PDF",
      preview: "\"EQ Cheat Sheet\" — 12 pages",
      color: C.green,
      start: 55,
    },
    {
      icon: "📧",
      label: "Email Sequence",
      preview: "Subject: Your mix is muddy — here's why",
      color: C.primary,
      start: 85,
    },
    {
      icon: "📋",
      label: "Cheat Sheet",
      preview: "Compression Quick Reference Guide",
      color: C.gold,
      start: 115,
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={1}>
      <FadeUp delay={0}>
        <SectionLabel color={C.cyan}>AI-POWERED</SectionLabel>
      </FadeUp>

      {/* Source: Course */}
      <FadeUp delay={5}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 24px",
            borderRadius: 16,
            background: `linear-gradient(135deg, ${C.darkGray}ee, ${C.cyan}10)`,
            border: `1px solid ${C.cyan}30`,
            marginBottom: 12,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 32 }}>📚</div>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: C.white,
                fontFamily: F,
              }}
            >
              Your Course Content
            </div>
            <div
              style={{ fontSize: 13, color: C.gray, fontFamily: F }}
            >
              Feed it once, generate forever
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Arrow connector */}
      <div
        style={{
          width: 3,
          background: `linear-gradient(180deg, ${C.cyan}, ${C.primary}40)`,
          height: interpolate(frame, [15, 25], [0, 28], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          borderRadius: 2,
          marginBottom: 8,
        }}
      />

      <div style={{ fontSize: 20, marginBottom: 12 }}>
        <div
          style={{
            opacity: interpolate(frame, [18, 25], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          🤖
        </div>
      </div>

      {/* Branches */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
        }}
      >
        {branches.map((branch, i) => {
          const localFrame = frame - branch.start;
          const enterSpring = spring({
            fps,
            frame: localFrame,
            config: { damping: 55, stiffness: 170 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterX = interpolate(enterSpring, [0, 1], [60, 0]);

          const checkDelay = branch.start + 22;
          const checkSpring = spring({
            fps,
            frame: frame - checkDelay,
            config: { damping: 40, stiffness: 200 },
          });
          const checkScale = interpolate(checkSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${branch.color}25`,
              }}
            >
              <div style={{ fontSize: 26, flexShrink: 0 }}>{branch.icon}</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: branch.color,
                    fontFamily: F,
                  }}
                >
                  {branch.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.gray,
                    fontFamily: F,
                    lineHeight: 1.3,
                    opacity: interpolate(
                      frame,
                      [branch.start + 8, branch.start + 16],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    ),
                  }}
                >
                  {branch.preview}
                </div>
              </div>
              <div
                style={{
                  transform: `scale(${checkScale})`,
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                ✅
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE — Split screen comparison (12s–22s, frames 360–660)
// ═══════════════════════════════════════════════════════════════════════
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(275, 300);

  const withoutTasks = [
    { text: "Write Instagram caption", time: "45 min" },
    { text: "Design lead magnet in Canva", time: "2 hours" },
    { text: "Write email sequence", time: "1.5 hours" },
    { text: "Create course cheat sheet", time: "1 hour" },
  ];

  const withTasks = [
    { text: "Instagram caption" },
    { text: "Lead magnet PDF" },
    { text: "Email sequence" },
    { text: "Course cheat sheet" },
  ];

  const taglineOp = interpolate(frame, [220, 235], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineSpring = spring({
    fps,
    frame: frame - 225,
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
      <BG seed={6} tint={C.cyan} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          padding: "80px 32px 60px",
        }}
      >
        {/* Split columns */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flex: 1,
          }}
        >
          {/* WITHOUT column */}
          <div style={{ flex: 1 }}>
            <FadeUp delay={5}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.red,
                  fontFamily: F,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                WITHOUT PPR
              </div>
            </FadeUp>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {withoutTasks.map((task, i) => {
                const taskDelay = 20 + i * 25;
                const taskOp = interpolate(
                  frame,
                  [taskDelay, taskDelay + 12],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <div
                    key={i}
                    style={{
                      opacity: taskOp,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: `${C.darkGray}cc`,
                      border: `1px solid ${C.red}20`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.white,
                        fontFamily: F,
                        lineHeight: 1.3,
                      }}
                    >
                      {task.text}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.red,
                        fontFamily: F,
                        marginTop: 4,
                      }}
                    >
                      ⏱️ {task.time}
                    </div>
                  </div>
                );
              })}
              <FadeUp delay={120}>
                <div
                  style={{
                    padding: "14px",
                    borderRadius: 10,
                    background: `${C.red}15`,
                    border: `1px solid ${C.red}30`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: C.red,
                      fontFamily: F,
                    }}
                  >
                    5+ hours
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 2,
              background: `linear-gradient(180deg, transparent, ${C.gray}30, transparent)`,
              alignSelf: "stretch",
            }}
          />

          {/* WITH column */}
          <div style={{ flex: 1 }}>
            <FadeUp delay={5}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.green,
                  fontFamily: F,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                WITH PPR
              </div>
            </FadeUp>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {withTasks.map((task, i) => {
                const taskDelay = 20 + i * 25;
                const checkSpring = spring({
                  fps,
                  frame: frame - (taskDelay + 8),
                  config: { damping: 40, stiffness: 200 },
                });
                const taskOp = interpolate(
                  frame,
                  [taskDelay, taskDelay + 12],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <div
                    key={i}
                    style={{
                      opacity: taskOp,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: `${C.darkGray}cc`,
                      border: `1px solid ${C.green}20`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.white,
                        fontFamily: F,
                      }}
                    >
                      {task.text}
                    </div>
                    <div
                      style={{
                        transform: `scale(${interpolate(checkSpring, [0, 1], [0, 1])})`,
                        fontSize: 16,
                      }}
                    >
                      ✅
                    </div>
                  </div>
                );
              })}
              <FadeUp delay={120}>
                <div
                  style={{
                    padding: "14px",
                    borderRadius: 10,
                    background: `${C.green}15`,
                    border: `1px solid ${C.green}30`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: C.green,
                      fontFamily: F,
                    }}
                  >
                    5 minutes
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOp,
            transform: `translateY(${interpolate(taglineSpring, [0, 1], [30, 0])}px)`,
            textAlign: "center",
            marginTop: 40,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.3,
            }}
          >
            <GradientText from={C.cyan} to={C.primary}>
              AI does the marketing.
            </GradientText>
            <div style={{ color: C.white, marginTop: 4 }}>
              You make the music.
            </div>
          </div>
        </div>
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
      <LogoIcon delay={8} size={90} gradientFrom={C.cyan} gradientVia={C.primary} gradientTo={C.pink} glowColor={C.cyan} />

      <FadeUp delay={18}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          The only platform that
        </div>
        <GradientText from={C.cyan} to={C.primary}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            markets for you.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={32}>
        <div style={{ marginTop: 10 }}>
          <CTAButton delay={32} gradientFrom={C.cyan} gradientTo={C.primary} glowColor={C.cyan}>
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
// MAIN COMPOSITION — "AI Does Your Marketing" (28s)
// ═══════════════════════════════════════════════════════════════════════
export const PromoAIMarketing: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={120}>
        <Attention />
      </Sequence>
      <Sequence from={120} durationInFrames={240}>
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
