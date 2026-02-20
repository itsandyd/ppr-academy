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
// ATTENTION — "You're paying for 5 tools" (0s–5s, frames 0–150)
// ═══════════════════════════════════════════════════════════════════════
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(125, 150);

  const tools = [
    { name: "Gumroad", price: 10, color: "#FF90E8" },
    { name: "Teachable", price: 39, color: "#FF6B6B" },
    { name: "ConvertKit", price: 29, color: "#FB6970" },
    { name: "Canva", price: 13, color: "#00C4CC" },
    { name: "Linktree", price: 9, color: "#43E660" },
  ];

  const headlineSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 55, stiffness: 170 },
  });

  const runningTotal = tools.reduce((sum, tool, i) => {
    const delay = 30 + i * 15;
    const progress = interpolate(frame, [delay, delay + 8], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return sum + tool.price * progress;
  }, 0);

  const allIn = frame > 30 + 4 * 15 + 8;
  const counterPulse = allIn ? Math.sin(frame * 0.12) * 0.15 + 1 : 1;
  const counterColor = runningTotal >= 99 ? C.red : C.white;

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red}>
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 56,
          zIndex: 10,
          transform: `scale(${counterPulse})`,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: C.gray,
            fontFamily: F,
            fontWeight: 600,
            textAlign: "right",
            marginBottom: 4,
          }}
        >
          MONTHLY COST
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            color: counterColor,
            fontFamily: F,
            textAlign: "right",
          }}
        >
          ${Math.round(runningTotal)}/mo
        </div>
      </div>

      <div
        style={{
          opacity: interpolate(headlineSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(headlineSpring, [0, 1], [40, 0])}px)`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.15,
          }}
        >
          You're paying for
        </div>
        <GradientText from={C.red} to={C.orange}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.15,
            }}
          >
            5 tools
          </div>
        </GradientText>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
        }}
      >
        {tools.map((tool, i) => {
          const delay = 30 + i * 15;
          const fromLeft = i % 2 === 0;
          const enterSpring = spring({
            fps,
            frame: frame - delay,
            config: { damping: 60, stiffness: 170 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1], {
            extrapolateRight: "clamp",
          });
          const enterX = interpolate(
            enterSpring,
            [0, 1],
            [fromLeft ? -80 : 80, 0],
            { extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 22px",
                borderRadius: 14,
                background: `${C.darkGray}cc`,
                border: `1px solid ${tool.color}30`,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {tool.name}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: tool.color,
                  fontFamily: F,
                }}
              >
                ${tool.price}/mo
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// INTEREST — "One platform replaces all" (5s–13s, frames 150–390)
// ═══════════════════════════════════════════════════════════════════════
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(215, 240);

  const features = [
    { icon: "🎓", title: "Course Builder", desc: "Upload and sell courses in minutes" },
    { icon: "🎵", title: "Beat & Preset Sales", desc: "Sell any digital product — beats, presets, templates" },
    { icon: "📧", title: "Email Campaigns", desc: "Built-in email marketing — no ConvertKit needed" },
    { icon: "🤖", title: "AI Marketing", desc: "AI writes your social posts from your own content" },
    { icon: "🔗", title: "Link-in-Bio", desc: "Your storefront replaces Linktree" },
    { icon: "📊", title: "Analytics", desc: "See what's selling and who's buying" },
  ];

  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introExit = interpolate(frame, [35, 45], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene opacity={op} translateY={y} seed={2}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2,
          opacity: introOp * introExit,
          padding: "0 56px",
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          What if{" "}
          <GradientText from={C.primary} to={C.cyan}>one platform</GradientText>
          {"\n"}replaced all of them?
        </div>
      </div>

      <div style={{ opacity: interpolate(frame, [45, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <FadeUp delay={48}>
          <SectionLabel color={C.primary}>ALL-IN-ONE</SectionLabel>
        </FadeUp>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            marginTop: 16,
          }}
        >
          {features.map((feat, i) => {
            const cardStart = 55 + i * 28;
            const enterSpring = spring({
              fps,
              frame: frame - cardStart,
              config: { damping: 60, stiffness: 170 },
            });
            const enterOp = interpolate(enterSpring, [0, 1], [0, 1], {
              extrapolateRight: "clamp",
            });
            const enterY = interpolate(enterSpring, [0, 1], [50, 0], {
              extrapolateRight: "clamp",
            });
            const exitOp = interpolate(
              frame,
              [cardStart + 50, cardStart + 60],
              [1, 0.4],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  opacity: enterOp * exitOp,
                  transform: `translateY(${enterY}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 22px",
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                  border: `1px solid ${C.primary}25`,
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0 }}>{feat.icon}</div>
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: C.white,
                      fontFamily: F,
                    }}
                  >
                    {feat.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: C.gray,
                      fontFamily: F,
                      lineHeight: 1.4,
                    }}
                  >
                    {feat.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE A — Storefront mockup (frames 0–90 within Desire sequence)
// ═══════════════════════════════════════════════════════════════════════
const DesireStorefront: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(70, 90);

  const products = [
    { name: "Mixing Masterclass", price: "$49", color: C.primary },
    { name: "Lo-Fi Beat Pack", price: "$19", color: C.pink },
    { name: "Serum Presets Vol.2", price: "$15", color: C.cyan },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={3}>
      <FadeUp delay={3}>
        <SectionLabel color={C.primary}>YOUR STOREFRONT</SectionLabel>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            width: "100%",
            padding: "20px 24px",
            borderRadius: 20,
            background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
            border: `1px solid ${C.primary}20`,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: C.white,
              fontFamily: F,
              marginBottom: 20,
            }}
          >
            🎵 DylanBeats
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {products.map((prod, i) => {
              const glowAmt =
                Math.sin((frame - 15 - i * 8) * 0.08) * 0.3 + 0.7;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: `${C.bg}cc`,
                    border: `1px solid ${prod.color}30`,
                    boxShadow: `0 0 ${16 * glowAmt}px ${prod.color}15`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: C.white,
                      fontFamily: F,
                    }}
                  >
                    {prod.name}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: prod.color,
                      fontFamily: F,
                    }}
                  >
                    {prod.price}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE B — Notification stack (frames 0–90 within Desire sequence)
// ═══════════════════════════════════════════════════════════════════════
const DesireNotifications: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(70, 90);

  const notifications = [
    { text: "New Sale: Mixing Masterclass", amount: "$29", delay: 8 },
    { text: "New Subscriber: john@email.com", amount: null, delay: 28 },
    { text: "New Sale: Lo-Fi Preset Pack", amount: "$15", delay: 48 },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={4}>
      <FadeUp delay={3}>
        <SectionLabel color={C.green}>SALES ROLLING IN</SectionLabel>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: "100%",
          marginTop: 24,
        }}
      >
        {notifications.map((notif, i) => {
          const enterSpring = spring({
            fps,
            frame: frame - notif.delay,
            config: { damping: 55, stiffness: 170 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterY = interpolate(enterSpring, [0, 1], [-40, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateY(${enterY}px)`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 22px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}ee, ${C.bg}ee)`,
                border: `1px solid ${notif.amount ? C.green : C.primary}30`,
                boxShadow: `0 0 20px ${notif.amount ? C.green : C.primary}10`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>
                  {notif.amount ? "💰" : "📧"}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {notif.text}
                </div>
              </div>
              {notif.amount && (
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.green,
                    fontFamily: F,
                  }}
                >
                  {notif.amount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE C — Revenue dashboard (frames 0–90 within Desire sequence)
// ═══════════════════════════════════════════════════════════════════════
const DesireRevenue: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(70, 90);

  const revenueTarget = 2847;
  const revenueValue = Math.round(
    interpolate(frame, [10, 55], [0, revenueTarget], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const chartDraw = interpolate(frame, [8, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chartPath = "M 0 120 C 60 110, 100 90, 160 75 C 220 60, 280 30, 340 20 C 380 14, 420 8, 460 5";
  const pathLength = 520;

  const scaleUp = spring({
    fps,
    frame: frame - 52,
    config: { damping: 50, stiffness: 160 },
  });
  const revScale = interpolate(scaleUp, [0, 1], [1, 1.15]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={5}>
      <FadeUp delay={3}>
        <SectionLabel color={C.green}>ANALYTICS</SectionLabel>
      </FadeUp>

      <div
        style={{
          width: "100%",
          padding: "24px",
          borderRadius: 20,
          background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
          border: `1px solid ${C.green}20`,
          marginTop: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: C.gray,
              fontFamily: F,
              fontWeight: 600,
            }}
          >
            Revenue This Month
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: F,
              transform: `scale(${revScale})`,
              transformOrigin: "right center",
            }}
          >
            <GradientText from={C.green} to={C.cyan}>
              ${revenueValue.toLocaleString()}
            </GradientText>
          </div>
        </div>

        <svg
          viewBox="0 0 460 130"
          style={{ width: "100%", height: 130 }}
        >
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={C.green} />
              <stop offset="100%" stopColor={C.cyan} />
            </linearGradient>
          </defs>
          <path
            d={chartPath}
            fill="none"
            stroke="url(#chartGrad)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength * (1 - chartDraw)}
          />
        </svg>

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            marginTop: 20,
            gap: 16,
          }}
        >
          {[
            { label: "Subscribers", value: "342", color: C.primary },
            { label: "Product Views", value: "1.2k", color: C.cyan },
            { label: "Conversion", value: "4.8%", color: C.green },
          ].map((stat, i) => {
            const statOp = interpolate(
              frame,
              [30 + i * 8, 38 + i * 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <div key={i} style={{ opacity: statOp, textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: stat.color,
                    fontFamily: F,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.gray,
                    fontFamily: F,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE D — "This could be your dashboard"
// ═══════════════════════════════════════════════════════════════════════
const DesireTagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Spring = spring({
    fps,
    frame: frame - 8,
    config: { damping: 60, stiffness: 160 },
  });
  const line1Op = interpolate(line1Spring, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const line1Scale = interpolate(line1Spring, [0, 1], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  const line2Spring = spring({
    fps,
    frame: frame - 28,
    config: { damping: 60, stiffness: 160 },
  });
  const line2Op = interpolate(line2Spring, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(line2Spring, [0, 1], [40, 0], {
    extrapolateRight: "clamp",
  });
  const line2Scale = interpolate(line2Spring, [0, 1], [0.85, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.pink}25 0%, transparent 70%)`,
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        style={{
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            opacity: line1Op,
            transform: `scale(${line1Scale})`,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
              lineHeight: 1.2,
              textShadow: `0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.15)`,
            }}
          >
            This could be
          </div>
        </div>

        <div
          style={{
            opacity: line2Op,
            transform: `translateY(${line2Y}px) scale(${line2Scale})`,
            marginTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: C.cyan,
              fontFamily: F,
              lineHeight: 1.2,
              textShadow: `0 0 30px ${C.cyan}80, 0 2px 20px rgba(0,0,0,0.8)`,
            }}
          >
            your dashboard.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ACTION — CTA (24s–30s, frames 720–900)
// ═══════════════════════════════════════════════════════════════════════
const Action: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const speed = 2 + (i % 3);
    const progress = Math.max(0, frame - 8) / 30;
    const dist = progress * speed * 50;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: Math.max(0, 1 - progress),
      size: 4 + (i % 3) * 2,
    };
  });

  return (
    <CenterScene>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + p.x - p.size / 2,
            top: 860 + p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? C.primary : C.pink,
            opacity: p.opacity * 0.5,
            boxShadow: `0 0 ${p.size * 2}px ${i % 2 === 0 ? C.primary : C.pink}`,
            zIndex: 0,
          }}
        />
      ))}

      <LogoIcon delay={8} size={100} />

      <FadeUp delay={22}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.15,
          }}
        >
          Start Free.
        </div>
        <GradientText from={C.primary} to={C.pink}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: F,
              lineHeight: 1.3,
              marginTop: 8,
            }}
          >
            Sell when you're ready.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={40}>
        <div style={{ marginTop: 10 }}>
          <CTAButton delay={40}>Start Selling Free →</CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={55}>
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
// MAIN COMPOSITION — "Stop Paying for 5 Tools" (30s)
// ═══════════════════════════════════════════════════════════════════════
export const PromoWhatIsPPR: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={150}>
        <Attention />
      </Sequence>
      <Sequence from={150} durationInFrames={240}>
        <Interest />
      </Sequence>
      <Sequence from={390} durationInFrames={120}>
        <DesireStorefront />
      </Sequence>
      <Sequence from={510} durationInFrames={120}>
        <DesireNotifications />
      </Sequence>
      <Sequence from={630} durationInFrames={120}>
        <DesireRevenue />
      </Sequence>
      <Sequence from={750} durationInFrames={120}>
        <DesireTagline />
      </Sequence>
      <Sequence from={870} durationInFrames={150}>
        <Action />
      </Sequence>
    </AbsoluteFill>
  );
};
