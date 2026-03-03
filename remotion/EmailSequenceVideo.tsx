import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SceneHook } from "./SceneHook";
import { SceneLeak } from "./SceneLeak";
import { SceneThreeEmails } from "./SceneThreeEmails";
import { SceneProblem } from "./SceneProblem";
import { ScenePPR } from "./ScenePPR";
import { SceneCTA } from "./SceneCTA";

// Email Sequence Video — 1800 frames (60 seconds) at 30fps
// 1080x1920 (vertical, Instagram Reels / TikTok)
//
// Scene 1: The Hook        — frames 0–150    (5s)   — 150 frames
// Scene 2: The Leak         — frames 150–360  (7s)   — 210 frames
// Scene 3: The Three Emails — frames 360–900  (18s)  — 540 frames
// Scene 4: The Problem      — frames 900–1200 (10s)  — 300 frames
// Scene 5: The PPR Tie-In   — frames 1200–1500 (10s) — 300 frames
// Scene 6: The CTA          — frames 1500–1800 (10s) — 300 frames

export const EmailSequenceVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#18181b" }}>
      <Sequence from={0} durationInFrames={150} premountFor={30}>
        <SceneHook />
      </Sequence>

      <Sequence from={150} durationInFrames={210} premountFor={30}>
        <SceneLeak />
      </Sequence>

      <Sequence from={360} durationInFrames={540} premountFor={30}>
        <SceneThreeEmails />
      </Sequence>

      <Sequence from={900} durationInFrames={300} premountFor={30}>
        <SceneProblem />
      </Sequence>

      <Sequence from={1200} durationInFrames={300} premountFor={30}>
        <ScenePPR />
      </Sequence>

      <Sequence from={1500} durationInFrames={300} premountFor={30}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
