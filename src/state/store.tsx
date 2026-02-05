import React from "react";
import { AppState, initialAppState, LimbId, LimbState, Subdivision } from "./limbState";

export type Action =
  | { type: "SET_BPM"; bpm: number }
  | { type: "UPDATE_LIMB"; limbId: LimbId; patch: Partial<LimbState> }
  | { type: "SET_LIMBS"; limbs: AppState["limbs"] };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_BPM":
      return { ...state, bpm: action.bpm };
    case "UPDATE_LIMB": {
      const next = {
        ...state.limbs[action.limbId],
        ...action.patch,
      };
      return {
        ...state,
        limbs: {
          ...state.limbs,
          [action.limbId]: next,
        },
      };
    }
    case "SET_LIMBS":
      return { ...state, limbs: action.limbs };
    default:
      return state;
  }
};

const AppStateContext = React.createContext<AppState>(initialAppState);
const AppDispatchContext = React.createContext<React.Dispatch<Action>>(() => {});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialAppState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => React.useContext(AppStateContext);
export const useAppDispatch = () => React.useContext(AppDispatchContext);

export const subdivisionOptions: Subdivision[] = [
  "quarter",
  "eighth",
  "triplet",
  "dotted-eighth",
  "sixteenth",
  "offbeats-8",
  "offbeats-16",
];
