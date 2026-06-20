/* ==================================================================
   Bass in der linken Hand — KAC Music Academy
   Praxis-Modul (Schwester zu Inversionen/Tonleitern). Akzent: GRÜN.
   4 Bass-Optionen (Grundton/Oktave/Shell/Voll) + 3 Umkehrungen des
   vollen Voicings. MIDI + Klavier-Sound + sequenz-/akkord-Prüfung.
   Keine Hände-Grafik (Fingersatz ist hier kein Lernziel).
   ================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------
     1) ENGINE  (Dur-Dreiklang je Grundton; Voicings als Positionen 0..23)
     ---------------------------------------------------------------- */
  const KEYS = [
    { id: 'C',  pc: 0,  third: 'E',  thirdm: 'Eb', fifth: 'G' },
    { id: 'Db', pc: 1,  third: 'F',  thirdm: 'E',  fifth: 'Ab' },
    { id: 'D',  pc: 2,  third: 'F#', thirdm: 'F',  fifth: 'A' },
    { id: 'Eb', pc: 3,  third: 'G',  thirdm: 'Gb', fifth: 'Bb' },
    { id: 'E',  pc: 4,  third: 'G#', thirdm: 'G',  fifth: 'B' },
    { id: 'F',  pc: 5,  third: 'A',  thirdm: 'Ab', fifth: 'C' },
    { id: 'F#', pc: 6,  third: 'A#', thirdm: 'A',  fifth: 'C#' },
    { id: 'G',  pc: 7,  third: 'B',  thirdm: 'Bb', fifth: 'D' },
    { id: 'Ab', pc: 8,  third: 'C',  thirdm: 'B',  fifth: 'Eb' },
    { id: 'A',  pc: 9,  third: 'C#', thirdm: 'C',  fifth: 'E' },
    { id: 'Bb', pc: 10, third: 'D',  thirdm: 'Db', fifth: 'F' },
    { id: 'B',  pc: 11, third: 'D#', thirdm: 'D',  fifth: 'F#' }
  ];
  const BLACK_PC = [1, 3, 6, 8, 10];

  // Positionen in einem 2-Oktav-Fenster (0..23, 0 = unteres C).
  // root = pc, fifth = pc+7, third (eine Oktave höher) = pc+4+12.
  // Voicing-Definitionen liefern Positions-Arrays (von unten nach oben) +
  // den Basston (unterste Pitchclass) + Anzeige-Töne.
  function noteName(key, which) { return which === 'root' ? key.id : which === 'third' ? key.third : key.fifth; }

  // Die 4 Fülle-Optionen
  const OPTIONS = [
    { id: 'root',   parts: ['root'] },
    { id: 'octave', parts: ['root', 'root8'] },
    { id: 'shell',  parts: ['root', 'fifth'] },
    { id: 'full',   parts: ['root', 'fifth', 'third8'] }
  ];
  // Die 3 Umkehrungen des vollen Voicings (Bass = unterster Ton)
  const INVERSIONS = [
    { id: 'inv0', bass: 'root',  parts: ['root', 'fifth', 'third8'] },    // C – G – E
    { id: 'inv1', bass: 'third', parts: ['third', 'root8', 'fifth8'] },   // E – C – G
    { id: 'inv2', bass: 'fifth', parts: ['fifth', 'third8', 'root16'] }   // G – E – C (C eine Oktave höher)
  ];

  function partPos(key, part, quality) {
    const t3 = quality === 'minor' ? 3 : 4;   // kleine Terz bei Moll, große bei Dur
    switch (part) {
      case 'root':   return key.pc;
      case 'root8':  return key.pc + 12;
      case 'root16': return key.pc + 24;
      case 'fifth':  return key.pc + 7;
      case 'fifth8': return key.pc + 7 + 12;
      case 'third':  return key.pc + t3;
      case 'third8': return key.pc + t3 + 12;
      default: return key.pc;
    }
  }
  function partName(key, part, quality) {
    if (part === 'root' || part === 'root8' || part === 'root16') return key.id;
    if (part === 'fifth' || part === 'fifth8') return key.fifth;
    return quality === 'minor' ? key.thirdm : key.third;
  }

  // Voicing berechnen → { positions(asc, im 0..23-Fenster), names(asc),
  //   pcs, bassPc, kind('option'|'inv'), id }.
  function computeVoicing(key, def, quality) {
    let positions = def.parts.map(function (p) { return partPos(key, p, quality); });
    let names = def.parts.map(function (p) { return partName(key, p, quality); });
    // ins 0..23-Fenster schieben (unterster Ton in untere Oktave)
    const lo = Math.min.apply(null, positions);
    const shift = -12 * Math.floor(lo / 12);
    positions = positions.map(function (p) { return p + shift; });
    // nach Tonhöhe sortieren (Namen mitführen)
    const order = positions.map(function (p, i) { return { p: p, n: names[i] }; })
      .sort(function (a, b) { return a.p - b.p; });
    positions = order.map(function (o) { return o.p; });
    names = order.map(function (o) { return o.n; });
    return {
      id: def.id, positions: positions, names: names,
      pcs: positions.map(function (p) { return ((p % 12) + 12) % 12; }),
      bassPc: ((positions[0] % 12) + 12) % 12
    };
  }

  // Oktav-unabhängige Prüfung: richtige Pitchclasses + richtiger Basston.
  function matchVoicing(notes, voicing) {
    if (!notes || notes.length === 0) return 'none';
    const tgt = new Set(voicing.pcs);
    const held = [];
    notes.forEach(function (n) { const pc = ((n % 12) + 12) % 12; if (held.indexOf(pc) < 0) held.push(pc); });
    const allPresent = voicing.pcs.every(function (pc) { return held.indexOf(pc) >= 0; });
    const noExtra = held.every(function (pc) { return tgt.has(pc); });
    if (allPresent && noExtra) {
      const bassPc = ((notes.slice().sort(function (a, b) { return a - b; })[0] % 12) + 12) % 12;
      // Basston nur bei den Umkehrungen entscheidend (Optionen: jeder Bass ok).
      return voicing.checkBass ? (bassPc === voicing.bassPc ? 'correct' : 'bass') : 'correct';
    }
    return 'partial';
  }

  /* ----------------------------------------------------------------
     1b) STIMMFÜHRUNG  (smarte Akkordfolgen, kleinste Bewegung)
     Diatonische Dur-/Moll-Dreiklänge; für jeden Folge-Akkord wird die
     Umkehrung des vollen Voicings gewählt, die am wenigsten Bewegung
     zum vorigen Akkord braucht — z. B. E–C–G  →  F–C–A.
     ---------------------------------------------------------------- */
  const PCNAME = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  function toneName(pc) { return PCNAME[(((pc % 12) + 12) % 12)]; }
  // Dur-Tonleiter: Halbton-Abstände + diatonische Qualität je Stufe (vii° wird gemieden).
  const MAJ_OFFS = [0, 2, 4, 5, 7, 9, 11];
  const MAJ_QUAL = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  const BASS_PROGS = [
    { name: 'I–IV–V–I', degs: [0, 3, 4, 0] },
    { name: 'I–V–vi–IV', degs: [0, 4, 5, 3] },
    { name: 'vi–IV–I–V', degs: [5, 3, 0, 4] },
    { name: 'ii–V–I', degs: [1, 4, 0] },
    { name: 'I–vi–IV–V', degs: [0, 5, 3, 4] }
  ];
  // Die drei vollen Voicings (Grundstellung/1./2. Umkehrung) als Positionen,
  // bezogen auf den Akkord-Grundton R (0..11), t3 = 4 (Dur) / 3 (Moll).
  function bassInvPositions(R, t3, inv) {
    if (inv === 0) return [R, R + 7, R + t3 + 12];        // Bass = Grundton (C–G–E)
    if (inv === 1) return [R + t3, R + 12, R + 19];       // Bass = Terz   (E–C–G)
    return [R + 7, R + t3 + 12, R + 24];                  // Bass = Quinte (G–E–C, C eine Oktave höher)
  }
  const VL_PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function vlCost(a, b) {
    let best = Infinity;
    for (let x = 0; x < VL_PERMS.length; x++) {
      let s = 0; for (let k = 0; k < 3; k++) s += Math.abs(a[k] - b[VL_PERMS[x][k]]);
      if (s < best) best = s;
    }
    return best;
  }
  function invNameOf(bassPc, R, t3) {
    if (bassPc === ((R % 12) + 12) % 12) return 'inv0';
    if (bassPc === (((R + t3) % 12) + 12) % 12) return 'inv1';
    return 'inv2';
  }
  function stepVoicing(positions, R, t3, quality) {
    const sorted = positions.slice().sort(function (a, b) { return a - b; });
    const names = sorted.map(function (p) { return toneName(p); });
    const pcs = sorted.map(function (p) { return ((p % 12) + 12) % 12; });
    const bassPc = pcs[0];
    return {
      positions: sorted, names: names, pcs: pcs, bassPc: bassPc, checkBass: true,
      label: toneName(R) + (quality === 'min' ? 'm' : ''),
      invId: invNameOf(bassPc, R, t3), quality: quality
    };
  }
  function makeProgression(keyPc) {
    const prog = BASS_PROGS[Math.floor(Math.random() * BASS_PROGS.length)];
    const chords = prog.degs.map(function (d) {
      const q = MAJ_QUAL[d]; const t3 = q === 'min' ? 3 : 4;
      return { R: (((keyPc + MAJ_OFFS[d]) % 12) + 12) % 12, t3: t3, quality: q === 'dim' ? 'maj' : q };
    });
    const steps = [];
    let prev = null;
    chords.forEach(function (c) {
      let chosen;
      if (prev === null) {
        let pos = bassInvPositions(c.R, c.t3, 0);
        while (pos[0] < 4) pos = pos.map(function (p) { return p + 12; });
        while (pos[0] > 15) pos = pos.map(function (p) { return p - 12; });
        chosen = pos;
      } else {
        let best = null;
        for (let inv = 0; inv < 3; inv++) {
          for (let k = -2; k <= 2; k++) {
            const pos = bassInvPositions(c.R, c.t3, inv).map(function (p) { return p + k * 12; });
            if (Math.min.apply(null, pos) < 0 || Math.max.apply(null, pos) > 35) continue;
            const cost = vlCost(prev, pos);
            if (!best || cost < best.cost) best = { pos: pos, cost: cost };
          }
        }
        chosen = best.pos;
      }
      prev = chosen.slice().sort(function (a, b) { return a - b; });
      steps.push(stepVoicing(chosen, c.R, c.t3, c.quality));
    });
    return { name: prog.name + ' · ' + toneName(keyPc), steps: steps, idx: 0 };
  }

  /* ----------------------------------------------------------------
     2) I18N
     ---------------------------------------------------------------- */
  const I18N = {
    de: {
      kicker: 'Music Academy · Linke Hand',
      title: 'Bass in der linken Hand',
      homeSub: 'Welche Töne die linke Hand spielt — Optionen, Lagen und die Umkehrungen des vollen Voicings. Sehen, üben, abfragen.',
      notation: 'Internationale Schreibweise (B statt deutschem H). Linke Hand = grün.',
      tiles: {
        overview: { t: 'Übersicht', s: 'Alle Bass-Optionen & Umkehrungen je Tonart.' },
        practice: { t: 'Üben', s: 'Ohne Druck üben, läuft endlos — Timer optional.' },
        quiz:     { t: 'Quiz', s: '20 Aufgaben mit Timer — am Ende deine Auswertung.' }
      },
      backChoose: 'Auswahl', back: 'Übersicht',
      overviewTitle: 'Alle Bass-Lagen',
      overviewSub: 'Vom Grundton bis zum vollen Voicing — und dieselben drei Töne mit verschiedenem Bass (Umkehrungen).',
      colOptions: 'Fülle-Optionen', colInversions: 'Umkehrungen (volles Voicing)',
      keyLabel: 'Tonart',
      optNames: { root: 'Grundton', octave: 'Oktave', shell: 'Shell (Quinte)', full: 'Voll' },
      optDesc: {
        root: 'Nur der Grundton — schlank, klar, gerade sehr tief.',
        octave: 'Grundton + Oktave — kräftiger, mehr Fundament.',
        shell: 'Grundton + Quinte (ohne Terz) — offen, tief nicht düster.',
        full: 'Grundton + Quinte + Terz (eine Oktave höher) — warm und voll.'
      },
      invNames: { inv0: 'Grundstellung', inv1: '1. Umkehrung', inv2: '2. Umkehrung' },
      invDesc: {
        inv0: 'Bass = Grundton (C–G–E). Standard-Lage, breit und satt.',
        inv1: 'Bass = Terz (E–C–G). Höher startend, weicher.',
        inv2: 'Bass = Quinte (G–E–C). Am höchsten, hell, schwebend.'
      },
      qualityLabel: { major: 'Dur', minor: 'Moll' },
      qualityNote: { major: 'Dur — große Terz.', minor: 'Moll — kleine Terz (nur das volle Voicing ändert sich; Grundton, Oktave und Shell bleiben gleich).' },
      // Konfig
      configKicker: 'Modus', configTitle: 'Konfiguration',
      blockSet: 'Was üben?', blockKey: 'Tonart', blockQuality: 'Klang', blockTimer: 'Timer',
      qualityOpts: { major: 'Dur', minor: 'Moll', both: 'Gemischt' },
      setOpts: {
        options: { t: 'Fülle-Optionen', d: 'Grundton · Oktave · Shell · Voll — welche Lage passt zur Höhe.' },
        inversions: { t: 'Umkehrungen', d: 'Dasselbe Voicing mit verschiedenem Bass (C–G–E / E–C–G / G–E–C).' },
        mixed: { t: 'Gemischt', d: 'Optionen und Umkehrungen gemischt.' },
        progression: { t: 'Stimmführung', d: 'Akkordfolgen mit kleinster Bewegung — die passende Umkehrung kommt von selbst (z. B. E–C–G → F–C–A).' }
      },
      progStep: 'Akkord',
      randomKey: 'Zufall',
      timerSwitch: 'Timer 15 s pro Aufgabe',
      timerLockedTitle: 'Timer 15 s pro Aufgabe — beim Quiz immer an.',
      timerLockedSub: 'Im Quiz läuft der Timer fest mit und lässt sich nicht abschalten.',
      start: 'Training starten',
      // Drill
      drillKicker: 'Aufgabe', play: 'Spiele', step: 'Schritt', hits: 'Treffer',
      tapHint: 'Tippe die Tasten oder spiel sie am MIDI-Keyboard — wird automatisch grün, wenn richtig.',
      correct: 'Richtig gespielt!', bassHint: function (n) { return 'Richtige Töne — aber der tiefste Ton muss ' + n + ' sein.'; },
      tip: 'Töne vorspielen', next: 'Weiter →', skip: 'Weiter →',
      midiOn: 'MIDI verbunden: ', midiOff: 'Kein MIDI-Gerät — tippen geht auch.',
      midiNo: 'Dieser Browser kann kein Web-MIDI (am besten Chrome/Edge). Tippen geht trotzdem.',
      resultTitle: 'Auswertung', resultAgain: 'Nochmal', resultBack: 'Zur Startseite',
      resultMeta: function (h, t) { return h + ' von ' + t + ' Aufgaben richtig'; },
      savedLocal: 'Ergebnis lokal gespeichert.', seconds: 'Sek.'
    },
    en: {
      kicker: 'Music Academy · Left hand',
      title: 'Bass in the left hand',
      homeSub: 'Which notes the left hand plays — options, registers and the inversions of the full voicing. See, practise, test.',
      notation: 'International notation (B, not the German H). Left hand = green.',
      tiles: {
        overview: { t: 'Overview', s: 'All bass options & inversions per key.' },
        practice: { t: 'Practise', s: 'Practise with no pressure, runs endlessly — timer optional.' },
        quiz:     { t: 'Quiz', s: '20 tasks with a timer — your result at the end.' }
      },
      backChoose: 'Menu', back: 'Overview',
      overviewTitle: 'All bass voicings',
      overviewSub: 'From the root to the full voicing — and the same three notes with a different bass (inversions).',
      colOptions: 'Fullness options', colInversions: 'Inversions (full voicing)',
      keyLabel: 'Key',
      optNames: { root: 'Root', octave: 'Octave', shell: 'Shell (fifth)', full: 'Full' },
      optDesc: {
        root: 'Just the root — lean, clear, good very low.',
        octave: 'Root + octave — stronger, more foundation.',
        shell: 'Root + fifth (no third) — open, not dark down low.',
        full: 'Root + fifth + third (an octave higher) — warm and full.'
      },
      invNames: { inv0: 'Root position', inv1: '1st inversion', inv2: '2nd inversion' },
      invDesc: {
        inv0: 'Bass = root (C–G–E). Standard, broad and full.',
        inv1: 'Bass = third (E–C–G). Starts higher, softer.',
        inv2: 'Bass = fifth (G–E–C). Highest, bright, floating.'
      },
      qualityLabel: { major: 'Major', minor: 'Minor' },
      qualityNote: { major: 'Major — major third.', minor: 'Minor — minor third (only the full voicing changes; root, octave and shell stay the same).' },
      configKicker: 'Mode', configTitle: 'Configuration',
      blockSet: 'Practise what?', blockKey: 'Key', blockQuality: 'Quality', blockTimer: 'Timer',
      qualityOpts: { major: 'Major', minor: 'Minor', both: 'Mixed' },
      setOpts: {
        options: { t: 'Fullness options', d: 'Root · octave · shell · full — which fits the register.' },
        inversions: { t: 'Inversions', d: 'Same voicing, different bass (C–G–E / E–C–G / G–E–C).' },
        mixed: { t: 'Mixed', d: 'Options and inversions mixed.' },
        progression: { t: 'Voice leading', d: 'Chord progressions with the least movement — the right inversion follows by itself (e.g. E–C–G → F–C–A).' }
      },
      progStep: 'Chord',
      randomKey: 'Random',
      timerSwitch: 'Timer 15 s per task',
      timerLockedTitle: 'Timer 15 s per task — always on in the quiz.',
      timerLockedSub: 'In the quiz the timer always runs and cannot be switched off.',
      start: 'Start training',
      drillKicker: 'Task', play: 'Play', step: 'Step', hits: 'Hits',
      tapHint: 'Tap the keys or play them on a MIDI keyboard — turns green automatically when correct.',
      correct: 'Played correctly!', bassHint: function (n) { return 'Right notes — but the lowest note must be ' + n + '.'; },
      tip: 'Play the notes', next: 'Next →', skip: 'Next →',
      midiOn: 'MIDI connected: ', midiOff: 'No MIDI device — tapping works too.',
      midiNo: 'This browser has no Web MIDI (use Chrome/Edge). Tapping still works.',
      resultTitle: 'Result', resultAgain: 'Again', resultBack: 'Back to start',
      resultMeta: function (h, t) { return h + ' of ' + t + ' tasks correct'; },
      savedLocal: 'Result saved locally.', seconds: 'sec'
    }
  };

  /* ----------------------------------------------------------------
     3) ZUSTAND
     ---------------------------------------------------------------- */
  const DRILL_SECONDS = 15;
  const state = {
    lang: 'de', view: 'home',
    overviewKey: 'C', overviewQuality: 'major',   // major | minor
    mode: 'practice',                 // practice | quiz
    cfg: { set: 'options', key: 'random', quality: 'major', timerOn: true },
    drill: null
  };
  function t() { return I18N[state.lang]; }
  const $ = function (id) { return document.getElementById(id); };
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function findKey(id) { return KEYS.find(function (k) { return k.id === id; }) || KEYS[0]; }

  /* ----------------------------------------------------------------
     4) KLAVIER-SOUND + MIDI  (aus piano.js portiert)
     ---------------------------------------------------------------- */
  let audioCtx = null, masterGain = null; const voices = {};
  function ensureAudio() {
    try {
      if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; audioCtx = new AC(); masterGain = audioCtx.createGain(); masterGain.gain.value = 0.22; masterGain.connect(audioCtx.destination); }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return true;
    } catch (e) { return false; }
  }
  function midiToFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function playNote(n, dur) {
    if (!ensureAudio()) return;
    if (voices[n]) releaseVoice(n, 0.02);
    const T = audioCtx.currentTime, f = midiToFreq(n), life = dur || 1.8;
    const osc = audioCtx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(f, T);
    const part = audioCtx.createOscillator(); part.type = 'sine'; part.frequency.setValueAtTime(f * 2, T);
    const pg = audioCtx.createGain(); pg.gain.value = 0.14;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, T);
    g.gain.exponentialRampToValueAtTime(0.7, T + 0.006);
    g.gain.exponentialRampToValueAtTime(0.12, T + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, T + life);
    osc.connect(g); part.connect(pg); pg.connect(g); g.connect(masterGain);
    osc.start(T); part.start(T);
    const stopAt = T + life + 0.05; osc.stop(stopAt); part.stop(stopAt);
    const v = { osc: osc, part: part, g: g };
    osc.onended = function () { if (voices[n] === v) delete voices[n]; };
    voices[n] = v;
  }
  function releaseVoice(n, rel) {
    const v = voices[n]; if (!v || !audioCtx) return;
    const T = audioCtx.currentTime;
    try { v.g.gain.cancelScheduledValues(T); v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), T); v.g.gain.exponentialRampToValueAtTime(0.0001, T + (rel || 0.13)); v.osc.stop(T + (rel || 0.13) + 0.03); v.part.stop(T + (rel || 0.13) + 0.03); } catch (e) {}
    delete voices[n];
  }
  function stopNote(n) { releaseVoice(n, 0.14); }

  const midi = { requested: false, deviceName: '', supported: typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess, active: new Set() };
  function initMidi() {
    if (midi.requested) return; midi.requested = true;
    if (!navigator.requestMIDIAccess) { midi.supported = false; updateMidiStatus(); return; }
    navigator.requestMIDIAccess().then(function (access) {
      function bind() { const names = []; access.inputs.forEach(function (inp) { inp.onmidimessage = handleMidi; if (inp.name) names.push(inp.name); }); midi.deviceName = names.join(', '); updateMidiStatus(); }
      bind(); access.onstatechange = bind;
    }).catch(function () { midi.supported = false; updateMidiStatus(); });
  }
  function handleMidi(msg) {
    const cmd = msg.data[0] & 0xf0, note = msg.data[1], vel = msg.data[2];
    if (cmd === 0x90 && vel > 0) { midi.active.add(note); playNote(note); onInputChange(); }
    else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) { midi.active.delete(note); stopNote(note); onInputChange(); }
  }
  function updateMidiStatus() {
    const e = $('bassMidi'); if (!e) return; const L = t();
    if (!midi.supported) { e.textContent = L.midiNo; e.className = 'midi-status mono is-no'; }
    else if (midi.deviceName) { e.textContent = '🎹 ' + L.midiOn + midi.deviceName; e.className = 'midi-status mono is-on'; }
    else { e.textContent = L.midiOff; e.className = 'midi-status mono'; }
  }
  function heldNotes() { return Array.from(midi.active).sort(function (a, b) { return a - b; }); }

  /* ----------------------------------------------------------------
     5) KLAVIATUR-BAUSTEIN  (Bass-grün; played/target/correct)
     ---------------------------------------------------------------- */
  function buildKeyboard(targetPositions, opts) {
    opts = opts || {};
    const whiteW = opts.whiteW || 14, whiteH = opts.whiteH || Math.round((opts.whiteW || 14) * 4.2);
    const blackW = Math.max(6, Math.round(whiteW * 0.62)), blackH = Math.round(whiteH * 0.62);
    const targetSet = new Set(targetPositions), played = opts.played || new Set(), fb = opts.feedback || null;
    const nameMap = opts.nameMap || {};
    const wrap = el('div', 'pkbd bass-kbd' + (opts.interactive ? ' is-interactive' : ''));
    function makeKey(p, type, wd, ht) {
      const k = document.createElement(opts.interactive ? 'button' : 'div');
      k.className = 'pkey ' + (type === 'w' ? 'wkey' : 'bkey'); k.style.width = wd + 'px'; k.style.height = ht + 'px'; k.dataset.pos = p;
      if (fb) { if (fb.correct.has(p)) k.classList.add('is-correct'); else if (targetSet.has(p)) k.classList.add('is-target'); }
      else { if (targetSet.has(p)) k.classList.add('is-target'); if (played.has(p)) k.classList.add('is-played'); }
      if (opts.bassPos === p) k.classList.add('is-bass');
      if (opts.labels && nameMap[p]) { const s = el('span', 'pkey-lbl'); s.textContent = nameMap[p]; k.appendChild(s); }
      if (opts.interactive) { k.type = 'button'; k.addEventListener('click', function () { (opts.onTap || function () {})(p); }); }
      return k;
    }
    const N = opts.keys || 24;   // 3 Oktaven (36) im Bass, damit gespreizte Voicings passen
    let w = 0; const blacks = [];
    for (let p = 0; p < N; p++) { const isB = BLACK_PC.indexOf(p % 12) !== -1; if (!isB) { wrap.appendChild(makeKey(p, 'w', whiteW, whiteH)); w++; } else blacks.push({ p: p, left: w * whiteW - blackW / 2 }); }
    wrap.style.width = (w * whiteW) + 'px'; wrap.style.height = whiteH + 'px';
    blacks.forEach(function (b) { const k = makeKey(b.p, 'b', blackW, blackH); k.style.left = b.left + 'px'; wrap.appendChild(k); });
    return wrap;
  }
  function nameMapOf(voicing) { const m = {}; voicing.positions.forEach(function (p, i) { m[p] = voicing.names[i]; }); return m; }

  /* ----------------------------------------------------------------
     6) ROUTING / RENDER
     ---------------------------------------------------------------- */
  function go(view) { state.view = view; render(); window.scrollTo(0, 0); }
  function render() {
    if ((state.view === 'drill' || state.view === 'result') && !state.drill) state.view = 'home';
    document.documentElement.lang = state.lang;
    const root = $('bassView'); if (!root) return;
    const note = $('bassNote'); if (note) note.textContent = t().notation;
    root.innerHTML = '';
    if (state.view === 'home') root.appendChild(renderHome());
    else if (state.view === 'overview') root.appendChild(renderOverview());
    else if (state.view === 'config') root.appendChild(renderConfig());
    else if (state.view === 'drill') root.appendChild(renderDrill());
    else if (state.view === 'result') root.appendChild(renderResult());
  }

  const ICON = {
    grid: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="11" y="14" width="42" height="36" stroke="#16150f" stroke-width="2"/><line x1="11" y1="32" x2="53" y2="32" stroke="#16150f" stroke-width="2"/><line x1="32" y1="14" x2="32" y2="50" stroke="#16150f" stroke-width="2"/></svg>',
    loop: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 32 C 28 24, 17 24, 17 32 C 17 40, 28 40, 32 32 C 36 24, 47 24, 47 32 C 47 40, 36 40, 32 32 Z" stroke="#16150f" stroke-width="2"/></svg>',
    timer: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="38" r="17" stroke="#16150f" stroke-width="2"/><line x1="32" y1="38" x2="32" y2="27" stroke="#16150f" stroke-width="2"/><line x1="32" y1="38" x2="40" y2="42" stroke="#16150f" stroke-width="2"/><line x1="26" y1="13" x2="38" y2="13" stroke="#16150f" stroke-width="2"/><line x1="32" y1="13" x2="32" y2="20" stroke="#16150f" stroke-width="2"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" stroke="#2e8b57" stroke-width="1.8"/><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" stroke="#2e8b57" stroke-width="1.8"/></svg>'
  };

  function renderHome() {
    const L = t(); const v = el('section', 'screen');
    v.innerHTML = '<div class="kicker">' + esc(L.kicker) + '</div><h1 class="title">' + esc(L.title) + '</h1><p class="sub">' + esc(L.homeSub) + '</p>';
    const tiles = el('div', 'tiles tiles-3');
    [['overview', ICON.grid, function () { go('overview'); }],
     ['practice', ICON.loop, function () { state.mode = 'practice'; state.cfg.timerOn = true; go('config'); }],
     ['quiz', ICON.timer, function () { state.mode = 'quiz'; go('config'); }]].forEach(function (d) {
      const meta = L.tiles[d[0]]; const b = el('button', 'tile'); b.type = 'button';
      b.innerHTML = '<span class="tile-icon">' + d[1] + '</span><span class="tile-title">' + esc(meta.t) + '</span><span class="tile-sub">' + esc(meta.s) + '</span><span class="tile-go"><span class="arrow">→</span></span>';
      b.addEventListener('click', function () { ensureAudio(); d[2](); }); tiles.appendChild(b);
    });
    v.appendChild(tiles); return v;
  }

  function backBtn(label, target) {
    const b = el('button', 'backlink mono'); b.type = 'button';
    b.innerHTML = '<span class="arrow">←</span> ' + esc(label);
    b.addEventListener('click', function () { go(target); }); return b;
  }

  function renderOverview() {
    const L = t(); const v = el('section', 'screen is-bass');
    v.appendChild(backBtn(L.title, 'home'));
    const head = el('div', 'ov-head');
    head.innerHTML = '<div><div class="kicker">' + esc(L.kicker) + ' · ' + esc(L.overviewTitle) + '</div><h1 class="title">' + esc(L.overviewTitle) + '</h1><p class="sub">' + esc(L.overviewSub) + '</p></div>';
    // Dur/Moll-Umschalter
    head.appendChild(qualityToggle(state.overviewQuality, function (q) { state.overviewQuality = q; render(); }));
    // Tonart-Chips
    const chips = el('div', 'chips ov-keys');
    KEYS.forEach(function (k) { const b = el('button', 'chip mono' + (k.id === state.overviewKey ? ' is-active' : '')); b.type = 'button'; b.textContent = k.id; b.addEventListener('click', function () { state.overviewKey = k.id; render(); }); chips.appendChild(b); });
    head.appendChild(chips); v.appendChild(head);
    const qnote = el('p', 'voic-qnote mono'); qnote.textContent = L.qualityNote[state.overviewQuality]; v.appendChild(qnote);

    const key = findKey(state.overviewKey), q = state.overviewQuality;
    // Optionen
    v.appendChild(sectionLabel(L.colOptions));
    const optRows = el('div', 'voic-list');
    OPTIONS.forEach(function (def) { optRows.appendChild(voicRow(key, computeVoicing(key, def, q), L.optNames[def.id], L.optDesc[def.id])); });
    v.appendChild(optRows);
    // Umkehrungen
    v.appendChild(sectionLabel(L.colInversions));
    const invRows = el('div', 'voic-list');
    INVERSIONS.forEach(function (def) { invRows.appendChild(voicRow(key, computeVoicing(key, def, q), L.invNames[def.id], L.invDesc[def.id], true)); });
    v.appendChild(invRows);
    return v;
  }
  function qualityToggle(current, onPick) {
    const L = t(); const seg = el('div', 'seg quality-seg');
    [['major', L.qualityLabel.major], ['minor', L.qualityLabel.minor]].forEach(function (d) {
      const b = el('button', 'seg-btn mono' + (current === d[0] ? ' is-active' : '') + (d[0] === 'minor' ? ' is-minor' : '')); b.type = 'button'; b.textContent = d[1];
      b.addEventListener('click', function () { onPick(d[0]); }); seg.appendChild(b);
    });
    return seg;
  }
  function sectionLabel(text) { const d = el('div', 'block-label voic-label'); d.innerHTML = '<span>' + esc(text) + '</span>'; return d; }
  function voicRow(key, vc, name, desc, showBass) {
    const row = el('div', 'voic-row');
    const bassPos = showBass ? vc.positions[0] : undefined;
    row.innerHTML = '<div class="voic-info"><div class="voic-name">' + esc(name) + '</div><div class="voic-notes mono">' + vc.names.join(' – ') + '</div><div class="voic-desc">' + esc(desc) + '</div></div>';
    const kbWrap = el('div', 'voic-kbd');
    kbWrap.appendChild(buildKeyboard(vc.positions, { whiteW: 15, keys: 36, bassPos: bassPos }));
    row.appendChild(kbWrap); return row;
  }

  function renderConfig() {
    const L = t(); const v = el('section', 'screen is-bass');
    v.appendChild(backBtn(L.title, 'home'));
    v.appendChild(htmlEl('<div class="kicker">' + esc(L.configKicker) + ' · ' + esc(L.tiles[state.mode === 'quiz' ? 'quiz' : 'practice'].t) + '</div><h1 class="title">' + esc(L.configTitle) + '</h1>'));
    // Was üben?
    v.appendChild(blockLabel(L.blockSet));
    const opts = el('div', 'opts');
    ['options', 'inversions', 'mixed', 'progression'].forEach(function (s, i) { opts.appendChild(optionCard(s, L.setOpts[s].t, L.setOpts[s].d, i + 1, state.cfg.set === s, function () { state.cfg.set = s; render(); })); });
    v.appendChild(wrapBlock(opts));
    // Tonart
    const hint = el('span', 'hint mono'); hint.textContent = state.cfg.key === 'random' ? L.randomKey : state.cfg.key;
    v.appendChild(blockLabel(L.blockKey, hint));
    const chips = el('div', 'chips');
    [{ id: 'random', label: L.randomKey }].concat(KEYS.map(function (k) { return { id: k.id, label: k.id }; })).forEach(function (it) {
      const b = el('button', 'chip mono' + (it.id === 'random' ? ' chip-random' : '') + (it.id === state.cfg.key ? ' is-active' : '')); b.type = 'button'; b.textContent = it.label;
      b.addEventListener('click', function () { state.cfg.key = it.id; render(); }); chips.appendChild(b);
    });
    v.appendChild(wrapBlock(chips));
    // Klang (Dur / Moll / Gemischt) — bei Stimmführung irrelevant (diatonische Folge).
    if (state.cfg.set !== 'progression') {
      v.appendChild(blockLabel(L.blockQuality));
      const qseg = el('div', 'seg quality-seg');
      ['major', 'minor', 'both'].forEach(function (q) {
        const b = el('button', 'seg-btn mono' + (state.cfg.quality === q ? ' is-active' : '') + (q === 'minor' ? ' is-minor' : '')); b.type = 'button'; b.textContent = L.qualityOpts[q];
        b.addEventListener('click', function () { state.cfg.quality = q; render(); }); qseg.appendChild(b);
      });
      v.appendChild(wrapBlock(qseg));
    }
    // Timer
    v.appendChild(blockLabel(L.blockTimer));
    const timer = el('div', 'timer');
    if (state.mode === 'quiz') { timer.innerHTML = '<div class="locked">' + ICON.lock + '<span class="locked-text"><b>' + esc(L.timerLockedTitle) + '</b><span class="sm">' + esc(L.timerLockedSub) + '</span></span></div>'; }
    else {
      const lbl = el('label', 'switch'); lbl.innerHTML = '<input type="checkbox" id="bassTimerChk"' + (state.cfg.timerOn ? ' checked' : '') + ' /><span class="switch-track"><span class="switch-knob"></span></span><span class="switch-text mono">' + esc(L.timerSwitch) + '</span>';
      timer.appendChild(lbl); setTimeout(function () { const c = $('bassTimerChk'); if (c) c.addEventListener('change', function () { state.cfg.timerOn = this.checked; }); }, 0);
    }
    v.appendChild(wrapBlock(timer));
    const start = el('button', 'start'); start.type = 'button'; start.innerHTML = '<span>' + esc(L.start) + '</span><span class="arrow">→</span>'; start.addEventListener('click', startDrill);
    v.appendChild(start);
    v.appendChild(midiStatusEl());
    return v;
  }
  function htmlEl(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
  function blockLabel(text, extra) { const d = el('div', 'block-label'); d.innerHTML = '<span>' + esc(text) + '</span>'; if (extra) d.appendChild(extra); return d; }
  function wrapBlock(child) { const d = el('div', 'block'); d.appendChild(child); return d; }
  function optionCard(id, title, desc, no, active, onClick) {
    const b = el('button', 'opt' + (active ? ' is-active' : '')); b.type = 'button';
    b.innerHTML = '<span class="radio"></span><span class="opt-body"><span class="opt-title">' + esc(title) + '</span><span class="opt-desc">' + esc(desc) + '</span></span><span class="opt-no mono">0' + no + '</span>';
    b.addEventListener('click', onClick); return b;
  }
  function midiStatusEl() { const d = el('div', 'midi-status mono'); d.id = 'bassMidi'; setTimeout(function () { initMidi(); updateMidiStatus(); }, 0); return d; }

  /* ----------------------------------------------------------------
     7) AUFGABEN-POOL + DRILL
     ---------------------------------------------------------------- */
  function buildProgressionTask() {
    const d = state.drill, cfg = state.cfg, L = t();
    if (!d.prog || d.prog.idx >= d.prog.steps.length) {
      const keyPc = cfg.key === 'random' ? Math.floor(Math.random() * 12) : findKey(cfg.key).pc;
      d.prog = makeProgression(keyPc);
    }
    const step = d.prog.steps[d.prog.idx]; const pos = d.prog.idx + 1, total = d.prog.steps.length;
    d.prog.idx += 1;
    const vc = { positions: step.positions, names: step.names, pcs: step.pcs, bassPc: step.bassPc, checkBass: true };
    return {
      key: { id: step.label }, def: { id: step.invId }, set: 'progression', quality: step.quality,
      label: L.invNames[step.invId], voicing: vc, bassName: step.names[0],
      prog: { name: d.prog.name, pos: pos, total: total }
    };
  }
  function buildTask() {
    const cfg = state.cfg;
    if (cfg.set === 'progression') return buildProgressionTask();
    const key = cfg.key === 'random' ? KEYS[Math.floor(Math.random() * KEYS.length)] : findKey(cfg.key);
    let set = cfg.set; if (set === 'mixed') set = Math.random() < 0.5 ? 'options' : 'inversions';
    let quality = cfg.quality || 'major'; if (quality === 'both') quality = Math.random() < 0.5 ? 'major' : 'minor';
    let def, label, checkBass = false;
    const L = t();
    if (set === 'options') { def = OPTIONS[Math.floor(Math.random() * OPTIONS.length)]; label = L.optNames[def.id]; }
    else { def = INVERSIONS[Math.floor(Math.random() * INVERSIONS.length)]; label = L.invNames[def.id]; checkBass = true; }
    const vc = computeVoicing(key, def, quality);
    vc.checkBass = checkBass;   // bassPc ist bereits der tiefste Ton (aus computeVoicing)
    return { key: key, def: def, set: set, quality: quality, label: label, voicing: vc, bassName: checkBass ? vc.names[0] : null };
  }
  function startDrill() {
    ensureAudio(); initMidi();
    state.drill = { step: 1, hits: 0, total: state.mode === 'quiz' ? 20 : null, timerOn: state.mode === 'quiz' ? true : state.cfg.timerOn, task: null, tap: new Set(), solved: false, msg: null, deadline: null, timerId: null, prog: null };
    nextTask(true);
    state.view = 'drill'; render(); window.scrollTo(0, 0);
  }
  function clearTimer() { if (state.drill && state.drill.timerId) { clearInterval(state.drill.timerId); state.drill.timerId = null; } }
  function startTimer() {
    clearTimer(); const d = state.drill; if (!d.timerOn) { d.deadline = null; return; }
    d.deadline = Date.now() + DRILL_SECONDS * 1000;
    d.timerId = setInterval(function () {
      if (state.view !== 'drill' || !state.drill || state.drill.solved) { clearTimer(); return; }
      if (Date.now() >= state.drill.deadline) { clearTimer(); onTimeout(); }
    }, 200);
  }
  function onTimeout() { if (state.mode === 'quiz') nextTask(true); else { state.drill.tap = new Set(); midi.active.clear(); state.drill.solved = false; state.drill.msg = null; startTimer(); render(); } }
  function nextTask(first) {
    const d = state.drill; if (!first) d.step += 1;
    if (d.total && d.step > d.total) { clearTimer(); saveResult(); go('result'); return; }
    d.task = buildTask(); d.tap = new Set(); midi.active.clear(); d.solved = false; d.msg = null;
    startTimer(); if (!first) render();
  }
  function currentInput() { return midi.active.size ? heldNotes() : Array.from(state.drill.tap).sort(function (a, b) { return a - b; }); }
  function onInputChange() {
    const d = state.drill; if (!d || state.view !== 'drill' || d.solved) return;
    const verdict = matchVoicing(currentInput(), d.task.voicing);
    if (verdict === 'correct') { d.solved = true; d.hits += 1; d.msg = null; clearTimer(); render(); setTimeout(function () { nextTask(false); }, 850); return; }
    d.msg = (verdict === 'bass') ? t().bassHint(d.task.bassName) : null;
    updateDrillBoard();
  }
  function onTap(p) { const d = state.drill; if (!d || d.solved) return; ensureAudio(); playNote(60 + p); if (d.tap.has(p)) d.tap.delete(p); else d.tap.add(p); onInputChange(); }

  function renderDrill() {
    const L = t(); const d = state.drill; const task = d.task; const vc = task.voicing;
    const v = el('section', 'screen is-bass');
    v.appendChild(backBtn(L.configTitle, 'config'));
    // Aufgabe
    const card = el('div', 'drill-prompt');
    let topLeft = esc(task.key.id);
    if (task.set === 'inversions') topLeft += ' · ' + esc(L.tiles.overview.t);
    else if (task.set === 'progression') topLeft = esc(task.prog.name) + ' · ' + esc(L.progStep) + ' ' + task.prog.pos + '/' + task.prog.total;
    card.innerHTML = '<div class="dp-top mono"><span>' + topLeft + '</span><span class="dp-step">' + esc(L.step) + ' ' + d.step + (d.total ? '/' + d.total : '') + ' · ' + esc(L.hits) + ' ' + d.hits + '</span></div>' +
      '<div class="dp-main"><span class="dp-lbl mono">' + esc(L.play) + '</span> <span class="dp-chord">' + esc(task.key.id) + '</span> <span class="dp-inv">' + esc(task.label) + '</span></div>' +
      '<div class="dp-notes mono">' + vc.names.join(' – ') + '</div>';
    v.appendChild(card);
    if (d.timerOn) { if (!d.deadline) d.deadline = Date.now() + DRILL_SECONDS * 1000; const remain = Math.max(0, d.deadline - Date.now()); const tb = el('div', 'drill-timer'); tb.innerHTML = '<div class="dt-track"><div id="bassBar" class="dt-bar"></div></div>'; v.appendChild(tb); setTimeout(function () { const f = $('bassBar'); if (f) { f.style.transition = 'none'; f.style.width = (remain / (DRILL_SECONDS * 1000) * 100) + '%'; void f.offsetWidth; f.style.transition = 'width ' + (remain / 1000) + 's linear'; f.style.width = '0%'; } }, 20); }
    // Board
    const board = el('div', 'drill-board'); board.id = 'bassBoard'; v.appendChild(board);
    const msg = el('div', 'drill-msg'); msg.id = 'bassMsg'; v.appendChild(msg);
    v.appendChild(midiStatusEl());
    // Aktionen
    const actions = el('div', 'drill-actions');
    const tip = el('button', 'btn btn-ghost'); tip.type = 'button'; tip.textContent = L.tip; tip.addEventListener('click', function () { ensureAudio(); vc.positions.forEach(function (p, i) { setTimeout(function () { playNote(60 + p); }, i * 140); }); });
    const next = el('button', 'btn btn-primary drill-next'); next.type = 'button'; next.innerHTML = esc(L.next); next.addEventListener('click', function () { nextTask(false); });
    actions.appendChild(tip); actions.appendChild(next); v.appendChild(actions);
    setTimeout(updateDrillBoard, 0);
    return v;
  }
  function updateDrillBoard() {
    const d = state.drill, host = $('bassBoard'); if (!host) return; const vc = d.task.voicing;
    const playedSet = new Set(); currentInput().forEach(function (n) { const pc = ((n % 12) + 12) % 12; const hit = vc.positions.find(function (p) { return ((p % 12) + 12) % 12 === pc; }); playedSet.add(hit !== undefined ? hit : pc); });
    const feedback = d.solved ? { correct: new Set(vc.positions) } : null;
    host.innerHTML = '';
    host.appendChild(buildKeyboard(vc.positions, { whiteW: 34, keys: 36, interactive: true, labels: true, nameMap: nameMapOf(vc), played: playedSet, feedback: feedback, bassPos: (vc.checkBass ? vc.positions[0] : undefined), onTap: onTap }));
    const msg = $('bassMsg'); if (msg) { const L = t(); if (d.solved) { msg.className = 'drill-msg is-ok'; msg.textContent = '✓ ' + L.correct; } else if (d.msg) { msg.className = 'drill-msg is-bad'; msg.textContent = d.msg; } else { msg.className = 'drill-msg'; msg.textContent = L.tapHint; } }
    updateMidiStatus();
  }

  function saveResult() {
    try { const d = state.drill; let name = ''; try { const u = JSON.parse(sessionStorage.getItem('tt_user') || 'null'); if (u && u.vorname) name = (u.vorname + ' ' + (u.nachname || '')).trim(); } catch (e) {}
      const rec = { ts: Date.now(), name: name, kind: 'bass', set: state.cfg.set, total: d.total, hits: d.hits };
      const k = 'tt_bass_results', arr = JSON.parse(localStorage.getItem(k) || '[]'); arr.push(rec); while (arr.length > 100) arr.shift(); localStorage.setItem(k, JSON.stringify(arr));
    } catch (e) {}
  }
  function renderResult() {
    const L = t(), d = state.drill; const total = (d && d.total) || 0, hits = (d && d.hits) || 0, pct = total ? Math.round(hits / total * 100) : 0;
    const v = el('section', 'screen is-bass'); v.appendChild(backBtn(L.title, 'home'));
    const panel = el('div', 'drill-result');
    panel.innerHTML = '<div class="kicker" style="margin-top:4px">' + esc(L.resultTitle) + '</div>' +
      '<div class="res-score"><span class="res-big">' + hits + '<span class="res-tot">/' + total + '</span></span><span class="res-pct mono">' + pct + '%</span></div>' +
      '<div class="res-meta mono">' + esc(L.resultMeta(hits, total)) + '</div><div class="res-saved mono">' + esc(L.savedLocal) + '</div>' +
      '<div class="modal-actions res-actions"><button class="btn btn-primary" id="bassAgain" type="button">' + esc(L.resultAgain) + '</button><button class="btn btn-ghost" id="bassHome" type="button">' + esc(L.resultBack) + '</button></div>';
    v.appendChild(panel);
    setTimeout(function () { const a = $('bassAgain'); if (a) a.addEventListener('click', function () { ensureAudio(); startDrill(); }); const h = $('bassHome'); if (h) h.addEventListener('click', function () { go('home'); }); }, 0);
    return v;
  }

  /* ----------------------------------------------------------------
     8) MOUNT / SPRACHE
     ---------------------------------------------------------------- */
  function setLang(lang) { state.lang = lang; try { localStorage.setItem('tt_lang', lang); } catch (e) {} render(); }
  function mount(root) {
    try { const s = localStorage.getItem('tt_lang'); if (s === 'de' || s === 'en') state.lang = s; } catch (e) {}
    if ((state.view === 'drill' || state.view === 'result') && !state.drill) state.view = 'home';
    clearTimer();
    root.classList.add('invtrainer', 'basstrainer');
    root.innerHTML = '<div id="bassView"></div><p id="bassNote" class="notation"></p>';
    render();
  }
  window.BassTrainer = { mount: mount, setLang: setLang, KEYS: KEYS, computeVoicing: computeVoicing, matchVoicing: matchVoicing, state: state, go: go };
})();
