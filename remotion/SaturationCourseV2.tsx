import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from "remotion";
import { C, F } from "./theme";
import { CinematicBG, Content, FadeUp, useExit } from "./components";

// ─── Image paths ──────────────────────────────────────────────────────
const IMAGES = {
  tubeAmp: staticFile("assets/saturation-tube-amp.png"),
  waveform: staticFile("assets/saturation-waveform.png"),
  console: staticFile("assets/saturation-console.png"),
  tape: staticFile("assets/saturation-tape.png"),
  producer: staticFile("assets/saturation-producer.png"),
  harmonics: staticFile("assets/saturation-harmonics.png"),
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK over tube amp image (0–6s = 0–180)
// ═══════════════════════════════════════════════════════════════════════
const Scene1_Hook: React.FC = () => {
  const { op, y } = useExit(155, 180, -20);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CinematicBG src={IMAGES.tubeAmp} startScale={1.0} endScale={1.12} startY={0} endY={-15} overlayOpacity={0.5} />
      <Content opacity={op} translateY={y}>
        <FadeUp delay={8} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
          Every hit record uses it.
        </FadeUp>
        <FadeUp delay={25} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 30, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
          Most producers don't understand it.
        </FadeUp>
        <FadeUp delay={48}>
          <div style={{ fontSize: 56, fontWeight: 900, fontFamily: F, lineHeight: 1.1, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saturation</span>
            <br />
            <span style={{ color: C.white }}>& </span>
            <span style={{ background: `linear-gradient(135deg, ${C.red}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Distortion</span>
          </div>
        </FadeUp>
        <FadeUp delay={90} style={{ fontSize: 20, color: C.white, fontFamily: F, fontWeight: 400, marginTop: 24, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
          From first principles to advanced sound design.
        </FadeUp>
      </Content>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — THE SCIENCE over waveform image (6–13s = 180–390)
// ═══════════════════════════════════════════════════════════════════════
const Scene2_Science: React.FC = () => {
  const { op, y } = useExit(185, 210, -20);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CinematicBG src={IMAGES.waveform} startScale={1.0} endScale={1.1} startX={0} endX={10} overlayOpacity={0.6} />
      <Content opacity={op} translateY={y}>
        <FadeUp delay={8} style={{ fontSize: 15, color: C.cyan, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 16, textShadow: "0 2px 15px rgba(0,0,0,0.9)" }}>
          THE SCIENCE
        </FadeUp>
        <FadeUp delay={18}>
          <div style={{ fontSize: 42, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
            Learn{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.primary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>why</span>
            <br />
            distortion sounds
            <br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>musical.</span>
          </div>
        </FadeUp>
        <FadeUp delay={55} style={{ marginTop: 36 }}>
          <div style={{ fontSize: 20, color: C.gray, fontFamily: F, lineHeight: 1.6, textShadow: "0 2px 15px rgba(0,0,0,0.9)" }}>
            Harmonics. Waveshaping.
            <br />
            Clipping curves. Overtone series.
            <br />
            <span style={{ color: C.orange, fontWeight: 600 }}>The foundation everything else builds on.</span>
          </div>
        </FadeUp>
      </Content>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — EVERY TYPE over tape reel (13–21s = 390–630)
// ═══════════════════════════════════════════════════════════════════════
const Scene3_Types: React.FC = () => {
  const { op, y } = useExit(215, 240, -20);
  const frame = useCurrentFrame();

  const types = [
    { name: "Tube", desc: "Warm, musical, even harmonics", color: C.orange },
    { name: "Tape", desc: "Soft compression, high-end roll-off", color: C.warmOrange },
    { name: "Transistor", desc: "Aggressive, odd harmonics, grit", color: C.red },
    { name: "Digital", desc: "Harsh, precise, aliasing artifacts", color: C.pink },
    { name: "Waveshaping", desc: "Fully controllable transfer curves", color: C.purple },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CinematicBG src={IMAGES.tape} startScale={1.05} endScale={1.15} startX={-10} endX={10} overlayOpacity={0.65} />
      <Content opacity={op} translateY={y}>
        <FadeUp delay={5} style={{ fontSize: 15, color: C.gold, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12, textShadow: "0 2px 15px rgba(0,0,0,0.9)" }}>
          MASTER EVERY TYPE
        </FadeUp>
        <FadeUp delay={12} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36, textShadow: "0 4px 25px rgba(0,0,0,0.9)" }}>
          Know exactly{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>when and why</span>
          <br />
          to reach for each one.
        </FadeUp>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
          {types.map((t, i) => {
            const d = 30 + i * 25;
            const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sc = interpolate(s, [0, 1], [0.9, 1]);
            return (
              <div key={i} style={{ opacity: s, transform: `scale(${sc})`, display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: `1px solid ${t.color}30` }}>
                <div style={{ width: 8, height: 40, borderRadius: 4, background: t.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: t.color, fontFamily: F }}>{t.name}</div>
                  <div style={{ fontSize: 14, color: C.gray, fontFamily: F }}>{t.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Content>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — APPLY IT over console image (21–30s = 630–900)
// ═══════════════════════════════════════════════════════════════════════
const Scene4_Apply: React.FC = () => {
  const { op, y } = useExit(245, 270, -20);
  const frame = useCurrentFrame();

  const elements = [
    { icon: "🥁", text: "Drums — punch without killing transients", delay: 30 },
    { icon: "🎸", text: "Bass — weight and presence without mud", delay: 60 },
    { icon: "🎤", text: "Vocals — warmth and character that cuts", delay: 90 },
    { icon: "🎹", text: "Synths — analog richness from digital sources", delay: 120 },
    { icon: "🎚️", text: "Mix bus — glue, loudness, and vibe", delay: 150 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CinematicBG src={IMAGES.console} startScale={1.0} endScale={1.1} startY={-10} endY={10} overlayOpacity={0.6} />
      <Content opacity={op} translateY={y}>
        <FadeUp delay={5} style={{ fontSize: 15, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12, textShadow: "0 2px 15px rgba(0,0,0,0.9)" }}>
          APPLY IT EVERYWHERE
        </FadeUp>
        <FadeUp delay={12} style={{ fontSize: 38, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 40, textShadow: "0 4px 25px rgba(0,0,0,0.9)" }}>
          Shape <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>every element</span>
          <br />
          of your mix.
        </FadeUp>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
          {elements.map((e, i) => {
            const s = interpolate(frame, [e.delay, e.delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 16, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{e.icon}</div>
                <div style={{ fontSize: 17, color: C.white, fontFamily: F, fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>{e.text}</div>
              </div>
            );
          })}
        </div>
      </Content>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — HARMONICS over harmonics image (30–38s = 900–1140)
// ═══════════════════════════════════════════════════════════════════════
const Scene5_Transform: React.FC = () => {
  const { op, y } = useExit(215, 240, -20);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CinematicBG src={IMAGES.harmonics} startScale={1.0} endScale={1.12} startX={5} endX={-5} overlayOpacity={0.55} />
      <Content opacity={op} translateY={y}>
        <FadeUp delay={8}>
          <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white, textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
            You'll hear
            <br />
            saturation
            <br />
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>differently.</span>
          </div>
        </FadeUp>
        <FadeUp delay={40} style={{ marginTop: 36 }}>
          <div style={{ fontSize: 22, color: C.white, fontFamily: F, lineHeight: 1.6, textShadow: "0 2px 15px rgba(0,0,0,0.9)" }}>
            Not as an effect you slap on.
            <br />
            <br />
            As a <span style={{ color: C.orange, fontWeight: 700 }}>fundamental tool</span> for
            <br />
            shaping tone, dynamics,
            <br />
            and <span style={{ color: C.gold, fontWeight: 700 }}>emotion</span> in every element.
          </div>
        </FadeUp>
        <FadeUp delay={80} style={{ fontSize: 28, fontWeight: 900, fontFamily: F, marginTop: 40, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Permanently.
        </FadeUp>
      </Content>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — CTA over producer image (38–48s = 1140–1440)
// ═══════════════════════════════════════════════════════════════════════
const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const priceSpring = spring({ fps, frame: frame - 30, config: { damping: 40, stiffness: 130 } });
  const priceScale = interpolate(priceSpring, [0, 1], [0, 1]);

  const ctaSpring = spring({ fps, frame: frame - 70, config: { damping: 50, stiffness: 160 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);

  const urlOp = interpolate(frame, [95, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CinematicBG src={IMAGES.producer} startScale={1.05} endScale={1.15} startY={0} endY={-20} overlayOpacity={0.65} />
      <Content>
        {/* Logo */}
        <FadeUp delay={8}>
          <div style={{ width: 100, height: 100, borderRadius: 26, background: `linear-gradient(135deg, ${C.orange}, ${C.red}, ${C.pink})`, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 0 60px ${C.orange}50`, marginBottom: 32 }}>
            <div style={{ fontSize: 50, color: C.white }}>▶</div>
          </div>
        </FadeUp>

        <FadeUp delay={20}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white, textShadow: "0 4px 25px rgba(0,0,0,0.9)" }}>
            Stop guessing.
            <br />
            Start{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>understanding.</span>
          </div>
        </FadeUp>

        {/* Price */}
        <div style={{ transform: `scale(${priceScale})`, marginTop: 30, marginBottom: 24 }}>
          <div style={{ padding: "20px 40px", borderRadius: 20, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(15px)", border: `2px solid ${C.gold}35` }}>
            <div style={{ fontSize: 60, fontWeight: 900, fontFamily: F, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>$9</div>
            <div style={{ fontSize: 15, color: C.gray, fontFamily: F, marginTop: 6 }}>Lifetime access. One payment.</div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ transform: `scale(${ctaScale})` }}>
          <div style={{ padding: "18px 44px", borderRadius: 60, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: C.white, fontSize: 22, fontWeight: 700, fontFamily: F, boxShadow: `0 0 ${36 * pulse}px ${C.orange}50, 0 4px 20px rgba(0,0,0,0.5)`, letterSpacing: 0.5 }}>
            Enroll Now →
          </div>
        </div>

        <div style={{ opacity: urlOp, marginTop: 20, fontSize: 17, color: C.gray, fontFamily: "monospace", letterSpacing: 2, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
          academy.pauseplayrepeat.com
        </div>
      </Content>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~48s @ 30fps = 1440 frames
// ═══════════════════════════════════════════════════════════════════════
export const SaturationCourseV2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={180}><Scene1_Hook /></Sequence>
    <Sequence from={180} durationInFrames={210}><Scene2_Science /></Sequence>
    <Sequence from={390} durationInFrames={240}><Scene3_Types /></Sequence>
    <Sequence from={630} durationInFrames={270}><Scene4_Apply /></Sequence>
    <Sequence from={900} durationInFrames={240}><Scene5_Transform /></Sequence>
    <Sequence from={1140} durationInFrames={300}><Scene6_CTA /></Sequence>
  </AbsoluteFill>
);
