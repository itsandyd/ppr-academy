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
  StatBig,
  LogoIcon,
  CTAButton,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK: The giving-away problem (0–6s = 0–180)
// ═══════════════════════════════════════════════════════════════════════
const Scene1_Hook: React.FC = () => {
  const { op, y } = useExit(155, 180);
  return (
    <CenterScene opacity={op} translateY={y}>
      <FadeUp delay={8} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        Gave away 500 sample packs
      </FadeUp>
      <FadeUp delay={25} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        last month.
      </FadeUp>
      <FadeUp delay={48}>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, lineHeight: 1, color: C.red, marginBottom: 20 }}>
          0
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: F, color: C.white }}>
          new followers.
        </div>
      </FadeUp>
      <FadeUp delay={80} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 36, lineHeight: 1.5 }}>
        Your generosity is growing their library.
        <br />
        Not your career.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — THE BEFORE: What happens without Follow Gates (6–12s)
// ═══════════════════════════════════════════════════════════════════════
const Scene2_Before: React.FC = () => {
  const { op, y } = useExit(155, 180);
  const frame = useCurrentFrame();

  const steps = [
    { text: "You post \"Free 808 pack — link in bio\"", icon: "📱" },
    { text: "Fans click the link", icon: "👆" },
    { text: "They download your pack", icon: "📦" },
    { text: "They close the tab", icon: "❌" },
    { text: "They never come back", icon: "👻" },
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={1}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.red, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        WITHOUT FOLLOW GATES
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        The download
        <br />
        <span style={{ color: C.red }}>dead end.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {steps.map((s, i) => {
          const d = 30 + i * 18;
          const enter = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: enter, transform: `translateX(${interpolate(enter, [0, 1], [60, 0])}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, background: i >= 3 ? `${C.red}10` : `${C.darkGray}aa`, border: `1px solid ${i >= 3 ? C.red : C.primary}15` }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 18, color: i >= 3 ? C.red : C.white, fontFamily: F, fontWeight: i >= 3 ? 600 : 500 }}>{s.text}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — THE FLIP: "One simple switch" (12–17s = 360–510)
// ═══════════════════════════════════════════════════════════════════════
const Scene3_Flip: React.FC = () => {
  const { op, y } = useExit(125, 150);
  const frame = useCurrentFrame();

  const flash = interpolate(frame, [0, 6], [0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CenterScene opacity={op} translateY={y} seed={2}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: C.green, opacity: flash, zIndex: 2 }} />

      <FadeUp delay={8} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        One simple switch:
      </FadeUp>
      <FadeUp delay={22}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Before they download,
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            they follow.
          </span>
        </div>
      </FadeUp>
      <FadeUp delay={55} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 28, lineHeight: 1.5 }}>
        That's a Follow Gate.
        <br />
        And it changes everything.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — HOW IT WORKS (17–30s = 510–900)
// ═══════════════════════════════════════════════════════════════════════
const FLOW = [
  { step: "1", text: "Fan clicks \"Download Free 808 Pack\"", color: C.cyan, icon: "🖱️" },
  { step: "2", text: "Follow Gate appears — branded to your store", color: C.primary, icon: "🚪" },
  { step: "3", text: "\"Follow me on Instagram + Spotify to unlock\"", color: C.instagram, icon: "📲" },
  { step: "4", text: "Fan follows — takes 2 seconds", color: C.spotify, icon: "✅" },
  { step: "5", text: "Email captured automatically", color: C.purple, icon: "📧" },
  { step: "6", text: "Pack delivered instantly — zero manual work", color: C.green, icon: "📦" },
];

const FlowStep: React.FC<{ item: (typeof FLOW)[0]; delay: number }> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ fps, frame: frame - delay, config: { damping: 50, stiffness: 160 } });
  const x = interpolate(enter, [0, 1], [100, 0]);
  const op = interpolate(enter, [0, 1], [0, 1]);
  const sc = interpolate(enter, [0, 1], [0.9, 1]);

  return (
    <div style={{ transform: `translateX(${x}px) scale(${sc})`, opacity: op, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 16, background: `${C.darkGray}cc`, border: `1px solid ${item.color}20`, width: "100%" }}>
      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: `${item.color}20`, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 16, fontWeight: 800, color: item.color, fontFamily: F }}>
        {item.step}
      </div>
      <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.white, fontFamily: F, lineHeight: 1.3 }}>{item.text}</div>
    </div>
  );
};

const Scene4_HowItWorks: React.FC = () => {
  const { op, y } = useExit(365, 390);
  const delays = [20, 70, 120, 170, 220, 270];

  return (
    <CenterScene opacity={op} translateY={y} seed={3}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        HOW IT WORKS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 32 }}>
        6 steps.{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Zero friction.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {FLOW.map((item, i) => (
          <FlowStep key={i} item={item} delay={delays[i]} />
        ))}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — THE TRIPLE WIN (30–40s = 900–1200)
// ═══════════════════════════════════════════════════════════════════════
const Scene5_TripleWin: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wins = [
    { icon: "👤", label: "New Follower", sub: "On Instagram, Spotify, YouTube, SoundCloud — your pick", color: C.instagram },
    { icon: "📧", label: "New Subscriber", sub: "Email captured — they're in your automation flow now", color: C.primary },
    { icon: "😊", label: "Happy Fan", sub: "They got free content they wanted. Everyone wins.", color: C.green },
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={4}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.pink, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        ONE ACTION
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 40, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 44 }}>
        <span style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Triple win.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        {wins.map((w, i) => {
          const d = 30 + i * 55;
          const enter = spring({ fps, frame: frame - d, config: { damping: 50, stiffness: 160 } });
          const sc = interpolate(enter, [0, 1], [0.8, 1]);
          const opp = interpolate(enter, [0, 1], [0, 1]);
          const yy = interpolate(enter, [0, 1], [50, 0]);

          return (
            <div key={i} style={{ transform: `translateY(${yy}px) scale(${sc})`, opacity: opp, background: `${C.darkGray}cc`, border: `2px solid ${w.color}30`, borderRadius: 20, padding: "28px 26px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 36 }}>{w.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: w.color, fontFamily: F }}>{w.label}</div>
              </div>
              <div style={{ fontSize: 17, color: C.gray, fontFamily: F, lineHeight: 1.45, paddingLeft: 52 }}>{w.sub}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — THE NUMBERS (40–50s = 1200–1500)
// ═══════════════════════════════════════════════════════════════════════
const Scene6_Numbers: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const compareOp = interpolate(frame, [140, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CenterScene opacity={op} translateY={y} seed={5}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE RESULTS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 50 }}>
        The math speaks
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>for itself.</span>
      </FadeUp>

      <div style={{ display: "flex", justifyContent: "space-around", width: "100%", marginBottom: 40 }}>
        <StatBig value="70%" label="conversion rate" color={C.green} delay={25} />
        <StatBig value="3x" label="more followers" color={C.primary} delay={45} />
      </div>

      {/* Before / After comparison */}
      <div style={{ opacity: compareOp, display: "flex", gap: 16, width: "100%" }}>
        <div style={{ flex: 1, padding: "20px 16px", borderRadius: 16, background: `${C.red}10`, border: `1px solid ${C.red}25`, textAlign: "center" as const }}>
          <div style={{ fontSize: 14, color: C.red, fontWeight: 700, fontFamily: F, letterSpacing: 2, marginBottom: 12 }}>BEFORE</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.white, fontFamily: F }}>500</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>downloads</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: F, marginTop: 8 }}>0</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>followers</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.red, fontFamily: F, marginTop: 8 }}>0</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>emails</div>
        </div>
        <div style={{ flex: 1, padding: "20px 16px", borderRadius: 16, background: `${C.green}10`, border: `1px solid ${C.green}25`, textAlign: "center" as const }}>
          <div style={{ fontSize: 14, color: C.green, fontWeight: 700, fontFamily: F, letterSpacing: 2, marginBottom: 12 }}>AFTER</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.white, fontFamily: F }}>500</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>downloads</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.green, fontFamily: F, marginTop: 8 }}>450</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>followers</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.green, fontFamily: F, marginTop: 8 }}>500</div>
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>emails</div>
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — PLATFORM SUPPORT (50–58s = 1500–1740)
// ═══════════════════════════════════════════════════════════════════════
const PLATFORMS = [
  { name: "Instagram", color: C.instagram, icon: "📸" },
  { name: "Spotify", color: C.spotify, icon: "🎧" },
  { name: "YouTube", color: C.youtube, icon: "▶️" },
  { name: "SoundCloud", color: C.soundcloud, icon: "☁️" },
  { name: "TikTok", color: C.white, icon: "🎵" },
  { name: "Twitter / X", color: C.gray, icon: "🐦" },
];

const Scene7_Platforms: React.FC = () => {
  const { op, y } = useExit(215, 240);
  const frame = useCurrentFrame();

  return (
    <CenterScene opacity={op} translateY={y} seed={6}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.purple, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        SUPPORTED PLATFORMS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        Require follows on
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>any platform.</span>
      </FadeUp>

      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, justifyContent: "center", width: "100%" }}>
        {PLATFORMS.map((p, i) => {
          const d = 30 + i * 20;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sc = interpolate(s, [0, 1], [0.7, 1]);
          return (
            <div key={i} style={{ opacity: s, transform: `scale(${sc})`, padding: "18px 24px", borderRadius: 16, background: `${C.darkGray}cc`, border: `2px solid ${p.color}30`, display: "flex", alignItems: "center", gap: 12, width: "44%" }}>
              <div style={{ fontSize: 28 }}>{p.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: p.color, fontFamily: F }}>{p.name}</div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={160} style={{ fontSize: 18, color: C.gray, fontFamily: F, marginTop: 30 }}>
        Require one, two, or all of them.
        <br />
        <span style={{ color: C.white, fontWeight: 600 }}>You choose.</span>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 8 — CTA (58–68s = 1740–2040)
// ═══════════════════════════════════════════════════════════════════════
const Scene8_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const urlOp = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CenterScene seed={7}>
      <LogoIcon delay={10} />

      <FadeUp delay={22}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Stop giving away
          <br />
          your work for
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>nothing.</span>
        </div>
      </FadeUp>

      <FadeUp delay={40} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 16 }}>
        Every free download should grow your career.
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={55}>
          Set Up Follow Gates →
        </CTAButton>
      </div>

      <div style={{ opacity: urlOp, marginTop: 24, fontSize: 18, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~68s @ 30fps = 2040 frames
// ═══════════════════════════════════════════════════════════════════════
export const FollowGatesVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={180}><Scene1_Hook /></Sequence>
    <Sequence from={180} durationInFrames={180}><Scene2_Before /></Sequence>
    <Sequence from={360} durationInFrames={150}><Scene3_Flip /></Sequence>
    <Sequence from={510} durationInFrames={390}><Scene4_HowItWorks /></Sequence>
    <Sequence from={900} durationInFrames={300}><Scene5_TripleWin /></Sequence>
    <Sequence from={1200} durationInFrames={300}><Scene6_Numbers /></Sequence>
    <Sequence from={1500} durationInFrames={240}><Scene7_Platforms /></Sequence>
    <Sequence from={1740} durationInFrames={300}><Scene8_CTA /></Sequence>
  </AbsoluteFill>
);
