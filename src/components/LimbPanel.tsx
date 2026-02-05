import React from "react";
import { LimbId } from "../state/limbState";
import { subdivisionOptions, useAppDispatch, useAppState } from "../state/store";
import { getOstinatoPattern } from "../engine/ostinato";

const limbLabels: Record<LimbId, string> = {
  RH: "Right Hand",
  LH: "Left Hand",
  RF: "Right Foot",
  LF: "Left Foot",
};

export const LimbPanel: React.FC<{
  limbId: LimbId;
  isPlaying: boolean;
  onPlay: (limbId: LimbId) => void;
  onStop: () => void;
}> = ({ limbId, isPlaying, onPlay, onStop }) => {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const limb = state.limbs[limbId];
  return (
    <div className="panel">
      <h3>{limbLabels[limbId]}</h3>
      <div className="controls">
        <label className="pill">
          <input
            type="checkbox"
            checked={limb.isEnabled}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_LIMB",
                limbId,
                patch: {
                  isEnabled: e.target.checked,
                  activeNotes: e.target.checked
                    ? getOstinatoPattern(limb.subdivision)
                    : [],
                  patternKey: e.target.checked ? "ostinato" : limb.patternKey,
                },
              })
            }
          />
          Enabled
        </label>
        <div className="control-row">
          <label>Playback</label>
          <div className="inline-row">
            <button
              className="secondary"
              disabled={!limb.isEnabled}
              onClick={() => onPlay(limbId)}
            >
              {isPlaying ? "Playing" : "Play"}
            </button>
            <button className="secondary" disabled={!isPlaying} onClick={onStop}>
              Stop
            </button>
          </div>
        </div>
        <div className="control-row">
          <label>Pattern</label>
          <select
            value={limb.subdivision}
            disabled={!limb.isEnabled}
            onChange={(e) => {
              const subdivision = e.target.value as any;
              dispatch({
                type: "UPDATE_LIMB",
                limbId,
                patch: {
                  isOstinato: true,
                  subdivision,
                  activeNotes: getOstinatoPattern(subdivision),
                  patternKey: "ostinato",
                },
              });
            }}
          >
            {subdivisionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <button
          className="primary"
          disabled={!limb.isEnabled}
          onClick={() => {
            const pick =
              subdivisionOptions[Math.floor(Math.random() * subdivisionOptions.length)];
            dispatch({
              type: "UPDATE_LIMB",
              limbId,
              patch: {
                isOstinato: true,
                subdivision: pick,
                activeNotes: getOstinatoPattern(pick),
                patternKey: "ostinato",
              },
            });
          }}
        >
          Random
        </button>
      </div>
    </div>
  );
};
