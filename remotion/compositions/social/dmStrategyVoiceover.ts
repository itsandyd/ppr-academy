export const DM_STRATEGY_VOICEOVER_COMPOSITION_ID = "dm-strategy-video";
export const DM_STRATEGY_TRANSITION_SECONDS = 0.4;

export const dmStrategySceneSeconds = {
  hook: 5.0,
  problem: 10.2,
  solution: 9.2,
  proof: 11.4,
  cta: 7.6,
} as const;

export const dmStrategyVoiceoverScenes = [
  {
    id: "scene-01-hook",
    text: "Most music producers struggle to turn their social media attention into actual income.",
  },
  {
    id: "scene-02-problem",
    text: "When someone comments asking for stems or a preset pack, you reply manually hours later. By then, the lead is gone. You're losing sales every week because your follow-up is too slow.",
  },
  {
    id: "scene-03-solution",
    text: "Pause Play Repeat changes that. It's an all-in-one storefront built for producers to sell courses, sample packs, and beats, with powerful DM automation built right in.",
  },
  {
    id: "scene-04-proof",
    text: "When a fan comments a keyword like P P R, our Smart AI reads the last ten messages for context, and instantly sends them a direct message with the exact link they asked for. No more missed opportunities.",
  },
  {
    id: "scene-05-cta",
    text: "Turn your comments into customers on autopilot. Comment P P R right now, and I'll instantly DM you the link to check out the platform.",
  },
] as const;

export const getDmStrategyVoiceoverFiles = () =>
  dmStrategyVoiceoverScenes.map((scene) => {
    return `voiceover/${DM_STRATEGY_VOICEOVER_COMPOSITION_ID}/${scene.id}.mp3`;
  });

export const getDmStrategyTimeline = (fps: number) => {
  const hook = Math.round(dmStrategySceneSeconds.hook * fps);
  const problem = Math.round(dmStrategySceneSeconds.problem * fps);
  const solution = Math.round(dmStrategySceneSeconds.solution * fps);
  const proof = Math.round(dmStrategySceneSeconds.proof * fps);
  const cta = Math.round(dmStrategySceneSeconds.cta * fps);
  const transition = Math.round(DM_STRATEGY_TRANSITION_SECONDS * fps);

  return {
    hook,
    problem,
    solution,
    proof,
    cta,
    transition,
    total:
      hook +
      problem +
      solution +
      proof +
      cta -
      transition * 4,
  };
};
