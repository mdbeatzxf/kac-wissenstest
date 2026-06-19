/* ==================================================================
   Inversionen am Klavier — KAC Music Academy
   Vanilla JS. Engine (Musiktheorie) sauber getrennt vom Rendering.
   Modus 1 "Raster": Übersicht 7×3.  Modus 2 "Training": MIDI-Drill
   mit Stimmführung. Web-MIDI optional (Chrome/Edge/Android).
   ================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     1) MUSIK-ENGINE  (sprachunabhängig)
     ---------------------------------------------------------------- */

  // 12 Dur-Tonarten: Grundton-Pitchclass (0=C) + korrekt buchstabierte Skala.
  // Internationale Schreibweise (B statt deutschem H).
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

  // Dur-Tonleiter in Halbtonschritten ab dem Grundton.
  const OFFS = [0, 2, 4, 5, 7, 9, 11];

  // Akkord-Qualität je Stufe (1..7) in Dur.
  const QUAL = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];

  // Halbton-Wert einer (auch oktavüberschreitenden) Tonleiter-Stufe.
  function scaleSemi(d) {
    const within = ((d % 7) + 7) % 7;
    return OFFS[within] + 12 * Math.floor(d / 7);
  }

  // Pitchclass-Set der weißen / schwarzen Tasten.
  const BLACK_PC = [1, 3, 6, 8, 10];

  // Dreiklang einer Stufe (i = 0..6) in einer Umkehrung (inv = 0..2).
  // Liefert Töne von unten nach oben: Namen, Tastatur-Positionen (0..~21), Halbtöne.
  function computeChord(key, i, inv) {
    const base = [i, i + 2, i + 4];                 // Grundton, Terz, Quinte (als Stufen)
    // Umkehrung: die unteren `inv` Töne wandern eine Oktave nach oben.
    const degs = base.slice(inv).concat(base.slice(0, inv).map(function (d) { return d + 7; }));
    const semis = degs.map(scaleSemi);
    const s0 = semis[0];
    const pc0 = (((key.pc + s0) % 12) + 12) % 12;    // unterster Ton: Pitchclass in unterer Oktave
    const positions = semis.map(function (s) { return pc0 + (s - s0); });
    const names = degs.map(function (d) { return key.scale[(((d % 7) + 7) % 7)]; });
    // Position des Grundtons innerhalb bottom→top — egal in welcher Umkehrung:
    // inv 0 → unten (0), inv 1 → oben (2), inv 2 → Mitte (1).
    const rootIndex = (3 - inv) % 3;
    return {
      degs: degs,
      semis: semis,
      positions: positions,   // bottom→top, alle innerhalb 0..23 (2 Oktaven)
      names: names,           // bottom→top
      quality: QUAL[i],
      rootName: key.scale[i],
      rootIndex: rootIndex,         // Index des Grundtons in names/positions
      rootPos: positions[rootIndex] // Tastatur-Position des Grundtons
    };
  }

  // Akkordname inkl. Qualitäts-Suffix.
  function chordLabel(rootName, quality) {
    if (quality === 'min') return rootName + 'm';
    if (quality === 'dim') return rootName + '°';
    return rootName;
  }

  /* --- Stimmführung: wähle pro Akkord die Umkehrung mit der wenigsten
         Bewegung zum vorigen Akkord ("wenig Finger"). --------------- */

  // Absolute Halbton-Lage einer Umkehrung, Bass nahe `refLow` platziert.
  function voicingPitches(key, i, inv, refLow) {
    const ch = computeChord(key, i, inv);
    let oct = 0;
    if (typeof refLow === 'number') oct = Math.round((refLow - ch.positions[0]) / 12) * 12;
    return { pitches: ch.positions.map(function (p) { return p + oct; }), ch: ch };
  }

  // Minimaler Gesamt-Bewegungsaufwand zwischen zwei Dreiklängen (3! Zuordnungen).
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

  function makeStep(key, ch, inv) {
    return {
      key: key, i: null, inv: inv,
      positions: ch.positions, names: ch.names,
      rootIndex: ch.rootIndex, rootPos: ch.rootPos,
      quality: ch.quality, label: chordLabel(ch.rootName, ch.quality)
    };
  }

  // degrees: Array von Stufen-Indizes (0..6) → Schritte mit smarter Umkehrung.
  function smartSteps(key, degrees) {
    const steps = [];
    let prev = null;
    for (let n = 0; n < degrees.length; n++) {
      const i = degrees[n];
      if (prev === null) {
        const v = voicingPitches(key, i, 0, 60);   // Start: Grundstellung mittig
        const st = makeStep(key, v.ch, 0); st.i = i; steps.push(st); prev = v.pitches;
      } else {
        let bestInv = 0, bestCost = Infinity, bestPitches = null, bestCh = null;
        for (let inv = 0; inv < 3; inv++) {
          const v = voicingPitches(key, i, inv, prev[0]);
          const c = vlCost(prev, v.pitches);
          if (c < bestCost) { bestCost = c; bestInv = inv; bestPitches = v.pitches; bestCh = v.ch; }
        }
        const st = makeStep(key, bestCh, bestInv); st.i = i; steps.push(st); prev = bestPitches;
      }
    }
    return steps;
  }

  // Klassische Folgen + diatonische Stufenreihen (Stufen-Indizes 0..6).
  const PROGS_CLASSIC = [
    { name: 'I–IV–V–I', degs: [0, 3, 4, 0] },
    { name: 'ii–V–I', degs: [1, 4, 0] },
    { name: 'I–V–vi–IV', degs: [0, 4, 5, 3] },
    { name: 'vi–IV–I–V', degs: [5, 3, 0, 4] },
    { name: 'I–vi–IV–V', degs: [0, 5, 3, 4] }
  ];
  const PROGS_WALK = [
    { name: 'I→VII (Stufenreihe)', degs: [0, 1, 2, 3, 4, 5, 6, 0] },
    { name: 'Terzen-Reihe', degs: [0, 2, 4, 6, 1, 3, 5, 0] }
  ];

  /* ----------------------------------------------------------------
     2) UI-TEXTE
     ---------------------------------------------------------------- */
  const I18N = {
    de: {
      back: 'Übersicht',
      kicker: 'Music Academy · Übung',
      title: 'Inversionen am Klavier',
      subtitle: 'Diatonische Dreiklänge in jeder Tonart und jeder Umkehrung — sehen, vergleichen, am Klavier üben.',
      keyLabel: 'Tonart (Key)',
      hintToggle: '7. Stufe: 5/7-Hinweis',
      columns: ['Grundstellung', '1. Umkehrung', '2. Umkehrung'],
      stage: 'Stufe',
      quality: { maj: 'Dur', min: 'Moll', dim: 'vermindert' },
      legendTitle: 'Hintergrundfarbe = Akkordqualität',
      bass: 'Bass',
      sevenHint: function (slash, five, seven) {
        return 'Praktisch spielen wir die 7. Stufe als 5-Akkord (' + five + ') mit dem 7. Ton (' + seven + ') im Bass → ' + slash + '. Im Raster zeigen wir den reinen verminderten Dreiklang.';
      },
      notation: 'Internationale Schreibweise (B statt deutschem H).',
      // Modus
      modeGrid: 'Raster',
      modeDrill: 'Training',
      // Modal
      practice: 'Üben',
      targetNotes: 'Zieltöne',
      tapHint: 'Tippe die Tasten (oder spiel sie am MIDI-Keyboard) — wird automatisch grün, wenn richtig.',
      check: 'Prüfen',
      clear: 'Tasten leeren',
      close: 'Schließen',
      correct: 'Richtig gespielt!',
      missingLbl: 'fehlt noch',
      extraLbl: 'zu viel',
      none: '—',
      // MIDI
      midiOn: function (n) { return 'MIDI verbunden' + (n ? ': ' + n : ''); },
      midiOff: 'Kein MIDI-Gerät — du kannst auch tippen.',
      midiNo: 'Dieser Browser kann kein Web-MIDI (am besten Chrome/Edge). Tippen geht trotzdem.',
      bassHint: function (note) { return 'Richtige Töne — aber der tiefste Ton muss ' + note + ' sein.'; },
      // Drill
      drillIntro: 'Spiel die geforderte Umkehrung — am MIDI-Keyboard oder per Tippen. Richtig = grün, dann geht\'s automatisch weiter. Die Umkehrungen sind so gewählt, dass du möglichst wenig Finger bewegst (Stimmführung).',
      drillType: 'Übungstyp',
      typeMixed: 'Gemischt',
      typeWalk: 'Stufenreihen',
      typeClassic: 'Klassiker',
      drillKey: 'Tonart',
      keyRandom: 'Zufall',
      start: 'Training starten',
      stop: 'Stopp',
      playPrompt: 'Spiele',
      step: 'Schritt',
      waiting: 'Spiel den Akkord…',
      drillCorrect: 'Richtig! Weiter …',
      timeUp: 'Zeit um — so geht\'s:',
      hits: 'Treffer',
      seconds: 'Sek.'
    },
    en: {
      back: 'Overview',
      kicker: 'Music Academy · Practice',
      title: 'Inversions on the piano',
      subtitle: 'Diatonic triads in every key and every inversion — see, compare, practise on the piano.',
      keyLabel: 'Key',
      hintToggle: '7th degree: 5/7 hint',
      columns: ['Root position', '1st inversion', '2nd inversion'],
      stage: 'No.',
      quality: { maj: 'Major', min: 'Minor', dim: 'diminished' },
      legendTitle: 'Background colour = chord quality',
      bass: 'Bass',
      sevenHint: function (slash, five, seven) {
        return 'In practice we play the 7th degree as the 5 chord (' + five + ') with the 7th note (' + seven + ') in the bass → ' + slash + '. In the grid we show the pure diminished triad.';
      },
      notation: 'International notation (B, not the German H).',
      modeGrid: 'Grid',
      modeDrill: 'Training',
      practice: 'Practise',
      targetNotes: 'Target notes',
      tapHint: 'Tap the keys (or play them on a MIDI keyboard) — turns green automatically when correct.',
      check: 'Check',
      clear: 'Clear keys',
      close: 'Close',
      correct: 'Played correctly!',
      missingLbl: 'still missing',
      extraLbl: 'too many',
      none: '—',
      midiOn: function (n) { return 'MIDI connected' + (n ? ': ' + n : ''); },
      midiOff: 'No MIDI device — you can also tap.',
      midiNo: 'This browser has no Web MIDI (use Chrome/Edge). Tapping still works.',
      bassHint: function (note) { return 'Right notes — but the lowest note must be ' + note + '.'; },
      drillIntro: 'Play the requested inversion — on a MIDI keyboard or by tapping. Correct = green, then it advances automatically. Inversions are chosen so you move as few fingers as possible (voice leading).',
      drillType: 'Exercise',
      typeMixed: 'Mixed',
      typeWalk: 'Scale-step series',
      typeClassic: 'Classics',
      drillKey: 'Key',
      keyRandom: 'Random',
      start: 'Start training',
      stop: 'Stop',
      playPrompt: 'Play',
      step: 'Step',
      waiting: 'Play the chord…',
      drillCorrect: 'Correct! Next …',
      timeUp: 'Time\'s up — like this:',
      hits: 'Hits',
      seconds: 'sec'
    }
  };

  /* ----------------------------------------------------------------
     3) ZUSTAND
     ---------------------------------------------------------------- */
  const DRILL_SECONDS = 15;
  const state = {
    lang: 'de',
    keyId: 'C',
    showHint: true,
    mode: 'grid',         // 'grid' | 'drill'
    modal: null,          // { i, inv, positions, names, played:Set, feedback, midiPlayed:Set, midiMsg }
    midi: { supported: typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess, requested: false, deviceName: '', active: new Set() },
    drill: {
      running: false, type: 'mixed', keyMode: 'random',
      steps: [], index: 0, progName: '',
      deadline: 0, secondsLeft: DRILL_SECONDS,
      timerId: null, advanceId: null,
      revealing: false, locked: false, tap: new Set(), msg: null, hits: 0
    }
  };

  function t() { return I18N[state.lang]; }
  function getKey() { return KEYS.find(function (k) { return k.id === state.keyId; }); }
  const $ = function (id) { return document.getElementById(id); };
  function rnd() { return Math.random(); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function now() { return Date.now(); }

  /* ----------------------------------------------------------------
     4) KLAVIATUR-BAUSTEIN  (wiederverwendbar: Mini + groß + Drill)
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
      el.style.width = wd + 'px';
      el.style.height = ht + 'px';
      el.dataset.pos = p;
      if (fb) {
        if (fb.correct.has(p)) el.classList.add('is-correct');
        else if (fb.missing.has(p)) el.classList.add('is-missing');
        else if (fb.extra.has(p)) el.classList.add('is-extra');
        else if (opts.showTargetUnderFb && targetSet.has(p)) el.classList.add('is-target');
      } else {
        if (targetSet.has(p)) el.classList.add('is-target');
        if (played.has(p)) el.classList.add('is-played');
      }
      if (opts.rootPos === p) el.classList.add('is-root');   // Grundton markieren
      if (opts.labels && nameMap[p]) {
        const s = document.createElement('span');
        s.className = 'pkey-lbl';
        s.textContent = nameMap[p];
        el.appendChild(s);
      }
      if (opts.interactive) {
        el.type = 'button';
        var tap = opts.onTap || onKeyTap;
        el.addEventListener('click', function () { tap(p); });
      }
      return el;
    }

    let w = 0;
    const blacks = [];
    for (let p = 0; p < 24; p++) {
      const isBlack = BLACK_PC.indexOf(p % 12) !== -1;
      if (!isBlack) { wrap.appendChild(makeKey(p, 'w', whiteW, whiteH)); w++; }
      else { blacks.push({ p: p, left: w * whiteW - blackW / 2 }); }
    }
    wrap.style.width = (w * whiteW) + 'px';
    wrap.style.height = whiteH + 'px';
    blacks.forEach(function (b) {
      const k = makeKey(b.p, 'b', blackW, blackH);
      k.style.left = b.left + 'px';
      wrap.appendChild(k);
    });
    return wrap;
  }

  /* ----------------------------------------------------------------
     5) RASTER  (7 Stufen × 3 Umkehrungen)
     ---------------------------------------------------------------- */
  function renderGrid() {
    const key = getKey();
    const L = t();
    const grid = $('grid');
    if (!grid) return;
    grid.innerHTML = '';

    grid.appendChild(cell('ghead corner', ''));
    L.columns.forEach(function (c) {
      const h = cell('ghead', '');
      h.innerHTML = '<span class="ghead-txt">' + esc(c) + '</span>';
      grid.appendChild(h);
    });

    for (let i = 0; i < 7; i++) {
      const quality = QUAL[i];
      const label = chordLabel(key.scale[i], quality);

      const rl = cell('rowlabel q-' + quality, '');
      let rlHtml =
        '<span class="stage-num mono">' + L.stage + ' ' + (i + 1) + '</span>' +
        '<span class="chord-name">' + esc(label) + '</span>' +
        '<span class="q-tag"><span class="q-dot q-dot-' + quality + '"></span>' + esc(L.quality[quality]) + '</span>';
      if (i === 6 && state.showHint) {
        const five = key.scale[4];
        const seven = key.scale[6];
        const slash = five + '/' + seven;
        rlHtml += '<span class="seven-badge mono" title="' + esc(L.sevenHint(slash, chordLabel(five, 'maj'), seven)) + '">5/7 → ' + esc(slash) + '</span>';
      }
      rl.innerHTML = rlHtml;
      grid.appendChild(rl);

      for (let inv = 0; inv < 3; inv++) {
        const ch = computeChord(key, i, inv);
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'cell q-' + quality;
        c.dataset.i = i;
        c.dataset.inv = inv;
        c.addEventListener('click', function () {
          openModal(parseInt(this.dataset.i, 10), parseInt(this.dataset.inv, 10));
        });

        const kb = buildKeyboard(ch.positions, { whiteW: 12, rootPos: ch.rootPos });
        c.appendChild(kb);

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

  function cell(cls, html) {
    const d = document.createElement('div');
    d.className = cls;
    if (html) d.innerHTML = html;
    return d;
  }

  /* ----------------------------------------------------------------
     6) CONTROLS + LEGENDE  (Raster-Modus)
     ---------------------------------------------------------------- */
  function renderControls() {
    const L = t();
    const c = $('controls');
    if (!c) return;
    c.innerHTML = '';

    const keyBlock = document.createElement('div');
    keyBlock.className = 'ctrl-block';
    keyBlock.innerHTML = '<div class="ctrl-label mono">' + esc(L.keyLabel) + '</div>';
    const keyRow = document.createElement('div');
    keyRow.className = 'keyrow';
    KEYS.forEach(function (k) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'keybtn mono' + (k.id === state.keyId ? ' is-active' : '');
      b.textContent = k.id;
      b.addEventListener('click', function () {
        state.keyId = k.id; renderControls(); renderGrid();
      });
      keyRow.appendChild(b);
    });
    keyBlock.appendChild(keyRow);
    c.appendChild(keyBlock);

    const hintBlock = document.createElement('label');
    hintBlock.className = 'switch';
    hintBlock.innerHTML =
      '<input type="checkbox" id="hintChk"' + (state.showHint ? ' checked' : '') + ' />' +
      '<span class="switch-track"><span class="switch-knob"></span></span>' +
      '<span class="switch-text mono">' + esc(L.hintToggle) + '</span>';
    c.appendChild(hintBlock);
    $('hintChk').addEventListener('change', function () {
      state.showHint = this.checked; renderGrid();
    });
  }

  function renderLegend() {
    const L = t();
    const el = $('legend');
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
  function targetInfo(positions) {
    return { pcs: positions.map(pcOf), bassPc: pcOf(positions[0]) };
  }
  // notes: aufsteigend sortierte Liste (MIDI-Noten ODER Tastatur-Positionen).
  // → 'correct' | 'bass' (richtige Töne, falscher Bass) | 'partial' | 'none'
  function matchInversion(notes, positions) {
    if (!notes || notes.length === 0) return 'none';
    const tgt = targetInfo(positions);
    const heldPcs = [];
    notes.forEach(function (n) { const pc = pcOf(n); if (heldPcs.indexOf(pc) < 0) heldPcs.push(pc); });
    const tgtSet = new Set(tgt.pcs);
    const allPresent = tgt.pcs.every(function (pc) { return heldPcs.indexOf(pc) >= 0; });
    const noExtra = heldPcs.every(function (pc) { return tgtSet.has(pc); });
    if (allPresent && noExtra) {
      return pcOf(notes[0]) === tgt.bassPc ? 'correct' : 'bass';
    }
    return 'partial';
  }
  // Gespielte Töne → Anzeige-Positionen (0..23) zum Hervorheben.
  function playedDisplayPositions(notes, positions) {
    const byPc = {};
    positions.forEach(function (p) { byPc[pcOf(p)] = p; });
    const set = new Set();
    notes.forEach(function (n) {
      const pc = pcOf(n);
      set.add(byPc[pc] !== undefined ? byPc[pc] : pc);
    });
    return set;
  }
  function heldNotes() {
    return Array.from(state.midi.active).sort(function (a, b) { return a - b; });
  }

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
    access.inputs.forEach(function (input) {
      input.onmidimessage = handleMidi;
      if (input.name) names.push(input.name);
    });
    state.midi.deviceName = names.join(', ');
    updateMidiStatus();
  }
  function handleMidi(msg) {
    const cmd = msg.data[0] & 0xf0, note = msg.data[1], vel = msg.data[2];
    if (cmd === 0x90 && vel > 0) state.midi.active.add(note);
    else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) state.midi.active.delete(note);
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
    const L = t(), m = state.midi;
    const cls = !m.supported ? 'is-no' : (m.deviceName ? 'is-on' : 'is-off');
    document.querySelectorAll('.midi-status').forEach(function (el) {
      el.textContent = (m.deviceName && m.supported ? '🎹 ' : '') + midiStatusText();
      el.className = 'midi-status mono ' + cls;
    });
  }

  /* ----------------------------------------------------------------
     9) MODAL  (große Klaviatur, antippen ODER MIDI → automatisch grün)
     ---------------------------------------------------------------- */
  function openModal(i, inv) {
    const key = getKey();
    const ch = computeChord(key, i, inv);
    state.modal = {
      i: i, inv: inv,
      positions: ch.positions, names: ch.names,
      rootName: ch.rootName, rootIndex: ch.rootIndex, rootPos: ch.rootPos,
      quality: ch.quality,
      played: new Set(), feedback: null, midiPlayed: new Set(), midiMsg: null
    };
    initMidi();
    renderModal();
  }
  function closeModal() {
    state.modal = null;
    const r = $('modalRoot'); if (r) r.innerHTML = '';
  }
  function onKeyTap(pos) {
    const m = state.modal;
    if (!m) return;
    if (m.played.has(pos)) m.played.delete(pos); else m.played.add(pos);
    m.feedback = null; m.midiMsg = null;
    renderModal();
  }
  function checkModal() {
    const m = state.modal;
    if (!m) return;
    const target = new Set(m.positions);
    const correct = new Set(), missing = new Set(), extra = new Set();
    target.forEach(function (p) { (m.played.has(p) ? correct : missing).add(p); });
    m.played.forEach(function (p) { if (!target.has(p)) extra.add(p); });
    m.feedback = { correct: correct, missing: missing, extra: extra, ok: missing.size === 0 && extra.size === 0 };
    renderModal();
  }
  // MIDI-Eingang live im Modal: hervorheben + automatisch prüfen.
  function midiUpdateModal() {
    const m = state.modal;
    if (!m) return;
    const notes = heldNotes();
    m.midiPlayed = playedDisplayPositions(notes, m.positions);
    const verdict = matchInversion(notes, m.positions);
    if (verdict === 'correct') {
      m.feedback = { correct: new Set(m.positions), missing: new Set(), extra: new Set(), ok: true };
      m.midiMsg = null;
    } else if (verdict === 'bass') {
      m.feedback = null; m.midiMsg = t().bassHint(m.names[0]);
    } else {
      m.feedback = null; m.midiMsg = null;
    }
    renderModal();
  }

  function renderModal() {
    const m = state.modal;
    const root = $('modalRoot');
    if (!root) return;
    if (!m) { root.innerHTML = ''; return; }
    const L = t();
    const key = getKey();
    const label = chordLabel(m.rootName, m.quality);

    const nameMap = {};
    m.positions.forEach(function (p, idx) { nameMap[p] = m.names[idx]; });

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
    const kb = buildKeyboard(m.positions, {
      whiteW: 40, interactive: true, labels: true,
      played: playedSet, feedback: m.feedback, nameMap: nameMap, rootPos: m.rootPos
    });
    kbWrap.appendChild(kb);
    panel.appendChild(kbWrap);

    const status = document.createElement('div');
    status.className = 'midi-status mono';
    panel.appendChild(status);

    const msg = document.createElement('div');
    msg.className = 'modal-msg';
    if (m.feedback) {
      if (m.feedback.ok) { msg.className += ' is-ok'; msg.textContent = '✓ ' + L.correct; }
      else {
        msg.className += ' is-bad';
        const parts = [];
        if (m.feedback.missing.size) parts.push(namesOf(m.feedback.missing, nameMap) + ' ' + L.missingLbl);
        if (m.feedback.extra.size) parts.push(m.feedback.extra.size + '× ' + L.extraLbl);
        msg.textContent = parts.join(' · ');
      }
    } else if (m.midiMsg) {
      msg.className += ' is-bad'; msg.textContent = m.midiMsg;
    } else {
      msg.textContent = L.tapHint;
    }
    panel.appendChild(msg);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML =
      '<button class="btn btn-primary" id="mCheck" type="button">' + esc(L.check) + '</button>' +
      '<button class="btn btn-ghost" id="mClear" type="button">' + esc(L.clear) + '</button>';
    panel.appendChild(actions);
    actions.querySelector('#mCheck').addEventListener('click', checkModal);
    actions.querySelector('#mClear').addEventListener('click', function () {
      m.played.clear(); m.midiPlayed = new Set(); m.feedback = null; m.midiMsg = null; renderModal();
    });

    back.appendChild(panel);
    root.appendChild(back);
    updateMidiStatus();
  }

  function namesOf(set, nameMap) {
    return Array.from(set).sort(function (a, b) { return a - b; })
      .map(function (p) { return nameMap[p] || ('#' + p); }).join(', ');
  }

  /* ----------------------------------------------------------------
     10) DRILL  (Training: getaktet, Stimmführung, auto-weiter)
     ---------------------------------------------------------------- */
  function buildProgression() {
    const d = state.drill;
    const key = d.keyMode === 'random' ? pick(KEYS) : (KEYS.find(function (k) { return k.id === d.keyMode; }) || KEYS[0]);
    let type = d.type;
    if (type === 'mixed') type = rnd() < 0.5 ? 'walk' : 'classic';
    const prog = type === 'walk' ? pick(PROGS_WALK) : pick(PROGS_CLASSIC);
    d.progName = key.id + ' · ' + prog.name;
    return smartSteps(key, prog.degs);
  }

  function startDrill() {
    const d = state.drill;
    stopDrillTimers();
    d.running = true; d.hits = 0;
    d.steps = buildProgression(); d.index = 0;
    newPrompt(false);
  }
  function stopDrill() {
    const d = state.drill;
    d.running = false; d.revealing = false; d.locked = false;
    stopDrillTimers();
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
    if (advance) {
      d.index++;
      if (d.index >= d.steps.length) { d.steps = buildProgression(); d.index = 0; }
    }
    d.revealing = false; d.locked = false; d.tap = new Set(); d.msg = null;
    d.secondsLeft = DRILL_SECONDS; d.deadline = now() + DRILL_SECONDS * 1000;
    d.timerId = setInterval(tickDrill, 100);
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
    if (d.tap.has(pos)) d.tap.delete(pos); else d.tap.add(pos);
    checkDrill();
  }
  function checkDrill() {
    const d = state.drill;
    if (!d.running || d.revealing || d.locked) return;
    const step = d.steps[d.index];
    if (!step) return;
    const notes = currentInput();
    const verdict = matchInversion(notes, step.positions);
    if (verdict === 'correct') { onDrillCorrect(); return; }
    if (verdict === 'bass') d.msg = t().bassHint(step.names[0]);
    else d.msg = null;
    updateDrillBoard();
  }
  function onDrillCorrect() {
    const d = state.drill;
    d.locked = true; d.hits++;
    d.msg = t().drillCorrect;
    stopDrillTimers();
    updateDrillBoard(true);
    d.advanceId = setTimeout(function () { newPrompt(true); }, 950);
  }
  function onDrillTimeout() {
    const d = state.drill;
    d.locked = true; d.revealing = true;
    d.msg = t().timeUp;
    stopDrillTimers();
    updateDrillBoard();
    d.advanceId = setTimeout(function () { newPrompt(false); }, 2400); // gleiche Aufgabe nochmal
  }

  function renderDrill() {
    const host = $('drillView');
    if (!host) return;
    const L = t(), d = state.drill;
    host.innerHTML = '';

    // --- Steuerleiste ---
    const ctr = document.createElement('div');
    ctr.className = 'drill-controls';
    const types = [['mixed', L.typeMixed], ['walk', L.typeWalk], ['classic', L.typeClassic]];
    const typeSeg = document.createElement('div');
    typeSeg.className = 'seg-block';
    typeSeg.innerHTML = '<div class="ctrl-label mono">' + esc(L.drillType) + '</div>';
    const segRow = document.createElement('div'); segRow.className = 'seg';
    types.forEach(function (tp) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'segbtn mono' + (d.type === tp[0] ? ' is-active' : '');
      b.textContent = tp[1];
      b.addEventListener('click', function () { d.type = tp[0]; if (d.running) startDrill(); else renderDrill(); });
      segRow.appendChild(b);
    });
    typeSeg.appendChild(segRow);
    ctr.appendChild(typeSeg);

    // Tonart
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

    // Start/Stop
    const action = document.createElement('div');
    action.className = 'seg-block seg-action';
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'btn ' + (d.running ? 'btn-ghost' : 'btn-primary');
    startBtn.textContent = d.running ? L.stop : L.start;
    startBtn.addEventListener('click', function () { if (d.running) stopDrill(); else { initMidi(); startDrill(); } });
    action.appendChild(startBtn);
    ctr.appendChild(action);

    host.appendChild(ctr);

    // --- MIDI-Status ---
    const status = document.createElement('div');
    status.className = 'midi-status mono';
    host.appendChild(status);

    if (!d.running) {
      const intro = document.createElement('p');
      intro.className = 'drill-intro';
      intro.textContent = L.drillIntro;
      host.appendChild(intro);
      updateMidiStatus();
      return;
    }

    // --- Aufgabe ---
    const step = d.steps[d.index];
    const card = document.createElement('div');
    card.className = 'drill-prompt';
    card.innerHTML =
      '<div class="dp-top mono"><span>' + esc(step.key.id) + ' · ' + esc(d.progName) + '</span>' +
      '<span class="dp-step">' + esc(L.step) + ' ' + (d.index + 1) + '/' + d.steps.length + ' · ' + esc(L.hits) + ' ' + d.hits + '</span></div>' +
      '<div class="dp-main"><span class="dp-lbl mono">' + esc(L.playPrompt) + '</span> ' +
      '<span class="dp-chord">' + esc(step.label) + '</span> ' +
      '<span class="dp-inv">' + esc(L.columns[step.inv]) + '</span></div>';
    host.appendChild(card);

    // Timer
    const timer = document.createElement('div');
    timer.className = 'drill-timer';
    timer.innerHTML = '<div class="dt-track"><div id="drillBar" class="dt-bar"></div></div><span id="drillSecs" class="dt-secs mono">' + d.secondsLeft + ' ' + esc(L.seconds) + '</span>';
    host.appendChild(timer);

    // Board
    const board = document.createElement('div');
    board.className = 'drill-board'; board.id = 'drillBoard';
    host.appendChild(board);

    // Nachricht
    const msg = document.createElement('div');
    msg.className = 'drill-msg'; msg.id = 'drillMsg';
    host.appendChild(msg);

    updateDrillBoard();
    updateMidiStatus();
    const bar = $('drillBar');
    if (bar) bar.style.width = (Math.max(0, d.deadline - now()) / (DRILL_SECONDS * 1000) * 100) + '%';
  }

  // Nur Board + Nachricht aktualisieren (ohne Steuerleiste/Timer neu zu bauen).
  function updateDrillBoard(correct) {
    const d = state.drill;
    const board = $('drillBoard');
    if (!board) return;
    const step = d.steps[d.index];
    const notes = currentInput();
    let feedback = null, showTarget = false;
    if (correct) {
      feedback = { correct: new Set(step.positions), missing: new Set(), extra: new Set(), ok: true };
    } else if (d.revealing) {
      // Antwort zeigen (Zieltasten markiert)
      showTarget = true;
    }
    const played = showTarget ? new Set() : playedDisplayPositions(notes, step.positions);
    board.innerHTML = '';
    const kb = buildKeyboard(showTarget ? step.positions : [], {
      whiteW: 38, interactive: true, onTap: onDrillTap,
      played: played, feedback: feedback, rootPos: d.revealing ? step.rootPos : undefined
    });
    board.appendChild(kb);

    const msg = $('drillMsg');
    if (msg) {
      let cls = 'drill-msg', text = d.msg || t().waiting;
      if (correct) cls += ' is-ok';
      else if (d.revealing) cls += ' is-reveal';
      else if (d.msg) cls += ' is-bad';
      msg.className = cls; msg.textContent = (correct ? '✓ ' : '') + text;
    }
  }

  /* ----------------------------------------------------------------
     11) MODUS-UMSCHALTER
     ---------------------------------------------------------------- */
  function renderModeSwitch() {
    const el = $('modeswitch');
    if (!el) return;
    const L = t();
    el.innerHTML = '';
    [['grid', L.modeGrid], ['drill', L.modeDrill]].forEach(function (mo) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'modebtn mono' + (state.mode === mo[0] ? ' is-active' : '');
      b.textContent = mo[1];
      b.addEventListener('click', function () { setMode(mo[0]); });
      el.appendChild(b);
    });
  }
  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode !== 'drill') stopDrill();
    applyMode();
    renderModeSwitch();
  }
  function applyMode() {
    const gv = $('gridView'), dv = $('drillView');
    if (!gv || !dv) return;
    if (state.mode === 'drill') {
      gv.hidden = true; dv.hidden = false;
      initMidi();
      renderDrill();
    } else {
      dv.hidden = true; gv.hidden = false;
      stopDrillTimers();
    }
  }

  /* ----------------------------------------------------------------
     12) SPRACHE + STATISCHE TEXTE
     ---------------------------------------------------------------- */
  function applyStaticTexts() {
    const L = t();
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i]').forEach(function (el) {
      const k = el.getAttribute('data-i');
      if (L[k]) el.textContent = L[k];
    });
    if ($('title')) $('title').textContent = L.title;
    if ($('subtitle')) $('subtitle').textContent = L.subtitle;
    if ($('notation')) $('notation').textContent = L.notation;
  }

  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem('tt_lang', lang); } catch (e) {}
    applyStaticTexts();
    renderModeSwitch();
    renderControls();
    renderLegend();
    renderGrid();
    if (state.mode === 'drill') renderDrill();
    if (state.modal) renderModal();
    updateMidiStatus();
  }

  /* ----------------------------------------------------------------
     13) HELFER
     ---------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------------
     14) START
     ---------------------------------------------------------------- */
  let escWired = false;
  function mount(root) {
    try {
      const saved = localStorage.getItem('tt_lang');
      if (saved === 'de' || saved === 'en') state.lang = saved;
    } catch (e) {}
    // Transient-State bei (Re-)Mount sauber zurücksetzen — aber den gewählten
    // Modus (Raster/Training) behalten, damit ein Sprachwechsel den Tab nicht
    // wegreißt. Ein laufender Drill wird gestoppt (frischer Start-Screen).
    stopDrillTimers();
    state.modal = null;
    state.drill.running = false; state.drill.revealing = false; state.drill.locked = false;

    root.classList.add('invtrainer');
    root.innerHTML =
      '<div class="kicker" data-i="kicker"></div>' +
      '<h1 id="title" class="title"></h1>' +
      '<p id="subtitle" class="sub"></p>' +
      '<div id="modeswitch" class="modeswitch"></div>' +
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
    renderModeSwitch();
    renderControls();
    renderLegend();
    renderGrid();
    applyMode();
  }

  // Exportiert für App-Einbettung + Tests:
  window.InversionTrainer = {
    mount: mount, setLang: setLang,
    KEYS: KEYS, computeChord: computeChord, chordLabel: chordLabel,
    smartSteps: smartSteps, matchInversion: matchInversion, state: state,
    // Test-Hook: MIDI-Eingang simulieren (Array von MIDI-Noten = gerade gedrückt).
    _simMidi: function (arr) { state.midi.active = new Set(arr || []); onMidiChange(); }
  };
})();
