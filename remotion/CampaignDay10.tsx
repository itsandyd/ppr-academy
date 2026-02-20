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
// CAMPAIGN DAY 10: "Stop Paying for 5 Tools"
// Narrative: The closer. Direct sales pitch. Financial argument.
// AIDA: Attention → Interest → Desire → Action (30s total)
// ═══════════════════════════════════════════════════════════════════════

// ─── ATTENTION (0:00–0:05) — Competitor cost stack ────────────────────
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const competitors = [
    { name: "Gumroad", price: 10, color: "#FF90E8" },
    { name: "Teachable", price: 39, color: "#FF6B6B" },
    { name: "ConvertKit", price: 29, color: "#FB6970" },
    { name: "Canva", price: 13, color: "#00C4CC" },
    { name: "Linktree", price: 9, color: "#43E660" },
  ];

  // Running total animation
  const totalTarget = competitors.reduce((s, c) => s + c.price, 0); // $100
  const runningTotal = interpolate(frame, [20, 120], [0, totalTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const totalRedFlash = interpolate(frame, [115, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headerOp = interpolate(frame, [3, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene tint={C.red}>
      <FadeUp delay={0}>
        <div
          style={{
            opacity: headerOp,
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
            marginBottom: 22,
          }}
        >
          You're paying for{"\n"}
          <GradientText from={C.red} to={C.orange}>
            5 tools.
          </GradientText>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          width: "100%",
          marginBottom: 18,
        }}
      >
        {competitors.map((comp, i) => {
          const cDelay = 14 + i * 16;
          const cOp = interpolate(frame, [cDelay, cDelay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: cOp,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 16px",
                borderRadius: 10,
                background: `${C.darkGray}cc`,
                border: `1px solid ${comp.color}25`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: comp.color,
                  fontFamily: F,
                }}
              >
                {comp.name}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.gray,
                  fontFamily: "monospace",
                }}
              >
                ${comp.price}/mo
              </div>
            </div>
          );
        })}
      </div>

      {/* Running total */}
      <div
        style={{
          padding: "14px 20px",
          borderRadius: 12,
          background: `${C.red}${Math.round(10 + totalRedFlash * 10).toString(16)}`,
          border: `1px solid ${C.red}${Math.round(30 + totalRedFlash * 40).toString(16)}`,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: interpolate(totalRedFlash, [0, 1], [0, 1]) > 0.5 ? C.red : C.white,
            fontFamily: "monospace",
            transition: "color 0.2s",
          }}
        >
          ~${Math.round(runningTotal)}/mo
        </div>
      </div>
    </CenterScene>
  );
};

// ─── INTEREST (0:05–0:13) — One platform replaces all ─────────────────
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(218, 240);

  const headerOp = interpolate(frame, [3, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headerSpring = spring({
    fps,
    frame: frame - 6,
    config: { damping: 50, stiffness: 170 },
  });

  // REAL features mapped to competitors
  const replacements = [
    {
      feature: "Courses & Products",
      replaces: "Teachable",
      icon: "🎓",
      color: C.orange,
      start: 20,
    },
    {
      feature: "Digital Sales",
      replaces: "Gumroad",
      icon: "💰",
      color: C.pink,
      start: 48,
    },
    {
      feature: "Email Campaigns",
      replaces: "ConvertKit",
      icon: "📧",
      color: C.primary,
      start: 76,
    },
    {
      feature: "AI Content & PDFs",
      replaces: "Canva",
      icon: "🤖",
      color: C.cyan,
      start: 104,
    },
    {
      feature: "Link-in-Bio",
      replaces: "Linktree",
      icon: "🔗",
      color: C.green,
      start: 132,
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={1}>
      <div
        style={{
          opacity: headerOp,
          transform: `translateY(${interpolate(headerSpring, [0, 1], [20, 0])}px)`,
          fontSize: 24,
          fontWeight: 900,
          color: C.white,
          fontFamily: F,
          lineHeight: 1.3,
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        What if{" "}
        <GradientText from={C.primary} to={C.cyan}>
          one platform
        </GradientText>
        {"\n"}replaced all of them?
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        {replacements.map((rep, i) => {
          const enterSpring = spring({
            fps,
            frame: frame - rep.start,
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
                gap: 10,
                padding: "11px 14px",
                borderRadius: 11,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${rep.color}25`,
              }}
            >
              <div style={{ fontSize: 20, flexShrink: 0 }}>{rep.icon}</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {rep.feature}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: rep.color,
                  fontFamily: F,
                  opacity: interpolate(
                    frame,
                    [rep.start + 10, rep.start + 18],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                }}
              >
                → Replaces {rep.replaces}
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── DESIRE (0:13–0:22) — Simulated creator dashboard ─────────────────
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(248, 270);

  // REAL product types & price ranges from the codebase
  const notifications = [
    { text: "New Sale: Serum Preset Pack", amount: "$25", delay: 20 },
    { text: "New Sale: Lo-Fi Beat Lease", amount: "$35", delay: 50 },
    { text: "New Subscriber: alex@beat.fm", amount: null, delay: 80 },
    { text: "New Sale: Mixing Masterclass", amount: "$49", delay: 110 },
    { text: "New Sale: MIDI Pack Vol. 2", amount: "$15", delay: 140 },
  ];

  // Revenue counter
  const revenueTarget = 4280;
  const revenueProgress = interpolate(frame, [160, 210], [0, revenueTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOp = interpolate(frame, [225, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={4}>
      <FadeUp delay={0}>
        <SectionLabel color={C.green}>YOUR DASHBOARD</SectionLabel>
      </FadeUp>

      {/* Dashboard mockup */}
      <div
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: 16,
          background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
          border: `1px solid ${C.green}20`,
          marginBottom: 14,
        }}
      >
        {/* Notifications feed */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 16,
          }}
        >
          {notifications.map((notif, i) => {
            const nSpring = spring({
              fps,
              frame: frame - notif.delay,
              config: { damping: 50, stiffness: 170 },
            });
            const nOp = interpolate(nSpring, [0, 1], [0, 1]);
            const nX = interpolate(nSpring, [0, 1], [-60, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: nOp,
                  transform: `translateX(${nX}px)`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: `${C.green}08`,
                  border: `1px solid ${C.green}15`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {notif.text}
                </div>
                {notif.amount && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: C.green,
                      fontFamily: "monospace",
                    }}
                  >
                    +{notif.amount}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revenue bar chart mockup */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 60,
            marginBottom: 10,
          }}
        >
          {[35, 52, 40, 68, 55, 72, 85].map((h, i) => {
            const barDelay = 155 + i * 5;
            const barSpring = spring({
              fps,
              frame: frame - barDelay,
              config: { damping: 40, stiffness: 160 },
            });
            const barH = interpolate(barSpring, [0, 1], [0, h]);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${barH}%`,
                  borderRadius: 4,
                  background: `linear-gradient(180deg, ${C.green}, ${C.green}60)`,
                }}
              />
            );
          })}
        </div>

        {/* Revenue number */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: "monospace",
              background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${Math.round(revenueProgress).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.gray, fontFamily: F }}>
            monthly revenue
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOp,
          fontSize: 20,
          fontWeight: 800,
          color: C.white,
          fontFamily: F,
          textAlign: "center",
        }}
      >
        This could be{" "}
        <GradientText from={C.green} to={C.cyan}>
          your dashboard.
        </GradientText>
      </div>
    </CenterScene>
  );
};

// ─── ACTION (0:22–0:30) — CTA with glow ───────────────────────────────
const Action: React.FC = () => {
  const frame = useCurrentFrame();

  // Glow pulse on logo
  const glowPulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <CenterScene>
      <div
        style={{
          filter: `drop-shadow(0 0 ${30 * glowPulse}px ${C.primary}40)`,
        }}
      >
        <LogoIcon delay={6} size={100} />
      </div>

      <FadeUp delay={16}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          Everything you need.
        </div>
      </FadeUp>

      <FadeUp delay={24}>
        <GradientText from={C.primary} to={C.pink}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            One platform.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={38}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Free to start.{" "}
          <span style={{ color: C.green }}>$12/mo to sell.</span>
        </div>
      </FadeUp>

      <FadeUp delay={50}>
        <div style={{ marginTop: 14 }}>
          <CTAButton delay={50}>Start Free →</CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={62}>
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
// MAIN COMPOSITION — Campaign Day 10: "Stop Paying for 5 Tools" (30s)
//
// Timing breakdown:
//   0.5s  buffer          15 fr
//   5.0s  Attention       150 fr  (competitor costs stacking up)
//   8.0s  Interest        240 fr  (one platform replaces all)
//   9.0s  Desire          270 fr  (dashboard + revenue animation)
//   7.0s  Action          210 fr  (CTA with glow)
//   0.5s  buffer          15 fr
//   ─────────────────────────────
//   30.0s total           900 fr
// ═══════════════════════════════════════════════════════════════════════
export const CampaignDay10: React.FC = () => {
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
