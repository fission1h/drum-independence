import { Subdivision } from "../state/limbState";

export const getOstinatoPattern = (subdivision: Subdivision): number[] => {
  switch (subdivision) {
    case "quarter":
      return [0, 4, 8, 12];
    case "eighth":
      return [0, 2, 4, 6, 8, 10, 12, 14];
    case "sixteenth":
      return Array.from({ length: 16 }, (_, i) => i);
    case "dotted-eighth":
      return [0, 3, 6, 9, 12, 15];
    case "offbeats-8":
      return [2, 6, 10, 14];
    case "offbeats-16":
      return [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15];
    case "triplet":
      return Array.from({ length: 12 }, (_, i) => i);
    default:
      return [];
  }
};
