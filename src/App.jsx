import React, { useEffect, useRef, useState } from 'react';
import {
  Shuffle, Power, Drum, Lock, Unlock, Settings, X, Info,
  Music, Type, Repeat, Sun, Moon, Dices, ChevronDown, ChevronUp, Link, Link2Off,
  Play, Pause, Volume2, VolumeX, Timer
} from 'lucide-react';
import { Beam, Formatter, Renderer, Stave, StaveNote, Tuplet, Voice } from 'vexflow';

const SYLLABLE_SYSTEMS = {
  standard: {
    sixteenths: ['e', '&', 'a'],
    triplets: ['ta', 'te'],
    beats: ['1', '2', '3', '4']
  },
  takadimi: {
    sixteenths: ['ka', 'di', 'mi'],
    triplets: ['ki', 'da'],
    beats: ['ta', 'ta', 'ta', 'ta']
  },
  dutadeta: {
    sixteenths: ['ta', 'de', 'ta'],
    triplets: ['da', 'di'],
    beats: ['du', 'du', 'du', 'du']
  }
};

const TIME_SIGNATURES = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '5/4', beats: 5 },
  { label: '6/8', beats: 6 },
  { label: '7/8', beats: 7 },
  { label: '9/8', beats: 9 },
  { label: '12/8', beats: 12 }
];

const METRONOME_SUBDIVISIONS = [
  { id: 'quarter', label: 'Quarter' },
  { id: 'eighth', label: '8ths' },
  { id: 'sixteenth', label: '16ths' },
  { id: 'triplet', label: 'Triplets' },
  { id: 'twoAndFour', label: 'Only 2&4' },
  { id: 'offbeatEighth', label: 'Off-beat 8ths' }
];

const GRID_DISPLAY_OPTIONS = [
  { id: 'simplified', label: 'Simplified' },
  { id: 'full', label: 'Full Grid' }
];

const PATTERN_VIEW_OPTIONS = [
  { id: 'dots', label: 'Beat Dots' },
  { id: 'notation', label: 'Notation' }
];

const OSTINATO_OPTIONS = [
  { name: 'Quarters', pattern: '● ○ ○ ○' },
  { name: '8ths', pattern: '● ○ ● ○' },
  { name: 'Dotted 8ths', pattern: '● ○ ○ ●' },
  { name: 'Triplets (8ths)', pattern: '● ● ●' },
  { name: '16ths', pattern: '● ● ● ●' },
  { name: 'Off-beat 8ths', pattern: '○ ○ ● ○' },
  { name: 'Off-beat 16ths', pattern: '○ ● ○ ●' },
  { name: '1 & 3', pattern: '16-step' },
  { name: '2 & 4', pattern: '16-step' }
];

const ALPHABET_16THS = [
  { name: '1', pattern: '● ○ ○ ○' }, { name: 'e', pattern: '○ ● ○ ○' }, { name: '&', pattern: '○ ○ ● ○' }, { name: 'a', pattern: '○ ○ ○ ●' },
  { name: '1 e', pattern: '● ● ○ ○' }, { name: '1 &', pattern: '● ○ ● ○' }, { name: '1 a', pattern: '● ○ ○ ●' }, { name: 'e &', pattern: '○ ● ● ○' },
  { name: 'e a', pattern: '○ ● ○ ●' }, { name: '& a', pattern: '○ ○ ● ●' }, { name: '1 e &', pattern: '● ● ● ○' }, { name: '1 e a', pattern: '● ● ○ ●' },
  { name: '1 & a', pattern: '● ○ ● ●' }, { name: 'e & a', pattern: '○ ● ● ●' }, { name: '1 e & a', pattern: '● ● ● ●' }, { name: 'Rest', pattern: '○ ○ ○ ○' }
];

const ALPHABET_TRIPLETS = [
  { name: '1', pattern: '● ○ ○' }, { name: 'ta', pattern: '○ ● ○' }, { name: 'te', pattern: '○ ○ ●' },
  { name: '1 ta', pattern: '● ● ○' }, { name: '1 te', pattern: '● ○ ●' }, { name: 'ta te', pattern: '○ ● ●' },
  { name: '1 ta te', pattern: '● ● ●' }, { name: 'Rest', pattern: '○ ○ ○' }
];

const LIMBS = [
  { id: 'rh', label: 'RH', fullName: 'Right Hand' },
  { id: 'lh', label: 'LH', fullName: 'Left Hand' },
  { id: 'rf', label: 'RF', fullName: 'Right Foot' },
  { id: 'lf', label: 'LF', fullName: 'Left Foot' },
  { id: 'vo', label: 'VO', fullName: 'Voice' }
];

const MIN_BPM = 20;
const MAX_BPM = 320;
const PULSES_PER_BEAT = 12;

const defaultLimbState = {
  enabled: true,
  soundOn: false,
  locked: false,
  mode: 'ostinato',
  pattern: 'Quarters',
  melody: '●○○○○○○○○○○○○○○○'
};

const normalizeMelody = (melody, stepsPerBar) => {
  const raw = (melody || '').split('').filter((c) => c === '●' || c === '○');
  const padded = [...raw];
  while (padded.length < stepsPerBar) padded.push('○');
  return padded.slice(0, stepsPerBar).join('');
};

const buildSpecialPattern = (patternName, beatsPerBar) => {
  const steps = beatsPerBar * 4;
  const chars = Array.from({ length: steps }, () => '○');
  const targets = patternName === '1 & 3' ? [0, 2] : [1, 3];
  targets.forEach((beatIdx) => {
    if (beatIdx < beatsPerBar) {
      chars[beatIdx * 4] = '●';
    }
  });
  return chars.join('');
};

const parsePatternChars = (patternString) => (patternString?.includes(' ') ? patternString.split(' ') : patternString?.split('') || []);

const subdivisionPulseMap = {
  quarter: [0],
  eighth: [0, 6],
  sixteenth: [0, 3, 6, 9],
  triplet: [0, 4, 8],
  offbeatEighth: [6]
};

const isSubdivisionAllowed = (subdivisionId, beatsPerBar) => {
  if (subdivisionId === 'twoAndFour') return beatsPerBar >= 4;
  return true;
};

const RhythmNotation = ({ beats, timeSignature, darkMode }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !beats?.length) return;
    containerRef.current.innerHTML = '';

    const [numBeatsRaw, beatValueRaw] = String(timeSignature).split('/').map((v) => Number(v));
    const numBeats = Number.isFinite(numBeatsRaw) ? numBeatsRaw : 4;
    const beatValue = Number.isFinite(beatValueRaw) ? beatValueRaw : 4;
    const stroke = darkMode ? '#64748b' : '#334155';
    const noteColor = darkMode ? '#f8fafc' : '#0f172a';

    const tokens = [];
    const tupletRanges = [];

    beats.forEach((beat) => {
      if (beat.length === 3) {
        const startIndex = tokens.length;
        beat.forEach((slot) => {
          tokens.push({ duration: '8', rest: slot !== '●' });
        });
        tupletRanges.push([startIndex, startIndex + 3]);
        return;
      }

      const slots = beat.length === 4 ? beat : ['○', '○', '○', '○'];
      const pairs = [
        [slots[0], slots[1]],
        [slots[2], slots[3]]
      ];

      pairs.forEach(([a, b]) => {
        if (a === '●' && b === '○') {
          tokens.push({ duration: '8', rest: false });
          return;
        }
        if (a === '○' && b === '○') {
          tokens.push({ duration: '8', rest: true });
          return;
        }
        tokens.push({ duration: '16', rest: a !== '●' });
        tokens.push({ duration: '16', rest: b !== '●' });
      });
    });

    const notes = tokens.map((token) => {
      const note = new StaveNote({
        keys: ['b/4'],
        duration: `${token.duration}${token.rest ? 'r' : ''}`,
        clef: 'percussion'
      });
      note.setStemDirection(1);
      note.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
      return note;
    });

    const width = Math.max(220, notes.length * 26 + 36);
    const height = 96;
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setStrokeStyle(stroke);
    context.setFillStyle(stroke);

    const stave = new Stave(10, 24, width - 20);
    stave.setNumLines(1);
    stave.setContext(context).draw();

    const voice = new Voice({ num_beats: numBeats, beat_value: beatValue });
    voice.setMode(Voice.Mode.SOFT);
    voice.addTickables(notes);

    new Formatter().joinVoices([voice]).format([voice], width - 42);
    voice.draw(context, stave);

    const beams = Beam.generateBeams(notes, { beam_rests: false, show_stemlets: false });
    beams.forEach((beam) => {
      beam.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
      beam.setContext(context).draw();
    });

    tupletRanges.forEach(([start, end]) => {
      const tupleNotes = notes.slice(start, end);
      if (tupleNotes.length === 3) {
        const tuplet = new Tuplet(tupleNotes, { num_notes: 3, notes_occupied: 2 });
        tuplet.setContext(context).draw();
      }
    });
  }, [beats, darkMode, timeSignature]);

  return <div ref={containerRef} className="w-full overflow-x-auto py-1" />;
};

const playKick = (ctx, atTime) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, atTime);
  osc.frequency.exponentialRampToValueAtTime(45, atTime + 0.12);

  gain.gain.setValueAtTime(0.0001, atTime);
  gain.gain.exponentialRampToValueAtTime(0.9, atTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, atTime + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(atTime);
  osc.stop(atTime + 0.2);
};

const playMetronomeClick = (ctx, atTime, accented) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = accented ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(accented ? 1600 : 1100, atTime);

  gain.gain.setValueAtTime(0.0001, atTime);
  gain.gain.exponentialRampToValueAtTime(accented ? 0.25 : 0.14, atTime + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, atTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(atTime);
  osc.stop(atTime + 0.05);
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [syllableSystem, setSyllableSystem] = useState('standard');
  const [linkedLimbs, setLinkedLimbs] = useState([]);
  const [bpm, setBpm] = useState(100);
  const [bpmInput, setBpmInput] = useState('100');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [gridDisplayMode, setGridDisplayMode] = useState('simplified');
  const [patternViewMode, setPatternViewMode] = useState('dots');
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [metronomeSubdivision, setMetronomeSubdivision] = useState('quarter');
  const [accentBeats, setAccentBeats] = useState([1]);
  const [isPlaying, setIsPlaying] = useState(false);

  const [state, setState] = useState({
    rh: { ...defaultLimbState },
    lh: { ...defaultLimbState },
    rf: { ...defaultLimbState },
    lf: { ...defaultLimbState },
    vo: { ...defaultLimbState }
  });

  const audioCtxRef = useRef(null);
  const schedulerRef = useRef(null);
  const bpmHoldRef = useRef(null);
  const nextPulseTimeRef = useRef(0);
  const pulseIndexRef = useRef(0);

  const stateRef = useRef(state);
  const bpmRef = useRef(bpm);
  const beatsPerBarRef = useRef(4);
  const metronomeEnabledRef = useRef(metronomeEnabled);
  const metronomeSubdivisionRef = useRef(metronomeSubdivision);
  const accentBeatsRef = useRef(accentBeats);

  const signatureObj = TIME_SIGNATURES.find((sig) => sig.label === timeSignature) || TIME_SIGNATURES[2];
  const beatsPerBar = signatureObj.beats;
  const stepsPerBar = beatsPerBar * 4;
  const sys = SYLLABLE_SYSTEMS[syllableSystem];

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    setBpmInput(String(bpm));
  }, [bpm]);

  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);

  useEffect(() => {
    metronomeEnabledRef.current = metronomeEnabled;
  }, [metronomeEnabled]);

  useEffect(() => {
    metronomeSubdivisionRef.current = metronomeSubdivision;
  }, [metronomeSubdivision]);

  useEffect(() => {
    accentBeatsRef.current = accentBeats;
  }, [accentBeats]);

  useEffect(() => () => {
    if (bpmHoldRef.current) {
      window.clearInterval(bpmHoldRef.current);
    }
    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
  }, []);

  const syncLinked = (draftState, sourceId) => {
    if (!linkedLimbs.includes(sourceId)) return draftState;
    const sourceData = draftState[sourceId];
    linkedLimbs.forEach((id) => {
      if (id !== sourceId && !draftState[id].locked) {
        draftState[id] = {
          ...draftState[id],
          mode: sourceData.mode,
          pattern: sourceData.pattern,
          melody: sourceData.melody
        };
      }
    });
    return draftState;
  };

  const getLimbStepString = (limbData) => {
    if (limbData.mode === 'melody') {
      return normalizeMelody(limbData.melody, stepsPerBar);
    }
    if (limbData.mode === 'ostinato' && (limbData.pattern === '1 & 3' || limbData.pattern === '2 & 4')) {
      return buildSpecialPattern(limbData.pattern, beatsPerBar);
    }
    return '';
  };

  const limbHitsOnPulse = (limbData, pulseIndex) => {
    const pulseInBeat = pulseIndex % PULSES_PER_BEAT;

    if (limbData.mode === 'melody' || (limbData.mode === 'ostinato' && (limbData.pattern === '1 & 3' || limbData.pattern === '2 & 4'))) {
      if (pulseInBeat % 3 !== 0) return false;
      const beatIdx = Math.floor(pulseIndex / PULSES_PER_BEAT);
      const stepInBeat = pulseInBeat / 3;
      const stepIndex = beatIdx * 4 + stepInBeat;
      const steps = getLimbStepString(limbData);
      return steps[stepIndex] === '●';
    }

    const obj = limbData.mode === 'alphabet'
      ? [...ALPHABET_16THS, ...ALPHABET_TRIPLETS].find((o) => o.name === limbData.pattern)
      : OSTINATO_OPTIONS.find((o) => o.name === limbData.pattern);

    const chars = parsePatternChars(obj?.pattern || '○ ○ ○ ○');
    const positions = chars.length === 3 ? [0, 4, 8] : chars.length === 2 ? [0, 6] : [0, 3, 6, 9];

    const slot = positions.indexOf(pulseInBeat);
    if (slot === -1) return false;
    return chars[slot] === '●';
  };

  const scheduleAudio = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const scheduleAhead = 0.1;

    while (nextPulseTimeRef.current < ctx.currentTime + scheduleAhead) {
      const pulse = pulseIndexRef.current;
      const activeBeatsPerBar = beatsPerBarRef.current;
      const totalPulses = activeBeatsPerBar * PULSES_PER_BEAT;
      const beatIdx = Math.floor(pulse / PULSES_PER_BEAT);
      const pulseInBeat = pulse % PULSES_PER_BEAT;

      if (metronomeEnabledRef.current) {
        const activeSubdivision = metronomeSubdivisionRef.current;
        let shouldClick = false;

        if (activeSubdivision === 'twoAndFour') {
          shouldClick = pulseInBeat === 0 && (beatIdx === 1 || beatIdx === 3);
        } else {
          const clickPositions = subdivisionPulseMap[activeSubdivision] || subdivisionPulseMap.quarter;
          shouldClick = clickPositions.includes(pulseInBeat);
        }

        if (shouldClick) {
          const accented = pulseInBeat === 0 && accentBeatsRef.current.includes(beatIdx + 1);
          playMetronomeClick(ctx, nextPulseTimeRef.current, accented);
        }
      }

      const liveState = stateRef.current;
      LIMBS.forEach((limb) => {
        const limbData = liveState[limb.id];
        if (!limbData.enabled || !limbData.soundOn) return;
        if (limbHitsOnPulse(limbData, pulse)) {
          playKick(ctx, nextPulseTimeRef.current);
        }
      });

      pulseIndexRef.current = (pulse + 1) % totalPulses;
      const liveBpm = Math.min(MAX_BPM, Math.max(MIN_BPM, Number(bpmRef.current) || 100));
      nextPulseTimeRef.current += 60 / liveBpm / PULSES_PER_BEAT;
    }
  };

  const startPlayback = async () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current);
    }

    pulseIndexRef.current = 0;
    nextPulseTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    schedulerRef.current = window.setInterval(scheduleAudio, 25);
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const toggleLimb = (id) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
  };

  const handleTimeSignatureChange = (nextSignature) => {
    const nextBeats = (TIME_SIGNATURES.find((sig) => sig.label === nextSignature) || TIME_SIGNATURES[2]).beats;
    const nextSteps = nextBeats * 4;

    setTimeSignature(nextSignature);
    setMetronomeSubdivision((prev) => (isSubdivisionAllowed(prev, nextBeats) ? prev : 'quarter'));
    setAccentBeats((prev) => {
      return prev.filter((b) => b <= nextBeats);
    });
    setState((prev) => {
      const nextState = { ...prev };
      LIMBS.forEach((limb) => {
        nextState[limb.id] = {
          ...nextState[limb.id],
          melody: normalizeMelody(nextState[limb.id].melody, nextSteps)
        };
      });
      return nextState;
    });
    pulseIndexRef.current = 0;
  };

  const toggleLimbSound = (id) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], soundOn: !prev[id].soundOn } }));
  };

  const toggleLock = (id) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], locked: !prev[id].locked } }));
  };

  const setMode = (id, mode) => {
    setState((prev) => {
      const extra = {};
      if (mode === 'melody') {
        extra.melody = Array.from({ length: stepsPerBar }, () => (Math.random() > 0.5 ? '●' : '○')).join('');
        extra.pattern = 'Random';
      }
      if (mode === 'alphabet') extra.pattern = ALPHABET_16THS[0].name;
      if (mode === 'ostinato') extra.pattern = OSTINATO_OPTIONS[0].name;

      const newState = { ...prev, [id]: { ...prev[id], mode, ...extra } };
      return syncLinked(newState, id);
    });
  };

  const toggleMelodyStep = (id, index) => {
    setState((prev) => {
      const melodyArr = normalizeMelody(prev[id].melody, stepsPerBar).split('');
      melodyArr[index] = melodyArr[index] === '●' ? '○' : '●';
      const newMelody = melodyArr.join('');
      const newState = {
        ...prev,
        [id]: { ...prev[id], mode: 'melody', melody: newMelody, pattern: 'Custom' }
      };
      return syncLinked(newState, id);
    });
  };

  const handleRandomizeLimb = (id) => {
    setState((prev) => {
      const current = prev[id];
      const update = {};
      if (current.mode === 'melody') {
        update.melody = Array.from({ length: stepsPerBar }, () => (Math.random() > 0.5 ? '●' : '○')).join('');
        update.pattern = 'Random';
      } else if (current.mode === 'alphabet') {
        const all = [...ALPHABET_16THS, ...ALPHABET_TRIPLETS];
        update.pattern = all[Math.floor(Math.random() * all.length)].name;
      } else {
        update.pattern = OSTINATO_OPTIONS[Math.floor(Math.random() * OSTINATO_OPTIONS.length)].name;
      }

      const newState = { ...prev, [id]: { ...prev[id], ...update } };
      return syncLinked(newState, id);
    });
  };

  const randomizeAll = () => {
    setState((prev) => {
      const newState = { ...prev };
      const processed = new Set();

      LIMBS.forEach((limb) => {
        if (processed.has(limb.id)) return;
        const current = newState[limb.id];
        if (!current.enabled || current.locked) return;

        const update = {};
        if (current.mode === 'melody') {
          update.melody = Array.from({ length: stepsPerBar }, () => (Math.random() > 0.5 ? '●' : '○')).join('');
          update.pattern = 'Random';
        } else if (current.mode === 'alphabet') {
          const all = [...ALPHABET_16THS, ...ALPHABET_TRIPLETS];
          update.pattern = all[Math.floor(Math.random() * all.length)].name;
        } else {
          update.pattern = OSTINATO_OPTIONS[Math.floor(Math.random() * OSTINATO_OPTIONS.length)].name;
        }

        newState[limb.id] = { ...newState[limb.id], ...update };

        if (linkedLimbs.includes(limb.id)) {
          linkedLimbs.forEach((linkId) => {
            if (!newState[linkId].locked) {
              newState[linkId] = {
                ...newState[linkId],
                mode: newState[limb.id].mode,
                pattern: newState[limb.id].pattern,
                melody: newState[limb.id].melody
              };
              processed.add(linkId);
            }
          });
        }
      });

      return newState;
    });
  };

  const toggleLink = (id) => {
    setLinkedLimbs((prev) => {
      const isLinked = prev.includes(id);
      const next = isLinked ? prev.filter((item) => item !== id) : [...prev, id];

      if (next.length > 1) {
        const sourceId = id;
        setState((current) => {
          const newState = { ...current };
          next.forEach((targetId) => {
            if (targetId !== sourceId && !newState[targetId].locked) {
              newState[targetId] = {
                ...newState[targetId],
                mode: current[sourceId].mode,
                pattern: current[sourceId].pattern,
                melody: current[sourceId].melody
              };
            }
          });
          return newState;
        });
      }

      return next;
    });
  };

  const renderDots = (limbId) => {
    const current = state[limbId];
    const isEnabled = current.enabled;
    const isCompoundMeter = ['6/8', '9/8', '12/8'].includes(timeSignature);
    const separatorClass = darkMode ? 'border-slate-700' : 'border-slate-200';
    const groupingClass = darkMode ? 'border-l-slate-700' : 'border-l-slate-300';
    const dotBase = isEnabled
      ? (darkMode ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 'bg-blue-600 shadow-sm')
      : (darkMode ? 'bg-slate-800' : 'bg-slate-300');
    const restBase = darkMode
      ? 'bg-slate-950 border border-slate-800 hover:border-slate-600'
      : 'bg-slate-100 border border-slate-200 hover:border-slate-300';
    const labelColor = isEnabled
      ? (darkMode ? 'text-slate-300' : 'text-slate-500')
      : (darkMode ? 'text-slate-700' : 'text-slate-300');

    const is16Step = current.mode === 'melody' || (current.mode === 'ostinato' && (current.pattern === '1 & 3' || current.pattern === '2 & 4'));
    const getBeatToken = (beatIdx) => (
      syllableSystem === 'standard'
        ? String(beatIdx + 1)
        : (sys.beats[beatIdx] || sys.beats[0] || String(beatIdx + 1))
    );

    if (is16Step) {
      const melodyString = getLimbStepString(current);

      if (patternViewMode === 'notation') {
        const beats = Array.from({ length: beatsPerBar }, (_, beatIdx) => (
          melodyString.slice(beatIdx * 4, beatIdx * 4 + 4).split('')
        ));
        return <RhythmNotation beats={beats} timeSignature={timeSignature} darkMode={darkMode} />;
      }

      return (
        <div className="flex flex-wrap gap-3 w-full">
          {Array.from({ length: beatsPerBar }).map((_, beatIdx) => (
            <div
              key={beatIdx}
              className={`flex gap-1.5 border-r ${separatorClass} last:border-0 pr-3 ${
                isCompoundMeter && beatIdx > 0 && beatIdx % 3 === 0 ? `ml-2 pl-2 border-l-2 ${groupingClass}` : ''
              }`}
            >
              {melodyString.slice(beatIdx * 4, beatIdx * 4 + 4).split('').map((char, i) => {
                const absIndex = beatIdx * 4 + i;
                const beatLabel = getBeatToken(beatIdx);
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5 group">
                    <button
                      disabled={!isEnabled || current.locked}
                      onClick={() => toggleMelodyStep(limbId, absIndex)}
                      className={`w-3 h-3 rounded-full transition-all active:scale-125 ${char === '●' ? dotBase : restBase}`}
                    />
                    <span className={`text-[7px] font-bold uppercase ${labelColor}`}>
                      {i === 0 ? beatLabel : sys.sixteenths[i - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    const obj = current.mode === 'alphabet'
      ? [...ALPHABET_16THS, ...ALPHABET_TRIPLETS].find((o) => o.name === current.pattern)
      : OSTINATO_OPTIONS.find((o) => o.name === current.pattern);

    const chars = parsePatternChars(obj?.pattern || '○ ○ ○ ○');
    const isTriplet = chars.length === 3 || current.pattern.includes('Triplet');
    const beatTokens = Array.from({ length: beatsPerBar }, (_, beatIdx) => (
      syllableSystem === 'standard'
        ? String(beatIdx + 1)
        : (sys.beats[beatIdx] || sys.beats[0] || String(beatIdx + 1))
    ));
    const subdivisions = isTriplet ? sys.triplets : sys.sixteenths;
    const normalizedChars = chars.length === 2 ? ['○', chars[0], chars[1], '○'] : chars;

    if (patternViewMode === 'notation') {
      const beatCount = gridDisplayMode === 'full' ? beatsPerBar : 1;
      const notationBeat = isTriplet ? chars : normalizedChars;
      const beats = Array.from({ length: beatCount }, () => notationBeat);
      const notationTimeSignature = beatCount === 1 ? '1/4' : timeSignature;
      return <RhythmNotation beats={beats} timeSignature={notationTimeSignature} darkMode={darkMode} />;
    }

    if (gridDisplayMode === 'simplified') {
      const simpleBeatToken = beatTokens[0] || '1';
      return (
        <div className="flex gap-4 items-center">
          {normalizedChars.map((char, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-4 h-4 rounded-full transition-all ${char === '●' ? dotBase : restBase}`} />
              <span className={`text-[9px] font-bold uppercase min-w-[12px] text-center ${labelColor}`}>
                {i === 0 ? simpleBeatToken : subdivisions[i - 1] || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-3 w-full">
        {beatTokens.map((beatToken, beatIdx) => (
          <div
            key={beatIdx}
            className={`flex gap-1.5 border-r ${separatorClass} last:border-0 pr-3 ${
              isCompoundMeter && beatIdx > 0 && beatIdx % 3 === 0 ? `ml-2 pl-2 border-l-2 ${groupingClass}` : ''
            }`}
          >
            {normalizedChars.map((char, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-4 h-4 rounded-full transition-all ${char === '●' ? dotBase : restBase}`} />
                <span className={`text-[9px] font-bold uppercase min-w-[12px] text-center ${labelColor}`}>
                  {i === 0 ? beatToken : subdivisions[i - 1] || ''}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const themeClass = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';

  const bumpBpm = (delta) => {
    setBpm((prev) => {
      const next = Math.min(MAX_BPM, Math.max(MIN_BPM, Number(prev) + delta));
      setBpmInput(String(next));
      return next;
    });
  };

  const stopBpmHold = () => {
    if (bpmHoldRef.current) {
      window.clearInterval(bpmHoldRef.current);
      bpmHoldRef.current = null;
    }
  };

  const startBpmHold = (delta) => {
    bumpBpm(delta);
    stopBpmHold();
    bpmHoldRef.current = window.setInterval(() => bumpBpm(delta), 120);
  };

  const commitBpmInput = () => {
    if (bpmInput === '') {
      setBpmInput(String(bpm));
      return;
    }
    const parsed = Number(bpmInput);
    if (Number.isNaN(parsed)) {
      setBpmInput(String(bpm));
      return;
    }
    const clamped = Math.min(MAX_BPM, Math.max(MIN_BPM, parsed));
    setBpm(clamped);
    setBpmInput(String(clamped));
  };

  return (
    <div className={`min-h-screen ${themeClass} p-2 md:p-6 transition-colors duration-300 font-sans pb-20`}>
      <div className="max-w-xl mx-auto flex flex-col h-full">

        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 px-2 gap-2">
          <div className="flex items-center gap-2">
            <Drum className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tighter leading-none">DRUMPULSE</h1>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}>
                  {timeSignature}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Timer className="w-3 h-3 text-slate-500" />
                <div className="flex items-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min={MIN_BPM}
                    max={MAX_BPM}
                    value={bpmInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBpmInput(value);
                      if (value !== '') {
                        const parsed = Number(value);
                        if (!Number.isNaN(parsed)) {
                          setBpm(parsed);
                        }
                      }
                    }}
                    onBlur={commitBpmInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="appearance-auto bg-transparent text-[10px] font-black w-12 outline-none border-b border-slate-700 [color-scheme:light]"
                  />
                  <div className="flex flex-col ml-1">
                    <button
                      onMouseDown={() => startBpmHold(1)}
                      onMouseUp={stopBpmHold}
                      onMouseLeave={stopBpmHold}
                      onTouchStart={() => startBpmHold(1)}
                      onTouchEnd={stopBpmHold}
                      className={`p-[1px] rounded ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}
                      title="Increase BPM"
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onMouseDown={() => startBpmHold(-1)}
                      onMouseUp={stopBpmHold}
                      onMouseLeave={stopBpmHold}
                      onTouchStart={() => startBpmHold(-1)}
                      onTouchEnd={stopBpmHold}
                      className={`p-[1px] rounded mt-[2px] ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}
                      title="Decrease BPM"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase">BPM</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMetronomeEnabled((prev) => !prev)}
              className={`p-2 rounded-full ${metronomeEnabled ? 'bg-emerald-500 text-white' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}
              title="Toggle metronome"
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayback}
              className={`p-2 rounded-full ${isPlaying ? 'bg-red-500 text-white' : darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'}`}
              title={isPlaying ? 'Pause playback' : 'Start playback'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowSettings(true)} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={randomizeAll}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all shadow-lg active:scale-95 ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
            >
              <Shuffle className="w-3 h-3" />
              <span className="hidden sm:inline">SHUFFLE</span>
            </button>
          </div>
        </header>

        <div className="space-y-2 mb-4">
          {LIMBS.map((limb) => {
            const current = state[limb.id];
            const isEnabled = current.enabled;
            const isLocked = current.locked;
            const isLinked = linkedLimbs.includes(limb.id);

            return (
              <div
                key={limb.id}
                className={`relative rounded-2xl border transition-all flex flex-col ${
                  isEnabled
                    ? (darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm')
                    : 'opacity-40 grayscale-[0.5]'
                }`}
              >
                {isLinked && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-blue-500 rounded-full z-10" />
                )}

                <div className="flex items-center p-2 gap-3">
                  <div className="flex flex-col items-center gap-1 min-w-[36px]">
                    <span className={`text-[10px] font-black ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{limb.label}</span>
                    <button onClick={() => toggleLimb(limb.id)} className={`p-1.5 rounded-lg ${isEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 overflow-hidden mb-1">
                      <span className={`text-sm font-black truncate ${isEnabled ? '' : 'text-slate-400'}`}>
                        {current.pattern}
                      </span>
                      <span className={`text-[14px] ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>•</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{current.mode}</span>
                      <button
                        disabled={!isEnabled}
                        onClick={() => toggleLimbSound(limb.id)}
                        className={`ml-auto p-1.5 rounded-md transition-colors ${current.soundOn ? 'bg-blue-500 text-white' : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}
                        title="Toggle limb sound"
                      >
                        {current.soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="min-h-[44px] flex items-center">
                      {renderDots(limb.id)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-1">
                    <div className={`flex flex-col gap-0.5 rounded-lg p-0.5 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                      <button onClick={() => setMode(limb.id, 'ostinato')} className={`p-1 rounded ${current.mode === 'ostinato' ? (darkMode ? 'bg-slate-800 text-white' : 'bg-white shadow-sm text-black') : 'text-slate-500'}`}><Repeat className="w-3 h-3" /></button>
                      <button onClick={() => setMode(limb.id, 'alphabet')} className={`p-1 rounded ${current.mode === 'alphabet' ? (darkMode ? 'bg-slate-800 text-white' : 'bg-white shadow-sm text-black') : 'text-slate-500'}`}><Type className="w-3 h-3" /></button>
                      <button onClick={() => setMode(limb.id, 'melody')} className={`p-1 rounded ${current.mode === 'melody' ? (darkMode ? 'bg-slate-800 text-white' : 'bg-white shadow-sm text-black') : 'text-slate-500'}`}><Music className="w-3 h-3" /></button>
                    </div>

                    <div className="flex flex-col gap-1 ml-1">
                      <button
                        disabled={!isEnabled}
                        onClick={() => toggleLock(limb.id)}
                        className={`p-2 rounded-lg transition-colors ${isLocked ? 'bg-orange-500 text-white' : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}
                      >
                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        disabled={!isEnabled || isLocked}
                        onClick={() => handleRandomizeLimb(limb.id)}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-blue-400 hover:text-white' : 'bg-slate-100 text-blue-600 hover:bg-blue-50'}`}
                      >
                        <Dices className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isEnabled && !isLocked && current.mode !== 'melody' && (
                  <div className={`relative flex items-center justify-center border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <select
                      value={current.pattern}
                      onChange={(e) => {
                        const value = e.target.value;
                        setState((prev) => {
                          const newState = { ...prev, [limb.id]: { ...prev[limb.id], pattern: value } };
                          return syncLinked(newState, limb.id);
                        });
                      }}
                      className={`w-full text-[10px] font-bold px-6 py-1.5 rounded-b-2xl appearance-none text-center outline-none bg-transparent ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {current.mode === 'alphabet' ? (
                        <>
                          <optgroup label="16th Notes">
                            {ALPHABET_16THS.map((opt) => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                          </optgroup>
                          <optgroup label="Triplets">
                            {ALPHABET_TRIPLETS.map((opt) => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                          </optgroup>
                        </>
                      ) : (
                        OSTINATO_OPTIONS.map((opt) => <option key={opt.name} value={opt.name}>{opt.name}</option>)
                      )}
                    </select>
                    <ChevronDown className={`w-3 h-3 absolute right-4 pointer-events-none ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500 shadow-inner'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Training Reference</h4>
          </div>
          <ul className="text-[9px] font-bold space-y-1 list-disc list-inside">
            <li>MODES: Ostinato (repeating), Alphabet (individual beats), Melody (full phrase).</li>
            <li>LOCK: Protect a limb from "Shuffle All" to maintain one stable pulse.</li>
            <li>TAP DOTS: In Melody/16-step mode, toggle dots to create custom grooves.</li>
            <li>LINK (Settings): Sync any group of limbs for coordinated "unison" patterns.</li>
          </ul>
        </div>

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-3xl p-6 overflow-y-auto max-h-[90vh] ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 shadow-2xl text-slate-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg uppercase tracking-tight">Configuration</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Limb Grouping (Sync)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {LIMBS.map((limb) => (
                      <button
                        key={limb.id}
                        onClick={() => toggleLink(limb.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${linkedLimbs.includes(limb.id) ? 'border-blue-500 bg-blue-500/10' : (darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-600')}`}
                      >
                        <span className="text-[9px] font-black">{limb.label}</span>
                        {linkedLimbs.includes(limb.id) ? <Link className="w-3 h-3 text-blue-500" /> : <Link2Off className="w-3 h-3 text-slate-400" />}
                      </button>
                    ))}
                  </div>
                  <p className={`text-[8px] mt-2 font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Linked limbs will share the same mode & pattern automatically.</p>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Time Signature</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SIGNATURES.map((sig) => (
                      <button
                        key={sig.label}
                        onClick={() => handleTimeSignatureChange(sig.label)}
                        className={`p-2 rounded-xl border text-xs font-black ${
                          timeSignature === sig.label
                            ? (darkMode ? 'border-blue-500 bg-blue-500/10 text-blue-200' : 'border-blue-500 bg-blue-50/50 text-slate-900')
                            : (darkMode ? 'border-slate-700 text-slate-300 bg-slate-800/30' : 'border-slate-100 text-slate-500')
                        }`}
                      >
                        {sig.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Display Density</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GRID_DISPLAY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setGridDisplayMode(opt.id)}
                        className={`p-2 rounded-xl border text-xs font-black ${
                          gridDisplayMode === opt.id
                            ? (darkMode ? 'border-blue-500 bg-blue-500/10 text-blue-200' : 'border-blue-500 bg-blue-50/50 text-slate-900')
                            : (darkMode ? 'border-slate-700 text-slate-300 bg-slate-800/30' : 'border-slate-100 text-slate-500')
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Pattern View</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PATTERN_VIEW_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPatternViewMode(opt.id)}
                        className={`p-2 rounded-xl border text-xs font-black ${
                          patternViewMode === opt.id
                            ? (darkMode ? 'border-blue-500 bg-blue-500/10 text-blue-200' : 'border-blue-500 bg-blue-50/50 text-slate-900')
                            : (darkMode ? 'border-slate-700 text-slate-300 bg-slate-800/30' : 'border-slate-100 text-slate-500')
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Metronome Subdivision</label>
                  <div className="grid grid-cols-2 gap-2">
                    {METRONOME_SUBDIVISIONS.map((sub) => {
                      const allowed = isSubdivisionAllowed(sub.id, beatsPerBar);
                      return (
                      <button
                        key={sub.id}
                        disabled={!allowed}
                        title={allowed ? '' : 'Only available in signatures with 4 or more beats'}
                        onClick={() => {
                          if (!allowed) return;
                          setMetronomeSubdivision(sub.id);
                        }}
                        className={`p-2 rounded-xl border text-xs font-black ${
                          metronomeSubdivision === sub.id
                            ? (darkMode ? 'border-blue-500 bg-blue-500/10 text-blue-200' : 'border-blue-500 bg-blue-50/50 text-slate-900')
                            : (darkMode ? 'border-slate-700 text-slate-300 bg-slate-800/30' : 'border-slate-100 text-slate-500')
                        } ${allowed ? '' : 'opacity-40 cursor-not-allowed'}`}
                      >
                        {sub.label}
                      </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Metronome Accents</label>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: beatsPerBar }).map((_, idx) => {
                      const beat = idx + 1;
                      const active = accentBeats.includes(beat);
                      return (
                        <button
                          key={beat}
                          onClick={() => {
                            setAccentBeats((prev) => {
                              const exists = prev.includes(beat);
                              if (exists) {
                                return prev.filter((b) => b !== beat);
                              }
                              return [...prev, beat].sort((a, b) => a - b);
                            });
                          }}
                          className={`p-2 rounded-xl border text-xs font-black ${
                            active
                              ? (darkMode ? 'border-blue-500 bg-blue-500/10 text-blue-200' : 'border-blue-500 bg-blue-50/50 text-slate-900')
                              : (darkMode ? 'border-slate-700 text-slate-300 bg-slate-800/30' : 'border-slate-100 text-slate-500')
                          }`}
                        >
                          {beat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Counting System</label>
                  <div className="space-y-2">
                    {Object.keys(SYLLABLE_SYSTEMS).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSyllableSystem(key)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                          syllableSystem === key
                            ? (darkMode ? 'border-blue-500 bg-blue-500/10 text-slate-100' : 'border-blue-500 bg-blue-50/50 text-slate-900')
                            : (darkMode ? 'border-transparent bg-slate-800 text-slate-300' : 'border-transparent bg-slate-50 text-slate-400')
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black uppercase text-sm">{key}</span>
                          <span className="text-[10px] font-mono opacity-60">
                            {SYLLABLE_SYSTEMS[key].beats[0]} {SYLLABLE_SYSTEMS[key].sixteenths.join(' ')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
