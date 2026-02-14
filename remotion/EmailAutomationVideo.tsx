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
  CenterScene,
  FadeUp,
  useExit,
  StepRow,
  ReasonCard,
  StatBlock,
  ConnectorLine,
  LogoIcon,
  CTAButton,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK: "50K followers. $200/month." (0–5s = 0–150)
// ═══════════════════════════════════════════════════════════════════════
const Scene1_Hook: React.FC = () => {
  const { op, y } = useExit(130, 150);
  return (
    <CenterScene opacity={op} translateY={y}>
      <FadeUp delay={8} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        50,000 Instagram followers.
      </FadeUp>
      <FadeUp delay={25} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 36 }}>
        $200 a month in sales.
      </FadeUp>
      <FadeUp delay={50}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Meanwhile, a producer
          <br />
          with <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>5,000 emails</span>
          <br />
          makes <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$5K/month.</span>
        </div>
      </FadeUp>
      <FadeUp delay={80} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 30 }}>
        The difference? Email.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — THE PROBLEM (5–10s = 150–300)
// ═══════════════════════════════════════════════════════════════════════
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(130, 150);
  const frame = useCurrentFrame();

  const problems = [
    "You drop a sample pack on IG stories",
    "50 people swipe up",
    "They download and disappear",
    "You never hear from them again",
    "No email. No follow-up. No sale.",
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={1}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.pink, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 16 }}>
        THE PROBLEM
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 38, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 44 }}>
        Sound familiar?
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {problems.map((text, i) => {
          const d = 25 + i * 18;
          const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const tx = interpolate(s, [0, 1], [60, 0]);
          return (
            <div
              key={i}
              style={{
                opacity: s,
                transform: `translateX(${tx}px)`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                borderRadius: 14,
                background: i === 4 ? `${C.pink}15` : `${C.darkGray}aa`,
                border: `1px solid ${i === 4 ? C.pink : C.primary}20`,
              }}
            >
              <div style={{ fontSize: 20, color: i === 4 ? C.pink : C.gray, fontFamily: F }}>
                {i === 4 ? "✕" : `${i + 1}.`}
              </div>
              <div style={{ fontSize: 18, color: i === 4 ? C.pink : C.white, fontFamily: F, fontWeight: i === 4 ? 700 : 500 }}>
                {text}
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — THE SHIFT (10–15s = 300–450)
// ═══════════════════════════════════════════════════════════════════════
const Scene3_Shift: React.FC = () => {
  const { op, y } = useExit(130, 150);
  return (
    <CenterScene opacity={op} translateY={y} seed={2}>
      <FadeUp delay={8}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.white }}>
          What if every
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>free download</span>
        </div>
      </FadeUp>
      <FadeUp delay={30}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.white, marginTop: 8 }}>
          started a
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>conversation</span>
        </div>
      </FadeUp>
      <FadeUp delay={55}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.white, marginTop: 8 }}>
          that ended in a
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>sale?</span>
        </div>
      </FadeUp>
      <FadeUp delay={80} style={{ fontSize: 20, color: C.gray, fontFamily: F, marginTop: 36 }}>
        That's email automation for music producers.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — THE FLOW: Step-by-step automation (15–28s = 450–840)
// ═══════════════════════════════════════════════════════════════════════
const STEPS = [
  { time: "3:00 AM", icon: "📦", text: "Fan downloads your free 808 pack", color: C.cyan },
  { time: "3:01 AM", icon: "📧", text: "Welcome email: \"Thanks! Here's a bonus one-shot kit\"", color: C.primary },
  { time: "Day 3", icon: "🎵", text: "Your story: How you built your sound from scratch", color: C.purple },
  { time: "Day 5", icon: "💡", text: "\"3 mixing mistakes killing your low end\" — value email", color: C.orange },
  { time: "Day 7", icon: "🎓", text: "\"My mixing course is 30% off this week\" — soft pitch", color: C.pink },
  { time: "Day 10", icon: "🔥", text: "Social proof: \"247 producers enrolled — join them\"", color: C.green },
  { time: "Day 10", icon: "💰", text: "They buy your $97 course. You were asleep.", color: C.green },
];

const Scene4_Flow: React.FC = () => {
  const { op, y } = useExit(370, 390);
  const delays = [20, 70, 120, 170, 220, 270, 320];

  return (
    <CenterScene opacity={op} translateY={y} seed={3}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE AUTOMATION
      </FadeUp>
      <FadeUp delay={8} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        Set it up once.{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Sell forever.
        </span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 0, width: "100%" }}>
        {STEPS.map((step, i) => (
          <React.Fragment key={i}>
            <StepRow step={step} delay={delays[i]} />
            {i < STEPS.length - 1 && <ConnectorLine delay={delays[i] + 15} color={step.color} />}
          </React.Fragment>
        ))}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — WHY THIS WORKS FOR PRODUCERS (28–38s = 840–1140)
// ═══════════════════════════════════════════════════════════════════════
const REASONS = [
  { icon: "🎧", title: "Your fans already want your sound", desc: "They downloaded your pack — they're warm leads, not cold traffic" },
  { icon: "📱", title: "Instagram can't do this", desc: "Stories disappear. Posts get buried. Email lands in their inbox every time" },
  { icon: "🔁", title: "One setup, infinite sales", desc: "Write the sequence once — it runs for every new subscriber forever" },
  { icon: "🎯", title: "Segment by interest", desc: "808 pack downloaders get mixing content. Preset fans get sound design tips" },
];

const Scene5_Why: React.FC = () => {
  const { op, y } = useExit(280, 300);
  return (
    <CenterScene opacity={op} translateY={y} seed={4}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.cyan, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        WHY EMAIL WINS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        Built for
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>music producers.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {REASONS.map((r, i) => (
          <ReasonCard key={i} item={r} delay={30 + i * 50} />
        ))}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — STATS (38–48s = 1140–1440)
// ═══════════════════════════════════════════════════════════════════════
const Scene6_Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { op, y } = useExit(280, 300);

  const quoteOp = interpolate(frame, [180, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CenterScene opacity={op} translateY={y} seed={5}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE RESULTS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 50 }}>
        Numbers don't lie.
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 36, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <StatBlock value="3x" label="more course sales" color={C.green} delay={25} />
          <StatBlock value="40%" label="email open rate" color={C.primary} delay={45} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <StatBlock value="70%" label="Follow Gate conversion" color={C.pink} delay={70} />
          <StatBlock value="0 hrs" label="manual email work" color={C.cyan} delay={90} />
        </div>
      </div>

      <div style={{ opacity: quoteOp, marginTop: 50, padding: "20px 28px", borderRadius: 16, border: `1px solid ${C.primary}20`, background: `${C.darkGray}80` }}>
        <div style={{ fontSize: 18, color: C.gray, fontFamily: F, fontStyle: "italic", lineHeight: 1.5 }}>
          "I set up my email flow 6 months ago.
          <br />
          It's made me <span style={{ color: C.green, fontWeight: 700 }}>$14,000</span> while I focused on making beats."
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — WHAT YOU CAN AUTOMATE (48–58s = 1440–1740)
// ═══════════════════════════════════════════════════════════════════════
const AUTOMATIONS = [
  { label: "Welcome sequence for new subscribers", icon: "👋" },
  { label: "Sample pack follow-up with upsell", icon: "📦" },
  { label: "Course drip content over 14 days", icon: "🎓" },
  { label: "Abandoned cart recovery emails", icon: "🛒" },
  { label: "Release day campaign with pre-save", icon: "🎶" },
  { label: "Re-engagement for inactive fans", icon: "🔄" },
  { label: "Coaching session reminders", icon: "📅" },
  { label: "VIP offers for your hottest leads", icon: "🔥" },
];

const Scene7_Automations: React.FC = () => {
  const frame = useCurrentFrame();
  const { op, y } = useExit(280, 300);

  return (
    <CenterScene opacity={op} translateY={y} seed={6}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        BUILT-IN WORKFLOWS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        Automate{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>everything.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {AUTOMATIONS.map((a, i) => {
          const d = 25 + i * 25;
          const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const tx = interpolate(s, [0, 1], [80, 0]);
          return (
            <div
              key={i}
              style={{
                opacity: s,
                transform: `translateX(${tx}px)`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 18px",
                borderRadius: 12,
                background: `${C.darkGray}90`,
                border: `1px solid ${C.primary}15`,
              }}
            >
              <div style={{ fontSize: 22 }}>{a.icon}</div>
              <div style={{ fontSize: 16, color: C.white, fontFamily: F, fontWeight: 500 }}>{a.label}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 8 — VISUAL WORKFLOW BUILDER (58–68s = 1740–2040)
// ═══════════════════════════════════════════════════════════════════════
const Scene8_Builder: React.FC = () => {
  const frame = useCurrentFrame();
  const { op, y } = useExit(280, 300);

  const nodes = [
    { label: "New Subscriber", color: C.cyan, y: 0 },
    { label: "Send Welcome Email", color: C.primary, y: 120 },
    { label: "Wait 3 Days", color: C.gray, y: 240 },
    { label: "If Opened?", color: C.orange, y: 360 },
    { label: "YES → Send Course Offer", color: C.green, y: 480 },
    { label: "NO → Send Value Email", color: C.pink, y: 480 },
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={7}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.purple, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        DRAG & DROP
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        Visual workflow builder.
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>No code required.</span>
      </FadeUp>

      {/* Workflow diagram */}
      <div style={{ position: "relative", width: "100%", height: 560 }}>
        {nodes.map((node, i) => {
          const d = 30 + i * 30;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sc = interpolate(s, [0, 1], [0.7, 1]);
          const isLast = i >= 4;
          const xOff = isLast ? (i === 4 ? -130 : 130) : 0;

          return (
            <React.Fragment key={i}>
              {/* Connector line */}
              {i > 0 && i < 4 && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: nodes[i - 1].y + 48,
                    width: 2,
                    height: interpolate(frame, [d - 5, d + 5], [0, 72], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    background: `linear-gradient(180deg, ${nodes[i - 1].color}50, ${node.color}50)`,
                    transform: "translateX(-1px)",
                  }}
                />
              )}
              {/* Branch lines for last two */}
              {i === 4 && (
                <>
                  <div style={{
                    position: "absolute",
                    left: "50%",
                    top: nodes[3].y + 48,
                    width: 2,
                    height: interpolate(frame, [d - 5, d + 5], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    background: `${C.orange}40`,
                    transform: "translateX(-1px)",
                  }} />
                  <div style={{
                    position: "absolute",
                    left: "calc(50% - 130px)",
                    top: nodes[3].y + 88,
                    width: 260,
                    height: 2,
                    opacity: interpolate(frame, [d, d + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    background: `linear-gradient(90deg, ${C.green}50, ${C.orange}30, ${C.pink}50)`,
                  }} />
                </>
              )}
              {/* Node */}
              <div
                style={{
                  position: "absolute",
                  left: `calc(50% + ${xOff}px)`,
                  top: node.y,
                  transform: `translateX(-50%) scale(${sc})`,
                  opacity: s,
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: `${C.bg}ee`,
                  border: `2px solid ${node.color}50`,
                  boxShadow: `0 0 20px ${node.color}15`,
                  whiteSpace: "nowrap" as const,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: node.color, fontFamily: F }}>{node.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 9 — CTA (68–78s = 2040–2340)
// ═══════════════════════════════════════════════════════════════════════
const Scene9_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const urlOp = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CenterScene>
      {/* Logo */}
      <LogoIcon delay={10} />

      <FadeUp delay={22}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Your fans are waiting
          <br />
          to hear from you.
        </div>
      </FadeUp>

      <FadeUp delay={38}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, marginTop: 8, background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Automate the conversation.
        </div>
      </FadeUp>

      {/* CTA */}
      <div style={{ marginTop: 44 }}>
        <CTAButton delay={55}>
          Start Building Workflows →
        </CTAButton>
      </div>

      <div style={{ opacity: urlOp, marginTop: 24, fontSize: 18, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION — ~78 seconds @ 30fps = 2340 frames
// ═══════════════════════════════════════════════════════════════════════
export const EmailAutomationVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Scene 1: Hook (0–5s) */}
      <Sequence from={0} durationInFrames={150}>
        <Scene1_Hook />
      </Sequence>

      {/* Scene 2: The Problem (5–10s) */}
      <Sequence from={150} durationInFrames={150}>
        <Scene2_Problem />
      </Sequence>

      {/* Scene 3: The Shift (10–15s) */}
      <Sequence from={300} durationInFrames={150}>
        <Scene3_Shift />
      </Sequence>

      {/* Scene 4: The Flow — 7 steps (15–28s) */}
      <Sequence from={450} durationInFrames={390}>
        <Scene4_Flow />
      </Sequence>

      {/* Scene 5: Why This Works for Producers (28–38s) */}
      <Sequence from={840} durationInFrames={300}>
        <Scene5_Why />
      </Sequence>

      {/* Scene 6: Stats (38–48s) */}
      <Sequence from={1140} durationInFrames={300}>
        <Scene6_Stats />
      </Sequence>

      {/* Scene 7: What You Can Automate (48–58s) */}
      <Sequence from={1440} durationInFrames={300}>
        <Scene7_Automations />
      </Sequence>

      {/* Scene 8: Visual Workflow Builder (58–68s) */}
      <Sequence from={1740} durationInFrames={300}>
        <Scene8_Builder />
      </Sequence>

      {/* Scene 9: CTA (68–78s) */}
      <Sequence from={2040} durationInFrames={300}>
        <Scene9_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
