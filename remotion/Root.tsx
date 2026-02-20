import React from "react";
import { Composition } from "remotion";
import { PausePlayRepeatVideo } from "./PausePlayRepeatVideo";
import { EmailAutomationVideo } from "./EmailAutomationVideo";
import { BeatLeaseVideo } from "./BeatLeaseVideo";
import { FollowGatesVideo } from "./FollowGatesVideo";
import { SaturationCourseVideo } from "./SaturationCourseVideo";
import { SaturationCourseV2 } from "./SaturationCourseV2";
import { HarmonicsLessonVideo } from "./HarmonicsLessonVideo";
import { HarmonicsLessonLong } from "./HarmonicsLessonLong";
import { HarmonicsFullLesson } from "./HarmonicsFullLesson";
import { ExcalidrawEmailVideo } from "./ExcalidrawEmailVideo";
import { ExcalidrawGamificationVideo } from "./ExcalidrawGamificationVideo";
import { DynamicVideo } from "./DynamicVideo";
import { PromoWhatIsPPR } from "./PromoWhatIsPPR";
import { PromoAIMarketing } from "./PromoAIMarketing";
import { PromoStorefront } from "./PromoStorefront";
import { PromoCreatorToolkit } from "./PromoCreatorToolkit";
import { PromoLearnerToCreator } from "./PromoLearnerToCreator";
import { PromoMadeForProducers } from "./PromoMadeForProducers";
import { PromoRebrandAnnouncement } from "./PromoRebrandAnnouncement";
import { CampaignDay1 } from "./CampaignDay1";
import { CampaignDay3 } from "./CampaignDay3";
import { CampaignDay5 } from "./CampaignDay5";
import { CampaignDay7 } from "./CampaignDay7";
import { CampaignDay10 } from "./CampaignDay10";

type DynamicVideoProps = {
  generatedCode: string;
  images: string[];
  audioUrl: string | null;
  duration: number;
  width: number;
  height: number;
};

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
        width={1920}
        height={1080}
      />
      <Composition
        id="HarmonicsFullLesson"
        component={HarmonicsFullLesson}
        durationInFrames={19800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ExcalidrawEmail"
        component={ExcalidrawEmailVideo}
        durationInFrames={2280}
        fps={30}
        width={1920}
        height={1080}
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
    </>
  );
};
