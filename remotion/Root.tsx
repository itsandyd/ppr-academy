import React from "react";
import { Composition } from "remotion";
import { PausePlayRepeatVideo } from "./PausePlayRepeatVideo";
import { EmailAutomationVideo } from "./compositions/features/EmailAutomationVideo";
import { BeatLeaseVideo } from "./compositions/features/BeatLeaseVideo";
import { FollowGatesVideo } from "./compositions/features/FollowGatesVideo";
import { SaturationCourseVideo } from "./compositions/courses/SaturationCourseVideo";
import { SaturationCourseV2 } from "./compositions/courses/SaturationCourseV2";
import { HarmonicsLessonVideo } from "./compositions/courses/HarmonicsLessonVideo";
import { HarmonicsLessonLong } from "./compositions/courses/HarmonicsLessonLong";
import { HarmonicsFullLesson } from "./compositions/courses/HarmonicsFullLesson";
import { ExcalidrawEmailVideo } from "./compositions/features/ExcalidrawEmailVideo";
import { ExcalidrawGamificationVideo } from "./compositions/features/ExcalidrawGamificationVideo";
import { DynamicVideo } from "./DynamicVideo";
import { PromoWhatIsPPR } from "./compositions/social/PromoWhatIsPPR";
import { PromoAIMarketing } from "./compositions/features/PromoAIMarketing";
import { PromoStorefront } from "./compositions/features/PromoStorefront";
import { PromoCreatorToolkit } from "./compositions/features/PromoCreatorToolkit";
import { PromoLearnerToCreator } from "./compositions/social/PromoLearnerToCreator";
import { PromoMadeForProducers } from "./compositions/social/PromoMadeForProducers";
import { PromoRebrandAnnouncement } from "./compositions/social/PromoRebrandAnnouncement";
import { CampaignDay1 } from "./compositions/social/CampaignDay1";
import { CampaignDay3 } from "./CampaignDay3";
import { CampaignDay5 } from "./CampaignDay5";
import { CampaignDay7 } from "./CampaignDay7";
import { CampaignDay10 } from "./CampaignDay10";
import { BeatTapeRevenueVideo } from "./compositions/social/BeatTapeRevenueVideo";
import { TheStackIKilled } from "./compositions/social/TheStackIKilled";
import { EmailSequenceVideo } from "./compositions/social/EmailSequenceVideo";
import { DMStrategyVideo } from "./compositions/social/DMStrategyVideo";
import { getDmStrategyTimeline } from "./compositions/social/dmStrategyVoiceover";
import { BeatLeaseVideo as BeatLeaseSocialVideo } from "./compositions/social/BeatLeaseVideo";
import { getBeatLeaseTimeline } from "./compositions/social/beatLeaseVoiceover";
import { SceneHook } from "./SceneHook";
import { SceneLeak } from "./SceneLeak";
import { SceneThreeEmails } from "./SceneThreeEmails";
import { SceneProblem } from "./SceneProblem";
import { ScenePPR } from "./ScenePPR";
import { SceneCTA } from "./SceneCTA";
import { EmailWorkflowVideo } from "./workflow-video/EmailWorkflowVideo";
import { ProducersTeachVideo } from "./compositions/social/ProducersTeachVideo";
import { TwoStepsAheadVideo } from "./compositions/social/TwoStepsAheadVideo";
import { PromoProducerPlatform } from "./compositions/social/PromoProducerPlatform";
import {
  BeatLeaseWarningAdaptive,
  calculateBeatLeaseWarningMetadata,
} from "./compositions/social/BeatLeaseWarningAdaptive";

type DynamicVideoProps = {
  generatedCode: string;
  images: string[];
  audioUrl: string | null;
  duration: number;
  width: number;
  height: number;
};

const dmStrategy60Timeline = getDmStrategyTimeline(60);
const beatLease60Timeline = getBeatLeaseTimeline(60);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PausePlayRepeat"
        component={PausePlayRepeatVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="EmailAutomation"
        component={EmailAutomationVideo}
        durationInFrames={2340}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BeatLease"
        component={BeatLeaseVideo}
        durationInFrames={2040}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FollowGates"
        component={FollowGatesVideo}
        durationInFrames={2040}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SaturationCourse"
        component={SaturationCourseVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SaturationCourseV2"
        component={SaturationCourseV2}
        durationInFrames={1440}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Dynamic Video — executes LLM-generated code at render time */}
      <Composition<any, DynamicVideoProps>
        id="DynamicVideo"
        component={DynamicVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          generatedCode: "return function() { return React.createElement(Remotion.AbsoluteFill, { style: { backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center' } }, React.createElement('div', { style: { color: '#fff', fontSize: 32, fontFamily: 'system-ui' } }, 'Dynamic Video')); };",
          images: [],
          audioUrl: null,
          duration: 1800,
          width: 1080,
          height: 1920,
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.duration,
          width: props.width,
          height: props.height,
          fps: 30,
        })}
      />
      <Composition
        id="HarmonicsLesson"
        component={HarmonicsLessonVideo}
        durationInFrames={2160}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HarmonicsLessonLong"
        component={HarmonicsLessonLong}
        durationInFrames={3360}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HarmonicsFullLesson"
        component={HarmonicsFullLesson}
        durationInFrames={19800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ExcalidrawEmail"
        component={ExcalidrawEmailVideo}
        durationInFrames={2280}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ExcalidrawGamification"
        component={ExcalidrawGamificationVideo}
        durationInFrames={2010}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ─── PROMO VIDEOS: Creator-Facing Platform Promotion ─── */}
      <Composition
        id="PromoWhatIsPPR"
        component={PromoWhatIsPPR}
        durationInFrames={1020}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoAIMarketing"
        component={PromoAIMarketing}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoStorefront"
        component={PromoStorefront}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoCreatorToolkit"
        component={PromoCreatorToolkit}
        durationInFrames={990}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoLearnerToCreator"
        component={PromoLearnerToCreator}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoMadeForProducers"
        component={PromoMadeForProducers}
        durationInFrames={1110}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PromoRebrandAnnouncement"
        component={PromoRebrandAnnouncement}
        durationInFrames={1380}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ─── AIDA CAMPAIGN: 10-Day Creator Recruitment Series ─── */}
      <Composition
        id="CampaignDay1"
        component={CampaignDay1}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CampaignDay3"
        component={CampaignDay3}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CampaignDay5"
        component={CampaignDay5}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CampaignDay7"
        component={CampaignDay7}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CampaignDay10"
        component={CampaignDay10}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ─── CONTENT VIDEOS: Educational Social Media Content ─── */}
      <Composition
        id="TheStackIKilled"
        component={TheStackIKilled}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BeatTapeRevenue"
        component={BeatTapeRevenueVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SceneHook"
        component={SceneHook}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SceneLeak"
        component={SceneLeak}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SceneThreeEmails"
        component={SceneThreeEmails}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SceneProblem"
        component={SceneProblem}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScenePPR"
        component={ScenePPR}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SceneCTA"
        component={SceneCTA}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ─── FULL EMAIL SEQUENCE: All 6 scenes composed ─── */}
      <Composition
        id="EmailSequenceVideo"
        component={EmailSequenceVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DMStrategyVideo"
        component={DMStrategyVideo}
        durationInFrames={dmStrategy60Timeline.total}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          enableVoiceover: true,
        }}
      />
      <Composition
        id="DMStrategyVideoSilent"
        component={DMStrategyVideo}
        durationInFrames={dmStrategy60Timeline.total}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          enableVoiceover: false,
        }}
      />
      <Composition
        id="BeatLeaseVideo"
        component={BeatLeaseSocialVideo}
        durationInFrames={beatLease60Timeline.total}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          enableVoiceover: true,
        }}
      />
      <Composition
        id="BeatLeaseVideoSilent"
        component={BeatLeaseSocialVideo}
        durationInFrames={beatLease60Timeline.total}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          enableVoiceover: false,
        }}
      />
      {/* ─── EMAIL WORKFLOW ENGINE: Codebase-Driven Video ─── */}
      <Composition
        id="EmailWorkflowVideo"
        component={EmailWorkflowVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ProducersTeachVideo"
        component={ProducersTeachVideo}
        durationInFrames={3807}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ─── PROMO: Two Steps Ahead — Creator Journey Video ─── */}
      <Composition
        id="TwoStepsAhead"
        component={TwoStepsAheadVideo}
        durationInFrames={5100}
        fps={60}
        width={1080}
        height={1920}
      />
      {/* ─── PROMO: Producer Platform Promotional Video ─── */}
      <Composition
        id="PromoProducerPlatform"
        component={PromoProducerPlatform}
        durationInFrames={1410}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ─── BEAT LEASE WARNING: Adaptive-Duration Cyberpunk Educational ─── */}
      <Composition
        id="BeatLeaseWarningAdaptive"
        component={BeatLeaseWarningAdaptive}
        durationInFrames={1650}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          pacingMultiplier: 1,
        }}
        calculateMetadata={calculateBeatLeaseWarningMetadata}
      />
    </>
  );
};
