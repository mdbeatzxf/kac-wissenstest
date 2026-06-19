/* ==================================================================
   Inversionen am Klavier — KAC Music Academy
   Vanilla JS. Engine (Musiktheorie) getrennt vom Rendering.
   Modus 1 "Raster": Übersicht 7×3 (Antippen/MIDI → rastet grün ein).
   Modus 2 "Training": Stimmführungs-Drill — Üben (endlos) ODER Quiz
   (feste Fragenzahl + Auswertung). Web-MIDI + Klavier-Sound optional.
   ================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     1) MUSIK-ENGINE  (sprachunabhängig)
     ---------------------------------------------------------------- */
  const KEYS = [
    { id: 'C',  pc: 0,  scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
    { id: 'Db', pc: 1,  scale: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'] },
    { id: 'D',  pc: 2,  scale: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
    { id: 'Eb', pc: 3,  scale: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'] },
    { id: 'E',  pc: 4,  scale: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
    { id: 'F',  pc: 5,  scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'] },
    { id: 'F#', pc: 6,  scale: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'] },
    { id: 'G',  pc: 7,  scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
    { id: 'Ab', pc: 8,  scale: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'] },
    { id: 'A',  pc: 9,  scale: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
    { id: 'Bb', pc: 10, scale: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'] },
    { id: 'B',  pc: 11, scale: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] }
  ];
  const OFFS = [0, 2, 4, 5, 7, 9, 11];
  const QUAL = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  const BLACK_PC = [1, 3, 6, 8, 10];

  function scaleSemi(d) {
    const within = ((d % 7) + 7) % 7;
    return OFFS[within] + 12 * Math.floor(d / 7);
  }

  function computeChord(key, i, inv) {
    const base = [i, i + 2, i + 4];
    const degs = base.slice(inv).concat(base.slice(0, inv).map(function (d) { return d + 7; }));
    const semis = degs.map(scaleSemi);
    const s0 = semis[0];
    const pc0 = (((key.pc + s0) % 12) + 12) % 12;
    const positions = semis.map(function (s) { return pc0 + (s - s0); });
    const names = degs.map(function (d) { return key.scale[(((d % 7) + 7) % 7)]; });
    const rootIndex = (3 - inv) % 3;
    return {
      degs: degs, semis: semis, positions: positions, names: names,
      quality: QUAL[i], rootName: key.scale[i],
      rootIndex: rootIndex, rootPos: positions[rootIndex]
    };
  }

  function chordLabel(rootName, quality) {
    if (quality === 'min') return rootName + 'm';
    if (quality === 'dim') return rootName + '°';
    return rootName;
  }

  /* --- Stimmführung: Umkehrung mit der wenigsten Bewegung wählen --- */
  function voicingPitches(key, i, inv, refLow) {
    const ch = computeChord(key, i, inv);
    let oct = 0;
    if (typeof refLow === 'number') oct = Math.round((refLow - ch.positions[0]) / 12) * 12;
    return { pitches: ch.positions.map(function (p) { return p + oct; }), ch: ch };
  }
  const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function vlCost(a, b) {
    let best = Infinity;
    for (let x = 0; x < PERMS.length; x++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += Math.abs(a[k] - b[PERMS[x][k]]);
      if (s < best) best = s;
    }
    return best;
  }
  function makeStep(key, ch, inv, i) {
    return {
      key: key, i: i, inv: inv,
      positions: ch.positions, names: ch.names,
      rootIndex: ch.rootIndex, rootPos: ch.rootPos,
      quality: ch.quality, label: chordLabel(ch.rootName, ch.quality)
    };
  }
  // degrees: Stufen-Indizes (0..6). startInv: Umkehrung des ersten Akkords (0..2).
  function smartSteps(key, degrees, startInv) {
    const steps = [];
    let prev = null;
    for (let n = 0; n < degrees.length; n++) {
      const i = degrees[n];
      if (prev === null) {
        const inv0 = startInv || 0;
        const v = voicingPitches(key, i, inv0, 60);
        steps.push(makeStep(key, v.ch, inv0, i)); prev = v.pitches;
      } else {
        let bestInv = 0, bestCost = Infinity, bestPitches = null, bestCh = null;
        for (let inv = 0; inv < 3; inv++) {
          const v = voicingPitches(key, i, inv, prev[0]);
          const c = vlCost(prev, v.pitches);
          if (c < bestCost) { bestCost = c; bestInv = inv; bestPitches = v.pitches; bestCh = v.ch; }
        }
        steps.push(makeStep(key, bestCh, bestInv, i)); prev = bestPitches;
      }
    }
    return steps;
  }

  // Stufenreihen = Quint-Folgen (durchlaufen alle 7 Stufen, erzeugen über die
  // Stimmführung von selbst alle Umkehrungen — nicht nur Grundstellung).
  const PROGS_WALK = [
    { name: 'Quintfall', degs: [0, 3, 6, 2, 5, 1, 4, 0] },     // I–IV–vii°–iii–vi–ii–V–I
    { name: 'Quintanstieg', degs: [0, 4, 1, 5, 2, 6, 3, 0] }   // I–V–ii–vi–iii–vii°–IV–I
  ];
  const PROGS_CLASSIC = [
    { name: 'I–IV–V–I', degs: [0, 3, 4, 0] },
    { name: 'ii–V–I', degs: [1, 4, 0] },
    { name: 'I–V–vi–IV', degs: [0, 4, 5, 3] },
    { name: 'vi–IV–I–V', degs: [5, 3, 0, 4] },
    { name: 'I–vi–IV–V', degs: [0, 5, 3, 4] }
  ];

  /* ----------------------------------------------------------------
     2) UI-TEXTE
     ---------------------------------------------------------------- */
  const I18N = {
    de: {
      kicker: 'Music Academy · Übung',
      title: 'Inversionen am Klavier',
      subtitle: 'Diatonische Dreiklänge in jeder Tonart und jeder Umkehrung — sehen, vergleichen, am Klavier üben.',
      keyLabel: 'Tonart (Key)',
      hintToggle: '7. Stufe: 5/7-Hinweis',
      columns: ['Grundstellung', '1. Umkehrung', '2. Umkehrung'],
      stage: 'Stufe',
      quality: { maj: 'Dur', min: 'Moll', dim: 'vermindert' },
      legendTitle: 'Hintergrundfarbe = Akkordqualität',
      sevenHint: function (slash, five, seven) {
        return 'Praktisch spielen wir die 7. Stufe als 5-Akkord (' + five + ') mit dem 7. Ton (' + seven + ') im Bass → ' + slash + '. Im Raster zeigen wir den reinen verminderten Dreiklang.';
      },
      notation: 'Internationale Schreibweise (B statt deutschem H).',
      modeGrid: 'Raster', modeDrill: 'Training', soundOn: '🔊 Ton', soundOff: '🔇 Ton',
      targetNotes: 'Zieltöne',
      tapHint: 'Tippe die Tasten oder spiel sie am MIDI-Keyboard — rastet automatisch grün ein, wenn richtig.',
      clear: 'Neu', close: 'Schließen', correct: 'Richtig gespielt!',
      midiOn: function (n) { return 'MIDI verbunden' + (n ? ': ' + n : ''); },
      midiOff: 'Kein MIDI-Gerät — du kannst auch tippen.',
      midiNo: 'Dieser Browser kann kein Web-MIDI (am besten Chrome/Edge). Tippen geht trotzdem.',
      bassHint: function (note) { return 'Richtige Töne — aber der tiefste Ton muss ' + note + ' sein.'; },
      drillIntro: 'Spiel die geforderte Umkehrung — am MIDI-Keyboard oder per Tippen. Richtig = grün, dann geht\'s automatisch weiter. Die Umkehrungen sind so gewählt, dass du möglichst wenig Finger bewegst (Stimmführung).',
      drillType: 'Übungstyp', typeWalk: 'Stufenreihen', typeClassic: 'Klassiker', typeMixed: 'Gemischt',
      format: 'Modus', fPractice: 'Üben', fQuiz: 'Quiz · 20',
      timerLbl: 'Timer 15 s', drillKey: 'Tonart', keyRandom: 'Zufall',
      start: 'Start', stop: 'Stopp', playPrompt: 'Spiele', step: 'Schritt', question: 'Frage',
      waiting: 'Spiel den Akkord…', drillCorrect: 'Richtig! Weiter …', timeUp: 'So geht\'s:',
      hits: 'Treffer', seconds: 'Sek.', skip: 'Weiter →',
      result: 'Auswertung', accuracy: 'Trefferquote', avgTime: 'Ø Zeit pro Aufgabe',
      byInversion: 'Nach Umkehrung', again: 'Nochmal', backStart: 'Zurück', savedLocal: 'Ergebnis lokal gespeichert.'
    },
    en: {
      kicker: 'Music Academy · Practice',
      title: 'Inversions on the piano',
      subtitle: 'Diatonic triads in every key and every inversion — see, compare, practise on the piano.',
      keyLabel: 'Key',
      hintToggle: '7th degree: 5/7 hint',
      columns: ['Root position', '1st inversion', '2nd inversion'],
      stage: 'No.',
      quality: { maj: 'Major', min: 'Minor', dim: 'diminished' },
      legendTitle: 'Background colour = chord quality',
      sevenHint: function (slash, five, seven) {
        return 'In practice we play the 7th degree as the 5 chord (' + five + ') with the 7th note (' + seven + ') in the bass → ' + slash + '. In the grid we show the pure diminished triad.';
      },
      notation: 'International notation (B, not the German H).',
      modeGrid: 'Grid', modeDrill: 'Training', soundOn: '🔊 Sound', soundOff: '🔇 Sound',
      targetNotes: 'Target notes',
      tapHint: 'Tap the keys or play them on a MIDI keyboard — locks in green automatically when correct.',
      clear: 'Reset', close: 'Close', correct: 'Played correctly!',
      midiOn: function (n) { return 'MIDI connected' + (n ? ': ' + n : ''); },
      midiOff: 'No MIDI device — you can also tap.',
      midiNo: 'This browser has no Web MIDI (use Chrome/Edge). Tapping still works.',
      bassHint: function (note) { return 'Right notes — but the lowest note must be ' + note + '.'; },
      drillIntro: 'Play the requested inversion — on a MIDI keyboard or by tapping. Correct = green, then it advances automatically. Inversions are chosen so you move as few fingers as possible (voice leading).',
      drillType: 'Exercise', typeWalk: 'Scale-step series', typeClassic: 'Classics', typeMixed: 'Mixed',
      format: 'Mode', fPractice: 'Practice', fQuiz: 'Quiz · 20',
      timerLbl: 'Timer 15 s', drillKey: 'Key', keyRandom: 'Random',
      start: 'Start', stop: 'Stop', playPrompt: 'Play', step: 'Step', question: 'Question',
      waiting: 'Play the chord…', drillCorrect: 'Correct! Next …', timeUp: 'Like this:',
      hits: 'Hits', seconds: 'sec', skip: 'Next →',
      result: 'Result', accuracy: 'Accuracy', avgTime: 'Avg time per question',
      byInversion: 'By inversion', again: 'Again', backStart: 'Back', savedLocal: 'Result saved locally.'
    }
  };

  /* ----------------------------------------------------------------
     3) ZUSTAND
     ---------------------------------------------------------------- */
  const DRILL_SECONDS = 15;
  const DRILL_SAVE_URL = ''; // TODO: Google Apps Script / Server-Endpoint zum zentralen Sammeln.
  const state = {
    lang: 'de', keyId: 'C', showHint: true, mode: 'grid', sound: true,
    modal: null,
    midi: { supported: typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess, requested: false, deviceName: '', active: new Set() },
    drill: {
      running: false, finished: false,
      type: 'walk', format: 'practice', timerOn: true, keyMode: 'random',
      steps: [], index: 0, progName: '',
      deadline: 0, secondsLeft: DRILL_SECONDS, questionStart: 0,
      timerId: null, advanceId: null,
      revealing: false, locked: false, tap: new Set(), msg: null,
      hits: 0, quizIndex: 0, quizTotal: 20, results: [], lastRecord: null
    }
  };

  function t() { return I18N[state.lang]; }
  function getKey() { return KEYS.find(function (k) { return k.id === state.keyId; }); }
  const $ = function (id) { return document.getElementById(id); };
  function rnd() { return Math.random(); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function now() { return Date.now(); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------------
     4) KLAVIER-SOUND  (Web Audio, einfache additive Stimme)
     ---------------------------------------------------------------- */
  let audioCtx = null, masterGain = null;
  const voices = {};
  function ensureAudio() {
    if (!state.sound) return false;
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        audioCtx = new AC();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.22;
        masterGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return true;
    } catch (e) { return false; }
  }
  function midiToFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function playNote(n, dur) {
    if (!ensureAudio()) return;
    if (voices[n]) releaseVoice(n, 0.02);
    const T = audioCtx.currentTime, f = midiToFreq(n), life = dur || 3.2;
    const osc = audioCtx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(f, T);
    const part = audioCtx.createOscillator(); part.type = 'sine'; part.frequency.setValueAtTime(f * 2, T);
    const pg = audioCtx.createGain(); pg.gain.value = 0.14;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, T);
    g.gain.exponentialRampToValueAtTime(0.7, T + 0.006);     // schneller Anschlag
    g.gain.exponentialRampToValueAtTime(0.12, T + 0.9);      // Klavier-Abklingen
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
    try {
      v.g.gain.cancelScheduledValues(T);
      v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), T);
      v.g.gain.exponentialRampToValueAtTime(0.0001, T + (rel || 0.13));
      v.osc.stop(T + (rel || 0.13) + 0.03); v.part.stop(T + (rel || 0.13) + 0.03);
    } catch (e) {}
    delete voices[n];
  }
  function stopNote(n) { releaseVoice(n, 0.14); }
  function tapSound(pos) { playNote(60 + pos, 1.4); }   // Anzeige-Position → MIDI-Note
  function allNotesOff() { Object.keys(voices).forEach(function (n) { releaseVoice(n, 0.05); }); }

  /* ----------------------------------------------------------------
     5) KLAVIATUR-BAUSTEIN
     ---------------------------------------------------------------- */
  function buildKeyboard(targetPositions, opts) {
    opts = opts || {};
    const whiteW = opts.whiteW || 14;
    const whiteH = opts.whiteH || Math.round(whiteW * 4.2);
    const blackW = Math.max(6, Math.round(whiteW * 0.62));
    const blackH = Math.round(whiteH * 0.62);
    const targetSet = new Set(targetPositions);
    const played = opts.played || new Set();
    const fb = opts.feedback || null;
    const nameMap = opts.nameMap || {};
    const wrap = document.createElement('div');
    wrap.className = 'pkbd' + (opts.interactive ? ' is-interactive' : '');

    function makeKey(p, type, wd, ht) {
      const el = document.createElement(opts.interactive ? 'button' : 'div');
      el.className = 'pkey ' + (type === 'w' ? 'wkey' : 'bkey');
      el.style.width = wd + 'px'; el.style.height = ht + 'px';
      el.dataset.pos = p;
      if (fb) {
        if (fb.correct.has(p)) el.classList.add('is-correct');
        else if (fb.missing.has(p)) el.classList.add('is-missing');
        else if (fb.extra.has(p)) el.classList.add('is-extra');
      } else {
        if (targetSet.has(p)) el.classList.add('is-target');
        if (played.has(p)) el.classList.add('is-played');
      }
      if (opts.rootPos === p) el.classList.add('is-root');
      if (opts.labels && nameMap[p]) {
        const s = document.createElement('span'); s.className = 'pkey-lbl'; s.textContent = nameMap[p]; el.appendChild(s);
      }
      if (opts.interactive) {
        el.type = 'button';
        const tap = opts.onTap || onKeyTap;
        el.addEventListener('click', function () { tap(p); });
      }
      return el;
    }

    let w = 0; const blacks = [];
    for (let p = 0; p < 24; p++) {
      const isBlack = BLACK_PC.indexOf(p % 12) !== -1;
      if (!isBlack) { wrap.appendChild(makeKey(p, 'w', whiteW, whiteH)); w++; }
      else { blacks.push({ p: p, left: w * whiteW - blackW / 2 }); }
    }
    wrap.style.width = (w * whiteW) + 'px';
    wrap.style.height = whiteH + 'px';
    blacks.forEach(function (b) {
      const k = makeKey(b.p, 'b', blackW, blackH);
      k.style.left = b.left + 'px'; wrap.appendChild(k);
    });
    return wrap;
  }

  /* ----------------------------------------------------------------
     6) RASTER  (7 Stufen × 3 Umkehrungen)
     ---------------------------------------------------------------- */
  function renderGrid() {
    const key = getKey(), L = t(), grid = $('grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.appendChild(cell('ghead corner', ''));
    L.columns.forEach(function (c) {
      const h = cell('ghead', ''); h.innerHTML = '<span class="ghead-txt">' + esc(c) + '</span>'; grid.appendChild(h);
    });
    for (let i = 0; i < 7; i++) {
      const quality = QUAL[i], label = chordLabel(key.scale[i], quality);
      const rl = cell('rowlabel q-' + quality, '');
      let rlHtml =
        '<span class="stage-num mono">' + L.stage + ' ' + (i + 1) + '</span>' +
        '<span class="chord-name">' + esc(label) + '</span>' +
        '<span class="q-tag"><span class="q-dot q-dot-' + quality + '"></span>' + esc(L.quality[quality]) + '</span>';
      if (i === 6 && state.showHint) {
        const five = key.scale[4], seven = key.scale[6], slash = five + '/' + seven;
        rlHtml += '<span class="seven-badge mono" title="' + esc(L.sevenHint(slash, chordLabel(five, 'maj'), seven)) + '">5/7 → ' + esc(slash) + '</span>';
      }
      rl.innerHTML = rlHtml; grid.appendChild(rl);
      for (let inv = 0; inv < 3; inv++) {
        const ch = computeChord(key, i, inv);
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'cell q-' + quality; c.dataset.i = i; c.dataset.inv = inv;
        c.addEventListener('click', function () { openModal(parseInt(this.dataset.i, 10), parseInt(this.dataset.inv, 10)); });
        c.appendChild(buildKeyboard(ch.positions, { whiteW: 12, rootPos: ch.rootPos }));
        const notes = document.createElement('div');
        notes.className = 'cell-notes mono';
        notes.innerHTML = ch.names.map(function (n, idx) {
          return '<span class="' + (idx === ch.rootIndex ? 'rootnote' : '') + '">' + esc(n) + '</span>';
        }).join('<span class="sep">–</span>');
        c.appendChild(notes);
        grid.appendChild(c);
      }
    }
  }
  function cell(cls, html) { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; return d; }

  function renderControls() {
    const L = t(), c = $('controls');
    if (!c) return;
    c.innerHTML = '';
    const keyBlock = document.createElement('div');
    keyBlock.className = 'ctrl-block';
    keyBlock.innerHTML = '<div class="ctrl-label mono">' + esc(L.keyLabel) + '</div>';
    const keyRow = document.createElement('div'); keyRow.className = 'keyrow';
    KEYS.forEach(function (k) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'keybtn mono' + (k.id === state.keyId ? ' is-active' : ''); b.textContent = k.id;
      b.addEventListener('click', function () { state.keyId = k.id; renderControls(); renderGrid(); });
      keyRow.appendChild(b);
    });
    keyBlock.appendChild(keyRow); c.appendChild(keyBlock);
    const hintBlock = document.createElement('label');
    hintBlock.className = 'switch';
    hintBlock.innerHTML =
      '<input type="checkbox" id="hintChk"' + (state.showHint ? ' checked' : '') + ' />' +
      '<span class="switch-track"><span class="switch-knob"></span></span>' +
      '<span class="switch-text mono">' + esc(L.hintToggle) + '</span>';
    c.appendChild(hintBlock);
    $('hintChk').addEventListener('change', function () { state.showHint = this.checked; renderGrid(); });
  }

  function renderLegend() {
    const L = t(), el = $('legend');
    if (!el) return;
    el.innerHTML =
      '<span class="legend-title mono">' + esc(L.legendTitle) + ':</span>' +
      ['maj', 'min', 'dim'].map(function (q) {
        return '<span class="legend-item"><span class="legend-swatch q-' + q + '"></span>' +
          '<span class="q-dot q-dot-' + q + '"></span>' + esc(L.quality[q]) + '</span>';
      }).join('');
  }

  /* ----------------------------------------------------------------
     7) OKTAV-UNABHÄNGIGE PRÜFUNG  (Akkordtöne + Basston)
     ---------------------------------------------------------------- */
  function pcOf(n) { return ((n % 12) + 12) % 12; }
  function targetInfo(positions) { return { pcs: positions.map(pcOf), bassPc: pcOf(positions[0]) }; }
  function matchInversion(notes, positions) {
    if (!notes || notes.length === 0) return 'none';
    const tgt = targetInfo(positions), heldPcs = [];
    notes.forEach(function (n) { const pc = pcOf(n); if (heldPcs.indexOf(pc) < 0) heldPcs.push(pc); });
    const tgtSet = new Set(tgt.pcs);
    const allPresent = tgt.pcs.every(function (pc) { return heldPcs.indexOf(pc) >= 0; });
    const noExtra = heldPcs.every(function (pc) { return tgtSet.has(pc); });
    if (allPresent && noExtra) return pcOf(notes[0]) === tgt.bassPc ? 'correct' : 'bass';
    return 'partial';
  }
  function playedDisplayPositions(notes, positions) {
    const byPc = {}; positions.forEach(function (p) { byPc[pcOf(p)] = p; });
    const set = new Set();
    notes.forEach(function (n) { const pc = pcOf(n); set.add(byPc[pc] !== undefined ? byPc[pc] : pc); });
    return set;
  }
  function heldNotes() { return Array.from(state.midi.active).sort(function (a, b) { return a - b; }); }

  /* ----------------------------------------------------------------
     8) WEB-MIDI
     ---------------------------------------------------------------- */
  function initMidi() {
    const m = state.midi;
    if (m.requested) return;
    m.requested = true;
    if (!navigator.requestMIDIAccess) { m.supported = false; updateMidiStatus(); return; }
    navigator.requestMIDIAccess().then(function (access) {
      bindMidiInputs(access);
      access.onstatechange = function () { bindMidiInputs(access); };
      updateMidiStatus();
    }).catch(function () { m.supported = false; updateMidiStatus(); });
  }
  function bindMidiInputs(access) {
    const names = [];
    access.inputs.forEach(function (input) { input.onmidimessage = handleMidi; if (input.name) names.push(input.name); });
    state.midi.deviceName = names.join(', ');
    updateMidiStatus();
  }
  function handleMidi(msg) {
    const cmd = msg.data[0] & 0xf0, note = msg.data[1], vel = msg.data[2];
    if (cmd === 0x90 && vel > 0) { state.midi.active.add(note); playNote(note); }
    else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) { state.midi.active.delete(note); stopNote(note); }
    else return;
    onMidiChange();
  }
  function onMidiChange() {
    if (state.modal) midiUpdateModal();
    else if (state.mode === 'drill' && state.drill.running) checkDrill();
  }
  function midiStatusText() {
    const L = t(), m = state.midi;
    if (!m.supported) return L.midiNo;
    if (m.deviceName) return L.midiOn(m.deviceName);
    return L.midiOff;
  }
  function updateMidiStatus() {
    const m = state.midi;
    const cls = !m.supported ? 'is-no' : (m.deviceName ? 'is-on' : 'is-off');
    document.querySelectorAll('.midi-status').forEach(function (el) {
      el.textContent = (m.deviceName && m.supported ? '🎹 ' : '') + midiStatusText();
      el.className = 'midi-status mono ' + cls;
    });
  }

  /* ----------------------------------------------------------------
     9) MODAL  (Antippen/MIDI → automatisch + eingerastet grün)
     ---------------------------------------------------------------- */
  function openModal(i, inv) {
    const key = getKey(), ch = computeChord(key, i, inv);
    state.modal = {
      i: i, inv: inv, positions: ch.positions, names: ch.names,
      rootName: ch.rootName, rootIndex: ch.rootIndex, rootPos: ch.rootPos, quality: ch.quality,
      played: new Set(), midiPlayed: new Set(), feedback: null, midiMsg: null, solved: false
    };
    ensureAudio(); initMidi(); renderModal();
  }
  function closeModal() {
    state.modal = null;
    const r = $('modalRoot'); if (r) r.innerHTML = '';
  }
  function onKeyTap(pos) {
    const m = state.modal;
    if (!m || m.solved) return;
    tapSound(pos);
    if (m.played.has(pos)) m.played.delete(pos); else m.played.add(pos);
    evalModal();
  }
  // Eingang (Tippen ODER MIDI) auswerten — bei "correct" rastet das Ergebnis ein.
  function evalModal() {
    const m = state.modal;
    if (!m) return;
    if (m.solved) { renderModal(); return; }
    const notes = state.midi.active.size ? heldNotes()
      : Array.from(m.played).sort(function (a, b) { return a - b; });
    m.midiPlayed = state.midi.active.size ? playedDisplayPositions(heldNotes(), m.positions) : new Set();
    const verdict = matchInversion(notes, m.positions);
    if (verdict === 'correct') {
      m.solved = true;
      m.feedback = { correct: new Set(m.positions), missing: new Set(), extra: new Set(), ok: true };
      m.midiMsg = null;
    } else if (verdict === 'bass') {
      m.feedback = null; m.midiMsg = t().bassHint(m.names[0]);
    } else {
      m.feedback = null; m.midiMsg = null;
    }
    renderModal();
  }
  function midiUpdateModal() { evalModal(); }

  function renderModal() {
    const m = state.modal, root = $('modalRoot');
    if (!root) return;
    if (!m) { root.innerHTML = ''; return; }
    const L = t(), key = getKey(), label = chordLabel(m.rootName, m.quality);
    const nameMap = {}; m.positions.forEach(function (p, idx) { nameMap[p] = m.names[idx]; });

    root.innerHTML = '';
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.addEventListener('click', function (e) { if (e.target === back) closeModal(); });
    const panel = document.createElement('div');
    panel.className = 'modal-panel q-' + m.quality;

    const head = document.createElement('div');
    head.className = 'modal-head';
    head.innerHTML =
      '<div class="mh-left">' +
        '<div class="mh-kicker mono">' + esc(key.id) + ' · ' + esc(L.stage) + ' ' + (m.i + 1) + ' · ' + esc(L.columns[m.inv]) + '</div>' +
        '<div class="mh-chord">' + esc(label) + ' <span class="mh-qual mono">' + esc(L.quality[m.quality]) + '</span></div>' +
      '</div>' +
      '<button class="modal-x" type="button" aria-label="' + esc(L.close) + '">✕</button>';
    panel.appendChild(head);
    head.querySelector('.modal-x').addEventListener('click', closeModal);

    const tn = document.createElement('div');
    tn.className = 'mh-target mono';
    tn.innerHTML = '<span class="mh-target-lbl">' + esc(L.targetNotes) + ':</span> ' +
      m.names.map(function (n, idx) {
        return '<span class="' + (idx === m.rootIndex ? 'rootnote' : '') + '">' + esc(n) + '</span>';
      }).join(' <span class="sep">–</span> ');
    panel.appendChild(tn);

    if (m.i === 6 && state.showHint) {
      const five = key.scale[4], seven = key.scale[6], slash = five + '/' + seven;
      const note = document.createElement('div');
      note.className = 'modal-note';
      note.innerHTML = '<span class="callout-mark mono">!</span><span>' + esc(L.sevenHint(slash, chordLabel(five, 'maj'), seven)) + '</span>';
      panel.appendChild(note);
    }

    const kbWrap = document.createElement('div');
    kbWrap.className = 'modal-kbd';
    const playedSet = new Set();
    m.played.forEach(function (p) { playedSet.add(p); });
    (m.midiPlayed || new Set()).forEach(function (p) { playedSet.add(p); });
    kbWrap.appendChild(buildKeyboard(m.positions, {
      whiteW: 40, interactive: true, labels: true,
      played: playedSet, feedback: m.feedback, nameMap: nameMap, rootPos: m.rootPos
    }));
    panel.appendChild(kbWrap);

    const status = document.createElement('div'); status.className = 'midi-status mono'; panel.appendChild(status);

    const msg = document.createElement('div');
    msg.className = 'modal-msg';
    if (m.feedback && m.feedback.ok) { msg.className += ' is-ok'; msg.textContent = '✓ ' + L.correct; }
    else if (m.midiMsg) { msg.className += ' is-bad'; msg.textContent = m.midiMsg; }
    else { msg.textContent = L.tapHint; }
    panel.appendChild(msg);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML = '<button class="btn btn-ghost" id="mClear" type="button">' + esc(L.clear) + '</button>';
    panel.appendChild(actions);
    actions.querySelector('#mClear').addEventListener('click', function () {
      m.played.clear(); m.midiPlayed = new Set(); m.feedback = null; m.midiMsg = null; m.solved = false; renderModal();
    });

    back.appendChild(panel); root.appendChild(back);
    updateMidiStatus();
  }

  /* ----------------------------------------------------------------
     10) DRILL  (Training: Üben endlos ODER Quiz mit Auswertung)
     ---------------------------------------------------------------- */
  function buildProgression() {
    const d = state.drill;
    const key = d.keyMode === 'random' ? pick(KEYS) : (KEYS.find(function (k) { return k.id === d.keyMode; }) || KEYS[0]);
    let type = d.type;
    if (type === 'mixed') type = rnd() < 0.5 ? 'walk' : 'classic';
    if (type === 'walk') {
      const prog = pick(PROGS_WALK);
      d.progName = key.id + ' · ' + prog.name;
      return smartSteps(key, prog.degs, Math.floor(rnd() * 3));   // zufällige Start-Umkehrung → Varianz
    }
    const prog = pick(PROGS_CLASSIC);
    d.progName = key.id + ' · ' + prog.name;
    return smartSteps(key, prog.degs, 0);
  }

  function startDrill() {
    const d = state.drill;
    stopDrillTimers();
    d.running = true; d.finished = false; d.hits = 0; d.quizIndex = 0; d.results = [];
    d.steps = buildProgression(); d.index = 0;
    newPrompt(false);
  }
  function stopDrill() {
    const d = state.drill;
    d.running = false; d.finished = false; d.revealing = false; d.locked = false;
    stopDrillTimers(); allNotesOff();
    if (state.mode === 'drill') renderDrill();
  }
  function stopDrillTimers() {
    const d = state.drill;
    if (d.timerId) { clearInterval(d.timerId); d.timerId = null; }
    if (d.advanceId) { clearTimeout(d.advanceId); d.advanceId = null; }
  }
  function newPrompt(advance) {
    const d = state.drill;
    stopDrillTimers();
    if (advance) { d.index++; if (d.index >= d.steps.length) { d.steps = buildProgression(); d.index = 0; } }
    d.revealing = false; d.locked = false; d.tap = new Set(); d.msg = null; d.questionStart = now();
    if (d.timerOn) { d.secondsLeft = DRILL_SECONDS; d.deadline = now() + DRILL_SECONDS * 1000; d.timerId = setInterval(tickDrill, 100); }
    renderDrill();
  }
  function tickDrill() {
    const d = state.drill;
    if (!$('drillView') || !d.running) { stopDrillTimers(); return; }
    const left = Math.max(0, d.deadline - now());
    d.secondsLeft = Math.ceil(left / 1000);
    const bar = $('drillBar'); if (bar) { bar.style.width = (left / (DRILL_SECONDS * 1000) * 100) + '%'; bar.classList.toggle('is-urgent', left <= 5000); }
    const secs = $('drillSecs'); if (secs) secs.textContent = d.secondsLeft + ' ' + t().seconds;
    if (left <= 0 && !d.locked) onDrillTimeout();
  }
  function currentInput() {
    if (state.midi.active.size) return heldNotes();
    return Array.from(state.drill.tap).sort(function (a, b) { return a - b; });
  }
  function onDrillTap(pos) {
    const d = state.drill;
    if (!d.running || d.revealing || d.locked) return;
    tapSound(pos);
    if (d.tap.has(pos)) d.tap.delete(pos); else d.tap.add(pos);
    checkDrill();
  }
  function checkDrill() {
    const d = state.drill;
    if (!d.running || d.revealing || d.locked) return;
    const step = d.steps[d.index]; if (!step) return;
    const verdict = matchInversion(currentInput(), step.positions);
    if (verdict === 'correct') { onDrillCorrect(); return; }
    d.msg = verdict === 'bass' ? t().bassHint(step.names[0]) : null;
    updateDrillBoard();
  }
  function onDrillCorrect() {
    const d = state.drill;
    if (d.locked) return;
    d.locked = true; d.hits++; d.msg = t().drillCorrect;
    stopDrillTimers(); updateDrillBoard(true);
    d.advanceId = setTimeout(function () { afterQuestion(true, true); }, 950);
  }
  function onDrillTimeout() {
    const d = state.drill;
    if (d.locked) return;
    d.locked = true; d.revealing = true; d.msg = t().timeUp;
    stopDrillTimers(); updateDrillBoard();
    // Quiz: zählt als Fehler + weiter. Üben: gleiche Aufgabe nochmal.
    d.advanceId = setTimeout(function () { afterQuestion(false, d.format === 'quiz'); }, 2300);
  }
  function onSkip() {
    const d = state.drill;
    if (!d.running || d.locked) return;
    d.locked = true; d.revealing = true; d.msg = t().timeUp;
    stopDrillTimers(); updateDrillBoard();
    d.advanceId = setTimeout(function () { afterQuestion(false, true); }, 1200);
  }
  function afterQuestion(hit, advance) {
    const d = state.drill;
    if (d.format === 'quiz') {
      const step = d.steps[d.index];
      d.results.push({ hit: hit, timeMs: now() - d.questionStart, key: step.key.id, label: step.label, inv: step.inv });
      d.quizIndex++;
      if (d.quizIndex >= d.quizTotal) { finishQuiz(); return; }
      newPrompt(true);
    } else {
      newPrompt(advance);
    }
  }

  function renderDrill() {
    const host = $('drillView');
    if (!host) return;
    const L = t(), d = state.drill;
    host.innerHTML = '';

    // Steuerleiste (immer)
    const ctr = document.createElement('div');
    ctr.className = 'drill-controls';
    ctr.appendChild(segBlock(L.drillType, [['walk', L.typeWalk], ['classic', L.typeClassic], ['mixed', L.typeMixed]], d.type, function (v) { d.type = v; if (d.running) startDrill(); else renderDrill(); }));
    ctr.appendChild(segBlock(L.format, [['practice', L.fPractice], ['quiz', L.fQuiz]], d.format, function (v) { d.format = v; if (d.running) startDrill(); else renderDrill(); }));

    const timerBlock = document.createElement('label');
    timerBlock.className = 'switch drill-timerswitch';
    timerBlock.innerHTML =
      '<input type="checkbox" id="timerChk"' + (d.timerOn ? ' checked' : '') + ' />' +
      '<span class="switch-track"><span class="switch-knob"></span></span>' +
      '<span class="switch-text mono">' + esc(L.timerLbl) + '</span>';
    ctr.appendChild(timerBlock);

    const keySeg = document.createElement('div');
    keySeg.className = 'seg-block';
    keySeg.innerHTML = '<div class="ctrl-label mono">' + esc(L.drillKey) + '</div>';
    const sel = document.createElement('select');
    sel.className = 'drill-select mono';
    const optR = document.createElement('option'); optR.value = 'random'; optR.textContent = L.keyRandom; sel.appendChild(optR);
    KEYS.forEach(function (k) { const o = document.createElement('option'); o.value = k.id; o.textContent = k.id; sel.appendChild(o); });
    sel.value = d.keyMode;
    sel.addEventListener('change', function () { d.keyMode = this.value; if (d.running) startDrill(); });
    keySeg.appendChild(sel);
    ctr.appendChild(keySeg);

    const action = document.createElement('div');
    action.className = 'seg-block seg-action';
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'btn ' + (d.running ? 'btn-ghost' : 'btn-primary');
    startBtn.textContent = d.running ? L.stop : L.start;
    startBtn.addEventListener('click', function () { if (d.running) stopDrill(); else { ensureAudio(); initMidi(); startDrill(); } });
    action.appendChild(startBtn);
    ctr.appendChild(action);
    host.appendChild(ctr);

    // Timer-Switch erst jetzt verdrahten (Element existiert)
    $('timerChk').addEventListener('change', function () { d.timerOn = this.checked; if (d.running) startDrill(); });

    const status = document.createElement('div'); status.className = 'midi-status mono'; host.appendChild(status);

    if (d.finished) { renderResult(host); updateMidiStatus(); return; }
    if (!d.running) {
      const intro = document.createElement('p'); intro.className = 'drill-intro'; intro.textContent = L.drillIntro; host.appendChild(intro);
      updateMidiStatus(); return;
    }

    const step = d.steps[d.index];
    const counter = d.format === 'quiz'
      ? (L.question + ' ' + (d.quizIndex + 1) + '/' + d.quizTotal + ' · ' + L.hits + ' ' + d.hits)
      : (L.step + ' ' + (d.index + 1) + ' · ' + L.hits + ' ' + d.hits);
    const card = document.createElement('div');
    card.className = 'drill-prompt';
    card.innerHTML =
      '<div class="dp-top mono"><span>' + esc(step.key.id) + ' · ' + esc(d.progName) + '</span>' +
      '<span class="dp-step">' + esc(counter) + '</span></div>' +
      '<div class="dp-main"><span class="dp-lbl mono">' + esc(L.playPrompt) + '</span> ' +
      '<span class="dp-chord">' + esc(step.label) + '</span> ' +
      '<span class="dp-inv">' + esc(L.columns[step.inv]) + '</span></div>';
    host.appendChild(card);

    if (d.timerOn) {
      const timer = document.createElement('div');
      timer.className = 'drill-timer';
      timer.innerHTML = '<div class="dt-track"><div id="drillBar" class="dt-bar"></div></div><span id="drillSecs" class="dt-secs mono">' + d.secondsLeft + ' ' + esc(L.seconds) + '</span>';
      host.appendChild(timer);
    }

    const board = document.createElement('div'); board.className = 'drill-board'; board.id = 'drillBoard'; host.appendChild(board);
    const msg = document.createElement('div'); msg.className = 'drill-msg'; msg.id = 'drillMsg'; host.appendChild(msg);

    const skipWrap = document.createElement('div');
    skipWrap.className = 'drill-skip';
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button'; skipBtn.className = 'btn btn-ghost'; skipBtn.textContent = L.skip;
    skipBtn.addEventListener('click', onSkip);
    skipWrap.appendChild(skipBtn);
    host.appendChild(skipWrap);

    updateDrillBoard();
    updateMidiStatus();
    const bar = $('drillBar');
    if (bar) bar.style.width = (Math.max(0, d.deadline - now()) / (DRILL_SECONDS * 1000) * 100) + '%';
  }

  function segBlock(label, items, current, onChoose) {
    const block = document.createElement('div');
    block.className = 'seg-block';
    block.innerHTML = '<div class="ctrl-label mono">' + esc(label) + '</div>';
    const row = document.createElement('div'); row.className = 'seg';
    items.forEach(function (it) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'segbtn mono' + (current === it[0] ? ' is-active' : ''); b.textContent = it[1];
      b.addEventListener('click', function () { onChoose(it[0]); });
      row.appendChild(b);
    });
    block.appendChild(row);
    return block;
  }

  function updateDrillBoard(correct) {
    const d = state.drill, board = $('drillBoard');
    if (!board) return;
    const step = d.steps[d.index];
    let feedback = null, showTarget = false;
    if (correct) feedback = { correct: new Set(step.positions), missing: new Set(), extra: new Set(), ok: true };
    else if (d.revealing) showTarget = true;
    const played = showTarget ? new Set() : playedDisplayPositions(currentInput(), step.positions);
    board.innerHTML = '';
    board.appendChild(buildKeyboard(showTarget ? step.positions : [], {
      whiteW: 38, interactive: true, onTap: onDrillTap,
      played: played, feedback: feedback, rootPos: d.revealing ? step.rootPos : undefined
    }));
    const msg = $('drillMsg');
    if (msg) {
      let cls = 'drill-msg', text = d.msg || t().waiting;
      if (correct) cls += ' is-ok'; else if (d.revealing) cls += ' is-reveal'; else if (d.msg) cls += ' is-bad';
      msg.className = cls; msg.textContent = (correct ? '✓ ' : '') + text;
    }
  }

  /* --- Auswertung (Quiz) --- */
  function participantName() {
    try { const u = JSON.parse(sessionStorage.getItem('tt_user') || 'null'); if (u && u.vorname) return (u.vorname + ' ' + (u.nachname || '')).trim(); } catch (e) {}
    return '';
  }
  function saveDrillResult(rec) {
    try {
      const k = 'tt_inv_results', arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.push(rec); while (arr.length > 100) arr.shift();
      localStorage.setItem(k, JSON.stringify(arr));
    } catch (e) {}
    if (DRILL_SAVE_URL) { try { fetch(DRILL_SAVE_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(rec) }); } catch (e) {} }
  }
  function finishQuiz() {
    const d = state.drill;
    d.running = false; d.finished = true; stopDrillTimers(); allNotesOff();
    const total = d.results.length, hits = d.results.filter(function (r) { return r.hit; }).length;
    const pct = total ? Math.round(hits / total * 100) : 0;
    const dur = d.results.reduce(function (s, r) { return s + (r.timeMs || 0); }, 0);
    const rec = { ts: now(), name: participantName(), exercise: d.type, keyMode: d.keyMode, total: total, hits: hits, pct: pct, durationMs: dur, results: d.results.slice() };
    saveDrillResult(rec); d.lastRecord = rec;
    renderDrill();
  }
  function renderResult(host) {
    const L = t(), d = state.drill, rec = d.lastRecord || { total: 0, hits: 0, pct: 0, durationMs: 0, results: [] };
    const avg = rec.results.length ? Math.round(rec.durationMs / rec.results.length / 100) / 10 : 0;
    // Genauigkeit je Umkehrung
    const byInv = [0, 1, 2].map(function (iv) {
      const rs = rec.results.filter(function (r) { return r.inv === iv; });
      const h = rs.filter(function (r) { return r.hit; }).length;
      return { inv: iv, total: rs.length, hits: h };
    });
    const panel = document.createElement('div');
    panel.className = 'drill-result';
    let invHtml = byInv.filter(function (b) { return b.total; }).map(function (b) {
      return '<div class="ri-row"><span class="ri-lbl mono">' + esc(L.columns[b.inv]) + '</span>' +
        '<span class="ri-bar"><span class="ri-fill" style="width:' + (b.total ? Math.round(b.hits / b.total * 100) : 0) + '%"></span></span>' +
        '<span class="ri-val mono">' + b.hits + '/' + b.total + '</span></div>';
    }).join('');
    panel.innerHTML =
      '<div class="kicker" style="margin-top:4px">' + esc(L.result) + '</div>' +
      '<div class="res-score"><span class="res-big">' + rec.hits + '<span class="res-tot">/' + rec.total + '</span></span>' +
      '<span class="res-pct mono">' + rec.pct + '%</span></div>' +
      '<div class="res-meta mono">' + esc(L.accuracy) + ': ' + rec.pct + '% · ' + esc(L.avgTime) + ': ' + avg + ' ' + esc(L.seconds) + '</div>' +
      '<div class="res-byinv"><div class="ctrl-label mono">' + esc(L.byInversion) + '</div>' + invHtml + '</div>' +
      '<div class="res-saved mono">' + esc(L.savedLocal) + '</div>' +
      '<div class="modal-actions res-actions">' +
        '<button class="btn btn-primary" id="resAgain" type="button">' + esc(L.again) + '</button>' +
        '<button class="btn btn-ghost" id="resBack" type="button">' + esc(L.backStart) + '</button>' +
      '</div>';
    host.appendChild(panel);
    $('resAgain').addEventListener('click', function () { ensureAudio(); startDrill(); });
    $('resBack').addEventListener('click', function () { d.finished = false; renderDrill(); });
  }

  /* ----------------------------------------------------------------
     11) MODUS-UMSCHALTER + SOUND
     ---------------------------------------------------------------- */
  function renderModeSwitch() {
    const el = $('modeswitch');
    if (!el) return;
    const L = t();
    el.innerHTML = '';
    [['grid', L.modeGrid], ['drill', L.modeDrill]].forEach(function (mo) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'modebtn mono' + (state.mode === mo[0] ? ' is-active' : ''); b.textContent = mo[1];
      b.addEventListener('click', function () { ensureAudio(); setMode(mo[0]); });
      el.appendChild(b);
    });
  }
  function renderSoundToggle() {
    const el = $('soundToggle');
    if (!el) return;
    el.textContent = state.sound ? t().soundOn : t().soundOff;
    el.classList.toggle('is-off', !state.sound);
    el.onclick = function () {
      state.sound = !state.sound;
      try { localStorage.setItem('tt_sound', state.sound ? '1' : '0'); } catch (e) {}
      if (!state.sound) allNotesOff(); else ensureAudio();
      renderSoundToggle();
    };
  }
  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode !== 'drill') stopDrill();
    applyMode(); renderModeSwitch();
  }
  function applyMode() {
    const gv = $('gridView'), dv = $('drillView');
    if (!gv || !dv) return;
    if (state.mode === 'drill') { gv.hidden = true; dv.hidden = false; initMidi(); renderDrill(); }
    else { dv.hidden = true; gv.hidden = false; stopDrillTimers(); }
  }

  /* ----------------------------------------------------------------
     12) SPRACHE + STATISCHE TEXTE
     ---------------------------------------------------------------- */
  function applyStaticTexts() {
    const L = t();
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i]').forEach(function (el) {
      const k = el.getAttribute('data-i'); if (L[k]) el.textContent = L[k];
    });
    if ($('title')) $('title').textContent = L.title;
    if ($('subtitle')) $('subtitle').textContent = L.subtitle;
    if ($('notation')) $('notation').textContent = L.notation;
  }
  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem('tt_lang', lang); } catch (e) {}
    applyStaticTexts();
    renderModeSwitch(); renderSoundToggle();
    renderControls(); renderLegend(); renderGrid();
    if (state.mode === 'drill') renderDrill();
    if (state.modal) renderModal();
    updateMidiStatus();
  }

  /* ----------------------------------------------------------------
     13) START
     ---------------------------------------------------------------- */
  let escWired = false;
  function mount(root) {
    try {
      const saved = localStorage.getItem('tt_lang');
      if (saved === 'de' || saved === 'en') state.lang = saved;
      const snd = localStorage.getItem('tt_sound');
      if (snd === '0') state.sound = false; else if (snd === '1') state.sound = true;
    } catch (e) {}
    // Transient zurücksetzen, aber gewählten Modus behalten (Sprachwechsel).
    stopDrillTimers(); allNotesOff();
    state.modal = null;
    state.drill.running = false; state.drill.finished = false; state.drill.revealing = false; state.drill.locked = false;

    root.classList.add('invtrainer');
    root.innerHTML =
      '<div class="kicker" data-i="kicker"></div>' +
      '<h1 id="title" class="title"></h1>' +
      '<p id="subtitle" class="sub"></p>' +
      '<div class="topbar">' +
        '<div id="modeswitch" class="modeswitch"></div>' +
        '<button id="soundToggle" class="soundbtn mono" type="button"></button>' +
      '</div>' +
      '<div id="gridView">' +
        '<div id="controls" class="controls"></div>' +
        '<div id="legend" class="legend"></div>' +
        '<div class="gridwrap"><div id="grid" class="grid"></div></div>' +
        '<p id="notation" class="notation"></p>' +
      '</div>' +
      '<div id="drillView" hidden></div>' +
      '<div id="modalRoot"></div>';

    if (!escWired) {
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.modal) closeModal(); });
      escWired = true;
    }
    applyStaticTexts();
    renderModeSwitch(); renderSoundToggle();
    renderControls(); renderLegend(); renderGrid();
    applyMode();
  }

  window.InversionTrainer = {
    mount: mount, setLang: setLang,
    KEYS: KEYS, computeChord: computeChord, chordLabel: chordLabel,
    smartSteps: smartSteps, matchInversion: matchInversion, state: state,
    _simMidi: function (arr) { state.midi.active = new Set(arr || []); onMidiChange(); }
  };
})();
