import * as Tone from "tone";
import { AppState, LimbId } from "../state/limbState";
import { createDrumVoices } from "./sounds";
import { getStepDurationSeconds } from "../engine/grid";

const voices = createDrumVoices();

export const initTransport = (bpm: number) => {
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.timeSignature = [4, 4];
};

const limbToVoice = (limbId: LimbId) => {
  if (limbId === "RH") return voices.rimA;
  if (limbId === "LH") return voices.rimB;
  if (limbId === "RF") return voices.kickA;
  return voices.kickB;
};

export const scheduleState = (state: AppState, onlyLimb?: LimbId | null) => {
  Tone.Transport.cancel();

  Object.entries(state.limbs).forEach(([id, limb]) => {
    if (onlyLimb && id !== onlyLimb) return;
    if (!limb.isEnabled) return;
    const voice = limbToVoice(id as LimbId);
    const stepDuration = getStepDurationSeconds(limb.subdivision);
    const noteDuration = limb.subdivision === "triplet" ? "8t" : "16n";
    limb.activeNotes.forEach((step) => {
      const time = step * stepDuration;
      Tone.Transport.schedule((t) => {
        voice.triggerAttackRelease("C2", noteDuration, t);
      }, time);
    });
  });
};

export const startTransport = async () => {
  await Tone.start();
  Tone.Transport.start();
};

export const stopTransport = () => {
  Tone.Transport.stop();
};
