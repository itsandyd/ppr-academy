import React from "react";
import { Sequence } from "remotion";
import { WorkflowSceneHook } from "./SceneHook";
import { WorkflowSceneProblem } from "./SceneProblem";
import { WorkflowSceneWorkflow } from "./SceneWorkflow";
import { WorkflowSceneSmartPart } from "./SceneSmartPart";
import { WorkflowSceneBroadcast } from "./SceneBroadcast";
import { WorkflowSceneCTA } from "./SceneCTA";

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL WORKFLOW VIDEO — Main Composition
//
// 1080x1920 (vertical), 30fps, 60 seconds (1800 frames)
// Visualizes the PPR email workflow engine from the real codebase.
//
// Scene breakdown:
//   Scene 1: The Hook        — 0-5s    (frames 0-150)
//   Scene 2: The Problem     — 5-12s   (frames 150-360)
//   Scene 3: The Workflow    — 12-35s  (frames 360-1050)
//   Scene 4: The Smart Part  — 35-45s  (frames 1050-1350)
//   Scene 5: The Broadcast   — 45-53s  (frames 1350-1590)
//   Scene 6: CTA             — 53-60s  (frames 1590-1800)
// ═══════════════════════════════════════════════════════════════════════════

export const EmailWorkflowVideo: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={150} premountFor={30}>
        <WorkflowSceneHook />
      </Sequence>

      <Sequence from={150} durationInFrames={210} premountFor={30}>
        <WorkflowSceneProblem />
      </Sequence>

      <Sequence from={360} durationInFrames={690} premountFor={30}>
        <WorkflowSceneWorkflow />
      </Sequence>

      <Sequence from={1050} durationInFrames={300} premountFor={30}>
        <WorkflowSceneSmartPart />
      </Sequence>

      <Sequence from={1350} durationInFrames={240} premountFor={30}>
        <WorkflowSceneBroadcast />
      </Sequence>

      <Sequence from={1590} durationInFrames={210} premountFor={30}>
        <WorkflowSceneCTA />
      </Sequence>
    </>
  );
};
