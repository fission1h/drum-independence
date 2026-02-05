export type Subdivision =
  | "quarter"
  | "eighth"
  | "triplet"
  | "dotted-eighth"
  | "sixteenth"
  | "offbeats-8"
  | "offbeats-16";

export type LimbId = "RH" | "LH" | "RF" | "LF";

export type LimbState = {
  isEnabled: boolean;
  isOstinato: boolean;
  subdivision: Subdivision;
  activeNotes: number[];
};

export type AppState = {
  bpm: number;
  limbs: Record<LimbId, LimbState>;
};

import { getOstinatoPattern } from "../engine/ostinato";

export const defaultLimbState = (subdivision: Subdivision): LimbState => ({
  isEnabled: true,
  isOstinato: true,
  subdivision,
  activeNotes: [],
});

export const initialAppState: AppState = {
  bpm: 90,
  limbs: {
    RH: { ...defaultLimbState("eighth") },
    LH: { ...defaultLimbState("eighth") },
    RF: { ...defaultLimbState("sixteenth") },
    LF: { ...defaultLimbState("sixteenth") },
  },
};
