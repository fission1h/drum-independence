import * as Tone from "tone";
import { Subdivision } from "../state/limbState";

export const getGridSize = (subdivision: Subdivision) => {
  if (subdivision === "triplet") return 12;
  return 16;
};

export const getStepDurationSeconds = (subdivision: Subdivision) => {
  if (subdivision === "triplet") {
    return Tone.Time("8t").toSeconds();
  }
  return Tone.Time("16n").toSeconds();
};
