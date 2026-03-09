export const BEAT_LEASE_VOICEOVER_COMPOSITION_ID = "beat-lease-video";
export const BEAT_LEASE_TRANSITION_SECONDS = 0.4;

export const beatLeaseSceneSeconds = {
  hook: 9.5,
  problem: 37.0,
  solution: 29.0,
  proof: 31.0,
  cta: 13.0,
} as const;

export const beatLeaseVoiceoverScenes = [
  {
    id: "scene-01-hook",
    text: "I sold a beat for fifty dollars. Three months later it was on a track with ten million streams. I got absolutely nothing from it — because I never set up proper licensing.",
  },
  {
    id: "scene-02-problem",
    text: "Most beatmakers do the same thing. They sell a beat without any clear terms — no distribution limits, no streaming caps, no stems pricing. Someone pays fifty bucks, the track takes off, and you have zero legal claim to a single dollar of that success. That's not bad luck — that's a business structure problem. You're leaving ninety percent of your potential income on the table every single time you sell without a proper license.",
  },
  {
    id: "scene-03-solution",
    text: "Here's how it works on PausePlayRepeat. You set up four license tiers once and the system handles everything else. Basic gets the artist an MP3 with a five thousand stream cap. Premium unlocks WAV files, music video rights, and fifty thousand streams. Unlimited gives them stems and trackouts with no distribution restrictions. And Exclusive — that's full ownership, your beat comes off the store, and the price starts at a thousand dollars. The platform auto-generates the contract and delivers the right files the moment they purchase.",
  },
  {
    id: "scene-04-proof",
    text: "Think about what this actually means in practice. The same beat — one recording session — can earn fifty dollars from a basic buyer, seventy-five from a premium buyer who needs WAV files, three hundred and fifty from someone who wants the full stems package, and fifteen hundred or more from an artist who wants exclusive rights. That's almost two thousand dollars from a single beat, versus the fifty you would've taken before. Tiered licensing doesn't change how good your beats are — it just makes sure you're paid what they're actually worth.",
  },
  {
    id: "scene-05-cta",
    text: "Your beats deserve a professional setup. Stop leaving money on the table with vague terms and handshake deals. Comment BEATS below — just the word BEATS — and I'll DM you the link to set up your tiered licensing system on PausePlayRepeat today.",
  },
] as const;

export const getBeatLeaseVoiceoverFiles = () =>
  beatLeaseVoiceoverScenes.map((scene) => {
    return `voiceover/${BEAT_LEASE_VOICEOVER_COMPOSITION_ID}/${scene.id}.mp3`;
  });

export const getBeatLeaseTimeline = (fps: number) => {
  const hook = Math.round(beatLeaseSceneSeconds.hook * fps);
  const problem = Math.round(beatLeaseSceneSeconds.problem * fps);
  const solution = Math.round(beatLeaseSceneSeconds.solution * fps);
  const proof = Math.round(beatLeaseSceneSeconds.proof * fps);
  const cta = Math.round(beatLeaseSceneSeconds.cta * fps);
  const transition = Math.round(BEAT_LEASE_TRANSITION_SECONDS * fps);

  return {
    hook,
    problem,
    solution,
    proof,
    cta,
    transition,
    total: hook + problem + solution + proof + cta - transition * 4,
  };
};
