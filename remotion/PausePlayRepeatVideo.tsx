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
import { GlowOrb, GridPattern, ScanLine, FeatureCard, StatCounter } from "./components";

// ═══════════════════════════════════════════════════════════════════════
// SCENE 1: LOGO REVEAL (0s – 4s, frames 0–120)
// ═══════════════════════════════════════════════════════════════════════
const Scene1_LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    fps,
    frame: frame - 15,
    config: { damping: 40, stiffness: 120 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoRotate = interpolate(logoSpring, [0, 1], [-180, 0]);

  const textOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [40, 55], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagOpacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringScale = interpolate(frame, [15, 90], [0.5, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [15, 90], [0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(frame, [100, 120], [1, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      <GridPattern opacity={0.3} />
      <GlowOrb x={100} y={300} size={350} color={C.primary} delay={0} />
      <GlowOrb x={700} y={1200} size={300} color={C.purple} delay={50} />
      <GlowOrb x={400} y={200} size={250} color={C.pink} delay={100} />
      <ScanLine />

      {/* Pulse ring */}
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: `2px solid ${C.primary}`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />

      {/* Logo icon */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            background: `linear-gradient(135deg, ${C.primary}, ${C.purple}, ${C.pink})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: `0 0 80px ${C.primary}60, 0 0 160px ${C.purple}30`,
          }}
        >
          <div style={{ fontSize: 70, color: C.white }}>▶</div>
        </div>
      </div>

      {/* Brand text */}
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textAlign: "center" as const,
          padding: "0 40px",
        }}
      >
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: -1,
            background: `linear-gradient(135deg, ${C.white}, ${C.primary}, ${C.pink})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: F,
            lineHeight: 1.2,
          }}
        >
          Pause.
          <br />
          Play.
          <br />
          Repeat.
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: tagOpacity,
          marginTop: 28,
          fontSize: 22,
          color: C.gray,
          letterSpacing: 3,
          textTransform: "uppercase" as const,
          fontFamily: F,
          fontWeight: 500,
          textAlign: "center" as const,
          padding: "0 60px",
        }}
      >
        The Future of Music Education
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 2: "IS NOW LIVE" ANNOUNCEMENT (4s – 8s, frames 120–240)
// ═══════════════════════════════════════════════════════════════════════
const Scene2_NowLive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const liveSpring = spring({
    fps,
    frame: frame - 10,
    config: { damping: 30, stiffness: 150 },
  });
  const liveScale = interpolate(liveSpring, [0, 1], [3, 1]);
  const liveOpacity = interpolate(liveSpring, [0, 1], [0, 1]);

  const subOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [35, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [20, 60], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flash = interpolate(frame, [0, 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      <GridPattern opacity={0.2} />
      <GlowOrb x={250} y={700} size={500} color={C.primary} delay={0} />
      <GlowOrb x={50} y={500} size={300} color={C.pink} delay={30} />
      <GlowOrb x={600} y={1300} size={300} color={C.purple} delay={60} />
      <ScanLine />

      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: C.white,
          opacity: flash * 0.8,
        }}
      />

      <div
        style={{
          transform: `scale(${liveScale})`,
          opacity: liveOpacity,
          textAlign: "center" as const,
          padding: "0 50px",
        }}
      >
        {/* Live badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: `linear-gradient(135deg, ${C.primary}20, ${C.purple}20)`,
            border: `1px solid ${C.primary}40`,
            borderRadius: 50,
            padding: "10px 28px",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 12px #22c55e80",
            }}
          />
          <span
            style={{
              fontSize: 18,
              color: C.white,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase" as const,
              fontFamily: F,
            }}
          >
            OFFICIALLY LIVE
          </span>
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: C.white,
            lineHeight: 1.1,
            letterSpacing: -2,
            fontFamily: F,
          }}
        >
          Pause
          <br />
          Play
          <br />
          Repeat
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${C.primary}, ${C.pink}, transparent)`,
            margin: "28px auto",
          }}
        />
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          fontSize: 26,
          color: C.gray,
          fontWeight: 400,
          fontFamily: F,
          textAlign: "center" as const,
          padding: "0 60px",
          lineHeight: 1.5,
        }}
      >
        The all-in-one platform for{" "}
        <span style={{ color: C.primary, fontWeight: 600 }}>
          music producers
        </span>{" "}
        to learn, create, and sell.
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 3: FEATURE SHOWCASE – LEARNING (8s – 13s, frames 240–390)
// ═══════════════════════════════════════════════════════════════════════
const Scene3_Features1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 60, stiffness: 180 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const exitOpacity = interpolate(frame, [130, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [130, 150], [0, -60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
      }}
    >
      <GridPattern opacity={0.15} />
      <GlowOrb x={50} y={400} size={400} color={C.purple} delay={0} />
      <GlowOrb x={600} y={1400} size={350} color={C.primary} delay={40} />
      <ScanLine />

      {/* Centered content wrapper */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "0 50px",
        }}
      >
        {/* Section label */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center" as const,
            marginBottom: 50,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: C.primary,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
              fontFamily: F,
              marginBottom: 12,
            }}
          >
            FEATURES
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: C.white,
              fontFamily: F,
              lineHeight: 1.1,
            }}
          >
            Everything You
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: F,
              lineHeight: 1.1,
            }}
          >
            Need to Level Up
          </div>
        </div>

        {/* Feature cards - stacked vertically */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
          }}
        >
          <FeatureCard
            icon="🎓"
            title="Pro Courses"
            desc="Video courses with modules, progress tracking & certificates"
            delay={25}
          />
          <FeatureCard
            icon="🎵"
            title="Sample Marketplace"
            desc="Credits-based sample library — browse by genre, BPM, key"
            delay={40}
          />
          <FeatureCard
            icon="🎹"
            title="Presets & Plugins"
            desc="Ableton racks, Serum presets, mixing templates & more"
            delay={55}
          />
          <FeatureCard
            icon="🎤"
            title="Beat Licensing"
            desc="Sell leases with auto-generated PDF contracts"
            delay={70}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 4: FEATURE SHOWCASE – CREATOR TOOLS (13s – 18s, frames 390–540)
// ═══════════════════════════════════════════════════════════════════════
const Scene4_Features2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 60, stiffness: 180 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const exitOpacity = interpolate(frame, [130, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [130, 150], [0, 60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
      }}
    >
      <GridPattern opacity={0.15} />
      <GlowOrb x={600} y={300} size={400} color={C.pink} delay={0} />
      <GlowOrb x={100} y={1200} size={350} color={C.primary} delay={40} />
      <ScanLine />

      {/* Centered content wrapper */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "0 50px",
        }}
      >
        {/* Section label */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center" as const,
            marginBottom: 50,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: C.pink,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
              fontFamily: F,
              marginBottom: 12,
            }}
          >
            CREATOR TOOLS
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: C.white,
              fontFamily: F,
              lineHeight: 1.1,
            }}
          >
            Build Your Empire.
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: F,
              lineHeight: 1.1,
            }}
          >
            Keep 90%.
          </div>
        </div>

        {/* Feature cards - stacked vertically */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
          }}
        >
          <FeatureCard
            icon="🏪"
            title="Custom Storefront"
            desc="Your own branded store with custom domain & social links"
            delay={25}
          />
          <FeatureCard
            icon="📧"
            title="Email Marketing"
            desc="Campaigns, workflows, A/B tests & CRM built in"
            delay={40}
          />
          <FeatureCard
            icon="🤖"
            title="AI Assistant"
            desc="Multi-agent AI generates courses, content & copy"
            delay={55}
          />
          <FeatureCard
            icon="📊"
            title="Real-Time Analytics"
            desc="Track revenue, enrollments & growth instantly"
            delay={70}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 5: STATS + SOCIAL PROOF (18s – 23s, frames 540–690)
// ═══════════════════════════════════════════════════════════════════════
const Scene5_Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 60, stiffness: 180 },
  });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);

  const exitOpacity = interpolate(frame, [130, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const productTypes = [
    "Courses",
    "Samples",
    "Presets",
    "Beats",
    "Plugins",
    "Templates",
    "Coaching",
    "Memberships",
    "Bundles",
    "PDFs",
    "Communities",
    "Mixing Services",
    "Project Files",
    "Tip Jars",
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      <GridPattern opacity={0.1} />
      <GlowOrb x={200} y={600} size={600} color={C.primary} delay={0} />
      <GlowOrb x={50} y={1400} size={300} color={C.pink} delay={30} />
      <GlowOrb x={600} y={300} size={350} color={C.purple} delay={60} />
      <ScanLine />

      {/* Centered content wrapper */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "0 50px",
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textAlign: "center" as const,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: C.white,
              fontFamily: F,
            }}
          >
            Sell{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              14+ Product Types
            </span>
          </div>
        </div>

        {/* Stats grid (2x2) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            gap: 40,
            justifyContent: "center",
            marginBottom: 60,
            width: "100%",
          }}
        >
          <div style={{ width: "40%", textAlign: "center" as const }}>
            <StatCounter value="90%" label="Revenue Share" delay={15} />
          </div>
          <div style={{ width: "40%", textAlign: "center" as const }}>
            <StatCounter value="14+" label="Product Types" delay={25} />
          </div>
          <div style={{ width: "40%", textAlign: "center" as const }}>
            <StatCounter value="∞" label="No Limits" delay={35} />
          </div>
          <div style={{ width: "40%", textAlign: "center" as const }}>
            <StatCounter value="AI" label="Powered" delay={45} />
          </div>
        </div>

        {/* Product type pills - staggered fade-in, always visible */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            gap: 10,
            justifyContent: "center",
            width: "100%",
          }}
        >
          {productTypes.map((type, i) => {
            const pillDelay = 55 + i * 3;
            const pillOpacity = interpolate(
              frame,
              [pillDelay, pillDelay + 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const pillScale = interpolate(
              frame,
              [pillDelay, pillDelay + 8],
              [0.7, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <div
                key={i}
                style={{
                  padding: "8px 20px",
                  borderRadius: 30,
                  border: `1px solid ${C.primary}30`,
                  color: C.gray,
                  fontSize: 15,
                  fontFamily: F,
                  fontWeight: 500,
                  background: `${C.darkGray}80`,
                  opacity: pillOpacity,
                  transform: `scale(${pillScale})`,
                }}
              >
                {type}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SCENE 6: FINAL CTA (23s – 30s, frames 690–900)
// ═══════════════════════════════════════════════════════════════════════
const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    fps,
    frame: frame - 10,
    config: { damping: 40, stiffness: 150 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);

  const titleSpring = spring({
    fps,
    frame: frame - 25,
    config: { damping: 60, stiffness: 180 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const ctaSpring = spring({
    fps,
    frame: frame - 50,
    config: { damping: 50, stiffness: 160 },
  });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);

  const urlOpacity = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  // Particle burst
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const speed = 3 + (i % 4);
    const startFrame = 5;
    const progress = Math.max(0, frame - startFrame) / 30;
    const dist = progress * speed * 60;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const opacity = Math.max(0, 1 - progress);
    return { x, y, opacity, size: 4 + (i % 3) * 2 };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <GridPattern opacity={0.2} />
      <GlowOrb x={200} y={700} size={700} color={C.primary} delay={0} />
      <GlowOrb x={50} y={400} size={350} color={C.purple} delay={20} />
      <GlowOrb x={600} y={1300} size={400} color={C.pink} delay={50} />
      <ScanLine />

      {/* Particle burst */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + p.x - p.size / 2,
            top: 860 + p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? C.primary : C.pink,
            opacity: p.opacity * 0.6,
            boxShadow: `0 0 ${p.size * 2}px ${i % 2 === 0 ? C.primary : C.pink}`,
          }}
        />
      ))}

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 28,
            background: `linear-gradient(135deg, ${C.primary}, ${C.purple}, ${C.pink})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: `0 0 80px ${C.primary}50`,
          }}
        >
          <div style={{ fontSize: 55, color: C.white }}>▶</div>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center" as const,
          padding: "0 50px",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          Start Creating.
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: F,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          Start Earning.
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${ctaScale})`,
          marginTop: 50,
        }}
      >
        <div
          style={{
            padding: "18px 48px",
            borderRadius: 60,
            background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`,
            color: C.white,
            fontSize: 24,
            fontWeight: 700,
            fontFamily: F,
            boxShadow: `0 0 ${40 * pulse}px ${C.primary}60, 0 4px 20px rgba(0,0,0,0.3)`,
            letterSpacing: 1,
            textAlign: "center" as const,
          }}
        >
          Join Pause Play Repeat →
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          marginTop: 30,
          fontSize: 20,
          color: C.gray,
          fontFamily: "monospace",
          letterSpacing: 2,
        }}
      >
        academy.pauseplayrepeat.com
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════════════════
export const PausePlayRepeatVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Scene 1: Logo Reveal (0s – 4s) */}
      <Sequence from={0} durationInFrames={120}>
        <Scene1_LogoReveal />
      </Sequence>

      {/* Scene 2: Now Live Announcement (4s – 8s) */}
      <Sequence from={120} durationInFrames={120}>
        <Scene2_NowLive />
      </Sequence>

      {/* Scene 3: Features - Learning (8s – 13s) */}
      <Sequence from={240} durationInFrames={150}>
        <Scene3_Features1 />
      </Sequence>

      {/* Scene 4: Features - Creator Tools (13s – 18s) */}
      <Sequence from={390} durationInFrames={150}>
        <Scene4_Features2 />
      </Sequence>

      {/* Scene 5: Stats + Social Proof (18s – 23s) */}
      <Sequence from={540} durationInFrames={150}>
        <Scene5_Stats />
      </Sequence>

      {/* Scene 6: Final CTA (23s – 30s) */}
      <Sequence from={690} durationInFrames={210}>
        <Scene6_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
