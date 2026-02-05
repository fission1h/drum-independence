import * as Tone from "tone";

export const createDrumVoices = () => {
  const rimA = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 3,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.05 },
  }).toDestination();

  const rimB = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0.01, release: 0.05 },
  }).toDestination();

  const kickA = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 5,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.2 },
  }).toDestination();

  const kickB = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.2 },
  }).toDestination();

  return { rimA, rimB, kickA, kickB };
};
