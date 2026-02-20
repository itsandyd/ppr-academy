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
// CAMPAIGN DAY 3: "AI Does Your Marketing"
// Narrative: Drop the differentiator. The "wait, what?" moment.
// AIDA: Attention → Interest → Desire → Action (30s total)
// ═══════════════════════════════════════════════════════════════════════

// ─── ATTENTION (0:00–0:05) — "What do I even post today?" ─────────────
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bubbleSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 55, stiffness: 170 },
  });
  const bubblePop = spring({
    fps,
    frame: frame - 55,
    config: { damping: 30, stiffness: 200 },
  });
  const bubbleScale =
    interpolate(bubbleSpring, [0, 1], [0, 1]) *
    interpolate(bubblePop, [0, 1], [1, 0]);

  const smashOp = interpolate(frame, [60, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const smashSpring = spring({
    fps,
    frame: frame - 63,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene tint={C.cyan}>
      {/* Blank post mockup */}
      <div
        style={{
          opacity:
            interpolate(bubbleSpring, [0, 1], [0, 1]) *
            interpolate(bubblePop, [0, 0.5], [1, 0], {
              extrapolateRight: "clamp",
            }),
        }}
      >
        <div
          style={{
            width: 260,
            height: 160,
            borderRadius: 18,
            background: `${C.darkGray}cc`,
            border: `1px solid ${C.gray}20`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 200,
              height: 12,
              borderRadius: 6,
              background: `${C.gray}25`,
            }}
          />
        </div>

        {/* Thought bubble */}
        <div
          style={{
            transform: `scale(${bubbleScale})`,
            transformOrigin: "center bottom",
            padding: "18px 24px",
            borderRadius: 22,
            background: `${C.darkGray}ee`,
            border: `1px solid ${C.cyan}30`,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: C.white,
              fontFamily: F,
              lineHeight: 1.3,
            }}
          >
            "What do I even{"\n"}post today?"
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 7 }}>
          {[11, 8, 5].map((size, i) => (
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
            fontSize: 34,
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

// ─── INTEREST (0:05–0:13) — AI Pipeline visualization ─────────────────
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(218, 240);

  // REAL AI features from the codebase
  const branches = [
    {
      icon: "📱",
      label: "TikTok Script",
      preview: "🔥 5 mixing mistakes killing your low end...",
      color: C.instagram,
      start: 22,
    },
    {
      icon: "📄",
      label: "Lead Magnet PDF",
      preview: '"EQ Cheat Sheet" — 12 pages',
      color: C.green,
      start: 48,
    },
    {
      icon: "📧",
      label: "Email Sequence",
      preview: "Subject: Your mix is muddy — here's why",
      color: C.primary,
      start: 74,
    },
    {
      icon: "📋",
      label: "Cheat Sheet Pack",
      preview: "Compression Quick Reference Guide",
      color: C.gold,
      start: 100,
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={1}>
      <FadeUp delay={0}>
        <SectionLabel color={C.cyan}>AI-POWERED PIPELINE</SectionLabel>
      </FadeUp>

      {/* Source: Course content */}
      <FadeUp delay={5}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${C.darkGray}ee, ${C.cyan}10)`,
            border: `1px solid ${C.cyan}30`,
            marginBottom: 10,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 28 }}>📚</div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.white,
                fontFamily: F,
              }}
            >
              Your Course Content
            </div>
            <div style={{ fontSize: 12, color: C.gray, fontFamily: F }}>
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
          height: interpolate(frame, [12, 22], [0, 24], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          borderRadius: 2,
          marginBottom: 6,
        }}
      />

      <div style={{ fontSize: 18, marginBottom: 10 }}>
        <div
          style={{
            opacity: interpolate(frame, [16, 22], [0, 1], {
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
          gap: 8,
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
          const enterX = interpolate(enterSpring, [0, 1], [50, 0]);

          const checkDelay = branch.start + 18;
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
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${branch.color}25`,
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{branch.icon}</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: branch.color,
                    fontFamily: F,
                  }}
                >
                  {branch.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.gray,
                    fontFamily: F,
                    lineHeight: 1.3,
                    opacity: interpolate(
                      frame,
                      [branch.start + 6, branch.start + 14],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }
                    ),
                  }}
                >
                  {branch.preview}
                </div>
              </div>
              <div
                style={{
                  transform: `scale(${checkScale})`,
                  fontSize: 18,
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

// ─── DESIRE (0:13–0:22) — Split screen time comparison ────────────────
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(248, 270);

  const withoutTasks = [
    { text: "Write Instagram caption", time: "45 min" },
    { text: "Design lead magnet PDF", time: "2 hours" },
    { text: "Write email sequence", time: "1.5 hours" },
    { text: "Create cheat sheet", time: "1 hour" },
  ];

  const withTasks = [
    { text: "Instagram caption" },
    { text: "Lead magnet PDF" },
    { text: "Email sequence" },
    { text: "Cheat sheet pack" },
  ];

  const taglineOp = interpolate(frame, [200, 215], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineSpring = spring({
    fps,
    frame: frame - 205,
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
          padding: "80px 30px 60px",
        }}
      >
        {/* Split columns */}
        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          {/* WITHOUT column */}
          <div style={{ flex: 1 }}>
            <FadeUp delay={5}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.red,
                  fontFamily: F,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 14,
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
                gap: 8,
              }}
            >
              {withoutTasks.map((task, i) => {
                const taskDelay = 18 + i * 22;
                const taskOp = interpolate(
                  frame,
                  [taskDelay, taskDelay + 10],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <div
                    key={i}
                    style={{
                      opacity: taskOp,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: `${C.darkGray}cc`,
                      border: `1px solid ${C.red}20`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
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
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.red,
                        fontFamily: F,
                        marginTop: 3,
                      }}
                    >
                      ⏱️ {task.time}
                    </div>
                  </div>
                );
              })}
              <FadeUp delay={108}>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: `${C.red}15`,
                    border: `1px solid ${C.red}30`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
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
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.green,
                  fontFamily: F,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 14,
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
                gap: 8,
              }}
            >
              {withTasks.map((task, i) => {
                const taskDelay = 18 + i * 22;
                const checkSpring = spring({
                  fps,
                  frame: frame - (taskDelay + 6),
                  config: { damping: 40, stiffness: 200 },
                });
                const taskOp = interpolate(
                  frame,
                  [taskDelay, taskDelay + 10],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <div
                    key={i}
                    style={{
                      opacity: taskOp,
                      padding: "10px 12px",
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
                        fontSize: 13,
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
                        fontSize: 14,
                      }}
                    >
                      ✅
                    </div>
                  </div>
                );
              })}
              <FadeUp delay={108}>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: `${C.green}15`,
                    border: `1px solid ${C.green}30`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
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
            transform: `translateY(${interpolate(taglineSpring, [0, 1], [25, 0])}px)`,
            textAlign: "center",
            marginTop: 36,
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

// ─── ACTION (0:22–0:30) — CTA ─────────────────────────────────────────
const Action: React.FC = () => {
  return (
    <CenterScene>
      <LogoIcon
        delay={6}
        size={90}
        gradientFrom={C.cyan}
        gradientVia={C.primary}
        gradientTo={C.pink}
        glowColor={C.cyan}
      />

      <FadeUp delay={16}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          The only platform that
        </div>
        <GradientText from={C.cyan} to={C.primary}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            markets for you.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={30}>
        <div style={{ marginTop: 10 }}>
          <CTAButton
            delay={30}
            gradientFrom={C.cyan}
            gradientTo={C.primary}
            glowColor={C.cyan}
          >
            Start Free →
          </CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={42}>
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
// MAIN COMPOSITION — Campaign Day 3: "AI Does Your Marketing" (30s)
//
// Timing breakdown:
//   0.5s  buffer          15 fr
//   5.0s  Attention       150 fr  (blank post → thought bubble → smash)
//   8.0s  Interest        240 fr  (AI pipeline: course → 4 outputs)
//   9.0s  Desire          270 fr  (split screen: 5hrs vs 5min)
//   7.0s  Action          210 fr  (CTA)
//   0.5s  buffer          15 fr
//   ─────────────────────────────
//   30.0s total           900 fr
// ═══════════════════════════════════════════════════════════════════════
export const CampaignDay3: React.FC = () => {
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
