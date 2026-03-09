import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { C, F } from "../../theme";
import {
  CenterScene,
  FadeUp,
  GradientText,
  SectionLabel,
  CTAButton,
  LogoIcon,
  useExit,
  WaveformVisual,
} from "../../components";

// ═══════════════════════════════════════════════════════════════════════
// HARMONICS LESSON (LONG): "Invisible 808s - Deep Dive"
// Completely redone with high-impact visuals and "Gemini" quality code.
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: HOOK (0-4s) — Invisible 808s ─────────────────────────────
const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.darkGray} seed={110}>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, textAlign: "center", marginBottom: 20 }}>
          Your 808s are
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: F, color: C.gray, lineHeight: 1, textAlign: "center", opacity: 0.5, filter: "blur(4px)" }}>
          INVISIBLE.
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: PROBLEM (4-10s) — Phone Speakers ─────────────────────────
const Scene2_Problem: React.FC = () => {
  const { op, y } = useExit(160, 180);
  const frame = useCurrentFrame();
  
  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={111}>
      <FadeUp delay={5}>
        <SectionLabel color={C.gray}>THE PROBLEM</SectionLabel>
      </FadeUp>

      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.white, fontFamily: F, textAlign: "center", marginBottom: 40 }}>
          Phone speakers
          <br />
          <span style={{ color: C.red, fontWeight: 900 }}>can't play 40Hz.</span>
        </div>
      </FadeUp>

      <div style={{ fontSize: 80 }}>📱🔇</div>
    </CenterScene>
  );
};

// ─── SCENE 3: SOLUTION (10-20s) — Add Harmonics ────────────────────────
const Scene3_Solution: React.FC = () => {
  const { op, y } = useExit(280, 300);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ fps, frame: frame - 20, config: { damping: 20 } });
  const harmonic = interpolate(reveal, [0, 1], [0, 100]);

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} seed={112}>
      <FadeUp delay={10}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, marginBottom: 40 }}>
          Add <GradientText from={C.orange} to={C.gold}>Harmonics.</GradientText>
        </div>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200 }}>
        <div style={{ width: 40, height: 150, background: C.darkGray, borderRadius: "5px 5px 0 0" }} />
        <div style={{ width: 40, height: harmonic * 1.2, background: C.orange, borderRadius: "5px 5px 0 0" }} />
        <div style={{ width: 40, height: harmonic * 0.8, background: C.gold, borderRadius: "5px 5px 0 0" }} />
        <div style={{ width: 40, height: harmonic * 0.5, background: C.yellow, borderRadius: "5px 5px 0 0" }} />
      </div>
    </CenterScene>
  );
};

// ─── SCENE 3.5: TOOLS (20-28s) — How To Do It ──────────────────────────
const Scene3_Tools: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tools = ["Distortion", "Saturation", "MaxxBass"];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={113}>
      <FadeUp delay={5}>
        <SectionLabel color={C.purple}>THE TOOLS</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
        {tools.map((t, i) => (
          <FadeUp key={i} delay={20 + i * 10}>
            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: F, color: C.white }}>{t}</div>
          </FadeUp>
        ))}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: PROOF (28-36s) — Audible Everywhere ──────────────────────
const Scene4_Proof: React.FC = () => {
  const { op, y } = useExit(220, 240);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const volume = Math.min(100, Math.floor(interpolate(frame, [20, 80], [0, 100])));

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={114}>
      <FadeUp delay={5}>
        <SectionLabel color={C.green}>THE RESULT</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20 }}>
        <div style={{ fontSize: 120, fontWeight: 900, fontFamily: F, color: C.green }}>{volume}%</div>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: F, color: C.white }}>Audible</div>
      </div>
      
      <FadeUp delay={40}>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 10 }}>
          On any speaker.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: CTA (36-45s) — Learn Sound Design ────────────────────────
const Scene5_CTA: React.FC = () => {
  return (
    <CenterScene tint={C.orange} seed={115}>
      <LogoIcon delay={5} size={100} />
      
      <FadeUp delay={20}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, color: C.white, marginTop: 30, textAlign: "center" }}>
          Learn
          <br />
          <GradientText from={C.orange} to={C.gold}>Sound Design.</GradientText>
        </div>
      </FadeUp>

      <div style={{ marginTop: 40 }}>
        <CTAButton delay={40} gradientFrom={C.orange} gradientTo={C.gold} glowColor={C.orange}>
          Link in Bio →
        </CTAButton>
      </div>
    </CenterScene>
  );
};

// ─── MAIN COMPOSITION ──────────────────────────────────────────────────
export const HarmonicsLessonLong: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={120}>
        <Scene1_Hook />
      </Sequence>
      <Sequence from={120} durationInFrames={180}>
        <Scene2_Problem />
      </Sequence>
      <Sequence from={300} durationInFrames={300}>
        <Scene3_Solution />
      </Sequence>
      <Sequence from={600} durationInFrames={240}>
        <Scene3_Tools />
      </Sequence>
      <Sequence from={840} durationInFrames={240}>
        <Scene4_Proof />
      </Sequence>
      <Sequence from={1080} durationInFrames={270}>
        <Scene5_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
