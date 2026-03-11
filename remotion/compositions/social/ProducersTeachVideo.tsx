import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { C } from "../../theme";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

const script = [
  { text: "Most producers think they're not good enough to teach.", duration: 125 },
  { text: "They've been making beats for years, mixing tracks, answering questions in DMs… and they still feel like <highlight>imposters</highlight>. They think they need a Grammy or some huge following before anyone would take them seriously.", duration: 486 },
  { text: "But that belief keeps talented producers stuck giving advice away for free.", duration: 166 },
  { text: "Here's the shift.", duration: 45 },
  { text: "You don't need to be the best in the world to teach. You only need to be <highlight>two steps ahead</highlight> of someone else.", duration: 319 },
  { text: "If you've been producing for two years, you know things a six-month producer struggles with. Cleaning up low end. Building compressor chains. Setting up proper sidechain. Structuring a mix so it actually works.", duration: 472 },
  { text: "To you that feels basic. To them, it's exactly what they're stuck on.", duration: 180 },
  { text: "And beginners often learn faster from someone closer to their level. The gap feels smaller. The steps feel clearer.", duration: 263 },
  { text: "If people already DM you asking how you did something… that's proof you have something worth teaching.", duration: 236 },
  { text: "That's actually why I built <highlight>PausePlayRepeat.com</highlight>.", duration: 83, showCard: true },
  { text: "Instead of answering the same questions in DMs forever, you can turn what you already explain into a cheat sheet, a course, or a coaching session. PausePlayRepeat handles the platform, payments, and delivery. You just show up with what you know.", duration: 569 },
  { text: "So if you want to turn your production knowledge into something people can actually buy, comment <highlight>PPR</highlight> and we'll DM you the link", duration: 333 },
  { text: "Ask yourself something.", duration: 55 },
  { text: "Are you holding back because you think you're not ready…", duration: 138 },
  { text: "or are you ignoring people who are already asking for your help?", duration: 166 },
  { text: "You only need to be <highlight>two steps ahead</highlight>.", duration: 111 },
  { text: "That's enough.", duration: 60 },
];

const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(<highlight>.*?<\/highlight>)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("<highlight>") && part.endsWith("</highlight>")) {
          return (
            <span key={i} style={{ color: C.orange }}>
              {part.replace(/<\/?highlight>/g, "")}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const RawCaption: React.FC<{ text: string; showCard?: boolean }> = ({
  text,
  showCard,
}) => {
  const frame = useCurrentFrame();
  
  // Fast, raw opacity fade over 6 frames (no springs, no sliding)
  const opacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          opacity,
          fontSize: 64,
          fontWeight: 700,
          color: C.white,
          textAlign: "center",
          lineHeight: 1.4,
          // Text shadow helps it pop if overlaid on actual B-roll
          textShadow: "0px 4px 24px rgba(0,0,0,0.8)",
        }}
      >
        <HighlightedText text={text} />
      </div>

      {showCard && (
        <div
          style={{
            marginTop: 80,
            opacity,
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "24px 40px",
            backgroundColor: "#18181b", // Zinc 900
            border: `2px solid #3f3f46`, // Zinc 700
            borderRadius: 24,
            boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(249, 115, 22, 0.3)`,
          }}
        >
          {/* Faux Play Button / Logo Mark */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: C.orange,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: C.white,
                letterSpacing: "-0.03em",
              }}
            >
              PausePlayRepeat
            </span>
            <span
              style={{
                fontSize: 22,
                color: "#a1a1aa", // Zinc 400
                fontWeight: 500,
              }}
            >
              The Creator Platform for Producers
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const ProducersTeachVideo: React.FC = () => {
  let currentFrame = 0;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        // Semi-transparent dark background with a blur.
        // If rendered as an MP4, it will just look like a dark grey/black background.
        // If rendered as WebM/ProRes with transparency, it will blur the B-roll underneath!
        backgroundColor: "rgba(10, 10, 10, 0.75)",
        backdropFilter: "blur(12px)",
      }}
    >
      {script.map((line, index) => {
        const startFrame = currentFrame;
        currentFrame += line.duration;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={line.duration}
          >
            <RawCaption text={line.text} showCard={line.showCard} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};