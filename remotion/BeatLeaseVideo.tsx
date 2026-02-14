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
  TierCard,
  LogoIcon,
  CTAButton,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK: The $50 beat story (0–6s = 0–180)
// ═══════════════════════════════════════════════════════════════════════
const Scene1_Hook: React.FC = () => {
  const { op, y } = useExit(155, 180);
  const frame = useCurrentFrame();

  const redFlash = interpolate(frame, [95, 105], [0, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const redFade = interpolate(frame, [105, 125], [0.15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const redOp = frame < 105 ? redFlash : redFade;

  return (
    <CenterScene opacity={op} translateY={y}>
      {/* Red flash overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: C.red, opacity: redOp, zIndex: 2 }} />

      <FadeUp delay={8} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 16 }}>
        Sold a beat for $50.
      </FadeUp>
      <FadeUp delay={28} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 16 }}>
        Three months later...
      </FadeUp>
      <FadeUp delay={48} style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white, marginBottom: 16 }}>
        it's on a track with{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          10M streams.
        </span>
      </FadeUp>
      <FadeUp delay={75}>
        <div style={{ fontSize: 52, fontWeight: 900, fontFamily: F, lineHeight: 1.1 }}>
          <span style={{ color: C.red }}>I got nothing.</span>
        </div>
      </FadeUp>
      <FadeUp delay={105} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 30 }}>
        Here's how proper licensing would have protected me.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — THE MISTAKE (6–12s = 180–360)
// ═══════════════════════════════════════════════════════════════════════
const Scene2_Mistake: React.FC = () => {
  const { op, y } = useExit(155, 180);
  const frame = useCurrentFrame();

  const mistakes = [
    "No distribution limits",
    "No streaming caps",
    "No stems pricing",
    "No contract on file",
    "No upgrade path when it blows up",
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={1}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.red, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        THE MISTAKE
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        Most beatmakers sell
        <br />
        <span style={{ color: C.red }}>"beats"</span> without terms.
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {mistakes.map((text, i) => {
          const d = 30 + i * 18;
          const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, background: `${C.darkGray}aa`, border: `1px solid ${C.red}20` }}>
              <div style={{ fontSize: 20, color: C.red }}>✕</div>
              <div style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500 }}>{text}</div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={120} style={{ fontSize: 20, color: C.gray, fontFamily: F, marginTop: 30 }}>
        You're leaving <span style={{ color: C.gold, fontWeight: 700 }}>90% of income</span> on the table.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — THE 4 TIERS (12–28s = 360–840)
// ═══════════════════════════════════════════════════════════════════════
const TIERS = [
  {
    name: "BASIC",
    price: "$25–50",
    color: C.cyan,
    features: ["MP3 file only", "5,000 stream cap", "Credit required", "No music video rights"],
  },
  {
    name: "PREMIUM",
    price: "$50–100",
    color: C.primary,
    features: ["WAV file", "50,000 stream cap", "Music video rights", "Radio play allowed"],
  },
  {
    name: "UNLIMITED",
    price: "$200–500",
    color: C.purple,
    features: ["WAV + stems/trackouts", "Unlimited distribution", "No streaming cap", "Full commercial use"],
  },
  {
    name: "EXCLUSIVE",
    price: "$1,000+",
    color: C.gold,
    features: ["Full ownership transfer", "Beat removed from store", "All stems + project file", "Buyer gets everything"],
  },
];

const Scene3_Tiers: React.FC = () => {
  const { op, y } = useExit(455, 480);
  const delays = [25, 120, 220, 330];

  return (
    <CenterScene opacity={op} translateY={y} seed={2}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.gold, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE 4 LICENSE TIERS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 32 }}>
        Your beat's value
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>scales with their success.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {TIERS.map((tier, i) => (
          <TierCard key={i} tier={tier} delay={delays[i]} />
        ))}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — THE MATH (28–38s = 840–1140)
// ═══════════════════════════════════════════════════════════════════════
const Scene4_Math: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const rows = [
    { label: "Without licensing", value: "$50", sub: "one sale, no follow-up", color: C.red },
    { label: "With Basic tier", value: "$50 + upgrade fees", sub: "they upgrade when streams grow", color: C.cyan },
    { label: "With all 4 tiers", value: "$50 + $100 + $300 + $1,500", sub: "same beat, multiple buyers", color: C.primary },
    { label: "Total potential", value: "$1,950+", sub: "from one single beat", color: C.gold },
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={3}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE MATH
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        One beat.
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Four income streams.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
        {rows.map((row, i) => {
          const d = 30 + i * 45;
          const enter = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sc = interpolate(enter, [0, 1], [0.85, 1]);
          return (
            <div key={i} style={{ opacity: enter, transform: `scale(${sc})`, background: i === 3 ? `${row.color}15` : `${C.darkGray}aa`, border: `1px solid ${row.color}${i === 3 ? "40" : "20"}`, borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 16, color: C.gray, fontFamily: F, fontWeight: 500 }}>{row.label}</div>
                <div style={{ fontSize: i === 3 ? 28 : 20, fontWeight: i === 3 ? 900 : 700, color: row.color, fontFamily: F }}>{row.value}</div>
              </div>
              <div style={{ fontSize: 13, color: `${C.gray}aa`, fontFamily: F }}>{row.sub}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — AUTO CONTRACTS (38–48s = 1140–1440)
// ═══════════════════════════════════════════════════════════════════════
const Scene5_Contracts: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const features = [
    { icon: "📄", text: "Auto-generated PDF contracts for each tier" },
    { icon: "⚖️", text: "Industry-standard legal terms built in" },
    { icon: "📦", text: "Correct files delivered per license level" },
    { icon: "🔔", text: "Stream cap alerts — buyer notified to upgrade" },
    { icon: "🚫", text: "Exclusive purchase removes beat from store" },
    { icon: "💳", text: "Instant Stripe payouts — no chasing invoices" },
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={4}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.purple, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        FULLY AUTOMATED
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        No lawyer needed.
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Contracts generate automatically.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {features.map((f, i) => {
          const d = 30 + i * 28;
          const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, background: `${C.darkGray}aa`, border: `1px solid ${C.purple}15` }}>
              <div style={{ fontSize: 24 }}>{f.icon}</div>
              <div style={{ fontSize: 17, color: C.white, fontFamily: F, fontWeight: 500 }}>{f.text}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — THE REAL SCENARIO (48–58s = 1440–1740)
// ═══════════════════════════════════════════════════════════════════════
const Scene6_Scenario: React.FC = () => {
  const { op, y } = useExit(275, 300);

  return (
    <CenterScene opacity={op} translateY={y} seed={5}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        REAL SCENARIO
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        Here's what happens when
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>your beat blows up.</span>
      </FadeUp>

      <FadeUp delay={30} style={{ width: "100%", padding: "20px 22px", borderRadius: 16, background: `${C.darkGray}bb`, border: `1px solid ${C.cyan}20`, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: C.cyan, fontFamily: F, fontWeight: 700, marginBottom: 8 }}>STEP 1</div>
        <div style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500 }}>Artist buys Basic license for $30</div>
      </FadeUp>

      <FadeUp delay={60} style={{ width: "100%", padding: "20px 22px", borderRadius: 16, background: `${C.darkGray}bb`, border: `1px solid ${C.primary}20`, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: C.primary, fontFamily: F, fontWeight: 700, marginBottom: 8 }}>STEP 2</div>
        <div style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500 }}>Track hits 5K streams — they need to upgrade</div>
      </FadeUp>

      <FadeUp delay={90} style={{ width: "100%", padding: "20px 22px", borderRadius: 16, background: `${C.darkGray}bb`, border: `1px solid ${C.purple}20`, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: C.purple, fontFamily: F, fontWeight: 700, marginBottom: 8 }}>STEP 3</div>
        <div style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500 }}>They upgrade to Unlimited for $300</div>
      </FadeUp>

      <FadeUp delay={120} style={{ width: "100%", padding: "20px 22px", borderRadius: 16, background: `${C.gold}10`, border: `1px solid ${C.gold}30`, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: C.gold, fontFamily: F, fontWeight: 700, marginBottom: 8 }}>STEP 4</div>
        <div style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500 }}>Track goes viral — they buy Exclusive for $1,500</div>
      </FadeUp>

      <FadeUp delay={155} style={{ marginTop: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: F, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          $30 → $330 → $1,830 from one beat.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — CTA (58–68s = 1740–2040)
// ═══════════════════════════════════════════════════════════════════════
const Scene7_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const urlOp = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CenterScene seed={6}>
      <LogoIcon delay={10} />

      <FadeUp delay={22}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Your beats deserve
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>professional licensing.</span>
        </div>
      </FadeUp>

      <FadeUp delay={38}>
        <div style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 16 }}>
          Stop selling your work short.
        </div>
      </FadeUp>

      <div style={{ marginTop: 44 }}>
        <CTAButton delay={55}>
          Set Up Beat Licensing →
        </CTAButton>
      </div>

      <div style={{ opacity: urlOp, marginTop: 24, fontSize: 18, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~68 seconds @ 30fps = 2040 frames
// ═══════════════════════════════════════════════════════════════════════
export const BeatLeaseVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={180}><Scene1_Hook /></Sequence>
    <Sequence from={180} durationInFrames={180}><Scene2_Mistake /></Sequence>
    <Sequence from={360} durationInFrames={480}><Scene3_Tiers /></Sequence>
    <Sequence from={840} durationInFrames={300}><Scene4_Math /></Sequence>
    <Sequence from={1140} durationInFrames={300}><Scene5_Contracts /></Sequence>
    <Sequence from={1440} durationInFrames={300}><Scene6_Scenario /></Sequence>
    <Sequence from={1740} durationInFrames={300}><Scene7_CTA /></Sequence>
  </AbsoluteFill>
);
