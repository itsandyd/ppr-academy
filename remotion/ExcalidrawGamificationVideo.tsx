import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

// Excalidraw palette
const C = {
  bg: "#ffffff",
  indigo: "#6366f1",
  purple: "#7c3aed",
  violet: "#8b5cf6",
  pink: "#ec4899",
  slate: "#334155",
  gray: "#64748b",
  lightGray: "#94a3b8",
  faintGray: "#e2e8f0",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  cyan: "#06b6d4",
  gold: "#eab308",
  black: "#1e293b",
};

// Hand-drawn / casual font — using Comic Sans as a stand-in for
// the hand-drawn feel (Excalidraw uses Virgil, which isn't available here)
// The sketch boxes and wobbly lines sell the style more than the font
const F = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive, sans-serif";
const F2 = "'Segoe UI', system-ui, sans-serif"; // for small labels

// ─── Wobbly path ──────────────────────────────────────────────────────
const wobble = (x1: number, y1: number, x2: number, y2: number, s: number = 0): string => {
  const mx = (x1 + x2) / 2 + Math.sin(s * 3.7) * 4;
  const my = (y1 + y2) / 2 + Math.cos(s * 2.3) * 4;
  return `M ${x1 + Math.sin(s) * 2} ${y1 + Math.cos(s) * 2} Q ${mx} ${my} ${x2 + Math.sin(s * 1.5) * 2} ${y2 + Math.cos(s * 2.1) * 2}`;
};

// ─── Sketch box (wobbly rectangle) ────────────────────────────────────
const SBox: React.FC<{ w: number; h: number; color: string; fill?: string; children: React.ReactNode; style?: React.CSSProperties; r?: number }> = ({ w, h, color, fill, children, style, r }) => {
  // Generate wobbly rectangle path with slight randomness
  const j = 3;
  const path = r
    ? `M ${r + j} ${j} L ${w - r - j} ${j + 1} Q ${w - j} ${j} ${w - j} ${r + j} L ${w - j + 1} ${h - r - j} Q ${w - j} ${h - j} ${w - r - j} ${h - j + 1} L ${r + j + 1} ${h - j} Q ${j} ${h - j} ${j} ${h - r - j + 1} L ${j + 1} ${r + j + 1} Q ${j} ${j} ${r + j} ${j} Z`
    : `M ${j} ${j + 1} L ${w - j + 1} ${j} L ${w - j} ${h - j + 1} L ${j + 1} ${h - j} Z`;

  return (
    <div style={{ position: "relative", width: w, height: h, ...style }}>
      <svg width={w} height={h} style={{ position: "absolute", top: 0, left: 0 }}>
        {fill && <path d={path} fill={fill} stroke="none" />}
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 14 }}>
        {children}
      </div>
    </div>
  );
};

// ─── Sketch circle ────────────────────────────────────────────────────
const SCircle: React.FC<{ size: number; color: string; fill?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ size, color, fill, children, style }) => {
  const r = size / 2;
  // Wobbly circle using 4-point bezier
  const path = `M ${r} 3 C ${size - 5} ${2} ${size - 2} ${r - 3} ${size - 3} ${r} C ${size - 1} ${size - 5} ${r + 3} ${size - 2} ${r} ${size - 3} C ${5} ${size - 1} ${2} ${r + 3} ${3} ${r} C ${1} ${5} ${r - 3} ${2} ${r} ${3} Z`;
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <svg width={size} height={size} style={{ position: "absolute" }}>
        {fill && <circle cx={r} cy={r} r={r - 4} fill={fill} />}
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      </svg>
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
};

// ─── Sketch arrow ─────────────────────────────────────────────────────
const SArrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; delay: number }> = ({ x1, y1, x2, y2, color = C.gray, delay }) => {
  const fr = useCurrentFrame();
  const op = interpolate(fr, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 14;
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: op, zIndex: 0 }}>
      <path d={wobble(x1, y1, x2, y2, delay)} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d={`M ${x2 - hl * Math.cos(angle - 0.4)} ${y2 - hl * Math.sin(angle - 0.4)} L ${x2} ${y2} L ${x2 - hl * Math.cos(angle + 0.4)} ${y2 - hl * Math.sin(angle + 0.4)}`} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Hand-drawn underline ─────────────────────────────────────────────
const Scribble: React.FC<{ color: string; width: number; delay: number }> = ({ color, width, delay }) => {
  const fr = useCurrentFrame();
  const w = interpolate(fr, [delay, delay + 12], [0, width], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <svg width={width} height={10} style={{ marginTop: -2 }}><path d={`M 3 6 Q ${width / 3} 2 ${w * 0.5} 6 Q ${(width * 2) / 3} 10 ${w} 5`} stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.5} /></svg>;
};

// ─── Progress bar (hand-drawn) ────────────────────────────────────────
const SketchProgress: React.FC<{ pct: number; color: string; delay: number; width?: number }> = ({ pct, color, delay, width: w = 400 }) => {
  const fr = useCurrentFrame();
  const en = interpolate(fr, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fillW = pct * (w - 8) / 100 * en;
  return (
    <div style={{ position: "relative", width: w, height: 28, opacity: interpolate(fr, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <svg width={w} height={28}><rect x={3} y={3} width={w - 6} height={22} rx={8} fill={C.faintGray} stroke={C.lightGray} strokeWidth={2} /><rect x={5} y={5} width={fillW} height={18} rx={6} fill={color} opacity={0.7} /></svg>
    </div>
  );
};

// ─── Layouts (9:16) ───────────────────────────────────────────────────
const Page: React.FC<{ children: React.ReactNode; op?: number; tY?: number }> = ({ children, op = 1, tY = 0 }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity: op, transform: `translateY(${tY}px)` }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: `radial-gradient(${C.faintGray} 1.5px, transparent 1.5px)`, backgroundSize: "22px 22px" }} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const, padding: "0 48px", zIndex: 1, width: "100%" }}>{children}</div>
  </AbsoluteFill>
);

const FU: React.FC<{ children: React.ReactNode; d: number; s?: React.CSSProperties }> = ({ children, d, s }) => {
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = spring({ fps, frame: fr - d, config: { damping: 60, stiffness: 170 } });
  return <div style={{ transform: `translateY(${interpolate(sp, [0, 1], [30, 0])}px)`, opacity: interpolate(sp, [0, 1], [0, 1]), ...s }}>{children}</div>;
};

const useEx = (s: number, e: number) => { const fr = useCurrentFrame(); return { op: interpolate(fr, [s, e], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), tY: interpolate(fr, [s, e], [0, -15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }; };

// ═══════════════════════════════════════════════════════════════════════
// S1 — Hook: 8% → 34% (0–5s)
// ═══════════════════════════════════════════════════════════════════════
const S1: React.FC = () => {
  const { op, tY } = useEx(125, 150);
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numSp = spring({ fps, frame: fr - 50, config: { damping: 40, stiffness: 120 } });
  const numScale = interpolate(numSp, [0, 1], [0, 1]);

  return (
    <Page op={op} tY={tY}>
      <FU d={8} s={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 400, marginBottom: 20 }}>
        Course completion rate:
      </FU>
      <FU d={20}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 12 }}>
          <span style={{ fontSize: 80, fontWeight: 900, color: C.red, fontFamily: F, textDecoration: "line-through", textDecorationThickness: 4 }}>8%</span>
          <span style={{ fontSize: 30, color: C.lightGray, fontFamily: F }}>→</span>
          <span style={{ fontSize: 80, fontWeight: 900, color: C.green, fontFamily: F, transform: `scale(${numScale})`, display: "inline-block" }}>34%</span>
        </div>
      </FU>
      <FU d={65} s={{ fontSize: 28, color: C.black, fontFamily: F, lineHeight: 1.4 }}>
        Same content.
        <br />
        <span style={{ color: C.indigo }}>Game mechanics</span> added.
      </FU>
      <FU d={85}><Scribble color={C.indigo} width={320} delay={90} /></FU>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S2 — Why people abandon courses (5–13s)
// ═══════════════════════════════════════════════════════════════════════
const S2: React.FC = () => {
  const { op, tY } = useEx(215, 240);
  const fr = useCurrentFrame();

  const reasons = [
    { text: "No immediate feedback", icon: "😐" },
    { text: "No sense of progress", icon: "📉" },
    { text: "No accountability", icon: "👻" },
    { text: "No recognition", icon: "🤷" },
    { text: "Dopamine is gone", icon: "💤" },
  ];

  return (
    <Page op={op} tY={tY}>
      <FU d={5} s={{ fontSize: 14, color: C.red, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F2, marginBottom: 10 }}>WHY THEY QUIT</FU>
      <FU d={10} s={{ fontSize: 36, fontWeight: 900, color: C.black, fontFamily: F, lineHeight: 1.2, marginBottom: 32 }}>
        Learning feels like an <span style={{ color: C.red }}>obligation</span>,
        <br />not an achievement.
      </FU>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {reasons.map((r, i) => {
          const d = 30 + i * 22;
          const en = interpolate(fr, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, transform: `translateX(${interpolate(en, [0, 1], [50, 0])}px)` }}>
              <SBox w={680} h={60} color={C.red} fill={`${C.red}06`} style={{ margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
                  <span style={{ fontSize: 24 }}>{r.icon}</span>
                  <span style={{ fontSize: 20, color: C.black, fontFamily: F, fontWeight: 700 }}>{r.text}</span>
                </div>
              </SBox>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S3 — Gamification flips it (13–23s)
// ═══════════════════════════════════════════════════════════════════════
const S3: React.FC = () => {
  const { op, tY } = useEx(275, 300);
  const fr = useCurrentFrame();

  const flips = [
    { trigger: "Complete module", reward: "🏅 Badge unlocked!", color: C.indigo },
    { trigger: "7-day streak", reward: "🔥 Achievement!", color: C.orange },
    { trigger: "Top 10", reward: "🏆 Leaderboard!", color: C.gold },
    { trigger: "First course done", reward: "📜 Certificate!", color: C.green },
  ];

  return (
    <Page op={op} tY={tY}>
      <FU d={5} s={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F2, marginBottom: 10 }}>THE FIX</FU>
      <FU d={10} s={{ fontSize: 36, fontWeight: 900, color: C.black, fontFamily: F, lineHeight: 1.2, marginBottom: 36 }}>
        Every milestone feels like <span style={{ color: C.green }}>winning.</span>
      </FU>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
        {flips.map((f, i) => {
          const d = 30 + i * 40;
          const en = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
              <SBox w={280} h={55} color={C.lightGray} fill={C.faintGray}>
                <span style={{ fontSize: 17, color: C.slate, fontFamily: F, fontWeight: 700 }}>{f.trigger}</span>
              </SBox>
              <svg width={40} height={20}><path d={wobble(5, 10, 32, 10, i)} stroke={f.color} strokeWidth={2.5} fill="none" strokeLinecap="round" /><path d="M 27 5 L 34 10 L 27 15" stroke={f.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <SBox w={280} h={55} color={f.color} fill={`${f.color}10`}>
                <span style={{ fontSize: 17, color: f.color, fontFamily: F, fontWeight: 900 }}>{f.reward}</span>
              </SBox>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S4 — XP & Levels (23–33s)
// ═══════════════════════════════════════════════════════════════════════
const S4: React.FC = () => {
  const { op, tY } = useEx(275, 300);
  const fr = useCurrentFrame();

  const levels = [
    { lv: "L1", xp: "0", pct: 12, color: C.lightGray },
    { lv: "L3", xp: "500", pct: 35, color: C.cyan },
    { lv: "L5", xp: "1500", pct: 55, color: C.indigo },
    { lv: "L8", xp: "5000", pct: 80, color: C.purple },
    { lv: "L10", xp: "10K+", pct: 100, color: C.gold },
  ];

  return (
    <Page op={op} tY={tY}>
      <FU d={5} s={{ fontSize: 14, color: C.purple, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F2, marginBottom: 10 }}>XP & LEVELING</FU>
      <FU d={10} s={{ fontSize: 36, fontWeight: 900, color: C.black, fontFamily: F, lineHeight: 1.2, marginBottom: 12 }}>
        Earn <span style={{ color: C.purple }}>XP</span> for every action.
        <br />Level up as you learn.
      </FU>
      <FU d={18} s={{ fontSize: 18, color: C.gray, fontFamily: F, marginBottom: 28 }}>
        Watch lessons, complete quizzes, finish courses → XP
      </FU>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center" }}>
        {levels.map((l, i) => {
          const d = 30 + i * 30;
          const en = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, display: "flex", alignItems: "center", gap: 14 }}>
              <SCircle size={50} color={l.color} fill={`${l.color}15`}>
                <span style={{ fontSize: 16, fontWeight: 900, color: l.color, fontFamily: F }}>{l.lv}</span>
              </SCircle>
              <SketchProgress pct={l.pct} color={l.color} delay={d + 8} width={500} />
              <span style={{ fontSize: 16, color: C.gray, fontFamily: F, width: 60 }}>{l.xp} XP</span>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S5 — Streaks (33–41s)
// ═══════════════════════════════════════════════════════════════════════
const S5: React.FC = () => {
  const { op, tY } = useEx(215, 240);
  const fr = useCurrentFrame();

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const active = [true, true, true, true, true, true, false];

  return (
    <Page op={op} tY={tY}>
      <FU d={5} s={{ fontSize: 14, color: C.orange, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F2, marginBottom: 10 }}>STREAK TRACKING</FU>
      <FU d={10} s={{ fontSize: 36, fontWeight: 900, color: C.black, fontFamily: F, lineHeight: 1.2, marginBottom: 32 }}>
        <span style={{ color: C.orange }}>🔥 Streaks</span> build habits.
      </FU>

      {/* Week display */}
      <FU d={25} s={{ display: "flex", gap: 12, marginBottom: 30 }}>
        {days.map((d, i) => {
          const dd = 35 + i * 15;
          const en = interpolate(fr, [dd, dd + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, transform: `scale(${interpolate(en, [0, 1], [0.7, 1])})` }}>
              <SCircle size={70} color={active[i] ? C.orange : C.lightGray} fill={active[i] ? `${C.orange}15` : `${C.faintGray}`}>
                <div style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 12, color: C.gray, fontFamily: F2, fontWeight: 600 }}>{d}</div>
                  <div style={{ fontSize: 20 }}>{active[i] ? "🔥" : "○"}</div>
                </div>
              </SCircle>
            </div>
          );
        })}
      </FU>

      <FU d={140} s={{ fontSize: 52, fontWeight: 900, color: C.orange, fontFamily: F }}>6 day streak!</FU>

      <FU d={160} s={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        {[{ streak: "7 days", badge: "🔥 Weekly Warrior" }, { streak: "30 days", badge: "⚡ Month Master" }, { streak: "100 days", badge: "👑 Legend" }].map((s, i) => {
          const d = 170 + i * 20;
          const en = interpolate(fr, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16, color: C.gray, fontFamily: F, width: 80, textAlign: "right" as const }}>{s.streak}</span>
              <span style={{ fontSize: 18, color: C.orange, fontFamily: F, fontWeight: 700 }}>{s.badge}</span>
            </div>
          );
        })}
      </FU>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S6 — Leaderboards (41–49s)
// ═══════════════════════════════════════════════════════════════════════
const S6: React.FC = () => {
  const { op, tY } = useEx(215, 240);
  const fr = useCurrentFrame();

  const board = [
    { rank: "1", name: "beatsbymike", xp: "12,400", color: C.gold },
    { rank: "2", name: "synthqueen", xp: "11,200", color: C.lightGray },
    { rank: "3", name: "lofilarry", xp: "10,800", color: C.orange },
    { rank: "4", name: "bassface", xp: "9,600", color: C.slate },
    { rank: "5", name: "you →", xp: "8,100", color: C.indigo },
  ];

  return (
    <Page op={op} tY={tY}>
      <FU d={5} s={{ fontSize: 14, color: C.gold, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F2, marginBottom: 10 }}>LEADERBOARDS</FU>
      <FU d={10} s={{ fontSize: 36, fontWeight: 900, color: C.black, fontFamily: F, lineHeight: 1.2, marginBottom: 32 }}>
        Healthy <span style={{ color: C.gold }}>competition</span>
        <br />creates accountability.
      </FU>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", alignItems: "center" }}>
        {board.map((b, i) => {
          const d = 30 + i * 25;
          const en = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const isYou = i === 4;
          return (
            <div key={i} style={{ opacity: en, transform: `translateX(${interpolate(en, [0, 1], [40, 0])}px)` }}>
              <SBox w={620} h={60} color={isYou ? C.indigo : C.lightGray} fill={isYou ? `${C.indigo}08` : "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
                  <SCircle size={36} color={b.color} fill={`${b.color}15`}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: b.color, fontFamily: F }}>{b.rank}</span>
                  </SCircle>
                  <span style={{ fontSize: 18, fontWeight: isYou ? 900 : 600, color: isYou ? C.indigo : C.slate, fontFamily: F, flex: 1, textAlign: "left" as const }}>{b.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: b.color, fontFamily: F2 }}>{b.xp} XP</span>
                </div>
              </SBox>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S7 — The Science (49–57s)
// ═══════════════════════════════════════════════════════════════════════
const S7: React.FC = () => {
  const { op, tY } = useEx(215, 240);
  const fr = useCurrentFrame();

  const principles = [
    { icon: "🎰", text: "Variable rewards trigger dopamine", color: C.purple },
    { icon: "📊", text: "Progress bars motivate completion", color: C.indigo },
    { icon: "👏", text: "Public recognition = accountability", color: C.orange },
    { icon: "🔄", text: "Streaks build daily habits", color: C.green },
  ];

  return (
    <Page op={op} tY={tY}>
      <FU d={5} s={{ fontSize: 14, color: C.cyan, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F2, marginBottom: 10 }}>THE SCIENCE</FU>
      <FU d={10} s={{ fontSize: 36, fontWeight: 900, color: C.black, fontFamily: F, lineHeight: 1.2, marginBottom: 12 }}>
        Same content.
        <br />Different <span style={{ color: C.cyan }}>psychology.</span>
      </FU>
      <FU d={18} s={{ fontSize: 52, fontWeight: 900, color: C.indigo, fontFamily: F, marginBottom: 28 }}>4x completion.</FU>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center" }}>
        {principles.map((p, i) => {
          const d = 40 + i * 35;
          const en = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, transform: `scale(${interpolate(en, [0, 1], [0.9, 1])})` }}>
              <SBox w={660} h={65} color={p.color} fill={`${p.color}06`} style={{ margin: "0 auto" }} r={16}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
                  <span style={{ fontSize: 26 }}>{p.icon}</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: C.black, fontFamily: F }}>{p.text}</span>
                </div>
              </SBox>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// S8 — CTA (57–67s)
// ═══════════════════════════════════════════════════════════════════════
const S8: React.FC = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaSp = spring({ fps, frame: fr - 70, config: { damping: 50, stiffness: 160 } });
  const ctaSc = interpolate(ctaSp, [0, 1], [0, 1]);
  const urlOp = interpolate(fr, [90, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Page>
      <FU d={8} s={{ fontSize: 22, color: C.gray, fontFamily: F, marginBottom: 16 }}>
        Your courses aren't boring.
      </FU>
      <FU d={22}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.2, color: C.black }}>
          They're just missing
          <br />
          <span style={{ color: C.indigo }}>game mechanics.</span>
        </div>
        <Scribble color={C.indigo} width={400} delay={35} />
      </FU>

      {/* Badge collection visual */}
      <FU d={50} s={{ display: "flex", gap: 12, marginTop: 30, marginBottom: 30 }}>
        {["🏅", "🔥", "🏆", "📜", "⚡", "👑"].map((b, i) => (
          <SCircle key={i} size={56} color={C.indigo} fill={`${C.indigo}08`}>
            <span style={{ fontSize: 24 }}>{b}</span>
          </SCircle>
        ))}
      </FU>

      <div style={{ transform: `scale(${ctaSc})` }}>
        <SBox w={520} h={60} color={C.indigo} fill={C.indigo}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.bg, fontFamily: F }}>Add Gamification →</div>
        </SBox>
      </div>

      <div style={{ opacity: urlOp, marginTop: 18, fontSize: 17, color: C.lightGray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~67s @ 30fps = 2010 frames, 9:16
// ═══════════════════════════════════════════════════════════════════════
export const ExcalidrawGamificationVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={150}><S1 /></Sequence>
    <Sequence from={150} durationInFrames={240}><S2 /></Sequence>
    <Sequence from={390} durationInFrames={300}><S3 /></Sequence>
    <Sequence from={690} durationInFrames={300}><S4 /></Sequence>
    <Sequence from={990} durationInFrames={240}><S5 /></Sequence>
    <Sequence from={1230} durationInFrames={240}><S6 /></Sequence>
    <Sequence from={1470} durationInFrames={240}><S7 /></Sequence>
    <Sequence from={1710} durationInFrames={300}><S8 /></Sequence>
  </AbsoluteFill>
);
