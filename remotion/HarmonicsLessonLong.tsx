import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

const C = {
  bg: "#0a0a0a",
  primary: "#6366f1",
  purple: "#7c3aed",
  pink: "#ec4899",
  cyan: "#22d3ee",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  gold: "#eab308",
  blue: "#3b82f6",
  white: "#ffffff",
  gray: "#94a3b8",
  lightGray: "#cbd5e1",
  darkGray: "#1e293b",
};
const F = "system-ui, -apple-system, sans-serif";

// ─── Background ───────────────────────────────────────────────────────
const BG: React.FC<{ seed?: number; tint?: string }> = ({ seed = 0, tint = C.primary }) => {
  const frame = useCurrentFrame();
  const scanY = (frame * 3) % 1200 - 50;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: `linear-gradient(${tint}10 1px, transparent 1px), linear-gradient(90deg, ${tint}10 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      {[
        { x: 100 + seed * 80, y: 200, s: 500, c: tint, d: 0 },
        { x: 1400 + seed * 40, y: 500, s: 450, c: C.purple, d: 40 },
        { x: 800, y: 100, s: 380, c: C.pink, d: 80 },
      ].map((o, i) => {
        const p = Math.sin((frame + o.d) * 0.025) * 0.3 + 0.7;
        const dr = Math.sin((frame + o.d) * 0.012) * 20;
        return <div key={i} style={{ position: "absolute", left: o.x, top: o.y + dr, width: o.s, height: o.s, borderRadius: "50%", background: `radial-gradient(circle, ${o.c}22, transparent 70%)`, opacity: p * 0.5, filter: `blur(${o.s * 0.3}px)` }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 1.5, background: `linear-gradient(90deg, transparent, ${tint}18, transparent)` }} />
    </>
  );
};

// 16:9 centered wrapper
const Center: React.FC<{ children: React.ReactNode; opacity?: number; translateY?: number; seed?: number; tint?: string }> = ({ children, opacity = 1, translateY = 0, seed = 0, tint }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity, transform: `translateY(${translateY}px)` }}>
    <BG seed={seed} tint={tint} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const, padding: "0 120px", zIndex: 1, width: "100%", maxWidth: 1600 }}>{children}</div>
  </AbsoluteFill>
);

// Two-column layout for 16:9
const TwoCol: React.FC<{ left: React.ReactNode; right: React.ReactNode; opacity?: number; translateY?: number; seed?: number; tint?: string; gap?: number }> = ({ left, right, opacity = 1, translateY = 0, seed = 0, tint, gap = 60 }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity, transform: `translateY(${translateY}px)` }}>
    <BG seed={seed} tint={tint} />
    <div style={{ display: "flex", alignItems: "center", gap, padding: "0 100px", zIndex: 1, width: "100%", maxWidth: 1700 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{left}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>{right}</div>
    </div>
  </AbsoluteFill>
);

const FadeUp: React.FC<{ children: React.ReactNode; delay: number; style?: React.CSSProperties }> = ({ children, delay, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 60, stiffness: 180 } });
  return <div style={{ transform: `translateY(${interpolate(s, [0, 1], [35, 0])}px)`, opacity: interpolate(s, [0, 1], [0, 1]), ...style }}>{children}</div>;
};

const FadeLeft: React.FC<{ children: React.ReactNode; delay: number; style?: React.CSSProperties }> = ({ children, delay, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 60, stiffness: 180 } });
  return <div style={{ transform: `translateX(${interpolate(s, [0, 1], [50, 0])}px)`, opacity: interpolate(s, [0, 1], [0, 1]), ...style }}>{children}</div>;
};

const useExit = (start: number, end: number) => {
  const frame = useCurrentFrame();
  return {
    op: interpolate(frame, [start, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    y: interpolate(frame, [start, end], [0, -20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
};

// ─── Harmonic Bars (wider for 16:9) ───────────────────────────────────
const HarmonicBars: React.FC<{
  delay: number;
  fundamental: number;
  count: number;
  showLabels?: boolean;
  mode?: "all" | "even" | "odd";
  height?: number;
  barWidth?: number;
}> = ({ delay, fundamental, count, showLabels = true, mode = "all", height: maxH = 220, barWidth: bw }) => {
  const frame = useCurrentFrame();
  const barW = bw || Math.min(50, 700 / count);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, height: maxH + 30, width: "100%" }}>
      {Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        const isEven = n % 2 === 0;
        const isOdd = n % 2 !== 0;

        let amplitude = 1 / n;
        if (mode === "even" && isOdd && n > 1) amplitude = 0.02;
        if (mode === "odd" && isEven) amplitude = 0.02;

        const h = amplitude * maxH;
        const d = delay + i * 6;
        const enter = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const barH = h * enter;

        let color = C.cyan;
        if (n === 1) color = C.white;
        else if (mode === "even" && isEven) color = C.green;
        else if (mode === "even" && isOdd && n > 1) color = `${C.gray}20`;
        else if (mode === "odd" && isOdd) color = C.orange;
        else if (mode === "odd" && isEven) color = `${C.gray}20`;

        const pulse = amplitude > 0.05 ? Math.sin((frame - d) * 0.04 + i) * 0.06 + 0.94 : 1;

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: barW, height: barH * pulse, borderRadius: barW / 3, backgroundColor: color, opacity: enter, boxShadow: barH > 15 ? `0 0 ${10 * pulse}px ${color}25` : "none" }} />
            {showLabels && <div style={{ fontSize: 11, color: `${C.gray}88`, fontFamily: "monospace", opacity: enter }}>{fundamental * n}</div>}
          </div>
        );
      })}
    </div>
  );
};

// ─── Sine Wave SVG ────────────────────────────────────────────────────
const SineWave: React.FC<{ delay: number; color: string; amplitude?: number; frequency?: number; label?: string; width?: number }> = ({
  delay, color, amplitude = 50, frequency = 2, label, width: svgW = 700,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const h = 120;
  const mid = h / 2;
  let d = "";
  for (let i = 0; i <= 250; i++) {
    const x = (i / 250) * svgW;
    const y = mid - Math.sin((i / 250) * Math.PI * frequency * 2 + frame * 0.05) * amplitude;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return (
    <div style={{ opacity: enter, width: "100%" }}>
      {label && <div style={{ fontSize: 13, color, fontFamily: F, fontWeight: 700, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" as const }}>{label}</div>}
      <svg viewBox={`0 0 ${svgW} ${h}`} style={{ width: "100%", height: 90 }}>
        <path d={`M 0 ${mid} L ${svgW} ${mid}`} stroke={`${color}18`} strokeWidth={1} fill="none" />
        <path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <path d={d} stroke={color} strokeWidth={10} fill="none" opacity={0.1} strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — TITLE CARD (0–8s = 0–240)
// ═══════════════════════════════════════════════════════════════════════
const Scene1: React.FC = () => {
  const { op, y } = useExit(215, 240);
  const frame = useCurrentFrame();
  const tagOp = interpolate(frame, [120, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Center opacity={op} translateY={y} tint={C.cyan}>
      <FadeUp delay={10} style={{ fontSize: 16, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 16 }}>
        SATURATION & DISTORTION — LESSON 1, CHAPTER 1
      </FadeUp>
      <FadeUp delay={25}>
        <div style={{ fontSize: 56, fontWeight: 900, fontFamily: F, lineHeight: 1.1 }}>
          <span style={{ color: C.white }}>The Hidden Architecture</span>
          <br />
          <span style={{ color: C.white }}>of </span>
          <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Musical Tone</span>
        </div>
      </FadeUp>
      <FadeUp delay={55} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 400, marginTop: 20, lineHeight: 1.5 }}>
        Understanding Harmonics
      </FadeUp>
      <div style={{ opacity: tagOp, marginTop: 30, display: "flex", gap: 12 }}>
        {["First Principles", "Harmonic Series", "Timbre", "Even vs Odd"].map((tag, i) => (
          <div key={i} style={{ padding: "8px 18px", borderRadius: 20, border: `1px solid ${C.cyan}25`, color: C.gray, fontSize: 14, fontFamily: F, background: `${C.darkGray}80` }}>{tag}</div>
        ))}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — "You think you hear one note" (8–18s = 240–540)
// ═══════════════════════════════════════════════════════════════════════
const Scene2: React.FC = () => {
  const { op, y } = useExit(275, 300);
  return (
    <TwoCol
      opacity={op} translateY={y} seed={1} tint={C.cyan}
      left={
        <>
          <FadeUp delay={8} style={{ textAlign: "left" as const }}>
            <div style={{ fontSize: 22, color: C.gray, fontFamily: F, marginBottom: 16 }}>
              When you strike a single key on a piano...
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
              You're not hearing
              <br />
              <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>one frequency.</span>
            </div>
          </FadeUp>
          <FadeUp delay={50} style={{ textAlign: "left" as const, marginTop: 24 }}>
            <div style={{ fontSize: 20, color: C.lightGray, fontFamily: F, lineHeight: 1.6 }}>
              Every pitched sound contains a hidden
              <br />
              architecture of frequencies stacked like
              <br />
              an invisible <span style={{ color: C.cyan, fontWeight: 700 }}>sonic skyscraper</span>.
            </div>
          </FadeUp>
          <FadeUp delay={85} style={{ textAlign: "left" as const, marginTop: 20 }}>
            <div style={{ fontSize: 18, color: C.gray, fontFamily: F, fontStyle: "italic" }}>
              This is called the harmonic series.
            </div>
          </FadeUp>
        </>
      }
      right={
        <FadeUp delay={30} style={{ width: "100%" }}>
          <HarmonicBars delay={35} fundamental={100} count={12} height={250} barWidth={36} />
          <div style={{ fontSize: 13, color: C.gray, fontFamily: F, marginTop: 10 }}>
            Harmonics of a 100 Hz fundamental — each at 1/n amplitude
          </div>
        </FadeUp>
      }
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — Integer Multiples (18–28s = 540–840)
// ═══════════════════════════════════════════════════════════════════════
const Scene3: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const harmonics = [
    { n: 1, freq: "100 Hz", interval: "Fundamental", color: C.white },
    { n: 2, freq: "200 Hz", interval: "Octave (×2)", color: C.cyan },
    { n: 3, freq: "300 Hz", interval: "Octave + Fifth (×3)", color: C.blue },
    { n: 4, freq: "400 Hz", interval: "Two Octaves (×4)", color: C.primary },
    { n: 5, freq: "500 Hz", interval: "Major Third (×5)", color: C.purple },
    { n: 6, freq: "600 Hz", interval: "Octave + Fifth (×6)", color: C.pink },
    { n: 7, freq: "700 Hz", interval: "Minor Seventh (×7)", color: C.orange },
    { n: 8, freq: "800 Hz", interval: "Three Octaves (×8)", color: C.gold },
  ];

  return (
    <TwoCol
      opacity={op} translateY={y} seed={2} tint={C.blue}
      left={
        <>
          <FadeUp delay={5} style={{ textAlign: "left" as const }}>
            <div style={{ fontSize: 15, color: C.cyan, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>EXACT INTEGER MULTIPLES</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15 }}>
              The 2nd harmonic is{" "}
              <span style={{ color: C.cyan }}>always</span>
              <br />
              twice the fundamental.
            </div>
          </FadeUp>
          <FadeUp delay={30} style={{ textAlign: "left" as const, marginTop: 20 }}>
            <div style={{ fontSize: 18, color: C.gray, fontFamily: F, lineHeight: 1.6 }}>
              This isn't a quirk of certain instruments.
              <br />
              <span style={{ color: C.lightGray, fontWeight: 600 }}>It's physics.</span>
              <br /><br />
              A guitar string vibrates in halves, thirds,
              <br />
              quarters — each producing its own frequency.
            </div>
          </FadeUp>
        </>
      }
      right={
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {harmonics.map((h, i) => {
            const d = 15 + i * 18;
            const s = interpolate(frame, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const barPct = (1 / h.n) * 100;
            return (
              <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, background: `${C.darkGray}80`, border: `1px solid ${h.color}12` }}>
                <div style={{ width: 60, textAlign: "right" as const, fontSize: 14, fontWeight: 800, color: h.color, fontFamily: "monospace" }}>{h.freq}</div>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: `${C.darkGray}` }}>
                  <div style={{ width: `${barPct}%`, height: "100%", borderRadius: 5, background: h.color, opacity: 0.75 }} />
                </div>
                <div style={{ width: 160, fontSize: 12, color: C.gray, fontFamily: F }}>{h.interval}</div>
              </div>
            );
          })}
        </div>
      }
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — Timbre: Same ingredients, different recipe (28–40s = 840–1200)
// ═══════════════════════════════════════════════════════════════════════
const Scene4: React.FC = () => {
  const { op, y } = useExit(335, 360);
  const frame = useCurrentFrame();

  const instruments = [
    { name: "Sine Wave", desc: "Pure tone — fundamental only", color: C.cyan, profile: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Sawtooth", desc: "All harmonics (1/n falloff) — rich, buzzy", color: C.orange, profile: [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12, 0.11, 0.1] },
    { name: "Square Wave", desc: "Odd harmonics only — hollow, woody", color: C.purple, profile: [1, 0, 0.33, 0, 0.2, 0, 0.14, 0, 0.11, 0] },
    { name: "Clarinet-like", desc: "Strong odd, weak even — reedy, nasal", color: C.green, profile: [1, 0.08, 0.45, 0.05, 0.3, 0.04, 0.2, 0.03, 0.15, 0.02] },
  ];

  return (
    <Center opacity={op} translateY={y} seed={3} tint={C.orange}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.orange, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        WHY TIMBRE EXISTS
      </FadeUp>
      <FadeUp delay={12} style={{ fontSize: 42, fontWeight: 900, color: C.white, fontFamily: F, lineHeight: 1.1, marginBottom: 8 }}>
        Same ingredients.{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Different recipe.</span>
      </FadeUp>
      <FadeUp delay={18} style={{ fontSize: 18, color: C.gray, fontFamily: F, marginBottom: 30 }}>
        Timbre = the unique fingerprint of harmonic amplitudes that makes a piano sound different from a guitar.
      </FadeUp>

      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, width: "100%", justifyContent: "center" }}>
        {instruments.map((inst, idx) => {
          const baseDelay = 35 + idx * 55;
          const s = interpolate(frame, [baseDelay, baseDelay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={idx} style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`, width: "47%", padding: "16px 18px", borderRadius: 16, background: `${C.darkGray}90`, border: `1px solid ${inst.color}18` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: inst.color, fontFamily: F }}>{inst.name}</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 60, marginBottom: 8 }}>
                {inst.profile.map((amp, i) => {
                  const bd = baseDelay + 12 + i * 3;
                  const be = interpolate(frame, [bd, bd + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: "75%", height: amp * 55 * be, borderRadius: 3, backgroundColor: amp > 0.03 ? inst.color : `${C.gray}15`, opacity: amp > 0.03 ? 0.8 : 0.2 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: C.gray, fontFamily: F }}>{inst.desc}</div>
            </div>
          );
        })}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — Warmth, Brightness, Thin, Rich (40–50s = 1200–1500)
// ═══════════════════════════════════════════════════════════════════════
const Scene5: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const qualities = [
    { word: "\"Warm\"", desc: "Strong lower harmonics (2nd & 3rd) relative to fundamental", color: C.orange, example: "Tube-saturated vocals, vintage tape" },
    { word: "\"Bright\"", desc: "Prominent upper harmonics (5th through 10th+)", color: C.cyan, example: "Crispy hi-hats, presence in vocals" },
    { word: "\"Thin\"", desc: "Lacks harmonic complexity — few overtones", color: C.gray, example: "Weak sine-like synths, over-filtered sounds" },
    { word: "\"Rich\"", desc: "Full harmonic spectrum present and balanced", color: C.gold, example: "Analog synths, grand piano, layered strings" },
  ];

  return (
    <Center opacity={op} translateY={y} seed={4} tint={C.gold}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.gold, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        WHAT PRODUCERS ACTUALLY MEAN
      </FadeUp>
      <FadeUp delay={12} style={{ fontSize: 42, fontWeight: 900, color: C.white, fontFamily: F, lineHeight: 1.1, marginBottom: 36 }}>
        When you say "warm" or "bright" —
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>you're describing harmonics.</span>
      </FadeUp>

      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, width: "100%", justifyContent: "center" }}>
        {qualities.map((q, i) => {
          const d = 30 + i * 40;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`, width: "47%", padding: "20px 22px", borderRadius: 16, background: `${C.darkGray}aa`, border: `1px solid ${q.color}20` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: q.color, fontFamily: F, marginBottom: 8 }}>{q.word}</div>
              <div style={{ fontSize: 15, color: C.lightGray, fontFamily: F, lineHeight: 1.4, marginBottom: 8 }}>{q.desc}</div>
              <div style={{ fontSize: 13, color: `${C.gray}aa`, fontFamily: F, fontStyle: "italic" }}>{q.example}</div>
            </div>
          );
        })}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — Frequency Bands (50–62s = 1500–1860)
// ═══════════════════════════════════════════════════════════════════════
const Scene6: React.FC = () => {
  const { op, y } = useExit(335, 360);
  const frame = useCurrentFrame();

  const bands = [
    { range: "20–60 Hz", name: "Sub-Bass", desc: "Felt, not heard. Chest rumble at concerts.", color: C.purple, pct: 8, harmonic: "Fundamentals of lowest bass" },
    { range: "60–250 Hz", name: "Bass", desc: "Body and warmth. Where bass guitar lives.", color: C.blue, pct: 18, harmonic: "100 Hz fund. lives here" },
    { range: "250–500 Hz", name: "Low-Mid", desc: "Can get muddy. The \"boxy\" zone.", color: C.green, pct: 15, harmonic: "2nd–3rd harmonics of bass" },
    { range: "500 Hz–2 kHz", name: "Midrange", desc: "Vocals, melodic instruments, intelligibility.", color: C.gold, pct: 25, harmonic: "4th–8th harmonics of bass" },
    { range: "2–4 kHz", name: "Presence", desc: "Attack, bite. Snare crack, vocal clarity.", color: C.orange, pct: 18, harmonic: "Upper harmonics add definition" },
    { range: "4–20 kHz", name: "Treble", desc: "Sparkle, air, space, detail.", color: C.pink, pct: 16, harmonic: "Highest harmonics, shimmer" },
  ];

  return (
    <Center opacity={op} translateY={y} seed={5} tint={C.blue}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.blue, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        THE FREQUENCY MAP
      </FadeUp>
      <FadeUp delay={12} style={{ fontSize: 38, fontWeight: 900, color: C.white, fontFamily: F, lineHeight: 1.1, marginBottom: 12 }}>
        A bass note's harmonics cascade through
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>every frequency band.</span>
      </FadeUp>
      <FadeUp delay={20} style={{ fontSize: 17, color: C.gray, fontFamily: F, marginBottom: 28 }}>
        The fundamental tells you what note is playing. The harmonics tell you what instrument and how it feels.
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {bands.map((b, i) => {
          const d = 35 + i * 28;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 100, textAlign: "right" as const }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: b.color, fontFamily: F }}>{b.name}</div>
                <div style={{ fontSize: 11, color: `${C.gray}80`, fontFamily: "monospace" }}>{b.range}</div>
              </div>
              <div style={{ flex: 1, height: 24, borderRadius: 6, background: `${C.darkGray}`, overflow: "hidden" }}>
                <div style={{ width: `${b.pct * 4}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${b.color}bb, ${b.color}40)` }} />
              </div>
              <div style={{ width: 250, textAlign: "left" as const }}>
                <div style={{ fontSize: 13, color: C.lightGray, fontFamily: F }}>{b.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — Even vs Odd: THE key to distortion (62–80s = 1860–2400)
// ═══════════════════════════════════════════════════════════════════════
const Scene7: React.FC = () => {
  const { op, y } = useExit(515, 540);

  return (
    <Center opacity={op} translateY={y} seed={6} tint={C.green}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.green, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        THE KEY TO UNDERSTANDING DISTORTION
      </FadeUp>
      <FadeUp delay={12} style={{ fontSize: 42, fontWeight: 900, color: C.white, fontFamily: F, lineHeight: 1.1, marginBottom: 36 }}>
        Even harmonics vs. Odd harmonics.
      </FadeUp>

      <div style={{ display: "flex", gap: 30, width: "100%", justifyContent: "center" }}>
        {/* Even side */}
        <FadeUp delay={30} style={{ flex: 1, padding: "24px", borderRadius: 20, background: `${C.green}08`, border: `2px solid ${C.green}25` }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green, fontFamily: F, marginBottom: 4 }}>Even Harmonics</div>
          <div style={{ fontSize: 14, color: C.gray, fontFamily: F, marginBottom: 16 }}>2nd, 4th, 6th, 8th...</div>
          <HarmonicBars delay={40} fundamental={100} count={10} mode="even" showLabels={false} height={160} barWidth={32} />
          <div style={{ fontSize: 15, color: C.lightGray, fontFamily: F, marginTop: 12, lineHeight: 1.5 }}>
            Adds <span style={{ color: C.green, fontWeight: 700 }}>octaves and fifths</span>
            <br />
            Consonant, warm, musical intervals
            <br />
            <span style={{ color: `${C.gray}aa`, fontSize: 13 }}>→ Tube saturation, tape warmth</span>
          </div>
        </FadeUp>

        {/* Odd side */}
        <FadeUp delay={160} style={{ flex: 1, padding: "24px", borderRadius: 20, background: `${C.orange}08`, border: `2px solid ${C.orange}25` }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.orange, fontFamily: F, marginBottom: 4 }}>Odd Harmonics</div>
          <div style={{ fontSize: 14, color: C.gray, fontFamily: F, marginBottom: 16 }}>3rd, 5th, 7th, 9th...</div>
          <HarmonicBars delay={170} fundamental={100} count={10} mode="odd" showLabels={false} height={160} barWidth={32} />
          <div style={{ fontSize: 15, color: C.lightGray, fontFamily: F, marginTop: 12, lineHeight: 1.5 }}>
            Adds <span style={{ color: C.orange, fontWeight: 700 }}>complex intervals</span>
            <br />
            Edge, tension, aggression
            <br />
            <span style={{ color: `${C.gray}aa`, fontSize: 13 }}>→ Transistor clipping, digital distortion</span>
          </div>
        </FadeUp>
      </div>

      <FadeUp delay={350} style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 30 }}>
        This is why tube saturation sounds{" "}
        <span style={{ color: C.green }}>warm</span>
        {" "}and hard clipping sounds{" "}
        <span style={{ color: C.orange }}>harsh</span>.
      </FadeUp>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 8 — Consonance & Dissonance (80–92s = 2400–2760)
// ═══════════════════════════════════════════════════════════════════════
const Scene8: React.FC = () => {
  const { op, y } = useExit(335, 360);

  return (
    <TwoCol
      opacity={op} translateY={y} seed={7} tint={C.purple}
      left={
        <>
          <FadeUp delay={5} style={{ textAlign: "left" as const }}>
            <div style={{ fontSize: 15, color: C.purple, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>CONSONANCE & DISSONANCE</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.white, fontFamily: F, lineHeight: 1.15 }}>
              Why do certain notes
              <br />
              sound <span style={{ color: C.green }}>good</span> together
              <br />
              and others <span style={{ color: C.red }}>clash</span>?
            </div>
          </FadeUp>
          <FadeUp delay={40} style={{ textAlign: "left" as const, marginTop: 24 }}>
            <div style={{ fontSize: 18, color: C.lightGray, fontFamily: F, lineHeight: 1.7 }}>
              When two notes' harmonics <span style={{ color: C.green, fontWeight: 600 }}>align</span>,
              <br />
              you hear consonance — stability.
              <br /><br />
              When they <span style={{ color: C.red, fontWeight: 600 }}>clash</span> (beating between
              <br />
              close frequencies), you hear dissonance.
            </div>
          </FadeUp>
        </>
      }
      right={
        <>
          <FadeUp delay={25} style={{ width: "100%", padding: "20px", borderRadius: 16, background: `${C.green}08`, border: `1px solid ${C.green}20`, marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.green, fontFamily: F, marginBottom: 8 }}>The Octave (2:1)</div>
            <div style={{ fontSize: 14, color: C.gray, fontFamily: F, lineHeight: 1.5 }}>
              100 Hz + 200 Hz — harmonics overlap almost completely.
              <br />No conflict. Pure reinforcement.
            </div>
          </FadeUp>
          <FadeUp delay={80} style={{ width: "100%", padding: "20px", borderRadius: 16, background: `${C.primary}08`, border: `1px solid ${C.primary}20`, marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.primary, fontFamily: F, marginBottom: 8 }}>The Fifth (3:2)</div>
            <div style={{ fontSize: 14, color: C.gray, fontFamily: F, lineHeight: 1.5 }}>
              3rd harmonic of lower = 2nd of upper.
              <br />Strong alignment — stable, powerful.
            </div>
          </FadeUp>
          <FadeUp delay={140} style={{ width: "100%", padding: "20px", borderRadius: 16, background: `${C.orange}08`, border: `1px solid ${C.orange}20` }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.orange, fontFamily: F, marginBottom: 8 }}>Why This Matters for Distortion</div>
            <div style={{ fontSize: 14, color: C.gray, fontFamily: F, lineHeight: 1.5 }}>
              <span style={{ color: C.green }}>Even harmonics</span> = octaves & fifths = consonant
              <br />
              <span style={{ color: C.orange }}>Odd harmonics</span> = complex intervals = tension
            </div>
          </FadeUp>
        </>
      }
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 9 — Practical Exercise / Takeaway (92–102s = 2760–3060)
// ═══════════════════════════════════════════════════════════════════════
const Scene9: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const steps = [
    { n: "1", text: "Load a sine wave oscillator at 200 Hz — see one peak in Spectrum", color: C.cyan },
    { n: "2", text: "Switch to sawtooth — see the cascade of ALL harmonics appear", color: C.orange },
    { n: "3", text: "Switch to square wave — see only ODD harmonics (gaps where even should be)", color: C.purple },
    { n: "4", text: "Sweep a narrow EQ boost slowly from 100 Hz to 2 kHz — hear each harmonic pop out", color: C.gold },
    { n: "5", text: "Now you can HEAR what saturation will later ADD to your sounds", color: C.green },
  ];

  return (
    <Center opacity={op} translateY={y} seed={8} tint={C.cyan}>
      <FadeUp delay={5} style={{ fontSize: 15, color: C.cyan, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>
        TRY THIS IN YOUR DAW
      </FadeUp>
      <FadeUp delay={12} style={{ fontSize: 38, fontWeight: 900, color: C.white, fontFamily: F, lineHeight: 1.1, marginBottom: 30 }}>
        Build your harmonic hearing.
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 1100 }}>
        {steps.map((s, i) => {
          const d = 30 + i * 35;
          const enter = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: enter, transform: `translateX(${interpolate(enter, [0, 1], [60, 0])}px)`, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderRadius: 14, background: i === 4 ? `${s.color}12` : `${C.darkGray}90`, border: `1px solid ${s.color}${i === 4 ? "30" : "15"}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}20`, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 16, fontWeight: 800, color: s.color, fontFamily: F, flexShrink: 0 }}>{s.n}</div>
              <div style={{ fontSize: 17, color: i === 4 ? s.color : C.white, fontFamily: F, fontWeight: i === 4 ? 700 : 500 }}>{s.text}</div>
            </div>
          );
        })}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 10 — Summary + CTA (102–112s = 3060–3360)
// ═══════════════════════════════════════════════════════════════════════
const Scene10: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaSpring = spring({ fps, frame: frame - 100, config: { damping: 50, stiffness: 160 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const urlOp = interpolate(frame, [130, 145], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <Center seed={9} tint={C.orange}>
      <FadeUp delay={8}>
        <div style={{ fontSize: 42, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          The harmonic series is the
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>alphabet of musical tone.</span>
        </div>
      </FadeUp>
      <FadeUp delay={35} style={{ fontSize: 20, color: C.gray, fontFamily: F, lineHeight: 1.6, marginTop: 20, maxWidth: 800 }}>
        Every sound you work with — every vocal, synth, drum hit —
        <br />
        is a combination of these frequencies in varying proportions.
      </FadeUp>
      <FadeUp delay={60} style={{ fontSize: 22, fontWeight: 700, color: C.lightGray, fontFamily: F, marginTop: 24 }}>
        Next chapter: How distortion <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>adds specific harmonics</span>
        <br />
        to this natural structure.
      </FadeUp>

      <FadeUp delay={80} style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 70, height: 70, borderRadius: 18, background: `linear-gradient(135deg, ${C.orange}, ${C.red}, ${C.pink})`, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 0 40px ${C.orange}40` }}>
          <div style={{ fontSize: 35, color: C.white }}>▶</div>
        </div>
        <div style={{ textAlign: "left" as const }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.white, fontFamily: F }}>Saturation & Distortion</div>
          <div style={{ fontSize: 16, color: C.gray, fontFamily: F }}>From First Principles to Advanced Sound Design</div>
        </div>
      </FadeUp>

      <div style={{ transform: `scale(${ctaScale})`, marginTop: 30, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$9</div>
        <div style={{ padding: "16px 40px", borderRadius: 60, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: C.white, fontSize: 22, fontWeight: 700, fontFamily: F, boxShadow: `0 0 ${36 * pulse}px ${C.orange}50`, letterSpacing: 0.5 }}>
          Enroll Now →
        </div>
      </div>
      <div style={{ opacity: urlOp, marginTop: 18, fontSize: 17, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~112s (1:52) @ 30fps = 3360 frames
// ═══════════════════════════════════════════════════════════════════════
export const HarmonicsLessonLong: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={240}><Scene1 /></Sequence>
    <Sequence from={240} durationInFrames={300}><Scene2 /></Sequence>
    <Sequence from={540} durationInFrames={300}><Scene3 /></Sequence>
    <Sequence from={840} durationInFrames={360}><Scene4 /></Sequence>
    <Sequence from={1200} durationInFrames={300}><Scene5 /></Sequence>
    <Sequence from={1500} durationInFrames={360}><Scene6 /></Sequence>
    <Sequence from={1860} durationInFrames={540}><Scene7 /></Sequence>
    <Sequence from={2400} durationInFrames={360}><Scene8 /></Sequence>
    <Sequence from={2760} durationInFrames={300}><Scene9 /></Sequence>
    <Sequence from={3060} durationInFrames={300}><Scene10 /></Sequence>
  </AbsoluteFill>
);
