import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

// TIMING: 20 sections, exact durations from ElevenLabs audio
// Total: ~11 minutes = 19800 frames @ 30fps

const C = {
  bg: "#0a0a0a", primary: "#6366f1", purple: "#7c3aed", pink: "#ec4899",
  cyan: "#22d3ee", green: "#22c55e", orange: "#f97316", red: "#ef4444",
  gold: "#eab308", blue: "#3b82f6", white: "#ffffff", gray: "#94a3b8",
  lightGray: "#cbd5e1", darkGray: "#1e293b",
};
const F = "system-ui, -apple-system, sans-serif";

// ─── Background ───────────────────────────────────────────────────────
const BG: React.FC<{ s?: number; t?: string }> = ({ s: seed = 0, t: tint = C.primary }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: `linear-gradient(${tint}0d 1px, transparent 1px), linear-gradient(90deg, ${tint}0d 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      {[{ x: 80 + seed * 70, y: 180, sz: 500, c: tint, d: 0 }, { x: 1300 + seed * 30, y: 450, sz: 420, c: C.purple, d: 40 }, { x: 700, y: 80, sz: 350, c: C.pink, d: 80 }].map((o, i) => (
        <div key={i} style={{ position: "absolute", left: o.x, top: o.y + Math.sin((frame + o.d) * 0.01) * 15, width: o.sz, height: o.sz, borderRadius: "50%", background: `radial-gradient(circle, ${o.c}1a, transparent 70%)`, opacity: (Math.sin((frame + o.d) * 0.02) * 0.25 + 0.75) * 0.4, filter: `blur(${o.sz * 0.3}px)` }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: (frame * 2) % 1200 - 50, height: 1, background: `linear-gradient(90deg, transparent, ${tint}12, transparent)` }} />
    </>
  );
};

// ─── Layouts ──────────────────────────────────────────────────────────
const CC: React.FC<{ children: React.ReactNode; op?: number; tY?: number; s?: number; t?: string }> = ({ children, op = 1, tY = 0, s = 0, t }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity: op, transform: `translateY(${tY}px)` }}>
    <BG s={s} t={t} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const, padding: "0 140px", zIndex: 1, width: "100%", maxWidth: 1600 }}>{children}</div>
  </AbsoluteFill>
);

const TC: React.FC<{ l: React.ReactNode; r: React.ReactNode; op?: number; tY?: number; s?: number; t?: string }> = ({ l, r, op = 1, tY = 0, s = 0, t }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity: op, transform: `translateY(${tY}px)` }}>
    <BG s={s} t={t} />
    <div style={{ display: "flex", alignItems: "center", gap: 70, padding: "0 100px", zIndex: 1, width: "100%", maxWidth: 1700 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{l}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>{r}</div>
    </div>
  </AbsoluteFill>
);

// ─── Helpers ──────────────────────────────────────────────────────────
const FU: React.FC<{ children: React.ReactNode; d: number; s?: React.CSSProperties }> = ({ children, d, s }) => {
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = spring({ fps, frame: fr - d, config: { damping: 65, stiffness: 170 } });
  return <div style={{ transform: `translateY(${interpolate(sp, [0, 1], [30, 0])}px)`, opacity: interpolate(sp, [0, 1], [0, 1]), ...s }}>{children}</div>;
};
const useEx = (s: number, e: number) => { const fr = useCurrentFrame(); return { op: interpolate(fr, [s, e], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), tY: interpolate(fr, [s, e], [0, -15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }; };

const Nar: React.FC<{ text: string; d: number; sz?: number; c?: string; it?: boolean }> = ({ text, d, sz = 22, c = C.lightGray, it }) => (
  <FU d={d} s={{ fontSize: sz, color: c, fontFamily: F, lineHeight: 1.65, fontWeight: 400, fontStyle: it ? "italic" : "normal", maxWidth: 1100, textAlign: "left" as const }}>{text}</FU>
);

const SH: React.FC<{ label: string; lc: string; title: React.ReactNode; d?: number }> = ({ label, lc, title, d = 5 }) => (
  <><FU d={d} s={{ fontSize: 14, color: lc, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 12 }}>{label}</FU><FU d={d + 6} s={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.1 }}>{title}</FU></>
);

const Grad: React.FC<{ children: string; from: string; to: string }> = ({ children, from, to }) => (
  <span style={{ background: `linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{children}</span>
);

// ─── Harmonic Bars ────────────────────────────────────────────────────
const HB: React.FC<{ d: number; f: number; n: number; lb?: boolean; mode?: "all"|"even"|"odd"; h?: number; bw?: number }> = ({ d, f, n, lb = true, mode = "all", h: mH = 220, bw }) => {
  const fr = useCurrentFrame(); const bW = bw || Math.min(48, 700 / n);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 7, height: mH + 30, width: "100%" }}>
      {Array.from({ length: n }, (_, i) => {
        const nn = i + 1; const isE = nn % 2 === 0;
        let a = 1 / nn;
        if (mode === "even" && !isE && nn > 1) a = 0.015;
        if (mode === "odd" && isE) a = 0.015;
        const hh = a * mH; const dd = d + i * 5;
        const en = interpolate(fr, [dd, dd + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        let col = C.cyan;
        if (nn === 1) col = C.white;
        else if (mode === "even" && isE) col = C.green;
        else if (mode === "even" && !isE) col = `${C.gray}18`;
        else if (mode === "odd" && !isE) col = C.orange;
        else if (mode === "odd" && isE) col = `${C.gray}18`;
        const p = a > 0.04 ? Math.sin((fr - dd) * 0.03 + i) * 0.05 + 0.95 : 1;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: bW, height: hh * en * p, borderRadius: bW / 3, backgroundColor: col, opacity: en, boxShadow: hh > 12 ? `0 0 8px ${col}20` : "none" }} />
            {lb && <div style={{ fontSize: 10, color: `${C.gray}70`, fontFamily: "monospace", opacity: en }}>{f * nn}</div>}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENES — each timed to exact audio duration
// ═══════════════════════════════════════════════════════════════════════

// S01 — Intro "When you strike..." (40s = 1200fr)
const S01: React.FC = () => {
  const { op, tY } = useEx(1170, 1200);
  return (
    <TC op={op} tY={tY} t={C.cyan}
      l={<>
        <Nar d={10} text="When you strike a single key on a piano, you might think you're hearing one note — one frequency vibrating through the air." />
        <Nar d={200} text="But what reaches your ears is far more complex and beautiful than a single tone." />
        <Nar d={380} text="Every pitched sound you've ever heard — from a plucked guitar string to a sung vowel — contains a hidden architecture of frequencies stacked on top of each other like an invisible sonic skyscraper." c={C.white} sz={24} />
        <Nar d={650} text="This architecture is called the harmonic series, and understanding it is the foundation for everything we'll explore about saturation and distortion." />
        <Nar d={900} text="Before you can meaningfully add harmonics to a sound, you need to understand where they come from naturally and why they make music sound the way it does." it />
      </>}
      r={<FU d={80} s={{ width: "100%" }}><HB d={90} f={100} n={14} h={280} bw={32} /><div style={{ fontSize: 14, color: C.gray, fontFamily: F, marginTop: 12, textAlign: "center" as const }}>The harmonic series of a 100 Hz fundamental</div></FU>}
    />
  );
};

// S02 — "Let's start with something concrete..." (35s = 1050fr)
const S02: React.FC = () => {
  const { op, tY } = useEx(1020, 1050);
  const fr = useCurrentFrame();
  const harms = [
    { freq: "100 Hz", name: "Fundamental", int: "The note", col: C.white },
    { freq: "200 Hz", name: "2nd Harmonic", int: "Octave (×2)", col: C.cyan },
    { freq: "300 Hz", name: "3rd Harmonic", int: "Oct + Fifth (×3)", col: C.blue },
    { freq: "400 Hz", name: "4th Harmonic", int: "Two Octaves (×4)", col: C.primary },
    { freq: "500 Hz", name: "5th Harmonic", int: "Major Third (×5)", col: C.purple },
  ];
  return (
    <TC op={op} tY={tY} s={1} t={C.blue}
      l={<>
        <SH label="THE FUNDAMENTAL" lc={C.cyan} title={<span style={{ color: C.white }}>One note. <Grad from={C.cyan} to={C.blue}>Many frequencies.</Grad></span>} />
        <Nar d={20} text="When you play a note with a fundamental frequency of 100 Hz — roughly a low G on a bass guitar — you're not just hearing 100 Hz." />
        <Nar d={280} text="Your ears simultaneously receive 200 Hz, 300 Hz, 400 Hz, 500 Hz, and so on, each at progressively lower volumes." />
        <Nar d={520} text="These are called harmonics or overtones — exact integer multiples of the fundamental. This mathematical relationship continues theoretically to infinity." c={C.white} />
      </>}
      r={<div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {harms.map((h, i) => {
          const d = 120 + i * 110;
          const s = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [30, 0])}px)`, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: `${C.darkGray}70`, border: `1px solid ${h.col}12` }}>
              <div style={{ width: 65, textAlign: "right" as const, fontSize: 15, fontWeight: 800, color: h.col, fontFamily: "monospace" }}>{h.freq}</div>
              <div style={{ flex: 1, height: 12, borderRadius: 6, background: C.darkGray }}><div style={{ width: `${(1 / (i + 1)) * 100}%`, height: "100%", borderRadius: 6, background: h.col, opacity: 0.7 }} /></div>
              <div style={{ width: 150, fontSize: 13, color: C.gray, fontFamily: F }}>{h.int}</div>
            </div>
          );
        })}
      </div>}
    />
  );
};

// S03 — "It's physics" (40s = 1200fr)
const S03: React.FC = () => {
  const { op, tY } = useEx(1170, 1200);
  return (
    <CC op={op} tY={tY} s={2} t={C.primary}>
      <FU d={10}><div style={{ fontSize: 52, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>This isn't a quirk.<br /><Grad from={C.primary} to={C.cyan}>It's physics.</Grad></div></FU>
      <Nar d={150} text="When a guitar string vibrates, it doesn't just move back and forth as a whole unit. It simultaneously vibrates in halves, thirds, quarters, and smaller divisions — each producing its own frequency." />
      <Nar d={450} text="A 110 Hz note on a guitar generates harmonics at 220 Hz, 330 Hz, 440 Hz, 880 Hz, and beyond." c={C.white} sz={24} />
      <Nar d={700} text="The same principle applies to the column of air in a trumpet, the membrane of a drum, and the vocal cords in your throat. Wherever you find pitched sound in nature, you find the harmonic series." />
    </CC>
  );
};

// S04 — "Here's where things become musically profound" (20s = 600fr)
const S04: React.FC = () => {
  const { op, tY } = useEx(570, 600);
  return (
    <CC op={op} tY={tY} s={3} t={C.orange}>
      <FU d={10}><div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>If every instrument produces the same harmonics —<br />why do they <Grad from={C.orange} to={C.gold}>sound different?</Grad></div></FU>
      <Nar d={150} text="The answer lies not in which harmonics are present, but in their relative loudness." sz={26} c={C.white} />
    </CC>
  );
};

// S05 — "Recipe" with instrument profiles (35s = 1050fr)
const S05: React.FC = () => {
  const { op, tY } = useEx(1020, 1050);
  const fr = useCurrentFrame();
  const insts = [
    { name: "Clarinet", desc: "Strong odd harmonics — hollow, woody", col: C.purple, p: [1, .06, .4, .04, .28, .03, .18, .02, .12, .01] },
    { name: "Trumpet", desc: "Even distribution, upper emphasis — brilliant", col: C.gold, p: [1, .7, .5, .55, .4, .45, .3, .25, .2, .15] },
    { name: "Flute", desc: "Few harmonics — pure, simple", col: C.cyan, p: [1, .15, .05, .02, .01, 0, 0, 0, 0, 0] },
    { name: "Violin", desc: "Rich harmonic content — expressive", col: C.orange, p: [1, .6, .45, .35, .3, .25, .22, .18, .15, .12] },
  ];
  return (
    <CC op={op} tY={tY} s={4} t={C.orange}>
      <SH label="THE RECIPE" lc={C.orange} title={<span style={{ color: C.white }}>Same ingredients. <Grad from={C.orange} to={C.gold}>Different recipe.</Grad></span>} />
      <div style={{ display: "flex", gap: 18, width: "100%", marginTop: 28, justifyContent: "center" }}>
        {insts.map((inst, idx) => {
          const bd = 50 + idx * 150;
          const s = interpolate(fr, [bd, bd + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={idx} style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`, flex: 1, padding: "18px", borderRadius: 16, background: `${C.darkGray}80`, border: `1px solid ${inst.col}15` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: inst.col, fontFamily: F, marginBottom: 10 }}>{inst.name}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 8 }}>
                {inst.p.map((a, i) => { const be = interpolate(fr, [bd + 12 + i * 3, bd + 18 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return <div key={i} style={{ flex: 1, height: a * 55 * be, borderRadius: 3, backgroundColor: a > .02 ? inst.col : `${C.gray}15`, opacity: .8 }} />; })}
              </div>
              <div style={{ fontSize: 12, color: C.gray, fontFamily: F }}>{inst.desc}</div>
            </div>
          );
        })}
      </div>
    </CC>
  );
};

// S06 — Timbre + warmth/brightness/thin (40s = 1200fr)
const S06: React.FC = () => {
  const { op, tY } = useEx(1170, 1200);
  const fr = useCurrentFrame();
  const quals = [
    { w: "Warmth", d: "Strong lower harmonics (2nd and 3rd) relative to the fundamental", c: C.orange },
    { w: "Brightness", d: "Upper harmonics (5th through 10th and beyond) are prominent", c: C.cyan },
    { w: "\"Thin\"", d: "Lacks harmonic complexity altogether", c: C.gray },
  ];
  return (
    <CC op={op} tY={tY} s={5} t={C.gold}>
      <Nar d={10} text="This unique fingerprint of harmonic amplitudes is what we call timbre — the 'color' or 'quality' of a sound that allows you to distinguish between instruments even when pitch and volume are identical." sz={24} c={C.white} />
      <Nar d={350} text="When musicians describe a sound as 'warm,' 'bright,' 'thin,' 'rich,' or 'nasal,' they're describing the balance of harmonics, even if they don't realize it." />
      <div style={{ display: "flex", gap: 24, width: "100%", marginTop: 30 }}>
        {quals.map((q, i) => {
          const d = 600 + i * 120;
          const s = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`, flex: 1, padding: "24px", borderRadius: 18, background: `${C.darkGray}90`, border: `1px solid ${q.c}20`, textAlign: "center" as const }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: q.c, fontFamily: F, marginBottom: 10 }}>{q.w}</div>
              <div style={{ fontSize: 16, color: C.lightGray, fontFamily: F, lineHeight: 1.5 }}>{q.d}</div>
            </div>
          );
        })}
      </div>
    </CC>
  );
};

// S07 — Spectrum analyzer (30s = 900fr)
const S07: React.FC = () => {
  const { op, tY } = useEx(870, 900);
  return (
    <TC op={op} tY={tY} s={6} t={C.cyan}
      l={<>
        <SH label="VISUALIZING HARMONICS" lc={C.cyan} title={<span style={{ color: C.white }}>See what you're <Grad from={C.cyan} to={C.blue}>hearing.</Grad></span>} />
        <Nar d={20} text="In Ableton Live 12, you can see this harmonic structure using Spectrum, the built-in analyzer." />
        <Nar d={250} text="You'll see a series of peaks — the tallest on the left is your fundamental, and the smaller peaks marching to the right are your harmonics." />
        <Nar d={500} text="This is the frequency domain representation of your sound." c={C.white} />
      </>}
      r={<FU d={100} s={{ width: "100%", padding: "28px", borderRadius: 20, background: `${C.darkGray}60`, border: `1px solid ${C.cyan}15` }}>
        <div style={{ fontSize: 13, color: C.cyan, fontFamily: F, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" as const }}>SPECTRUM VIEW</div>
        <HB d={120} f={200} n={12} h={200} bw={36} />
        <div style={{ fontSize: 12, color: `${C.gray}88`, fontFamily: F, marginTop: 8, textAlign: "center" as const }}>← Fundamental ... Harmonics →</div>
      </FU>}
    />
  );
};

// S08 — Sine vs Saw exercise (35s = 1050fr)
const S08: React.FC = () => {
  const { op, tY } = useEx(1020, 1050);
  const fr = useCurrentFrame();
  const waves = [
    { name: "Sine Wave", desc: "One peak — just the fundamental, no harmonics", col: C.cyan, p: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Sawtooth", desc: "All harmonics — rich and buzzy", col: C.orange, p: [1, .5, .33, .25, .2, .17, .14, .12, .11, .1] },
  ];
  return (
    <CC op={op} tY={tY} s={7} t={C.orange}>
      <FU d={5} s={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 24 }}>Practical exercise: <Grad from={C.orange} to={C.gold}>Sine vs Sawtooth</Grad></FU>
      <Nar d={15} text="Load a sine wave oscillator at 200 Hz. In Spectrum, you'll see one peak. Now switch to sawtooth — a cascade of all harmonics appears." />
      <div style={{ display: "flex", gap: 30, width: "100%", marginTop: 24 }}>
        {waves.map((w, idx) => {
          const bd = 200 + idx * 350;
          const s = interpolate(fr, [bd, bd + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={idx} style={{ opacity: s, flex: 1, padding: "24px", borderRadius: 18, background: `${C.darkGray}80`, border: `2px solid ${w.col}20` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: w.col, fontFamily: F, marginBottom: 14 }}>{w.name}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, marginBottom: 12 }}>
                {w.p.map((a, i) => { const be = interpolate(fr, [bd + 15 + i * 5, bd + 22 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return <div key={i} style={{ flex: 1, height: a * 80 * be, borderRadius: 4, backgroundColor: a > .02 ? w.col : `${C.gray}12`, opacity: .85 }} />; })}
              </div>
              <div style={{ fontSize: 15, color: C.gray, fontFamily: F }}>{w.desc}</div>
            </div>
          );
        })}
      </div>
    </CC>
  );
};

// S09 — Square wave (35s = 1050fr)
const S09: React.FC = () => {
  const { op, tY } = useEx(1020, 1050);
  const fr = useCurrentFrame();
  const sq = [1, 0, .33, 0, .2, 0, .14, 0, .11, 0];
  return (
    <TC op={op} tY={tY} s={8} t={C.purple}
      l={<>
        <FU d={5} s={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, textAlign: "left" as const }}>Now try a <Grad from={C.purple} to={C.pink}>square wave.</Grad></FU>
        <Nar d={15} text="You'll notice something different: peaks at 200 Hz, 600 Hz, 1000 Hz, 1400 Hz — the odd harmonics only, with the even harmonics nearly absent." />
        <Nar d={400} text="This is why square waves have that distinctive hollow, clarinet-like quality." c={C.white} />
        <Nar d={600} text="The visual pattern in your spectrum analyzer directly corresponds to what you're hearing. Training yourself to connect these two is one of the most valuable skills you can develop as a producer." />
      </>}
      r={<FU d={60} s={{ width: "100%", padding: "28px", borderRadius: 20, background: `${C.darkGray}70`, border: `2px solid ${C.purple}20` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.purple, fontFamily: F, marginBottom: 14 }}>Square Wave</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, marginBottom: 8 }}>
          {sq.map((a, i) => { const d = 80 + i * 30; const e = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><div style={{ width: "70%", height: a * 120 * e, borderRadius: 4, backgroundColor: a > .02 ? C.purple : `${C.gray}12`, opacity: .85 }} /><div style={{ fontSize: 9, color: `${C.gray}60`, fontFamily: "monospace" }}>{a > .02 ? `${200 * (i + 1)}` : ""}</div></div>; })}
        </div>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>Odd harmonics only — gaps where even harmonics should be</div>
      </FU>}
    />
  );
};

// S10 — "Understanding where harmonics fall..." (20s = 600fr)
const S10: React.FC = () => {
  const { op, tY } = useEx(570, 600);
  return (
    <CC op={op} tY={tY} s={9} t={C.blue}>
      <SH label="FREQUENCY BANDS" lc={C.blue} title={<span style={{ color: C.white }}>Where harmonics <Grad from={C.blue} to={C.purple}>live in your mix.</Grad></span>} />
      <Nar d={18} text="Understanding where harmonics fall in the frequency spectrum helps you predict how they'll interact with your mix. The human hearing range — 20 Hz to 20,000 Hz — divides into perceptually distinct regions." />
    </CC>
  );
};

// S11 — Frequency band list (45s = 1350fr)
const S11: React.FC = () => {
  const { op, tY } = useEx(1320, 1350);
  const fr = useCurrentFrame();
  const bands = [
    { range: "20–60 Hz", name: "Sub-Bass", desc: "Felt as much as heard — the physical rumble in your chest", col: C.purple },
    { range: "60–250 Hz", name: "Bass", desc: "Body and warmth — bass guitars, lower piano, weight of vocals", col: C.blue },
    { range: "250–500 Hz", name: "Low-Mid", desc: "The 'boxy' zone — can get muddy if harmonics pile up", col: C.green },
    { range: "500 Hz–2 kHz", name: "Midrange", desc: "Vocals and melodic instruments — where intelligibility lives", col: C.gold },
    { range: "2–4 kHz", name: "Presence", desc: "Attack and bite — snare crack, vocal consonant clarity", col: C.orange },
    { range: "4–20 kHz", name: "Treble", desc: "Sparkle, air, space, and the sense of detail", col: C.pink },
  ];
  return (
    <CC op={op} tY={tY} s={10} t={C.blue}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {bands.map((b, i) => {
          const d = 30 + i * 130;
          const s = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 110, textAlign: "right" as const }}><div style={{ fontSize: 18, fontWeight: 800, color: b.col, fontFamily: F }}>{b.name}</div><div style={{ fontSize: 11, color: `${C.gray}70`, fontFamily: "monospace" }}>{b.range}</div></div>
              <div style={{ flex: 1, height: 22, borderRadius: 5, background: `${C.darkGray}80` }}><div style={{ width: `${30 + i * 12}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${b.col}aa, ${b.col}30)` }} /></div>
              <div style={{ width: 380, textAlign: "left" as const, fontSize: 15, color: C.lightGray, fontFamily: F }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </CC>
  );
};

// S12 — Bass harmonics cascade (35s = 1050fr)
const S12: React.FC = () => {
  const { op, tY } = useEx(1020, 1050);
  const fr = useCurrentFrame();
  const cascade = [
    { f: "100 Hz", what: "Fundamental", feel: "The note", col: C.blue },
    { f: "200 Hz", what: "2nd harmonic", feel: "Adds warmth", col: C.cyan },
    { f: "400 Hz", what: "4th harmonic", feel: "Contributes body", col: C.green },
    { f: "800 Hz", what: "8th harmonic", feel: "Presence & definition", col: C.gold },
    { f: "1600 Hz", what: "16th harmonic", feel: "Definition", col: C.orange },
    { f: "4 kHz+", what: "Upper harmonics", feel: "Clarity & articulation", col: C.pink },
  ];
  return (
    <TC op={op} tY={tY} s={11} t={C.cyan}
      l={<>
        <FU d={5} s={{ fontSize: 36, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white, textAlign: "left" as const }}>A bass note at 100 Hz —<br />harmonics <Grad from={C.cyan} to={C.pink}>reach everywhere.</Grad></FU>
        <Nar d={200} text="The fundamental tells you what note is playing. The harmonics tell you what instrument is playing it — and how it feels." />
        <Nar d={500} text="A bass with weak upper harmonics sounds dull. One with strong upper harmonics cuts through but might sound harsh if overdone." />
      </>}
      r={<div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        {cascade.map((c, i) => { const d = 80 + i * 100; const s = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return (
          <div key={i} style={{ opacity: s, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, background: `${C.darkGray}80`, border: `1px solid ${c.col}15` }}>
            <div style={{ width: 70, textAlign: "right" as const, fontSize: 15, fontWeight: 800, color: c.col, fontFamily: "monospace" }}>{c.f}</div>
            <div style={{ width: 2, height: 28, background: `${c.col}40`, borderRadius: 1 }} />
            <div><div style={{ fontSize: 15, color: C.white, fontFamily: F, fontWeight: 600 }}>{c.what}</div><div style={{ fontSize: 13, color: C.gray, fontFamily: F }}>{c.feel}</div></div>
          </div>
        ); })}
      </div>}
    />
  );
};

// S13 — Consonance & Dissonance intro (25s = 750fr)
const S13: React.FC = () => {
  const { op, tY } = useEx(720, 750);
  return (
    <CC op={op} tY={tY} s={12} t={C.purple}>
      <SH label="CONSONANCE & DISSONANCE" lc={C.purple} title={<span style={{ color: C.white }}>Why notes sound <Grad from={C.green} to={C.cyan}>good together</Grad> — or <Grad from={C.red} to={C.orange}>clash.</Grad></span>} />
      <Nar d={20} text="When you play two notes simultaneously, their harmonics interact. If they align, you perceive consonance — stability. If they clash, creating rapid beating, you perceive dissonance — tension." />
    </CC>
  );
};

// S14 — Octave and fifth (30s = 900fr)
const S14: React.FC = () => {
  const { op, tY } = useEx(870, 900);
  return (
    <TC op={op} tY={tY} s={13} t={C.green}
      l={<>
        <Nar d={10} text="Consider the octave — the most consonant interval. When you play 100 Hz and 200 Hz together, their harmonic series overlap almost completely. No conflict, no beating — just reinforcement." c={C.white} />
        <Nar d={350} text="The perfect fifth (3:2 ratio) works similarly: the third harmonic of the lower note aligns with the second harmonic of the upper." />
      </>}
      r={<>
        <FU d={50} s={{ width: "100%", padding: "22px", borderRadius: 18, background: `${C.green}08`, border: `1px solid ${C.green}20`, marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.green, fontFamily: F, marginBottom: 6 }}>Octave (2:1)</div>
          <div style={{ fontSize: 15, color: C.lightGray, fontFamily: F, lineHeight: 1.5 }}>100 Hz + 200 Hz — harmonics overlap completely. Pure reinforcement.</div>
        </FU>
        <FU d={350} s={{ width: "100%", padding: "22px", borderRadius: 18, background: `${C.primary}08`, border: `1px solid ${C.primary}20` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, fontFamily: F, marginBottom: 6 }}>Perfect Fifth (3:2)</div>
          <div style={{ fontSize: 15, color: C.lightGray, fontFamily: F, lineHeight: 1.5 }}>3rd harmonic of lower = 2nd of upper. Strong alignment, stable.</div>
        </FU>
      </>}
    />
  );
};

// S15 — Even vs Odd + distortion connection (45s = 1350fr)
const S15: React.FC = () => {
  const { op, tY } = useEx(1320, 1350);
  return (
    <CC op={op} tY={tY} s={14} t={C.green}>
      <SH label="THE KEY TO DISTORTION" lc={C.green} title={<span style={{ color: C.white }}>Even vs. Odd <Grad from={C.green} to={C.orange}>Harmonics.</Grad></span>} />
      <div style={{ display: "flex", gap: 40, width: "100%", marginTop: 24 }}>
        <FU d={30} s={{ flex: 1, padding: "28px", borderRadius: 22, background: `${C.green}08`, border: `2px solid ${C.green}22` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.green, fontFamily: F, marginBottom: 6 }}>Even Harmonics</div>
          <div style={{ fontSize: 15, color: C.gray, fontFamily: F, marginBottom: 14 }}>2nd, 4th, 6th</div>
          <HB d={40} f={100} n={10} mode="even" lb={false} h={130} bw={36} />
          <div style={{ fontSize: 16, color: C.lightGray, fontFamily: F, marginTop: 14, lineHeight: 1.6 }}>Adds <span style={{ color: C.green, fontWeight: 700 }}>octaves and fifths</span> — consonant, musical</div>
          <div style={{ fontSize: 14, color: `${C.gray}aa`, fontFamily: F, marginTop: 6 }}>→ Tube saturation, tape warmth</div>
        </FU>
        <FU d={400} s={{ flex: 1, padding: "28px", borderRadius: 22, background: `${C.orange}08`, border: `2px solid ${C.orange}22` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.orange, fontFamily: F, marginBottom: 6 }}>Odd Harmonics</div>
          <div style={{ fontSize: 15, color: C.gray, fontFamily: F, marginBottom: 14 }}>3rd, 5th, 7th</div>
          <HB d={410} f={100} n={10} mode="odd" lb={false} h={130} bw={36} />
          <div style={{ fontSize: 16, color: C.lightGray, fontFamily: F, marginTop: 14, lineHeight: 1.6 }}>Adds <span style={{ color: C.orange, fontWeight: 700 }}>complex intervals</span> — edge, tension</div>
          <div style={{ fontSize: 14, color: `${C.gray}aa`, fontFamily: F, marginTop: 6 }}>→ Transistor clipping, digital distortion</div>
        </FU>
      </div>
      <FU d={800} s={{ marginTop: 24, fontSize: 22, fontWeight: 700, color: C.white, fontFamily: F }}>
        Why tube saturation sounds <span style={{ color: C.green }}>warm</span> and hard clipping sounds <span style={{ color: C.orange }}>harsh</span> — it's the harmonic balance.
      </FU>
    </CC>
  );
};

// S16 — Ear training intro (15s = 450fr)
const S16: React.FC = () => {
  const { op, tY } = useEx(420, 450);
  return (
    <CC op={op} tY={tY} s={15} t={C.gold}>
      <SH label="BUILD YOUR HEARING" lc={C.gold} title={<span style={{ color: C.white }}><Grad from={C.gold} to={C.orange}>Hear harmonics</Grad> naturally.</span>} />
      <Nar d={18} text="This isn't mystical ear-training that takes years — it's a concrete skill you can practice in a few focused sessions." sz={24} c={C.white} />
    </CC>
  );
};

// S17 — EQ sweep exercise (45s = 1350fr)
const S17: React.FC = () => {
  const { op, tY } = useEx(1320, 1350);
  const fr = useCurrentFrame();
  const steps = [
    "Load a sawtooth wave synth — play and hold C2 (65 Hz)",
    "Sweep a narrow EQ boost (high Q, 10-12 dB) from 100 Hz to 2 kHz",
    "At 130 Hz — the 2nd harmonic pops out",
    "At 195 Hz — the 3rd emerges, different character",
    "At 260 Hz — the 4th. Each has a different quality.",
    "Lower harmonics feel warm; upper ones feel bright and present",
  ];
  return (
    <CC op={op} tY={tY} s={16} t={C.gold}>
      <FU d={5} s={{ fontSize: 34, fontWeight: 800, color: C.white, fontFamily: F, marginBottom: 24 }}>The EQ Sweep Exercise</FU>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 1100 }}>
        {steps.map((s, i) => {
          const d = 40 + i * 120;
          const en = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, transform: `translateX(${interpolate(en, [0, 1], [50, 0])}px)`, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderRadius: 14, background: `${C.darkGray}80`, border: `1px solid ${C.gold}12` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.gold}18`, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 16, fontWeight: 800, color: C.gold, fontFamily: F, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500 }}>{s}</div>
            </div>
          );
        })}
      </div>
    </CC>
  );
};

// S18 — Try with real recordings (35s = 1050fr)
const S18: React.FC = () => {
  const { op, tY } = useEx(1020, 1050);
  return (
    <CC op={op} tY={tY} s={17} t={C.purple}>
      <FU d={8} s={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>Now try with <Grad from={C.purple} to={C.pink}>real recordings.</Grad></FU>
      <Nar d={80} text="A sustained guitar note. A held piano chord. A vocal phrase. The harmonics won't be as mathematically perfect — real instruments have slight inharmonicity — but you'll still hear them emerge." />
      <FU d={450} s={{ marginTop: 28, padding: "28px", borderRadius: 20, background: `${C.purple}0a`, border: `1px solid ${C.purple}20`, maxWidth: 1000 }}>
        <div style={{ fontSize: 22, color: C.white, fontFamily: F, fontWeight: 700, lineHeight: 1.5, textAlign: "center" as const }}>This is the sound of timbre being dissected.</div>
        <div style={{ fontSize: 18, color: C.lightGray, fontFamily: F, lineHeight: 1.6, marginTop: 12, textAlign: "center" as const }}>When you later apply saturation, you'll understand exactly what's changing: <span style={{ color: C.orange, fontWeight: 700 }}>specific harmonics are being boosted</span>.</div>
      </FU>
    </CC>
  );
};

// S19 — Closing (40s = 1200fr)
const S19: React.FC = () => {
  const { op, tY } = useEx(1170, 1200);
  return (
    <CC op={op} tY={tY} s={18} t={C.cyan}>
      <FU d={10} s={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>The harmonic series is the<br /><Grad from={C.cyan} to={C.purple}>alphabet of musical tone.</Grad></FU>
      <Nar d={200} text="Every sound you work with in production — every vocal, every synth, every drum hit — is a combination of these mathematically related frequencies in varying proportions." />
      <FU d={500} s={{ marginTop: 24, fontSize: 24, fontWeight: 700, color: C.lightGray, fontFamily: F, lineHeight: 1.5 }}>
        Next chapter: how distortion <Grad from={C.orange} to={C.red}>adds specific harmonics</Grad> to this natural structure.
      </FU>
      <Nar d={750} text="But first, make sure this foundation is solid: play with Spectrum, sweep those EQ bands, and start hearing the hidden architecture inside every sound you touch." it />
    </CC>
  );
};

// S20 — CTA (15s = 450fr)
const S20: React.FC = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaSp = spring({ fps, frame: fr - 80, config: { damping: 50, stiffness: 160 } });
  const ctaSc = interpolate(ctaSp, [0, 1], [0, 1]);
  const urlOp = interpolate(fr, [110, 125], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(fr * 0.06) * 0.25 + 0.75;
  return (
    <CC s={19} t={C.orange}>
      <FU d={10} s={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 30 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${C.orange}, ${C.red}, ${C.pink})`, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 0 50px ${C.orange}40` }}><div style={{ fontSize: 40, color: C.white }}>▶</div></div>
        <div style={{ textAlign: "left" as const }}><div style={{ fontSize: 28, fontWeight: 800, color: C.white, fontFamily: F }}>Saturation & Distortion</div><div style={{ fontSize: 18, color: C.gray, fontFamily: F }}>From First Principles to Advanced Sound Design</div></div>
      </FU>
      <div style={{ transform: `scale(${ctaSc})`, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ fontSize: 52, fontWeight: 900, fontFamily: F, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$9</div>
        <div style={{ padding: "16px 44px", borderRadius: 60, background: `linear-gradient(135deg, ${C.orange}, ${C.red})`, color: C.white, fontSize: 24, fontWeight: 700, fontFamily: F, boxShadow: `0 0 ${36 * pulse}px ${C.orange}45` }}>Enroll Now →</div>
      </div>
      <div style={{ opacity: urlOp, marginTop: 20, fontSize: 18, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>academy.pauseplayrepeat.com</div>
    </CC>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — 20 scenes, exact timing from audio
// Total: 19800 frames = 11 minutes 0 seconds
// ═══════════════════════════════════════════════════════════════════════
export const HarmonicsFullLesson: React.FC = () => {
  // Duration in frames (seconds × 30)
  const scenes: [React.FC, number][] = [
    [S01, 1200],  // 40s
    [S02, 1050],  // 35s
    [S03, 1200],  // 40s
    [S04, 600],   // 20s
    [S05, 1050],  // 35s
    [S06, 1200],  // 40s
    [S07, 900],   // 30s
    [S08, 1050],  // 35s
    [S09, 1050],  // 35s
    [S10, 600],   // 20s
    [S11, 1350],  // 45s
    [S12, 1050],  // 35s
    [S13, 750],   // 25s
    [S14, 900],   // 30s
    [S15, 1350],  // 45s
    [S16, 450],   // 15s
    [S17, 1350],  // 45s
    [S18, 1050],  // 35s
    [S19, 1200],  // 40s
    [S20, 450],   // 15s
  ];

  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {scenes.map(([Component, dur], i) => {
        const from = cursor;
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
