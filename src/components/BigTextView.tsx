import React from "react";
import { useAppState } from "../state/store";

const beatLabels16 = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];
const beatLabelsTriplet = ["1", "trip", "let", "2", "trip", "let", "3", "trip", "let", "4", "trip", "let"];

export const BigTextView: React.FC = () => {
  const state = useAppState();
  return (
    <div className="view">
      <div className="sequencer">
        {Object.entries(state.limbs)
          .filter(([_, limb]) => limb.isEnabled)
          .map(([id, limb]) => {
            const isTriplet = limb.subdivision === "triplet";
            const labels = isTriplet ? beatLabelsTriplet : beatLabels16;
            const beatSize = isTriplet ? 3 : 4;
            const beats = Array.from({ length: 4 }, (_, beat) => {
              const start = beat * beatSize;
              return {
                labels: labels.slice(start, start + beatSize),
                indices: Array.from({ length: beatSize }, (_, i) => start + i),
              };
            });
            const mappedNotes = isTriplet ? limb.activeNotes : limb.activeNotes;
            return (
              <div className="sequencer-row" key={id}>
                <div className="sequencer-label">{id}</div>
                <div className="sequencer-grid">
                  <div className="beat-row labels">
                    {beats.map((beat, b) => (
                      <div
                        key={`${id}-lbl-beat-${b}`}
                        className={`beat-group ${isTriplet ? "triplet" : "sixteenth"}`}
                      >
                        {beat.labels.map((label, i) => (
                          <div key={`${id}-lbl-${b}-${i}`} className="sequencer-label-cell">
                            {label}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="beat-row cells">
                    {beats.map((beat, b) => (
                      <div
                        key={`${id}-cell-beat-${b}`}
                        className={`beat-group ${isTriplet ? "triplet" : "sixteenth"}`}
                      >
                        {beat.indices.map((i) => (
                          <div
                            key={`${id}-${i}`}
                            className={`sequencer-cell ${mappedNotes.includes(i) ? "active" : ""}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
