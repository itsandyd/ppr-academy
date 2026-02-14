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
import { CenterScene, FadeUp, useExit, WaveformVisual } from "./components";

// Saturation course uses orange-themed orbs (red + warmOrange) instead of default (purple + pink)
const SAT_ORBS: [string, string] = [C.red, C.warmOrange];
const SAT_PAD = "0 52px";

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK (0–6s = 0–180)
// ═══════════════════════════════════════════════════════════════════════
const Scene1_Hook: React.FC = () => {
  const { op, y } = useExit(155, 180);
  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <FadeUp delay={8} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        Every hit record uses it.
      </FadeUp>
      <FadeUp delay={25} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 30 }}>
        Most producers don't understand it.
      </FadeUp>
      <FadeUp delay={48}>
        <div style={{ fontSize: 50, fontWeight: 900, fontFamily: F, lineHeight: 1.1 }}>
          <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saturation</span>
          <br />
          <span style={{ color: C.white }}>& </span>
          <span style={{ background: `linear-gradient(135deg, ${C.red}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Distortion</span>
        </div>
      </FadeUp>
      <FadeUp delay={78} style={{ width: "100%" }}>
        <WaveformVisual delay={78} distorted />
      </FadeUp>
      <FadeUp delay={90} style={{ fontSize: 20, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 20 }}>
        From first principles to advanced sound design.
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — THE PROBLEM (6–12s = 180–360)
// ═══════════════════════════════════════════════════════════════════════
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(155, 180);
  const frame = useCurrentFrame();

  const problems = [
    "You add saturation because someone said to",
    "You don't know why it sounds good",
    "You can't choose between tube, tape, or digital",
    "Your low end gets muddy every time",
    "You use presets and hope for the best",
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={1} tint={C.red} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        SOUND FAMILIAR?
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        Using distortion
        <br />
        <span style={{ color: C.orange }}>without understanding it.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {problems.map((text, i) => {
          const d = 30 + i * 18;
          const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, background: `${C.darkGray}aa`, border: `1px solid ${C.orange}15` }}>
              <div style={{ fontSize: 18, color: C.orange }}>→</div>
              <div style={{ fontSize: 17, color: C.white, fontFamily: F, fontWeight: 500 }}>{text}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — THE SHIFT (12–17s = 360–510)
// ═══════════════════════════════════════════════════════════════════════
const Scene3_Shift: React.FC = () => {
  const { op, y } = useExit(125, 150);
  return (
    <CenterScene opacity={op} translateY={y} seed={2} tint={C.warmOrange} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <FadeUp delay={8}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.white }}>
          What if you
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>understood why</span>
        </div>
      </FadeUp>
      <FadeUp delay={30}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.white, marginTop: 8 }}>
          distortion sounds
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.red}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>musical?</span>
        </div>
      </FadeUp>

      {/* Clean vs Saturated waveform comparison */}
      <FadeUp delay={55} style={{ width: "100%", marginTop: 36 }}>
        <div style={{ fontSize: 13, color: C.primary, fontFamily: F, fontWeight: 700, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" as const }}>CLEAN — Pure sine wave</div>
        <WaveformVisual delay={55} />
      </FadeUp>
      <FadeUp delay={75} style={{ width: "100%", marginTop: 24 }}>
        <div style={{ fontSize: 13, color: C.orange, fontFamily: F, fontWeight: 700, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" as const }}>SATURATED — Peaks soft-clipped, harmonics added</div>
        <WaveformVisual delay={75} distorted />
        <div style={{ fontSize: 12, color: `${C.gray}90`, fontFamily: F, marginTop: 6 }}>
          Dashed lines = clipping threshold
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — WHAT YOU'LL LEARN (17–32s = 510–960)
// ═══════════════════════════════════════════════════════════════════════
const TOPICS = [
  { icon: "🔬", title: "The Science", desc: "Why harmonics make distortion sound warm, aggressive, or musical", color: C.cyan },
  { icon: "🎛️", title: "Every Major Type", desc: "Tube, tape, transistor, digital, waveshaping — when and why to use each", color: C.orange },
  { icon: "🥁", title: "Drums & Percussion", desc: "Add punch and presence without destroying transients", color: C.red },
  { icon: "🎸", title: "Bass & Low End", desc: "Saturation that adds weight without muddiness", color: C.purple },
  { icon: "🎤", title: "Vocals & Melodics", desc: "Warmth, grit, and character that cuts through any mix", color: C.pink },
  { icon: "🎚️", title: "Mix Bus & Mastering", desc: "Glue, loudness, and vibe on your master chain", color: C.gold },
];

const TopicCard: React.FC<{ item: (typeof TOPICS)[0]; delay: number }> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ fps, frame: frame - delay, config: { damping: 50, stiffness: 160 } });
  const x = interpolate(enter, [0, 1], [100, 0]);
  const op = interpolate(enter, [0, 1], [0, 1]);
  const sc = interpolate(enter, [0, 1], [0.9, 1]);

  return (
    <div style={{ transform: `translateX(${x}px) scale(${sc})`, opacity: op, display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: `${C.darkGray}cc`, border: `1px solid ${item.color}20`, width: "100%" }}>
      <div style={{ fontSize: 30, flexShrink: 0 }}>{item.icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: F, marginBottom: 3 }}>{item.title}</div>
        <div style={{ fontSize: 14, color: C.gray, fontFamily: F, lineHeight: 1.35 }}>{item.desc}</div>
      </div>
    </div>
  );
};

const Scene4_Topics: React.FC = () => {
  const { op, y } = useExit(425, 450);
  const delays = [25, 85, 145, 205, 265, 325];

  return (
    <CenterScene opacity={op} translateY={y} seed={3} tint={C.orange} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        INSIDE THE COURSE
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 32 }}>
        From{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.primary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>first principles</span>
        <br />
        to{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>advanced design.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {TOPICS.map((t, i) => (
          <TopicCard key={i} item={t} delay={delays[i]} />
        ))}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — THE TRANSFORMATION (32–42s = 960–1260)
// ═══════════════════════════════════════════════════════════════════════
const Scene5_Transform: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const befores = [
    "Slapping on presets and hoping",
    "Muddy low end every time",
    "\"Which saturator do I use?\"",
    "Flat, lifeless mixes",
  ];
  const afters = [
    "Choosing the right type for the job",
    "Controlled harmonic enhancement",
    "\"I need tape warmth here, tube grit there\"",
    "Mixes with depth, warmth, and character",
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={4} tint={C.warmOrange} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE TRANSFORMATION
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        Before → After
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {befores.map((b, i) => {
          const d = 30 + i * 45;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, display: "flex", gap: 10, width: "100%" }}>
              <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: `${C.red}10`, border: `1px solid ${C.red}20` }}>
                <div style={{ fontSize: 14, color: C.red, fontFamily: F, fontWeight: 600 }}>{b}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 18, color: C.gray }}>→</div>
              <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: `${C.green}10`, border: `1px solid ${C.green}20` }}>
                <div style={{ fontSize: 14, color: C.green, fontFamily: F, fontWeight: 600 }}>{afters[i]}</div>
              </div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={220} style={{ fontSize: 20, color: C.gray, fontFamily: F, marginTop: 30, fontStyle: "italic" }}>
        You'll hear saturation differently.
        <br />
        <span style={{ color: C.orange, fontWeight: 700 }}>Permanently.</span>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — PRICE + OFFER (42–50s = 1260–1500)
// ═══════════════════════════════════════════════════════════════════════
const Scene6_Offer: React.FC = () => {
  const { op, y } = useExit(215, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const priceSpring = spring({ fps, frame: frame - 30, config: { damping: 40, stiffness: 130 } });
  const priceScale = interpolate(priceSpring, [0, 1], [0, 1]);
  const pulse = Math.sin(frame * 0.05) * 0.15 + 0.85;

  const bullets = [
    "First principles → advanced application",
    "Every distortion type explained & demonstrated",
    "Creative techniques for every element of your mix",
    "Lifetime access — learn at your pace",
  ];

  return (
    <CenterScene opacity={op} translateY={y} seed={5} tint={C.gold} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.gold, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 16 }}>
        ENROLL NOW
      </FadeUp>

      {/* Price card */}
      <div style={{ transform: `scale(${priceScale})`, padding: "32px 40px", borderRadius: 24, background: `linear-gradient(135deg, ${C.darkGray}ee, ${C.bg}ee)`, border: `2px solid ${C.gold}35`, boxShadow: `0 0 ${30 * pulse}px ${C.gold}15`, marginBottom: 36, width: "100%" }}>
        <div style={{ fontSize: 18, color: C.gray, fontFamily: F, marginBottom: 8 }}>Full Course</div>
        <div style={{ fontSize: 72, fontWeight: 900, fontFamily: F, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
          $9
        </div>
        <div style={{ fontSize: 16, color: C.gray, fontFamily: F, marginTop: 8 }}>One-time payment. Lifetime access.</div>
      </div>

      {/* Bullet points */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {bullets.map((b, i) => {
          const d = 50 + i * 20;
          const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 16, color: C.gold }}>✓</div>
              <div style={{ fontSize: 16, color: C.white, fontFamily: F, fontWeight: 500 }}>{b}</div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — CTA (50–60s = 1500–1800)
// ═══════════════════════════════════════════════════════════════════════
const Scene7_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({ fps, frame: frame - 10, config: { damping: 40, stiffness: 150 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const ctaSpring = spring({ fps, frame: frame - 55, config: { damping: 50, stiffness: 160 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const urlOp = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <CenterScene seed={6} tint={C.orange} orbColors={SAT_ORBS} padding={SAT_PAD}>
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 36 }}>
        <div style={{ width: 110, height: 110, borderRadius: 28, background: `linear-gradient(135deg, ${C.orange}, ${C.red}, ${C.pink})`, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 0 70px ${C.orange}50` }}>
          <div style={{ fontSize: 55, color: C.white }}>▶</div>
        </div>
      </div>

      <FadeUp delay={22}>
        <div style={{ fontSize: 38, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Stop guessing.
          <br />
          Start{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            understanding.
          </span>
        </div>
      </FadeUp>

      <FadeUp delay={40} style={{ fontSize: 20, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 16, lineHeight: 1.5 }}>
        Saturation & Distortion
        <br />
        From First Principles to Advanced Sound Design
      </FadeUp>

      <div style={{ transform: `scale(${ctaScale})`, marginTop: 40 }}>
        <div style={{ padding: "18px 44px", borderRadius: 60, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: C.white, fontSize: 22, fontWeight: 700, fontFamily: F, boxShadow: `0 0 ${36 * pulse}px ${C.orange}50, 0 4px 20px rgba(0,0,0,0.3)`, letterSpacing: 0.5 }}>
          Enroll for $9 →
        </div>
      </div>

      <div style={{ opacity: urlOp, marginTop: 24, fontSize: 18, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~60s @ 30fps = 1800 frames
// ═══════════════════════════════════════════════════════════════════════
export const SaturationCourseVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={180}><Scene1_Hook /></Sequence>
    <Sequence from={180} durationInFrames={180}><Scene2_Problem /></Sequence>
    <Sequence from={360} durationInFrames={150}><Scene3_Shift /></Sequence>
    <Sequence from={510} durationInFrames={450}><Scene4_Topics /></Sequence>
    <Sequence from={960} durationInFrames={300}><Scene5_Transform /></Sequence>
    <Sequence from={1260} durationInFrames={240}><Scene6_Offer /></Sequence>
    <Sequence from={1500} durationInFrames={300}><Scene7_CTA /></Sequence>
  </AbsoluteFill>
);
