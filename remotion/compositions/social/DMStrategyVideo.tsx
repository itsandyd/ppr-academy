// Category 1 — Post 3: The DM Strategy That Turns Comments Into Customers
import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise3D } from "@remotion/noise";
import {
  evolvePath,
  getLength,
  getPointAtLength,
  getTangentAtLength,
} from "@remotion/paths";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { C, F } from "../../theme";
import { CTAButton, GradientText, SectionLabel } from "../../components";
import { getDmStrategyTimeline, getDmStrategyVoiceoverFiles } from "./dmStrategyVoiceover";

const scaleFrames = (framesAt30Fps: number, fps: number) =>
  Math.round((framesAt30Fps / 30) * fps);

type DMStrategyVideoProps = {
  enableVoiceover?: boolean;
};

const PauseIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const PlayIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M6 4l14 8-14 8z" />
  </svg>
);

const RepeatIcon = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const FlowArrow: React.FC<{ color: string }> = ({ color }) => (
  <svg width="170" height="88" viewBox="0 0 170 88" fill="none">
    <path
      d="M10 44H118"
      stroke={color}
      strokeWidth="20"
      strokeLinecap="round"
    />
    <path d="M110 12L160 44L110 76V12Z" fill={color} />
  </svg>
);

const NoiseOverlay: React.FC<{ seed: string; color: string; opacity?: number }> = ({
  seed,
  color,
  opacity = 0.22,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rows = 14;
  const cols = 9;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "screen" }}
    >
      {new Array(cols).fill(true).map((_, col) =>
        new Array(rows).fill(true).map((__, row) => {
          const x = (col / (cols - 1)) * width;
          const y = (row / (rows - 1)) * height;
          const offsetX = noise3D(`${seed}-x`, col / cols, row / rows, frame * 0.015) * 28;
          const offsetY = noise3D(`${seed}-y`, col / cols, row / rows, frame * 0.015) * 28;
          const alpha = interpolate(
            noise3D(`${seed}-a`, col / cols, row / rows, frame * 0.02),
            [-1, 1],
            [0.08, 0.9],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <circle
              key={`${seed}-${col}-${row}`}
              cx={x + offsetX}
              cy={y + offsetY}
              r={2.3}
              fill={color}
              opacity={alpha}
            />
          );
        }),
      )}
    </svg>
  );
};

const SceneShell: React.FC<{
  tint: string;
  seed: string;
  children: React.ReactNode;
}> = ({ tint, seed, children }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        overflow: "hidden",
        fontFamily: F,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 20%, ${tint}22 0%, transparent 45%), linear-gradient(180deg, ${C.bg} 0%, #050816 100%)`,
        }}
      />
      <NoiseOverlay seed={seed} color={tint} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.42) 55%, rgba(15,23,42,0.88) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "120px 88px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const GlassCard: React.FC<{
  children: React.ReactNode;
  border: string;
  width?: number;
  style?: React.CSSProperties;
}> = ({ children, border, width, style }) => (
  <div
    style={{
      width,
      background: "linear-gradient(180deg, rgba(30,41,59,0.96), rgba(15,23,42,0.92))",
      border: `1px solid ${border}`,
      borderRadius: 28,
      boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
      backdropFilter: "blur(18px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const titleSpring = spring({
    fps,
    frame: frame - s(0.13),
    config: { damping: 14, stiffness: 220 },
  });
  const cardSpring = spring({
    fps,
    frame: frame - s(2.5),
    config: { damping: 18, stiffness: 190 },
  });

  return (
    <SceneShell tint={C.orange} seed="hook">
      <div
        style={{
          transform: `scale(${interpolate(titleSpring, [0, 1], [1.18, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}) translateY(${interpolate(titleSpring, [0, 1], [50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          opacity: interpolate(titleSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 86,
            lineHeight: 0.98,
            fontWeight: 900,
            color: C.white,
            letterSpacing: -3,
          }}
        >
          Attention <GradientText from={C.orange} to={C.red}>≠</GradientText> Income
        </div>
      </div>
      <div
        style={{
          marginTop: 46,
          transform: `scale(${interpolate(cardSpring, [0, 1], [0.75, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          opacity: interpolate(cardSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <GlassCard border={`${C.red}55`} style={{ padding: "22px 30px" }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: C.gray,
              textAlign: "center",
            }}
          >
            Stop losing money on
            <span style={{ color: C.red }}> social media.</span>
          </div>
        </GlassCard>
      </div>
    </SceneShell>
  );
};

const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const comments = [
    { text: "fire", x: -220, y: -120, delay: 0.2 },
    { text: "how do I get this?", x: 0, y: -20, delay: 1.5 },
    { text: "STEMS", x: -130, y: 96, delay: 2.8 },
  ];
  const timeProgress = interpolate(frame, [s(4.0), s(7.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lateReplySpring = spring({
    fps,
    frame: frame - s(7.5),
    config: { damping: 18, stiffness: 190 },
  });

  return (
    <SceneShell tint={C.red} seed="problem">
      <SectionLabel color={C.red}>THE PROBLEM</SectionLabel>
      <div style={{ position: "relative", width: 850, height: 680, marginTop: 28 }}>
        {comments.map((comment) => {
          const pop = spring({
            fps,
            frame: frame - s(comment.delay),
            config: { damping: 14, stiffness: 210 },
          });
          return (
            <GlassCard
              key={comment.text}
              border={`${C.gray}33`}
              style={{
                position: "absolute",
                left: 200 + comment.x,
                top: 160 + comment.y,
                padding: "18px 28px",
                borderBottomLeftRadius: 10,
                transform: `scale(${interpolate(pop, [0, 1], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}) translateY(${interpolate(pop, [0, 1], [30, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}px)`,
                opacity:
                  interpolate(pop, [0, 1], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }) * interpolate(timeProgress, [0, 1], [1, 0.28], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                filter: `grayscale(${interpolate(timeProgress, [0, 1], [0, 100], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}%)`,
              }}
            >
              <div style={{ fontSize: 30, color: C.white, fontWeight: 700 }}>{comment.text}</div>
            </GlassCard>
          );
        })}

        <div
          style={{
            position: "absolute",
            right: 50,
            top: 40, // Moved up even higher to give plenty of room for the manual reply card
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            opacity: interpolate(timeProgress, [0.05, 0.2], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: "50%",
              border: `4px solid ${C.red}`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 4,
                height: 40,
                borderRadius: 999,
                backgroundColor: C.red,
                transformOrigin: "bottom center",
                transform: `translate(-50%, -100%) rotate(${interpolate(
                  timeProgress,
                  [0, 1],
                  [0, 760],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                )}deg)`,
              }}
            />
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.red }}>
            {Math.max(
              1,
              Math.floor(
                interpolate(timeProgress, [0, 1], [1, 24], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              ),
            )}
            h later
          </div>
        </div>

        <GlassCard
          border={`${C.red}60`}
          width={400}
          style={{
            position: "absolute",
            right: 20,
            bottom: 200, // Moved down slightly to increase the gap between the clock and this card
            padding: "22px 24px",
            transform: `scale(${interpolate(lateReplySpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(lateReplySpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 18, color: C.red, fontWeight: 800, marginBottom: 10 }}>
            MANUAL REPLY
          </div>
          <div style={{ fontSize: 28, color: C.white, lineHeight: 1.3, fontWeight: 700 }}>
            Hey sorry, just seeing this now...
          </div>
        </GlassCard>

        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0, // Reset back to 0 so it sits cleanly at the bottom of the container
            transform: "translateX(-50%)",
            textAlign: "center",
            width: "100%", // Added width to prevent wrapping issues if any
          }}
        >
          <div style={{ fontSize: 50, fontWeight: 900, color: C.white }}>Manual replies =</div>
          <div style={{ fontSize: 50, fontWeight: 900, color: C.red }}>Lost sales.</div>
        </div>
      </div>
    </SceneShell>
  );
};

const Scene3_Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const commentSpring = spring({
    fps,
    frame: frame - s(0.2),
    config: { damping: 16, stiffness: 200 },
  });
  const arrowSpring = spring({
    fps,
    frame: frame - s(3.5),
    config: { damping: 18, stiffness: 210 },
  });
  const dmSpring = spring({
    fps,
    frame: frame - s(4.5),
    config: { damping: 18, stiffness: 190 },
  });

  return (
    <SceneShell tint={C.primary} seed="solution">
      <SectionLabel color={C.primary}>THE FIX</SectionLabel>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <div style={{ fontSize: 66, lineHeight: 0.98, fontWeight: 900, color: C.white }}>
          <GradientText from={C.primary} to={C.cyan}>PausePlayRepeat</GradientText>
          <br />
          Built-in DM Automation
        </div>
      </div>

      <div
        style={{
          marginTop: 54,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          width: "100%",
        }}
      >
        <GlassCard
          border={`${C.gray}44`}
          width={290}
          style={{
            padding: "28px 30px",
            transform: `scale(${interpolate(commentSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(commentSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 16, color: C.gray, fontWeight: 800, letterSpacing: 1 }}>COMMENT TRIGGER</div>
          <div style={{ fontSize: 46, color: C.white, fontWeight: 900, marginTop: 12 }}>"STEMS"</div>
          <div style={{ fontSize: 20, color: C.gray, marginTop: 16 }}>Someone just raised their hand.</div>
        </GlassCard>

        <div
          style={{
            transform: `scale(${interpolate(arrowSpring, [0, 1], [0.3, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(arrowSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <FlowArrow color={C.primary} />
        </div>

        <GlassCard
          border={`${C.primary}66`}
          width={390}
          style={{
            padding: "28px 30px",
            boxShadow: `0 0 0 1px ${C.primary}22, 0 40px 100px ${C.primary}25`,
            transform: `scale(${interpolate(dmSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(dmSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 16, color: C.primary, fontWeight: 800, letterSpacing: 1 }}>AUTO-DM</div>
          <div style={{ fontSize: 27, color: C.white, marginTop: 14, lineHeight: 1.35, fontWeight: 700 }}>
            Hey! Here's the link
            <br />
            to check it out:
          </div>
          <div style={{ fontSize: 22, color: C.cyan, marginTop: 14, fontWeight: 800 }}>
            pauseplayrepeat.com
          </div>
          <div style={{ fontSize: 18, color: C.gray, marginTop: 18 }}>
            Sent instantly while the intent is still hot.
          </div>
        </GlassCard>
      </div>
    </SceneShell>
  );
};

const Scene4_Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const card1 = spring({ fps, frame: frame - s(0.2), config: { damping: 18, stiffness: 200 } });
  const card2 = spring({ fps, frame: frame - s(3.5), config: { damping: 18, stiffness: 200 } });
  const card3 = spring({ fps, frame: frame - s(6.5), config: { damping: 18, stiffness: 200 } });
  const pathProgress = interpolate(frame, [s(6.5), s(8.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const saleSpring = spring({ fps, frame: frame - s(9.5), config: { damping: 16, stiffness: 210 } });

  const connectorPath =
    "M 540 215 C 540 250 540 268 540 302 C 540 338 540 358 540 395 C 540 435 540 458 540 500";
  const { strokeDasharray, strokeDashoffset } = evolvePath(pathProgress, connectorPath);
  const connectorLength = getLength(connectorPath);
  const point = getPointAtLength(connectorPath, pathProgress * connectorLength);
  const tangent = getTangentAtLength(connectorPath, pathProgress * connectorLength);
  const angle = Math.atan2(tangent.y, tangent.x);

  return (
    <SceneShell tint={C.purple} seed="proof">
      <SectionLabel color={C.purple}>FEATURE IN ACTION</SectionLabel>
      <div style={{ fontSize: 58, color: C.white, fontWeight: 900, textAlign: "center", marginTop: 20 }}>
        A real workflow.
        <br />
        Not just canned replies.
      </div>

      <div style={{ position: "relative", width: 860, height: 620, marginTop: 34 }}>
        <svg
          width={860}
          height={620}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        >
          <path
            d={connectorPath}
            fill="none"
            stroke={`${C.gray}40`}
            strokeWidth={5}
            strokeDasharray="10 12"
          />
          <path
            d={connectorPath}
            fill="none"
            stroke={C.cyan}
            strokeWidth={5}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 14px ${C.cyan})` }}
          />
          <g
            style={{
              transform: `translate(${point.x}px, ${point.y}px) rotate(${angle}rad)`,
              transformOrigin: "0 0",
            }}
          >
            <polygon points="0,0 -18,-10 -18,10" fill={C.cyan} />
          </g>
        </svg>

        <GlassCard
          border={`${C.purple}60`}
          width={520}
          style={{
            position: "absolute",
            left: 170,
            top: 70,
            padding: "22px 26px",
            zIndex: 1,
            transform: `scale(${interpolate(card1, [0, 1], [0.65, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(card1, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 14, color: C.gray, fontWeight: 800, letterSpacing: 1 }}>TRIGGER</div>
          <div style={{ fontSize: 30, color: C.white, fontWeight: 800, marginTop: 10 }}>
            Comment contains: <span style={{ color: C.purple }}>STEMS</span>
          </div>
        </GlassCard>

        <GlassCard
          border={`${C.cyan}60`}
          width={520}
          style={{
            position: "absolute",
            left: 170,
            top: 255,
            padding: "22px 26px",
            zIndex: 1,
            transform: `scale(${interpolate(card2, [0, 1], [0.65, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(card2, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 14, color: C.gray, fontWeight: 800, letterSpacing: 1 }}>SMART AI</div>
          <div style={{ fontSize: 30, color: C.white, fontWeight: 800, marginTop: 10 }}>
            Reads the last 10 messages for context
          </div>
        </GlassCard>

        <GlassCard
          border={`${C.primary}60`}
          width={520}
          style={{
            position: "absolute",
            left: 170,
            top: 440,
            padding: "22px 26px",
            zIndex: 1,
            transform: `scale(${interpolate(card3, [0, 1], [0.65, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(card3, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div style={{ fontSize: 14, color: C.gray, fontWeight: 800, letterSpacing: 1 }}>ACTION</div>
          <div style={{ fontSize: 30, color: C.white, fontWeight: 800, marginTop: 10 }}>
            Sends the right DM with the right link
          </div>
        </GlassCard>

        <GlassCard
          border={`${C.green}70`}
          width={300} // Made slightly wider to fit the text better
          style={{
            position: "absolute",
            right: 0, // Pushed slightly to the right
            bottom: -50, // Moved down to avoid overlapping the third card
            padding: "18px 22px",
            zIndex: 2,
            transform: `scale(${interpolate(saleSpring, [0, 1], [0.4, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}) translateY(${interpolate(saleSpring, [0, 1], [40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
            opacity: interpolate(saleSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            boxShadow: `0 35px 80px ${C.green}30`,
          }}
        >
          <div style={{ fontSize: 15, color: C.green, fontWeight: 800, letterSpacing: 1 }}>
            OUTCOME
          </div>
          <div style={{ fontSize: 38, color: C.white, fontWeight: 900, marginTop: 10 }}>
            Sale: $50
          </div>
          <div style={{ fontSize: 18, color: C.gray, marginTop: 8 }}>
            From comment to customer in seconds.
          </div>
        </GlassCard>
      </div>
    </SceneShell>
  );
};

const Scene5_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const pauseSpring = spring({ fps, frame: frame - s(0.12), config: { damping: 13, stiffness: 210 } });
  const playSpring = spring({ fps, frame: frame - s(0.35), config: { damping: 13, stiffness: 210 } });
  const repeatSpring = spring({ fps, frame: frame - s(0.58), config: { damping: 13, stiffness: 210 } });
  const textSpring = spring({ fps, frame: frame - s(2.5), config: { damping: 16, stiffness: 200 } });

  return (
    <SceneShell tint={C.orange} seed="cta">
      <div style={{ display: "flex", gap: 26, marginBottom: 48 }}>
        <div
          style={{
            transform: `scale(${interpolate(pauseSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
          }}
        >
          <PauseIcon color="#EC4899" size={102} />
        </div>
        <div
          style={{
            transform: `scale(${interpolate(playSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
          }}
        >
          <PlayIcon color="#38BDF8" size={102} />
        </div>
        <div
          style={{
            transform: `scale(${interpolate(repeatSpring, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
          }}
        >
          <RepeatIcon color={C.white} size={102} />
        </div>
      </div>

      <div
        style={{
          transform: `scale(${interpolate(textSpring, [0, 1], [0.82, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
          opacity: interpolate(textSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 70, color: C.white, fontWeight: 900, lineHeight: 1.02 }}>
          Comment <GradientText from={C.orange} to={C.red}>PPR</GradientText>
        </div>
        <div style={{ fontSize: 28, color: C.gray, marginTop: 18, marginBottom: 38 }}>
          I'll DM you the link to check it out.
        </div>
        <CTAButton delay={70} gradientFrom={C.orange} gradientTo={C.red} glowColor={C.orange}>
          pauseplayrepeat.com
        </CTAButton>
      </div>
    </SceneShell>
  );
};

export const DMStrategyVideo: React.FC<DMStrategyVideoProps> = ({
  enableVoiceover = false,
}) => {
  const { fps } = useVideoConfig();
  const timeline = getDmStrategyTimeline(fps);
  const hookDuration = timeline.hook;
  const problemDuration = timeline.problem;
  const solutionDuration = timeline.solution;
  const proofDuration = timeline.proof;
  const ctaDuration = timeline.cta;
  const transitionDuration = timeline.transition;
  const voiceoverFiles = getDmStrategyVoiceoverFiles();

  const hookStart = 0;
  const problemStart = hookDuration - transitionDuration;
  const solutionStart = problemStart + problemDuration - transitionDuration;
  const proofStart = solutionStart + solutionDuration - transitionDuration;
  const ctaStart = proofStart + proofDuration - transitionDuration;

  const sceneVoiceovers = [
    { from: hookStart, src: voiceoverFiles[0] },
    { from: problemStart, src: voiceoverFiles[1] },
    { from: solutionStart, src: voiceoverFiles[2] },
    { from: proofStart, src: voiceoverFiles[3] },
    { from: ctaStart, src: voiceoverFiles[4] },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {enableVoiceover
        ? sceneVoiceovers.map((voiceover) => (
            <Sequence key={voiceover.src} from={voiceover.from} layout="none">
              <Audio src={staticFile(voiceover.src)} volume={0.95} />
            </Sequence>
          ))
        : null}
      <TransitionSeries>
        <TransitionSeries.Sequence
          durationInFrames={hookDuration}
          premountFor={1 * fps}
        >
          <Scene1_Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        <TransitionSeries.Sequence
          durationInFrames={problemDuration}
          premountFor={1 * fps}
        >
          <Scene2_Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        <TransitionSeries.Sequence
          durationInFrames={solutionDuration}
          premountFor={1 * fps}
        >
          <Scene3_Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        <TransitionSeries.Sequence
          durationInFrames={proofDuration}
          premountFor={1 * fps}
        >
          <Scene4_Proof />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />
        <TransitionSeries.Sequence durationInFrames={ctaDuration} premountFor={1 * fps}>
          <Scene5_CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
