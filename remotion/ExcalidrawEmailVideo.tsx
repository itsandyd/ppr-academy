import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

// ─── Excalidraw color palette ─────────────────────────────────────────
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
  black: "#1e293b",
};
const F = "'Segoe UI', system-ui, -apple-system, sans-serif";

// ─── Wobbly SVG path generator ────────────────────────────────────────
const wobble = (x1: number, y1: number, x2: number, y2: number, seed: number = 0): string => {
  const mx = (x1 + x2) / 2 + Math.sin(seed * 3.7) * 3;
  const my = (y1 + y2) / 2 + Math.cos(seed * 2.3) * 3;
  return `M ${x1 + Math.sin(seed) * 1.5} ${y1 + Math.cos(seed) * 1.5} Q ${mx} ${my} ${x2 + Math.sin(seed * 1.5) * 1.5} ${y2 + Math.cos(seed * 2.1) * 1.5}`;
};

// ─── Hand-drawn box ───────────────────────────────────────────────────
const SketchBox: React.FC<{
  width: number;
  height: number;
  color: string;
  fill?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, color, fill, children, style }) => {
  const w = width;
  const h = height;
  const j = 2; // jitter
  const path = `M ${j} ${j} L ${w - j} ${j + 1} L ${w - j + 1} ${h - j} L ${j + 1} ${h - j + 1} Z`;
  return (
    <div style={{ position: "relative", width, height, ...style }}>
      <svg width={w} height={h} style={{ position: "absolute", top: 0, left: 0 }}>
        {fill && <path d={path} fill={fill} stroke="none" />}
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "url(#rough)" }} />
      </svg>
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 12 }}>
        {children}
      </div>
    </div>
  );
};

// ─── Hand-drawn rounded box ───────────────────────────────────────────
const SketchPill: React.FC<{
  color: string;
  fill?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ color, fill, children, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 40, border: `2.5px solid ${color}`, backgroundColor: fill || "transparent", ...style }}>
    {children}
  </div>
);

// ─── Hand-drawn arrow (SVG) ───────────────────────────────────────────
const SketchArrow: React.FC<{
  x1: number; y1: number; x2: number; y2: number;
  color?: string; delay: number;
}> = ({ x1, y1, x2, y2, color = C.gray, delay }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 12;
  const ah1x = x2 - headLen * Math.cos(angle - 0.4);
  const ah1y = y2 - headLen * Math.sin(angle - 0.4);
  const ah2x = x2 - headLen * Math.cos(angle + 0.4);
  const ah2y = y2 - headLen * Math.sin(angle + 0.4);
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: op, zIndex: 0 }}>
      <path d={wobble(x1, y1, x2, y2, delay)} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d={`M ${ah1x} ${ah1y} L ${x2} ${y2} L ${ah2x} ${ah2y}`} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────
const Page: React.FC<{ children: React.ReactNode; opacity?: number; tY?: number }> = ({ children, opacity = 1, tY = 0 }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, display: "flex", justifyContent: "center", alignItems: "center", opacity, transform: `translateY(${tY}px)` }}>
    {/* Faint dot grid like Excalidraw */}
    <div style={{ position: "absolute", inset: 0, opacity: 0.3, backgroundImage: `radial-gradient(${C.faintGray} 1.5px, transparent 1.5px)`, backgroundSize: "24px 24px" }} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const, padding: "0 100px", zIndex: 1, width: "100%", maxWidth: 1600 }}>{children}</div>
  </AbsoluteFill>
);

const FU: React.FC<{ children: React.ReactNode; d: number; s?: React.CSSProperties }> = ({ children, d, s }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ fps, frame: fr - d, config: { damping: 60, stiffness: 170 } });
  return <div style={{ transform: `translateY(${interpolate(sp, [0, 1], [30, 0])}px)`, opacity: interpolate(sp, [0, 1], [0, 1]), ...s }}>{children}</div>;
};

const useEx = (s: number, e: number) => {
  const fr = useCurrentFrame();
  return {
    op: interpolate(fr, [s, e], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    tY: interpolate(fr, [s, e], [0, -15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  };
};

// Hand-drawn underline
const Underline: React.FC<{ color: string; width: number; delay: number }> = ({ color, width, delay }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [delay, delay + 15], [0, width], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={width} height={8} style={{ marginTop: -4 }}>
      <path d={`M 2 5 Q ${width / 4} 2 ${w / 2} 5 Q ${(width * 3) / 4} 8 ${w} 4`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1 — Hook (0–5s)
// ═══════════════════════════════════════════════════════════════════════
const S1: React.FC = () => {
  const { op, tY } = useEx(125, 150);
  return (
    <Page opacity={op} tY={tY}>
      <FU d={8} s={{ fontSize: 28, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 16 }}>
        I send 50+ emails a week.
      </FU>
      <FU d={28} s={{ fontSize: 28, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 28 }}>
        I write 0 of them.
      </FU>
      <FU d={55}>
        <div style={{ fontSize: 52, fontWeight: 800, fontFamily: F, lineHeight: 1.15, color: C.black }}>
          Email <span style={{ color: C.indigo }}>Automation</span>
          <br />
          for Music Producers
        </div>
        <Underline color={C.indigo} width={520} delay={70} />
      </FU>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2 — The Problem: scattered tools (5–12s)
// ═══════════════════════════════════════════════════════════════════════
const S2: React.FC = () => {
  const { op, tY } = useEx(185, 210);
  const fr = useCurrentFrame();

  const tools = [
    { name: "Mailchimp", icon: "📧", x: 120, y: 220 },
    { name: "Gumroad", icon: "📦", x: 420, y: 180 },
    { name: "Linktree", icon: "🔗", x: 720, y: 240 },
    { name: "Instagram", icon: "📱", x: 1020, y: 200 },
    { name: "Google Sheets", icon: "📊", x: 270, y: 420 },
    { name: "Stripe", icon: "💳", x: 570, y: 440 },
    { name: "Calendar", icon: "📅", x: 870, y: 400 },
  ];

  return (
    <Page opacity={op} tY={tY}>
      <FU d={5} s={{ fontSize: 16, color: C.purple, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 8 }}>THE PROBLEM</FU>
      <FU d={10} s={{ fontSize: 40, fontWeight: 800, color: C.black, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        Your marketing is <span style={{ color: C.red }}>scattered</span> across 7 tools.
      </FU>
      <div style={{ position: "relative", width: 1200, height: 300 }}>
        {tools.map((t, i) => {
          const d = 25 + i * 18;
          const s = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const rot = Math.sin(i * 2.7) * 4;
          return (
            <div key={i} style={{ position: "absolute", left: t.x, top: t.y - 200, opacity: s, transform: `rotate(${rot}deg) scale(${interpolate(s, [0, 1], [0.8, 1])})` }}>
              <SketchBox width={140} height={80} color={C.lightGray} fill={`${C.faintGray}`}>
                <div style={{ fontSize: 24 }}>{t.icon}</div>
                <div style={{ fontSize: 13, color: C.gray, fontFamily: F, fontWeight: 600 }}>{t.name}</div>
              </SketchBox>
            </div>
          );
        })}
        {/* Messy dashed lines between them */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const d = 100 + i * 10;
          return <SketchArrow key={i} x1={tools[i].x + 120} y1={tools[i].y - 160} x2={tools[i + 1].x + 20} y2={tools[i + 1].y - 160} color={`${C.red}40`} delay={d} />;
        })}
      </div>
      <FU d={140} s={{ fontSize: 22, color: C.red, fontFamily: F, fontWeight: 600, marginTop: 20 }}>
        7 logins. 7 bills. Data everywhere. Nothing talks to each other.
      </FU>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3 — The Solution: Visual Workflow (12–24s)
// ═══════════════════════════════════════════════════════════════════════
const S3: React.FC = () => {
  const { op, tY } = useEx(335, 360);
  const fr = useCurrentFrame();

  const nodes = [
    { label: "New Subscriber", icon: "👤", color: C.cyan, x: 540, y: 60 },
    { label: "Send Welcome Email", icon: "📧", color: C.indigo, x: 540, y: 190 },
    { label: "Wait 3 Days", icon: "⏳", color: C.gray, x: 540, y: 310 },
    { label: "Opened?", icon: "🤔", color: C.orange, x: 540, y: 430 },
    { label: "YES → Course Offer", icon: "✅", color: C.green, x: 320, y: 560 },
    { label: "NO → Value Email", icon: "💌", color: C.purple, x: 760, y: 560 },
  ];

  const arrows: [number, number][] = [[0, 1], [1, 2], [2, 3]];

  return (
    <Page opacity={op} tY={tY}>
      <FU d={5} s={{ fontSize: 16, color: C.indigo, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 8 }}>THE SOLUTION</FU>
      <FU d={10} s={{ fontSize: 40, fontWeight: 800, color: C.black, fontFamily: F, lineHeight: 1.15, marginBottom: 20 }}>
        One <span style={{ color: C.indigo }}>visual workflow</span>. Set up once. Runs forever.
      </FU>

      <div style={{ position: "relative", width: 1200, height: 550 }}>
        {/* Arrows between nodes */}
        {arrows.map(([from, to], i) => (
          <SketchArrow key={i} x1={nodes[from].x + 70} y1={nodes[from].y + 55} x2={nodes[to].x + 70} y2={nodes[to].y} color={C.lightGray} delay={30 + from * 40} />
        ))}
        {/* Branch arrows from "Opened?" */}
        <SketchArrow x1={nodes[3].x + 30} y1={nodes[3].y + 55} x2={nodes[4].x + 90} y2={nodes[4].y} color={C.green} delay={190} />
        <SketchArrow x1={nodes[3].x + 110} y1={nodes[3].y + 55} x2={nodes[5].x + 50} y2={nodes[5].y} color={C.purple} delay={210} />

        {/* Nodes */}
        {nodes.map((n, i) => {
          const d = 20 + i * 35;
          const s = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "absolute", left: n.x, top: n.y, opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`, zIndex: 2 }}>
              <SketchBox width={180} height={55} color={n.color} fill={`${n.color}12`}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{n.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: n.color, fontFamily: F }}>{n.label}</span>
                </div>
              </SketchBox>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4 — The Sequence (24–36s)
// ═══════════════════════════════════════════════════════════════════════
const S4: React.FC = () => {
  const { op, tY } = useEx(335, 360);
  const fr = useCurrentFrame();

  const steps = [
    { day: "Day 0", text: "Welcome + free sample pack", icon: "🎁", color: C.indigo },
    { day: "Day 3", text: "Your production journey story", icon: "📖", color: C.purple },
    { day: "Day 7", text: "Best-selling course intro", icon: "🎓", color: C.violet },
    { day: "Day 14", text: "'Still interested?' + discount", icon: "💰", color: C.pink },
  ];

  return (
    <Page opacity={op} tY={tY}>
      <FU d={5} s={{ fontSize: 16, color: C.purple, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 8 }}>THE SEQUENCE</FU>
      <FU d={10} s={{ fontSize: 40, fontWeight: 800, color: C.black, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        4 emails. <span style={{ color: C.purple }}>Zero manual sending.</span>
      </FU>

      <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
        {steps.map((s, i) => {
          const d = 30 + i * 50;
          const en = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <React.Fragment key={i}>
              <div style={{ opacity: en, transform: `translateY(${interpolate(en, [0, 1], [20, 0])}px)` }}>
                <SketchBox width={220} height={140} color={s.color} fill={`${s.color}08`}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: F }}>{s.day}</div>
                  <div style={{ fontSize: 13, color: C.slate, fontFamily: F, fontWeight: 500, marginTop: 4 }}>{s.text}</div>
                </SketchBox>
              </div>
              {i < steps.length - 1 && (
                <div style={{ opacity: en, display: "flex", alignItems: "center", paddingTop: 50 }}>
                  <svg width={30} height={20}><path d={wobble(0, 10, 25, 10, i)} stroke={C.lightGray} strokeWidth={2.5} fill="none" strokeLinecap="round" /><path d="M 20 5 L 27 10 L 20 15" stroke={C.lightGray} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5 — Segmentation (36–46s)
// ═══════════════════════════════════════════════════════════════════════
const S5: React.FC = () => {
  const { op, tY } = useEx(275, 300);
  const fr = useCurrentFrame();

  const segments = [
    { trigger: "Purchased a course?", action: "→ Different email track", icon: "🎓", color: C.indigo },
    { trigger: "Opened 5+ emails?", action: "→ Tagged as 'engaged'", icon: "🔥", color: C.orange },
    { trigger: "Inactive 30 days?", action: "→ Re-engagement campaign", icon: "💤", color: C.gray },
    { trigger: "Clicked course link?", action: "→ Send discount code", icon: "🎯", color: C.green },
  ];

  return (
    <Page opacity={op} tY={tY}>
      <FU d={5} s={{ fontSize: 16, color: C.indigo, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 8 }}>SMART SEGMENTATION</FU>
      <FU d={10} s={{ fontSize: 40, fontWeight: 800, color: C.black, fontFamily: F, lineHeight: 1.15, marginBottom: 36 }}>
        Your list <span style={{ color: C.indigo }}>segments itself.</span>
      </FU>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", maxWidth: 900 }}>
        {segments.map((s, i) => {
          const d = 30 + i * 40;
          const en = interpolate(fr, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, transform: `translateX(${interpolate(en, [0, 1], [40, 0])}px)`, display: "flex", alignItems: "center", gap: 20 }}>
              <SketchPill color={s.color} fill={`${s.color}08`}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: C.black, fontFamily: F }}>{s.trigger}</span>
              </SketchPill>
              <svg width={50} height={20}><path d={wobble(5, 10, 40, 10, i)} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinecap="round" /><path d="M 35 5 L 42 10 L 35 15" stroke={s.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <SketchPill color={s.color} fill={`${s.color}15`}>
                <span style={{ fontSize: 16, fontWeight: 600, color: s.color, fontFamily: F }}>{s.action}</span>
              </SketchPill>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6 — Results / Stats (46–56s)
// ═══════════════════════════════════════════════════════════════════════
const S6: React.FC = () => {
  const { op, tY } = useEx(275, 300);
  const fr = useCurrentFrame();

  const stats = [
    { value: "40%", label: "open rate", sub: "(industry avg: 20%)", color: C.indigo },
    { value: "3x", label: "course sales", sub: "vs. broadcast only", color: C.purple },
    { value: "15%", label: "click rate", sub: "on promotions", color: C.violet },
    { value: "0 hrs", label: "per week", sub: "on email writing", color: C.green },
  ];

  return (
    <Page opacity={op} tY={tY}>
      <FU d={5} s={{ fontSize: 16, color: C.green, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 8 }}>THE RESULTS</FU>
      <FU d={10} s={{ fontSize: 40, fontWeight: 800, color: C.black, fontFamily: F, lineHeight: 1.15, marginBottom: 40 }}>
        Set up once. <span style={{ color: C.green }}>Works while you sleep.</span>
      </FU>

      <div style={{ display: "flex", gap: 36, justifyContent: "center" }}>
        {stats.map((s, i) => {
          const d = 30 + i * 40;
          const en = interpolate(fr, [d, d + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: en, transform: `scale(${interpolate(en, [0, 1], [0.8, 1])})` }}>
              <SketchBox width={200} height={160} color={s.color} fill={`${s.color}06`}>
                <div style={{ fontSize: 48, fontWeight: 900, color: s.color, fontFamily: F, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.black, fontFamily: F, marginTop: 6 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.lightGray, fontFamily: F, marginTop: 2 }}>{s.sub}</div>
              </SketchBox>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 7 — What you can automate (56–66s)
// ═══════════════════════════════════════════════════════════════════════
const S7: React.FC = () => {
  const { op, tY } = useEx(275, 300);
  const fr = useCurrentFrame();

  const items = [
    { text: "Welcome sequences", icon: "👋" },
    { text: "Sample pack follow-ups", icon: "📦" },
    { text: "Course drip content", icon: "🎓" },
    { text: "Abandoned cart recovery", icon: "🛒" },
    { text: "Release day campaigns", icon: "🎶" },
    { text: "Re-engagement flows", icon: "🔄" },
    { text: "Coaching reminders", icon: "📅" },
    { text: "VIP offers for hot leads", icon: "🔥" },
  ];

  return (
    <Page opacity={op} tY={tY}>
      <FU d={5} s={{ fontSize: 16, color: C.orange, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, fontFamily: F, marginBottom: 8 }}>BUILT-IN TEMPLATES</FU>
      <FU d={10} s={{ fontSize: 40, fontWeight: 800, color: C.black, fontFamily: F, lineHeight: 1.15, marginBottom: 30 }}>
        Automate <span style={{ color: C.orange }}>everything.</span>
      </FU>

      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, justifyContent: "center", maxWidth: 1000 }}>
        {items.map((item, i) => {
          const d = 25 + i * 20;
          const en = interpolate(fr, [d, d + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const colors = [C.indigo, C.purple, C.violet, C.pink, C.orange, C.cyan, C.green, C.indigo];
          return (
            <div key={i} style={{ opacity: en, transform: `scale(${interpolate(en, [0, 1], [0.85, 1])})` }}>
              <SketchPill color={colors[i]} fill={`${colors[i]}08`}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: C.black, fontFamily: F }}>{item.text}</span>
              </SketchPill>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 8 — CTA (66–76s)
// ═══════════════════════════════════════════════════════════════════════
const S8: React.FC = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaSp = spring({ fps, frame: fr - 70, config: { damping: 50, stiffness: 160 } });
  const ctaSc = interpolate(ctaSp, [0, 1], [0, 1]);
  const urlOp = interpolate(fr, [90, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Page>
      <FU d={10}>
        <div style={{ fontSize: 22, color: C.gray, fontFamily: F, marginBottom: 20 }}>Your email list is worthless without automation.</div>
      </FU>
      <FU d={25}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.black }}>
          Build workflows that
          <br />
          <span style={{ color: C.indigo }}>nurture, segment, and convert</span>
          <br />
          automatically.
        </div>
        <Underline color={C.indigo} width={600} delay={40} />
      </FU>

      <div style={{ transform: `scale(${ctaSc})`, marginTop: 36 }}>
        <SketchBox width={380} height={60} color={C.indigo} fill={C.indigo}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.bg, fontFamily: F, letterSpacing: 1 }}>Start Building Workflows →</div>
        </SketchBox>
      </div>

      <div style={{ opacity: urlOp, marginTop: 20, fontSize: 18, color: C.lightGray, fontFamily: "monospace", letterSpacing: 2 }}>
        academy.pauseplayrepeat.com
      </div>
    </Page>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN — ~76s @ 30fps = 2280 frames, 16:9
// ═══════════════════════════════════════════════════════════════════════
export const ExcalidrawEmailVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={150}><S1 /></Sequence>
    <Sequence from={150} durationInFrames={210}><S2 /></Sequence>
    <Sequence from={360} durationInFrames={360}><S3 /></Sequence>
    <Sequence from={720} durationInFrames={360}><S4 /></Sequence>
    <Sequence from={1080} durationInFrames={300}><S5 /></Sequence>
    <Sequence from={1380} durationInFrames={300}><S6 /></Sequence>
    <Sequence from={1680} durationInFrames={300}><S7 /></Sequence>
    <Sequence from={1980} durationInFrames={300}><S8 /></Sequence>
  </AbsoluteFill>
);
