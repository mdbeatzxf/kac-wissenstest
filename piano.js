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
  // 28 gängige Folgen — Namen automatisch aus den Stufen (Stimmführung wählt die Lagen).
  const ROMAN_DEG = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const CLASSIC_DEGS = [
    [0, 3, 4, 0], [1, 4, 0], [0, 4, 5, 3], [5, 3, 0, 4], [0, 5, 3, 4],
    [0, 3, 5, 4], [0, 5, 1, 4], [0, 4, 3, 4], [3, 4, 0], [0, 2, 5, 3],
    [1, 4, 0, 5], [5, 1, 4, 0], [0, 3, 1, 4], [0, 2, 3, 4], [5, 4, 3, 0],
    [0, 3, 4, 5], [3, 4, 2, 5], [2, 5, 1, 4], [0, 5, 2, 3], [3, 0, 4, 5],
    [0, 1, 2, 3], [5, 3, 4, 0], [0, 3, 0, 4], [1, 3, 4, 0], [0, 5, 3, 4, 0],
    [3, 4, 5, 0], [1, 5, 3, 4], [0, 3, 4, 5, 0]
  ];
  const PROGS_CLASSIC = CLASSIC_DEGS.map(function (degs) {
    return { name: degs.map(function (d) { return ROMAN_DEG[d]; }).join('–'), degs: degs };
  });

  /* ----------------------------------------------------------------
     2) UI-TEXTE
     ---------------------------------------------------------------- */
  const I18N = {
    de: {
      kicker: 'Music Academy · Übung',
      title: 'Akkorde & Umkehrungen am Klavier',
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
      hits: 'Treffer', seconds: 'Sek.', skip: 'Weiter →', tip: 'Tipp', withHint: function (n) { return 'davon ' + n + ' mit Tipp'; },
      result: 'Auswertung', accuracy: 'Trefferquote', avgTime: 'Ø Zeit pro Aufgabe',
      byInversion: 'Nach Umkehrung', again: 'Nochmal', backStart: 'Zurück', savedLocal: 'Ergebnis lokal gespeichert.',
      backChoose: 'Auswahl', tileGo: 'Weiter', cfgMode: 'Modus', startBtn: 'Training starten',
      timerSwitch: 'Timer 15 s pro Frage',
      tileOverview: 'Übersicht', tileOverviewSub: 'Alle Stufen & Umkehrungen im Raster — antippen oder am MIDI-Keyboard spielen.',
      tilePractice: 'Üben', tilePracticeSub: 'Ohne Druck üben, läuft endlos — Timer optional.',
      tileQuiz: 'Quiz', tileQuizSub: '20 Fragen mit Timer — am Ende deine Auswertung.',
      descWalk: 'Eine Akkordfolge, die in Quint-Schritten durch die Tonleiter wandert. Jede Stufe in der Umkehrung mit der geringsten Fingerbewegung — du übst alle Umkehrungen, nicht nur die Grundstellung.',
      descClassic: 'Bekannte Akkordfolgen wie I–IV–V–I oder ii–V–I, jeweils in der stimmführungs-freundlichen Lage.',
      descMixed: 'Zufällige Mischung aus Stufenreihen und Klassikern.',
      timerLockedTitle: 'Timer 15 s pro Frage — beim Quiz immer an.',
      timerLockedSub: 'Im Quiz-Modus läuft der Timer fest mit und lässt sich nicht abschalten.'
    },
    en: {
      kicker: 'Music Academy · Practice',
      title: 'Chords & Inversions on the piano',
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
      hits: 'Hits', seconds: 'sec', skip: 'Next →', tip: 'Hint', withHint: function (n) { return n + ' with hint'; },
      result: 'Result', accuracy: 'Accuracy', avgTime: 'Avg time per question',
      byInversion: 'By inversion', again: 'Again', backStart: 'Back', savedLocal: 'Result saved locally.',
      backChoose: 'Menu', tileGo: 'Next', cfgMode: 'Mode', startBtn: 'Start training',
      timerSwitch: 'Timer 15 s per question',
      tileOverview: 'Overview', tileOverviewSub: 'All degrees & inversions in the grid — tap or play on a MIDI keyboard.',
      tilePractice: 'Practice', tilePracticeSub: 'Practise without pressure, runs endlessly — timer optional.',
      tileQuiz: 'Quiz', tileQuizSub: '20 questions with timer — your result at the end.',
      descWalk: 'A chord sequence moving through the scale in fifths. Each degree in the inversion with the least finger movement — you practise all inversions, not just root position.',
      descClassic: 'Well-known progressions like I–IV–V–I or ii–V–I, each in the voice-leading-friendly position.',
      descMixed: 'Random mix of scale-step series and classics.',
      timerLockedTitle: 'Timer 15 s per question — always on in Quiz.',
      timerLockedSub: 'In Quiz mode the timer runs fixed and cannot be switched off.'
    }
  };

  /* ----------------------------------------------------------------
     3) ZUSTAND
     ---------------------------------------------------------------- */
  const DRILL_SECONDS = 15;
  const HINT_DELAY = 10000;   // Üben: Zieltasten faden nach 10 s blass ein
  const DRILL_SAVE_URL = ''; // TODO: Google Apps Script / Server-Endpoint zum zentralen Sammeln.
  const state = {
    lang: 'de', keyId: 'C', showHint: true, view: 'home', sound: true,
    modal: null,
    midi: { supported: typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess, requested: false, deviceName: '', active: new Set() },
    drill: {
      running: false, finished: false,
      type: 'walk', format: 'practice', timerOn: true, keyMode: 'random',
      steps: [], index: 0, progName: '',
      deadline: 0, secondsLeft: DRILL_SECONDS, questionStart: 0,
      timerId: null, advanceId: null, assistId: null,
      revealing: false, locked: false, tap: new Set(), msg: null,
      hintOn: false, hintOpacity: 0, tipUsed: false, hintedThisQ: false,
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
        if (targetSet.has(p)) el.classList.add(opts.targetClass || 'is-target');
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
    else if (state.view === 'drill' && state.drill.running) checkDrill();
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
  }
  function stopDrillTimers() {
    const d = state.drill;
    if (d.timerId) { clearInterval(d.timerId); d.timerId = null; }
    if (d.advanceId) { clearTimeout(d.advanceId); d.advanceId = null; }
    if (d.assistId) { clearInterval(d.assistId); d.assistId = null; }
  }
  function newPrompt(advance) {
    const d = state.drill;
    stopDrillTimers();
    if (advance) { d.index++; if (d.index >= d.steps.length) { d.steps = buildProgression(); d.index = 0; } }
    d.revealing = false; d.locked = false; d.tap = new Set(); d.msg = null; d.questionStart = now();
    d.hintOn = false; d.hintOpacity = 0; d.tipUsed = false; d.hintedThisQ = false;
    if (d.timerOn) { d.secondsLeft = DRILL_SECONDS; d.deadline = now() + DRILL_SECONDS * 1000; d.timerId = setInterval(tickDrill, 100); }
    d.assistId = setInterval(assistTick, 250);   // Auto-Fade-Hilfe (Üben) + Tipp
    renderDrill();
  }
  // Blendet die Zieltasten gestuft ein: im Üben-Modus automatisch nach HINT_DELAY,
  // per Tipp-Knopf sofort. Im Quiz nur per Tipp.
  function assistTick() {
    const d = state.drill;
    if (!$('drillView') || !d.running || d.revealing || d.locked) return;
    let op = 0;
    if (d.tipUsed) op = 0.55;
    else if (d.format !== 'quiz') {
      const elapsed = now() - d.questionStart;
      if (elapsed >= HINT_DELAY) op = 0.14 + Math.min(1, (elapsed - HINT_DELAY) / 8000) * (0.5 - 0.14);
    }
    const show = op > 0;
    if (show !== d.hintOn) { d.hintOn = show; d.hintOpacity = op; updateDrillBoard(); }
    else if (show) { d.hintOpacity = op; const b = $('drillBoard'); if (b) b.style.setProperty('--hint-op', op.toFixed(3)); }
  }
  function onTip() {
    const d = state.drill;
    if (!d.running || d.revealing || d.locked) return;
    d.tipUsed = true; d.hintedThisQ = true;
    assistTick();
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
      d.results.push({ hit: hit, timeMs: now() - d.questionStart, key: step.key.id, label: step.label, inv: step.inv, hinted: d.hintedThisQ });
      d.quizIndex++;
      if (d.quizIndex >= d.quizTotal) { finishQuiz(); return; }
      newPrompt(true);
    } else {
      newPrompt(advance);
    }
  }

  // Laufender Drill (Steuerung liegt jetzt im Konfig-Screen).
  function renderDrill() {
    const host = $('drillView');
    if (!host) return;
    const L = t(), d = state.drill;

    if (d.finished) { renderResult(host); updateMidiStatus(); return; }
    if (!d.running) { host.innerHTML = ''; return; }

    const step = d.steps[d.index];
    const counter = d.format === 'quiz'
      ? (L.question + ' ' + (d.quizIndex + 1) + '/' + d.quizTotal + ' · ' + L.hits + ' ' + d.hits)
      : (L.step + ' ' + (d.index + 1) + ' · ' + L.hits + ' ' + d.hits);

    let html =
      backLink('drillBack', L.backChoose) +
      '<div class="iv-modekick mono">' + esc(L.cfgMode) + ' · ' + esc(d.format === 'quiz' ? L.tileQuiz : L.tilePractice) + '</div>' +
      '<div class="drill-prompt">' +
        '<div class="dp-top mono"><span>' + esc(step.key.id) + ' · ' + esc(d.progName) + '</span>' +
        '<span class="dp-step">' + esc(counter) + '</span></div>' +
        '<div class="dp-main"><span class="dp-lbl mono">' + esc(L.playPrompt) + '</span> ' +
        '<span class="dp-chord">' + esc(step.label) + '</span> ' +
        '<span class="dp-inv">' + esc(L.columns[step.inv]) + '</span></div>' +
      '</div>';
    if (d.timerOn) {
      html += '<div class="drill-timer"><div class="dt-track"><div id="drillBar" class="dt-bar"></div></div>' +
              '<span id="drillSecs" class="dt-secs mono">' + d.secondsLeft + ' ' + esc(L.seconds) + '</span></div>';
    }
    html += '<div class="drill-board" id="drillBoard"></div>' +
            '<div class="drill-msg" id="drillMsg"></div>' +
            '<div class="drill-skip">' +
              '<button class="btn btn-ghost" id="tipBtn" type="button">' + esc(L.tip) + '</button>' +
              '<button class="btn btn-ghost" id="skipBtn" type="button">' + esc(L.skip) + '</button>' +
            '</div>' +
            '<div class="midi-status mono"></div>';
    host.innerHTML = html;

    $('drillBack').addEventListener('click', function () { stopDrill(); showView('config'); });
    $('tipBtn').addEventListener('click', onTip);
    $('skipBtn').addEventListener('click', onSkip);

    updateDrillBoard();
    updateMidiStatus();
    const bar = $('drillBar');
    if (bar) bar.style.width = (Math.max(0, d.deadline - now()) / (DRILL_SECONDS * 1000) * 100) + '%';
  }

  function updateDrillBoard(correct) {
    const d = state.drill, board = $('drillBoard');
    if (!board) return;
    const step = d.steps[d.index];
    let feedback = null, showTarget = false, ghost = false;
    if (correct) feedback = { correct: new Set(step.positions), missing: new Set(), extra: new Set(), ok: true };
    else if (d.revealing) showTarget = true;
    else if (d.hintOn) ghost = true;
    const played = showTarget ? new Set() : playedDisplayPositions(currentInput(), step.positions);
    board.innerHTML = '';
    board.appendChild(buildKeyboard((showTarget || ghost) ? step.positions : [], {
      whiteW: 38, interactive: true, onTap: onDrillTap,
      played: played, feedback: feedback,
      targetClass: ghost ? 'is-hint' : 'is-target',
      rootPos: d.revealing ? step.rootPos : undefined
    }));
    if (ghost) board.style.setProperty('--hint-op', (d.hintOpacity || 0.14).toFixed(3));
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
    const hinted = d.results.filter(function (r) { return r.hinted; }).length;
    const rec = { ts: now(), name: participantName(), exercise: d.type, keyMode: d.keyMode, total: total, hits: hits, pct: pct, hinted: hinted, durationMs: dur, results: d.results.slice() };
    saveDrillResult(rec); d.lastRecord = rec;
    renderDrill();
  }
  function renderResult(host) {
    const L = t(), d = state.drill, rec = d.lastRecord || { total: 0, hits: 0, pct: 0, durationMs: 0, results: [] };
    const avg = rec.results.length ? Math.round(rec.durationMs / rec.results.length / 100) / 10 : 0;
    const hintedCount = rec.results.filter(function (r) { return r.hinted; }).length;
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
      '<div class="res-meta mono">' + esc(L.accuracy) + ': ' + rec.pct + '% · ' + esc(L.avgTime) + ': ' + avg + ' ' + esc(L.seconds) + (hintedCount ? ' · ' + esc(L.withHint(hintedCount)) : '') + '</div>' +
      '<div class="res-byinv"><div class="ctrl-label mono">' + esc(L.byInversion) + '</div>' + invHtml + '</div>' +
      '<div class="res-saved mono">' + esc(L.savedLocal) + '</div>' +
      '<div class="modal-actions res-actions">' +
        '<button class="btn btn-primary" id="resAgain" type="button">' + esc(L.again) + '</button>' +
        '<button class="btn btn-ghost" id="resBack" type="button">' + esc(L.backStart) + '</button>' +
      '</div>';
    host.innerHTML = '';
    host.appendChild(panel);
    $('resAgain').addEventListener('click', function () { ensureAudio(); startDrill(); showView('drill'); });
    $('resBack').addEventListener('click', function () { stopDrill(); showView('home'); });
  }

  /* ----------------------------------------------------------------
     11) NAVIGATION  (Kacheln · Übersicht/Raster · Konfig · Drill) + SOUND
     ---------------------------------------------------------------- */
  const ICON_GRID =
    '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
    '<rect x="13" y="13" width="16" height="16" stroke="#16150f" stroke-width="2"/>' +
    '<rect x="35" y="13" width="16" height="16" stroke="#16150f" stroke-width="2"/>' +
    '<rect x="13" y="35" width="16" height="16" stroke="#16150f" stroke-width="2"/>' +
    '<rect x="35" y="35" width="16" height="16" stroke="#16150f" stroke-width="2"/></svg>';
  const ICON_LOOP =
    '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
    '<path d="M32 32 C 28 24, 17 24, 17 32 C 17 40, 28 40, 32 32 C 36 24, 47 24, 47 32 C 47 40, 36 40, 32 32 Z" stroke="#16150f" stroke-width="2" stroke-linejoin="miter"/></svg>';
  const ICON_WATCH =
    '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
    '<circle cx="32" cy="38" r="17" stroke="#16150f" stroke-width="2"/>' +
    '<line x1="32" y1="38" x2="32" y2="27" stroke="#16150f" stroke-width="2"/>' +
    '<line x1="32" y1="38" x2="40" y2="42" stroke="#16150f" stroke-width="2"/>' +
    '<line x1="26" y1="13" x2="38" y2="13" stroke="#16150f" stroke-width="2"/>' +
    '<line x1="32" y1="13" x2="32" y2="20" stroke="#16150f" stroke-width="2"/>' +
    '<line x1="47" y1="22" x2="51" y2="18" stroke="#16150f" stroke-width="2"/></svg>';
  const ICON_LOCK =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<rect x="5" y="11" width="14" height="9" stroke="#2a63b0" stroke-width="1.8"/>' +
    '<path d="M8 11 V8 a4 4 0 0 1 8 0 V11" stroke="#2a63b0" stroke-width="1.8"/></svg>';

  function backLink(id, label) {
    return '<button class="iv-back" id="' + id + '" type="button"><span class="iv-arr">←</span> ' + esc(label) + '</button>';
  }

  /* --- Startseite: drei Kacheln --- */
  function renderHome() {
    const host = $('homeView');
    if (!host) return;
    const L = t();
    host.innerHTML =
      '<div class="tiles">' +
        tileHTML('overview', ICON_GRID, L.tileOverview, L.tileOverviewSub, L.tileGo) +
        tileHTML('practice', ICON_LOOP, L.tilePractice, L.tilePracticeSub, L.tileGo) +
        tileHTML('quiz', ICON_WATCH, L.tileQuiz, L.tileQuizSub, L.tileGo) +
      '</div>';
    host.querySelectorAll('.tile').forEach(function (b) {
      b.addEventListener('click', function () {
        ensureAudio();
        const which = b.getAttribute('data-tile');
        if (which === 'overview') { showView('raster'); }
        else {
          state.drill.format = (which === 'quiz') ? 'quiz' : 'practice';
          if (which === 'quiz') state.drill.timerOn = true;
          showView('config');
        }
      });
    });
  }
  function tileHTML(id, icon, title, sub, go) {
    return '<button class="tile" type="button" data-tile="' + id + '">' +
      '<span class="tile-icon">' + icon + '</span>' +
      '<span class="tile-title">' + esc(title) + '</span>' +
      '<span class="tile-sub">' + esc(sub) + '</span>' +
      '<span class="tile-go mono">' + esc(go) + ' <span class="arrow">→</span></span>' +
    '</button>';
  }

  /* --- Übersicht: Raster --- */
  function renderRaster() {
    const host = $('rasterView');
    if (!host) return;
    const L = t();
    host.innerHTML =
      backLink('rasterBack', L.backChoose) +
      '<div id="controls" class="controls"></div>' +
      '<div id="legend" class="legend"></div>' +
      '<div class="gridwrap"><div id="grid" class="grid"></div></div>' +
      '<p id="notation" class="notation"></p>';
    $('rasterBack').addEventListener('click', function () { showView('home'); });
    if ($('notation')) $('notation').textContent = L.notation;
    renderControls(); renderLegend(); renderGrid();
  }

  /* --- Konfiguration (für Üben oder Quiz) --- */
  function renderConfig() {
    const host = $('configView');
    if (!host) return;
    const L = t(), d = state.drill;
    const types = [['walk', L.typeWalk, L.descWalk], ['classic', L.typeClassic, L.descClassic], ['mixed', L.typeMixed, L.descMixed]];
    const optsHtml = types.map(function (tp, idx) {
      return '<button class="opt' + (d.type === tp[0] ? ' is-active' : '') + '" type="button" data-type="' + tp[0] + '">' +
        '<span class="radio"></span>' +
        '<span class="opt-body"><span class="opt-title">' + esc(tp[1]) + '</span>' +
        '<span class="opt-desc">' + esc(tp[2]) + '</span></span>' +
        '<span class="opt-no mono">0' + (idx + 1) + '</span></button>';
    }).join('');
    const chips = ['random'].concat(KEYS.map(function (k) { return k.id; })).map(function (id) {
      const label = id === 'random' ? L.keyRandom : id;
      return '<button class="chip mono' + (id === 'random' ? ' chip-random' : '') + (d.keyMode === id ? ' is-active' : '') + '" type="button" data-key="' + id + '">' + esc(label) + '</button>';
    }).join('');
    let timerHtml;
    if (d.format === 'quiz') {
      timerHtml = '<div class="locked">' + ICON_LOCK +
        '<span class="locked-text"><b>' + esc(L.timerLockedTitle) + '</b>' +
        '<span class="sm">' + esc(L.timerLockedSub) + '</span></span></div>';
    } else {
      timerHtml = '<label class="switch"><input type="checkbox" id="cfgTimer"' + (d.timerOn ? ' checked' : '') + ' />' +
        '<span class="switch-track"><span class="switch-knob"></span></span>' +
        '<span class="switch-text mono">' + esc(L.timerSwitch) + '</span></label>';
    }
    host.innerHTML =
      backLink('configBack', L.backChoose) +
      '<div class="iv-modekick mono">' + esc(L.cfgMode) + ' · ' + esc(d.format === 'quiz' ? L.tileQuiz : L.tilePractice) + '</div>' +
      '<div class="block"><div class="block-label">' + esc(L.drillType) + '</div><div class="opts">' + optsHtml + '</div></div>' +
      '<div class="block"><div class="block-label">' + esc(L.drillKey) + ' <span class="hint mono">' + esc(d.keyMode === 'random' ? L.keyRandom : d.keyMode) + '</span></div><div class="chips">' + chips + '</div></div>' +
      '<div class="block"><div class="block-label">' + esc(L.timerLbl) + '</div><div class="cfg-timer">' + timerHtml + '</div></div>' +
      '<div class="midi-status mono"></div>' +
      '<button class="start" id="cfgStart" type="button"><span>' + esc(L.startBtn) + '</span><span class="arrow">→</span></button>';
    $('configBack').addEventListener('click', function () { showView('home'); });
    host.querySelectorAll('.opt').forEach(function (o) {
      o.addEventListener('click', function () {
        d.type = o.getAttribute('data-type');
        host.querySelectorAll('.opt').forEach(function (x) { x.classList.toggle('is-active', x === o); });
      });
    });
    host.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () { d.keyMode = c.getAttribute('data-key'); renderConfig(); });
    });
    if (d.format !== 'quiz') { const tc = $('cfgTimer'); if (tc) tc.addEventListener('change', function () { d.timerOn = this.checked; }); }
    $('cfgStart').addEventListener('click', function () { ensureAudio(); initMidi(); startDrill(); showView('drill'); });
    updateMidiStatus();
  }

  /* --- Ansicht umschalten --- */
  function showView(view) {
    state.view = view;
    if (view !== 'raster') closeModal();
    const map = { home: 'homeView', raster: 'rasterView', config: 'configView', drill: 'drillView' };
    Object.keys(map).forEach(function (k) { const el = $(map[k]); if (el) el.hidden = (k !== view); });
    // Modul-Kopf (Kicker/Titel/Untertitel) nur auf der Startseite — Unteransichten
    // tragen ihren eigenen Backlink oben.
    const home = (view === 'home');
    const kick = document.querySelector('.invtrainer > .kicker'); if (kick) kick.style.display = home ? '' : 'none';
    const ttl = $('title'); if (ttl) ttl.style.display = home ? '' : 'none';
    const sub = $('subtitle'); if (sub) sub.style.display = home ? '' : 'none';
    if (view === 'home') renderHome();
    else if (view === 'raster') renderRaster();
    else if (view === 'config') { initMidi(); renderConfig(); }
    else if (view === 'drill') renderDrill();
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
    renderSoundToggle();
    showView(state.view);
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
    // Transient zurücksetzen, aber die gewählte Ansicht behalten (Sprachwechsel).
    stopDrillTimers(); allNotesOff();
    state.modal = null;
    state.drill.running = false; state.drill.finished = false; state.drill.revealing = false; state.drill.locked = false;
    if (state.view === 'drill') state.view = 'config';   // laufender Drill wird beim Re-Mount gestoppt

    root.classList.add('invtrainer');
    root.innerHTML =
      '<div class="topbar"><button id="soundToggle" class="soundbtn mono" type="button"></button></div>' +
      '<div class="kicker" data-i="kicker"></div>' +
      '<h1 id="title" class="title"></h1>' +
      '<p id="subtitle" class="sub"></p>' +
      '<div id="homeView"></div>' +
      '<div id="rasterView" hidden></div>' +
      '<div id="configView" hidden></div>' +
      '<div id="drillView" hidden></div>' +
      '<div id="modalRoot"></div>';

    if (!escWired) {
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.modal) closeModal(); });
      escWired = true;
    }
    applyStaticTexts();
    renderSoundToggle();
    showView(state.view);
  }

  window.InversionTrainer = {
    mount: mount, setLang: setLang,
    KEYS: KEYS, computeChord: computeChord, chordLabel: chordLabel,
    smartSteps: smartSteps, matchInversion: matchInversion, state: state,
    _simMidi: function (arr) { state.midi.active = new Set(arr || []); onMidiChange(); }
  };
})();
