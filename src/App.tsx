import React from "react";
import { AppProvider, useAppDispatch, useAppState } from "./state/store";
import { LimbPanel } from "./components/LimbPanel";
import { BigTextView } from "./components/BigTextView";
import { initTransport, scheduleState, startTransport, stopTransport } from "./audio/toneEngine";
import { subdivisionOptions } from "./state/store";
import { getOstinatoPattern } from "./engine/ostinato";

const AppShell: React.FC = () => {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [playingLimb, setPlayingLimb] = React.useState<null | "RH" | "LH" | "RF" | "LF">(null);
  React.useEffect(() => {
    initTransport(state.bpm);
  }, [state.bpm]);

  React.useEffect(() => {
    const next = { ...state.limbs };
    let changed = false;
    (Object.keys(next) as Array<keyof typeof next>).forEach((id) => {
      const limb = next[id];
      if (limb.activeNotes.length === 0) {
        next[id] = {
          ...limb,
          isOstinato: true,
          patternKey: "ostinato",
          activeNotes: getOstinatoPattern(limb.subdivision),
        };
        changed = true;
      }
    });
    if (changed) {
      dispatch({ type: "SET_LIMBS", limbs: next });
    }
  }, [state.limbs, dispatch]);

  React.useEffect(() => {
    scheduleState(state, playingLimb);
  }, [state, playingLimb]);

  const handlePlayLimb = async (limbId: "RH" | "LH" | "RF" | "LF") => {
    setPlayingLimb(limbId);
    await startTransport();
  };

  const handleStop = () => {
    setPlayingLimb(null);
    stopTransport();
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="subtitle">Drumming Independence</div>
          <div className="title">Four-Limb Matrix</div>
        </div>
        <div className="inline-row">
          <div className="pill">BPM</div>
          <input
            type="number"
            value={state.bpm}
            min={40}
            max={200}
            onChange={(e) => dispatch({ type: "SET_BPM", bpm: Number(e.target.value) })}
          />
        </div>
      </header>

      <BigTextView key="grid" />

      <section className="panel">
        <div className="controls">
          <button
            className="primary"
            onClick={() => {
              const next = { ...state.limbs };
              (Object.keys(next) as Array<keyof typeof next>).forEach((id) => {
                if (!next[id].isEnabled) return;
                const pick =
                  subdivisionOptions[Math.floor(Math.random() * subdivisionOptions.length)];
                next[id] = {
                  ...next[id],
                  isOstinato: true,
                  subdivision: pick,
                  activeNotes: getOstinatoPattern(pick),
                  patternKey: "ostinato",
                };
              });
              dispatch({ type: "SET_LIMBS", limbs: next });
            }}
          >
            Randomize All
          </button>
        </div>
      </section>

      <section className="panel-grid">
        <LimbPanel
          limbId="RH"
          isPlaying={playingLimb === "RH"}
          onPlay={handlePlayLimb}
          onStop={handleStop}
        />
        <LimbPanel
          limbId="LH"
          isPlaying={playingLimb === "LH"}
          onPlay={handlePlayLimb}
          onStop={handleStop}
        />
        <LimbPanel
          limbId="RF"
          isPlaying={playingLimb === "RF"}
          onPlay={handlePlayLimb}
          onStop={handleStop}
        />
        <LimbPanel
          limbId="LF"
          isPlaying={playingLimb === "LF"}
          onPlay={handlePlayLimb}
          onStop={handleStop}
        />
      </section>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
