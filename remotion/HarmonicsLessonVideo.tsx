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
  darkGray: "#1e293b",
};
const F = "system-ui, -apple-system, sans-serif";

// ─── Shared ───────────────────────────────────────────────────────────
const BG: React.FC<{ seed?: number; tint?: string }> = ({ seed = 0, tint = C.primary }) => {
  const frame = useCurrentFrame();
  const scanY = (frame * 3) % 2100 - 100;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: `linear-gradient(${tint}10 1px, transparent 1px), linear-gradient(90deg, ${tint}10 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      {[
        { x: 60 + seed * 50, y: 450, s: 480, c: tint, d: 0 },
        { x: 520 + seed * 25, y: 1200, s: 400, c: C.purple, d: 40 },
        { x: 20, y: 850, s: 350, c: C.pink, d: 80 },
      ].map((o, i) => {
        const p = Math.sin((frame + o.d) * 0.03) * 0.3 + 0.7;
        const dr = Math.sin((frame + o.d) * 0.015) * 20;
        return <div key={i} style={{ position: "absolute", left: o.x, top: o.y + dr, width: o.s, height: o.s, borderRadius: "50%", background: `radial-gradient(circle, ${o.c}25, transparent 70%)`, opacity: p * 0.5, filter: `blur(${o.s * 0.3}px)` }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 1.5, background: `linear-gradient(90deg, transparent, ${tint}20, transparent)` }} />
    </>
  );
};

const Center: React.FC<{ children: React.ReactNode; opacity?: number; translateY?: number; seed?: number; tint?: string }> = ({ children, opacity = 1, translateY = 0, seed = 0, tint }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity, transform: `translateY(${translateY}px)` }}>
    <BG seed={seed} tint={tint} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const, padding: "0 48px", zIndex: 1, width: "100%" }}>{children}</div>
  </AbsoluteFill>
);

const FadeUp: React.FC<{ children: React.ReactNode; delay: number; style?: React.CSSProperties }> = ({ children, delay, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 60, stiffness: 180 } });
  return <div style={{ transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`, opacity: interpolate(s, [0, 1], [0, 1]), ...style }}>{children}</div>;
};

const useExit = (start: number, end: number) => {
  const frame = useCurrentFrame();
  return {
    op: interpolate(frame, [start, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    y: interpolate(frame, [start, end], [0, -25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
};

// ─── Harmonic Series Visualization ────────────────────────────────────
const HarmonicBars: React.FC<{
  delay: number;
  fundamental: number;
  count: number;
  showLabels?: boolean;
  highlightEven?: boolean;
  highlightOdd?: boolean;
  mode?: "all" | "even" | "odd";
}> = ({ delay, fundamental, count, showLabels = true, highlightEven, highlightOdd, mode = "all" }) => {
  const frame = useCurrentFrame();
  const maxH = 200;
  const barW = Math.min(40, (900 - count * 6) / count);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, height: maxH + 40, width: "100%" }}>
      {Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        const isEven = n % 2 === 0;
        const isOdd = n % 2 !== 0;

        // Natural harmonic amplitude falloff: 1/n
        let amplitude = 1 / n;
        // Suppress based on mode
        if (mode === "even" && isOdd && n > 1) amplitude = 0.03;
        if (mode === "odd" && isEven) amplitude = 0.03;

        const h = amplitude * maxH;
        const d = delay + i * 8;
        const enter = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const barH = h * enter;

        let color = C.cyan;
        if (n === 1) color = C.white;
        else if (highlightEven && isEven) color = C.green;
        else if (highlightOdd && isOdd) color = C.orange;
        else if (mode === "even" && isEven) color = C.green;
        else if (mode === "even" && isOdd && n > 1) color = `${C.gray}30`;
        else if (mode === "odd" && isOdd) color = C.orange;
        else if (mode === "odd" && isEven) color = `${C.gray}30`;

        // Subtle pulse on visible bars
        const pulse = (mode === "all" || (mode === "even" && isEven) || (mode === "odd" && isOdd))
          ? Math.sin((frame - d) * 0.04 + i) * 0.08 + 0.92
          : 1;

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: barW,
                height: barH * pulse,
                borderRadius: barW / 3,
                backgroundColor: color,
                opacity: enter,
                boxShadow: barH > 10 ? `0 0 ${12 * pulse}px ${color}30` : "none",
                transition: "background-color 0.3s",
              }}
            />
            {showLabels && (
              <div style={{ fontSize: 10, color: `${C.gray}aa`, fontFamily: "monospace", opacity: enter }}>
                {fundamental * n}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Sine Wave SVG ────────────────────────────────────────────────────
const SineWave: React.FC<{ delay: number; color: string; amplitude?: number; frequency?: number; label?: string }> = ({
  delay, color, amplitude = 40, frequency = 2, label,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = 900;
  const h = 100;
  const mid = h / 2;
  let d = "";
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * w;
    const y = mid - Math.sin((i / 200) * Math.PI * frequency * 2 + frame * 0.06) * amplitude;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return (
    <div style={{ opacity: enter, width: "100%" }}>
      {label && <div style={{ fontSize: 12, color, fontFamily: F, fontWeight: 700, letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" as const }}>{label}</div>}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 70 }}>
        <path d={`M 0 ${mid} L ${w} ${mid}`} stroke={`${color}20`} strokeWidth={1} fill="none" />
        <path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <path d={d} stroke={color} strokeWidth={8} fill="none" opacity={0.12} strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — HOOK: "You think you're hearing one note" (0–7s)
// ═══════════════════════════════════════════════════════════════════════
const Scene1: React.FC = () => {
  const { op, y } = useExit(185, 210);
  return (
    <Center opacity={op} translateY={y} tint={C.cyan}>
      <FadeUp delay={8} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        You play one note on a piano.
      </FadeUp>
      <FadeUp delay={28} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 28 }}>
        You think you're hearing one frequency.
      </FadeUp>
      <FadeUp delay={52}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          You're hearing
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>an entire</span>
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>architecture.</span>
        </div>
      </FadeUp>
      <FadeUp delay={85} style={{ width: "100%", marginTop: 30 }}>
        <HarmonicBars delay={85} fundamental={100} count={10} />
      </FadeUp>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — The Harmonic Series Explained (7–16s)
// ═══════════════════════════════════════════════════════════════════════
const Scene2: React.FC = () => {
  const { op, y } = useExit(245, 270);
  const frame = useCurrentFrame();

  const harmonics = [
    { n: 1, freq: "100 Hz", name: "Fundamental", color: C.white, note: "The note you played" },
    { n: 2, freq: "200 Hz", name: "2nd Harmonic", color: C.cyan, note: "One octave up" },
    { n: 3, freq: "300 Hz", name: "3rd Harmonic", color: C.blue, note: "Octave + fifth" },
    { n: 4, freq: "400 Hz", name: "4th Harmonic", color: C.primary, note: "Two octaves up" },
    { n: 5, freq: "500 Hz", name: "5th Harmonic", color: C.purple, note: "Major third" },
    { n: 6, freq: "600 Hz", name: "6th Harmonic", color: C.pink, note: "Octave + fifth" },
  ];

  return (
    <Center opacity={op} translateY={y} seed={1} tint={C.cyan}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.cyan, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE HARMONIC SERIES
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 8 }}>
        One note.{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Many frequencies.
        </span>
      </FadeUp>
      <FadeUp delay={15} style={{ fontSize: 16, color: C.gray, fontFamily: F, marginBottom: 28 }}>
        Integer multiples of the fundamental — it's physics.
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {harmonics.map((h, i) => {
          const d = 30 + i * 22;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const barWidth = (1 / h.n) * 100;
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 12, background: `${C.darkGray}90`, border: `1px solid ${h.color}15` }}>
              <div style={{ width: 55, textAlign: "right" as const, fontSize: 13, fontWeight: 800, color: h.color, fontFamily: "monospace" }}>{h.freq}</div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: `${C.darkGray}`, overflow: "hidden" }}>
                <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 4, background: h.color, opacity: 0.8 }} />
              </div>
              <div style={{ width: 80, fontSize: 11, color: C.gray, fontFamily: F }}>{h.note}</div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={175} style={{ fontSize: 15, color: `${C.gray}cc`, fontFamily: F, marginTop: 16, fontStyle: "italic" }}>
        Each harmonic is quieter than the last — falling off at 1/n amplitude.
      </FadeUp>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — Timbre: Why instruments sound different (16–26s)
// ═══════════════════════════════════════════════════════════════════════
const Scene3: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  // Show 3 "instruments" with different harmonic profiles
  const instruments = [
    { name: "Sine Wave", desc: "Fundamental only — pure, no harmonics", color: C.cyan, profile: [1, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Sawtooth", desc: "All harmonics — rich, buzzy, full", color: C.orange, profile: [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12] },
    { name: "Square Wave", desc: "Odd harmonics only — hollow, clarinet-like", color: C.purple, profile: [1, 0, 0.33, 0, 0.2, 0, 0.14, 0] },
  ];

  return (
    <Center opacity={op} translateY={y} seed={2} tint={C.orange}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.orange, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        WHY TIMBRE EXISTS
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 8 }}>
        Same harmonics.
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Different recipe.</span>
      </FadeUp>
      <FadeUp delay={15} style={{ fontSize: 16, color: C.gray, fontFamily: F, marginBottom: 28 }}>
        Timbre is the unique fingerprint of harmonic amplitudes.
      </FadeUp>

      {instruments.map((inst, idx) => {
        const baseDelay = 35 + idx * 70;
        const s = interpolate(frame, [baseDelay, baseDelay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={idx} style={{ opacity: s, width: "100%", marginBottom: 16, padding: "14px 16px", borderRadius: 14, background: `${C.darkGray}90`, border: `1px solid ${inst.color}20` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: inst.color, fontFamily: F }}>{inst.name}</div>
              <div style={{ fontSize: 12, color: C.gray, fontFamily: F }}>{inst.desc}</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 50 }}>
              {inst.profile.map((amp, i) => {
                const bd = baseDelay + 10 + i * 4;
                const be = interpolate(frame, [bd, bd + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: "80%", height: amp * 45 * be, borderRadius: 3, backgroundColor: amp > 0.05 ? inst.color : `${C.gray}20`, opacity: amp > 0.05 ? 0.85 : 0.3 }} />
                    <div style={{ fontSize: 8, color: `${C.gray}60`, fontFamily: "monospace" }}>{i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — Warmth vs Brightness (26–34s)
// ═══════════════════════════════════════════════════════════════════════
const Scene4: React.FC = () => {
  const { op, y } = useExit(215, 240);
  const frame = useCurrentFrame();

  const qualities = [
    { word: "Warmth", desc: "Strong 2nd & 3rd harmonics", color: C.orange, icon: "🔥" },
    { word: "Brightness", desc: "Strong 5th–10th+ harmonics", color: C.cyan, icon: "✨" },
    { word: "Thin", desc: "Lacks harmonic complexity", color: C.gray, icon: "📉" },
    { word: "Rich", desc: "Full harmonic spectrum present", color: C.gold, icon: "🎵" },
  ];

  return (
    <Center opacity={op} translateY={y} seed={3} tint={C.orange}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.gold, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        WHAT YOU'RE REALLY DESCRIBING
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        "Warm." "Bright." "Thin."
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>It's all harmonics.</span>
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {qualities.map((q, i) => {
          const d = 30 + i * 30;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`, display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 16, background: `${C.darkGray}aa`, border: `1px solid ${q.color}25` }}>
              <div style={{ fontSize: 30 }}>{q.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: q.color, fontFamily: F }}>{q.word}</div>
                <div style={{ fontSize: 14, color: C.gray, fontFamily: F }}>{q.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — Even vs Odd Harmonics (34–46s)
// ═══════════════════════════════════════════════════════════════════════
const Scene5: React.FC = () => {
  const { op, y } = useExit(335, 360);
  const frame = useCurrentFrame();

  const phase1 = interpolate(frame, [0, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phase2 = interpolate(frame, [150, 300], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Center opacity={op} translateY={y} seed={4} tint={C.green}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE KEY TO DISTORTION
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 28 }}>
        Even vs. Odd
        <br />
        <span style={{ background: `linear-gradient(135deg, ${C.green}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Harmonics.</span>
      </FadeUp>

      {/* Even harmonics */}
      <FadeUp delay={25} style={{ width: "100%", padding: "16px 18px", borderRadius: 16, background: `${C.green}08`, border: `1px solid ${C.green}20`, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.green, fontFamily: F }}>Even Harmonics (2nd, 4th, 6th)</div>
          <div style={{ fontSize: 12, color: C.green, fontFamily: F, opacity: 0.7 }}>Tube saturation</div>
        </div>
        <HarmonicBars delay={30} fundamental={100} count={8} mode="even" showLabels={false} />
        <div style={{ fontSize: 13, color: C.gray, fontFamily: F, marginTop: 8 }}>
          Adds octaves and fifths — <span style={{ color: C.green, fontWeight: 700 }}>consonant, warm, musical</span>
        </div>
      </FadeUp>

      {/* Odd harmonics */}
      <FadeUp delay={160} style={{ width: "100%", padding: "16px 18px", borderRadius: 16, background: `${C.orange}08`, border: `1px solid ${C.orange}20`, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.orange, fontFamily: F }}>Odd Harmonics (3rd, 5th, 7th)</div>
          <div style={{ fontSize: 12, color: C.orange, fontFamily: F, opacity: 0.7 }}>Transistor / digital</div>
        </div>
        <HarmonicBars delay={165} fundamental={100} count={8} mode="odd" showLabels={false} />
        <div style={{ fontSize: 13, color: C.gray, fontFamily: F, marginTop: 8 }}>
          Adds complex intervals — <span style={{ color: C.orange, fontWeight: 700 }}>edgy, aggressive, tense</span>
        </div>
      </FadeUp>

      <FadeUp delay={280} style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 12 }}>
        This is why tube saturation sounds{" "}
        <span style={{ color: C.green }}>warm</span>
        {" "}and hard clipping sounds{" "}
        <span style={{ color: C.orange }}>harsh</span>.
      </FadeUp>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — Frequency Bands Where Harmonics Live (46–56s)
// ═══════════════════════════════════════════════════════════════════════
const Scene6: React.FC = () => {
  const { op, y } = useExit(275, 300);
  const frame = useCurrentFrame();

  const bands = [
    { range: "20–60 Hz", name: "Sub-Bass", desc: "Felt, not heard. The rumble.", color: C.purple, width: "15%" },
    { range: "60–250 Hz", name: "Bass", desc: "Body, warmth. Fundamental home.", color: C.blue, width: "25%" },
    { range: "250–2K Hz", name: "Midrange", desc: "Intelligibility. Where vocals live.", color: C.green, width: "30%" },
    { range: "2–4 kHz", name: "Presence", desc: "Attack, bite. Snare crack.", color: C.orange, width: "18%" },
    { range: "4–20 kHz", name: "Treble", desc: "Sparkle, air, detail.", color: C.pink, width: "12%" },
  ];

  return (
    <Center opacity={op} translateY={y} seed={5} tint={C.blue}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.blue, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 10 }}>
        THE FREQUENCY MAP
      </FadeUp>
      <FadeUp delay={10} style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 12 }}>
        A 100 Hz bass note's
        <br />
        harmonics reach{" "}
        <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.pink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>everywhere.</span>
      </FadeUp>

      <FadeUp delay={20} style={{ fontSize: 15, color: C.gray, fontFamily: F, marginBottom: 28, lineHeight: 1.5 }}>
        200 Hz adds warmth. 800 Hz adds presence.
        <br />
        4 kHz+ adds clarity and articulation.
      </FadeUp>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {bands.map((b, i) => {
          const d = 40 + i * 30;
          const s = interpolate(frame, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [50, 0])}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: b.color, fontFamily: F }}>{b.name} <span style={{ fontWeight: 400, color: C.gray, fontSize: 12 }}>({b.range})</span></div>
              </div>
              <div style={{ height: 28, borderRadius: 8, background: `${C.darkGray}`, overflow: "hidden", marginBottom: 2 }}>
                <div style={{ width: b.width, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${b.color}cc, ${b.color}50)`, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                  <div style={{ fontSize: 10, color: C.white, fontFamily: F, fontWeight: 600 }}>{b.range}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: `${C.gray}aa`, fontFamily: F }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — Connection to Saturation (56–64s)
// ═══════════════════════════════════════════════════════════════════════
const Scene7: React.FC = () => {
  const { op, y } = useExit(215, 240);
  return (
    <Center opacity={op} translateY={y} seed={6} tint={C.orange}>
      <FadeUp delay={8}>
        <div style={{ fontSize: 42, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Saturation
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>adds harmonics</span>
          <br />
          that weren't there.
        </div>
      </FadeUp>
      <FadeUp delay={40} style={{ width: "100%", marginTop: 30, padding: "20px 18px", borderRadius: 16, background: `${C.darkGray}90`, border: `1px solid ${C.orange}20` }}>
        <div style={{ fontSize: 16, color: C.gray, fontFamily: F, lineHeight: 1.7, textAlign: "left" as const }}>
          <span style={{ color: C.green, fontWeight: 700 }}>Tube saturation</span> emphasizes even harmonics
          <br />→ octaves and fifths → <span style={{ color: C.green }}>warm and musical</span>
          <br /><br />
          <span style={{ color: C.orange, fontWeight: 700 }}>Transistor clipping</span> emphasizes odd harmonics
          <br />→ complex intervals → <span style={{ color: C.orange }}>aggressive and edgy</span>
          <br /><br />
          <span style={{ color: C.red, fontWeight: 700 }}>Digital hard clipping</span> adds both chaotically
          <br />→ aliasing artifacts → <span style={{ color: C.red }}>harsh and gritty</span>
        </div>
      </FadeUp>
      <FadeUp delay={100} style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: F, marginTop: 24 }}>
        Now you know <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>why</span> it sounds the way it does.
      </FadeUp>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 8 — CTA (64–72s)
// ═══════════════════════════════════════════════════════════════════════
const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({ fps, frame: frame - 10, config: { damping: 40, stiffness: 150 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const ctaSpring = spring({ fps, frame: frame - 60, config: { damping: 50, stiffness: 160 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const urlOp = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <Center seed={7} tint={C.orange}>
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 30 }}>
        <div style={{ width: 100, height: 100, borderRadius: 26, background: `linear-gradient(135deg, ${C.orange}, ${C.red}, ${C.pink})`, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 0 60px ${C.orange}50` }}>
          <div style={{ fontSize: 50, color: C.white }}>▶</div>
        </div>
      </div>

      <FadeUp delay={20}>
        <div style={{ fontSize: 20, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 16 }}>
          This is Lesson 1, Chapter 1.
        </div>
      </FadeUp>

      <FadeUp delay={32}>
        <div style={{ fontSize: 34, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Saturation & Distortion
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, fontFamily: F, lineHeight: 1.3, color: C.gray, marginTop: 8 }}>
          From First Principles to
          <br />
          Advanced Sound Design
        </div>
      </FadeUp>

      <FadeUp delay={48}>
        <div style={{ fontSize: 52, fontWeight: 900, fontFamily: F, marginTop: 24, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$9</div>
      </FadeUp>

      <div style={{ transform: `scale(${ctaScale})`, marginTop: 28 }}>
        <div style={{ padding: "16px 40px", borderRadius: 60, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: C.white, fontSize: 22, fontWeight: 700, fontFamily: F, boxShadow: `0 0 ${36 * pulse}px ${C.orange}50`, letterSpacing: 0.5 }}>
          Start Learning →
        </div>
      </div>
      <div style={{ opacity: urlOp, marginTop: 20, fontSize: 17, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </Center>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~72s @ 30fps = 2160 frames
// ═══════════════════════════════════════════════════════════════════════
export const HarmonicsLessonVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={210}><Scene1 /></Sequence>
    <Sequence from={210} durationInFrames={270}><Scene2 /></Sequence>
    <Sequence from={480} durationInFrames={300}><Scene3 /></Sequence>
    <Sequence from={780} durationInFrames={240}><Scene4 /></Sequence>
    <Sequence from={1020} durationInFrames={360}><Scene5 /></Sequence>
    <Sequence from={1380} durationInFrames={300}><Scene6 /></Sequence>
    <Sequence from={1680} durationInFrames={240}><Scene7 /></Sequence>
    <Sequence from={1920} durationInFrames={240}><Scene8 /></Sequence>
  </AbsoluteFill>
);
