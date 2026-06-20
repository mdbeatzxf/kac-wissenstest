/* ==================================================================
   Tonleitern am Klavier — KAC Music Academy
   Vanilla JS. Musik-Engine sauber getrennt von Rendering.
   Stil & Navigation wie „Inversionen am Klavier".
   ================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     1) MUSIK-ENGINE
     ---------------------------------------------------------------- */

  // 12 Dur-Tonarten (internationale Schreibweise, B statt H).
  const MAJOR_KEYS = [
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

  // 12 Moll-Tonarten (natürliches Moll, konventionelle Schreibweise).
  const MINOR_KEYS = [
    { id: 'A',  pc: 9,  scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
    { id: 'Bb', pc: 10, scale: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'] },
    { id: 'B',  pc: 11, scale: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'] },
    { id: 'C',  pc: 0,  scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'] },
    { id: 'C#', pc: 1,  scale: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'] },
    { id: 'D',  pc: 2,  scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'] },
    { id: 'Eb', pc: 3,  scale: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'] },
    { id: 'E',  pc: 4,  scale: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'] },
    { id: 'F',  pc: 5,  scale: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'] },
    { id: 'F#', pc: 6,  scale: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'] },
    { id: 'G',  pc: 7,  scale: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'] },
    { id: 'G#', pc: 8,  scale: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'] }
  ];

  const OFFS = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10]
  };

  // Halbtonschritte (Position im 8-Ton-Verlauf, 0-basiert: nach diesem Index folgt ein Halbton).
  // Dur: 3–4 und 7–8  → Lücken nach Index 2 und 6.
  // Moll: 2–3 und 5–6 → Lücken nach Index 1 und 4.
  const HALFSTEPS = {
    major: [2, 6],
    minor: [1, 4]
  };

  const BLACK_PC = [1, 3, 6, 8, 10];

  /* ----- Fingersätze (Standard; bei Bedarf hier zentral anpassen) -----
     8 Werte = aufsteigend inkl. Oktavton. RH = rechte Hand, LH = linke Hand. */
  const FINGERING = {
    major: {
      'C':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'G':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'D':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'A':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'E':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'B':  { r: [1,2,3,1,2,3,4,5], l: [4,3,2,1,4,3,2,1] },
      'F#': { r: [2,3,4,1,2,3,1,2], l: [4,3,2,1,3,2,1,4] },
      'Db': { r: [2,3,1,2,3,4,1,2], l: [3,2,1,4,3,2,1,3] },
      'Ab': { r: [3,4,1,2,3,1,2,3], l: [3,2,1,4,3,2,1,3] },
      'Eb': { r: [3,1,2,3,4,1,2,3], l: [3,2,1,4,3,2,1,3] },
      'Bb': { r: [2,1,2,3,1,2,3,4], l: [3,2,1,4,3,2,1,3] },
      'F':  { r: [1,2,3,4,1,2,3,4], l: [5,4,3,2,1,3,2,1] }
    },
    minor: {
      'A':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'E':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'D':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'G':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'C':  { r: [1,2,3,1,2,3,4,5], l: [5,4,3,2,1,3,2,1] },
      'B':  { r: [1,2,3,1,2,3,4,5], l: [4,3,2,1,4,3,2,1] },
      'F':  { r: [1,2,3,4,1,2,3,4], l: [5,4,3,2,1,3,2,1] },
      'F#': { r: [3,4,1,2,3,1,2,3], l: [4,3,2,1,3,2,1,4] },
      'C#': { r: [1,2,3,1,2,3,4,5], l: [4,3,2,1,4,3,2,1] },
      'G#': { r: [3,4,1,2,3,1,2,3], l: [3,2,1,4,3,2,1,3] },
      'Eb': { r: [3,1,2,3,4,1,2,3], l: [3,2,1,4,3,2,1,3] },
      'Bb': { r: [2,1,2,3,1,2,3,4], l: [3,2,1,4,3,2,1,3] }
    }
  };

  function keysOf(type) { return type === 'minor' ? MINOR_KEYS : MAJOR_KEYS; }
  function findKey(type, id) {
    const list = keysOf(type);
    return list.find(function (k) { return k.id === id; }) || list[0];
  }

  // Tonleiter berechnen: 8 Töne (inkl. Oktave), Positionen 0..23, Halbton-Lücken.
  function computeScale(type, key) {
    const offs = OFFS[type];
    const positions = [];
    const names = [];
    const degrees = [];
    for (let i = 0; i < 7; i++) {
      positions.push(key.pc + offs[i]);
      names.push(key.scale[i]);
      degrees.push(i + 1);
    }
    // Oktavton
    positions.push(key.pc + 12);
    names.push(key.scale[0]);
    degrees.push(8);
    return {
      type: type,
      keyId: key.id,
      positions: positions,   // 8 Werte 0..23
      names: names,           // 8 Namen
      degrees: degrees,       // 1..8
      halfsteps: HALFSTEPS[type],
      fingering: (FINGERING[type] && FINGERING[type][key.id]) || null
    };
  }

  /* ----------------------------------------------------------------
     2) UI-TEXTE
     ---------------------------------------------------------------- */
  const I18N = {
    de: {
      back: 'Übersicht',
      kicker: 'Music Academy',
      homeKicker: 'Music Academy · Tonleitern',
      title: 'Tonleitern am Klavier',
      homeSub: 'Tonleitern sehen, üben und abfragen — Stufen, Halbtonschritte und Fingersatz in jeder Tonart.',
      tiles: {
        overview: { t: 'Übersicht', s: 'Alle Tonleitern im Raster — Stufen, Halbtöne, Fingersatz.' },
        practice: { t: 'Üben', s: 'Ohne Druck üben, läuft endlos — Timer optional.' },
        quiz:     { t: 'Quiz', s: '20 Aufgaben mit Timer — am Ende deine Auswertung.' }
      },
      typeToggle: { major: 'Dur', minor: 'Moll' },
      overviewTitle: 'Alle Tonleitern',
      overviewSub: 'Die Stufenzahlen (farbig) sind das Wichtigste. Die Klammern markieren die Halbtonschritte.',
      overviewFingerLegend: 'Zeile anklicken → Fingersatz auf den Händen',
      colTones: 'Töne & Stufen',
      fingerR: 'R', fingerL: 'L',
      fingerHint: 'Fingersatz',
      halfstepLbl: 'Halbton',
      // Konfig
      configKicker: 'Modus',
      configTitle: 'Konfiguration',
      blockType: 'Tonleiter-Typ',
      blockPattern: 'Richtung / Pattern',
      blockKey: 'Tonart',
      blockTimer: 'Timer',
      typeOpts: {
        major: { t: 'Dur', d: 'Die klassische Dur-Tonleiter mit Halbtönen zwischen 3–4 und 7–8.' },
        minor: { t: 'Moll', d: 'Natürliches Moll mit Halbtönen zwischen 2–3 und 5–6.' }
      },
      patternOpts: {
        up:     { t: 'Aufwärts', d: 'Von der 1. zur 8. Stufe — Grundlage für alles Weitere.' },
        down:   { t: 'Abwärts', d: 'Von der 8. zurück zur 1. Stufe — der Fingersatz spiegelt sich.' },
        thirds: { t: 'Terzen', d: 'In Terzen: 1-3-2-4-3-5… — schult Sprünge und Hörsinn.' }
      },
      randomKey: 'Zufall',
      timerSwitch: 'Timer 15 s pro Aufgabe',
      timerLockedTitle: 'Timer 15 s pro Aufgabe — beim Quiz immer an.',
      timerLockedSub: 'Im Quiz-Modus läuft der Timer fest mit und kann nicht abgeschaltet werden.',
      start: 'Training starten',
      // Drill
      drillKicker: 'Aufgabe',
      play: 'Spiele',
      dirUp: 'aufwärts', dirDown: 'abwärts', patThirds: 'Terzen',
      step: 'Schritt', hits: 'Treffer',
      legendDeg: 'Stufe (1–7)', legendFinger: 'Fingersatz',
      handsHint: 'leuchtet auf den Händen',
      handsCurrent: 'Aktuell:',
      dirLeft: 'links', dirRight: 'rechts',
      tip: 'Tipp: nächster Finger', next: 'Weiter',
      showFingers: 'Fingersatz einblenden',
      notation: 'Internationale Schreibweise (B statt deutschem H). Fingersätze nach gängigem Standard.'
    },
    en: {
      back: 'Overview',
      kicker: 'Music Academy',
      homeKicker: 'Music Academy · Scales',
      title: 'Scales on the piano',
      homeSub: 'See, practise and test scales — degrees, half steps and fingering in every key.',
      tiles: {
        overview: { t: 'Overview', s: 'All scales in a grid — degrees, half steps, fingering.' },
        practice: { t: 'Practise', s: 'Practise with no pressure, runs endlessly — timer optional.' },
        quiz:     { t: 'Quiz', s: '20 tasks with a timer — your results at the end.' }
      },
      typeToggle: { major: 'Major', minor: 'Minor' },
      overviewTitle: 'All scales',
      overviewSub: 'The degree numbers (in colour) matter most. The brackets mark the half steps.',
      overviewFingerLegend: 'Click a row → fingering on the hands',
      colTones: 'Notes & degrees',
      fingerR: 'R', fingerL: 'L',
      fingerHint: 'Fingering',
      halfstepLbl: 'Half step',
      configKicker: 'Mode',
      configTitle: 'Configuration',
      blockType: 'Scale type',
      blockPattern: 'Direction / pattern',
      blockKey: 'Key',
      blockTimer: 'Timer',
      typeOpts: {
        major: { t: 'Major', d: 'The classic major scale with half steps between 3–4 and 7–8.' },
        minor: { t: 'Minor', d: 'Natural minor with half steps between 2–3 and 5–6.' }
      },
      patternOpts: {
        up:     { t: 'Ascending', d: 'From the 1st to the 8th degree — the basis for everything.' },
        down:   { t: 'Descending', d: 'From the 8th back to the 1st — the fingering mirrors.' },
        thirds: { t: 'Thirds', d: 'In thirds: 1-3-2-4-3-5… — trains leaps and the ear.' }
      },
      randomKey: 'Random',
      timerSwitch: 'Timer 15 s per task',
      timerLockedTitle: 'Timer 15 s per task — always on in the quiz.',
      timerLockedSub: 'In quiz mode the timer always runs and cannot be switched off.',
      start: 'Start training',
      drillKicker: 'Task',
      play: 'Play',
      dirUp: 'ascending', dirDown: 'descending', patThirds: 'thirds',
      step: 'Step', hits: 'Hits',
      legendDeg: 'Degree (1–7)', legendFinger: 'Fingering',
      handsHint: 'lights up on the hands',
      handsCurrent: 'Current:',
      dirLeft: 'left', dirRight: 'right',
      tip: 'Hint: next finger', next: 'Next',
      showFingers: 'Show fingering',
      notation: 'International notation (B, not the German H). Fingerings follow common standard.'
    }
  };

  /* ----------------------------------------------------------------
     3) ZUSTAND
     ---------------------------------------------------------------- */
  const state = {
    lang: 'de',
    view: 'home',          // home | overview | config | drill
    overviewType: 'major',
    ov: { open: null, cur: 0 },
    mode: 'practice',      // practice | quiz
    cfg: { type: 'major', pattern: 'up', key: 'random', timerOn: true },
    drill: null            // { type, key, pattern, step, hits, played:Set, showFingers, dir }
  };

  function t() { return I18N[state.lang]; }
  const $ = function (id) { return document.getElementById(id); };

  /* ----------------------------------------------------------------
     4) KLAVIATUR-BAUSTEIN
     opts: whiteW, interactive, played:Set, degreeMap, fingerMap, showDeg, showFinger,
           targetPositions
     ---------------------------------------------------------------- */
  function buildKeyboard(targetPositions, opts) {
    opts = opts || {};
    const whiteW = opts.whiteW || 14;
    const whiteH = opts.whiteH || Math.round(whiteW * 4.2);
    const blackW = Math.max(6, Math.round(whiteW * 0.62));
    const blackH = Math.round(whiteH * 0.62);
    const targetSet = new Set(targetPositions);
    const played = opts.played || new Set();
    const degreeMap = opts.degreeMap || {};
    const fingerMap = opts.fingerMap || {};

    const wrap = document.createElement('div');
    wrap.className = 'pkbd' + (opts.interactive ? ' is-interactive' : '');

    function makeKey(p, type, wd, ht) {
      const el = document.createElement(opts.interactive ? 'button' : 'div');
      el.className = 'pkey ' + (type === 'w' ? 'wkey' : 'bkey');
      el.style.width = wd + 'px';
      el.style.height = ht + 'px';
      el.dataset.pos = p;
      if (targetSet.has(p)) el.classList.add('is-target');
      if (played.has(p)) el.classList.add('is-played');
      if (opts.currentPos === p) el.classList.add('is-current');
      // Stufenzahl (Hauptfokus)
      if (opts.showDeg && degreeMap[p] != null) {
        const d = document.createElement('span');
        d.className = 'pkey-deg mono';
        d.textContent = degreeMap[p];
        el.appendChild(d);
      }
      // Fingersatz
      if (opts.showFinger && fingerMap[p] != null) {
        const f = document.createElement('span');
        f.className = 'pkey-fing mono';
        f.textContent = fingerMap[p];
        el.appendChild(f);
      }
      if (opts.interactive) {
        el.type = 'button';
        el.addEventListener('click', function () {
          if (opts.onSelect) { opts.onSelect(p); return; }
          if (played.has(p)) played.delete(p); else played.add(p);
          if (opts.onTap) opts.onTap(p);
        });
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

  // Hilfsmaps aus einer Skala
  function degreeMapOf(scale) {
    const m = {};
    scale.positions.forEach(function (p, i) { if (scale.degrees[i] <= 7) m[p] = scale.degrees[i]; });
    // Oktavton zeigt 8 nicht (gleiche Position-Klasse wie 1, andere Oktave) → eigene Position, zeige 1
    m[scale.positions[7]] = 1;
    return m;
  }
  function fingerMapOf(scale, hand) {
    const m = {};
    if (!scale.fingering) return m;
    const arr = scale.fingering[hand];
    scale.positions.forEach(function (p, i) { m[p] = arr[i]; });
    return m;
  }

  /* ----------------------------------------------------------------
     5) ROUTING
     ---------------------------------------------------------------- */
  function go(view) {
    state.view = view;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    if (state.view === 'drill' && !state.drill) state.view = 'home';
    applyStaticChrome();
    const root = $('stView');
    if (!root) return;
    root.innerHTML = '';
    if (state.view === 'home') root.appendChild(renderHome());
    else if (state.view === 'overview') root.appendChild(renderOverview());
    else if (state.view === 'config') root.appendChild(renderConfig());
    else if (state.view === 'drill') root.appendChild(renderDrill());
  }

  function applyStaticChrome() {
    const L = t();
    document.documentElement.lang = state.lang;
    // Back-Link + Sprachumschalter liefert die App; hier nur die Fußnote.
    const note = $('stNote');
    if (note) note.textContent = L.notation;
  }

  /* ----------------------------------------------------------------
     6) HOME — drei Kacheln
     ---------------------------------------------------------------- */
  function renderHome() {
    const L = t();
    const v = el('section', 'screen');
    v.innerHTML =
      '<div class="kicker">' + esc(L.homeKicker) + '</div>' +
      '<h1 class="title">' + esc(L.title) + '</h1>' +
      '<p class="sub">' + esc(L.homeSub) + '</p>';

    const tiles = el('div', 'tiles tiles-3');
    const defs = [
      { id: 'overview', icon: ICON.grid, go: function () { go('overview'); } },
      { id: 'practice', icon: ICON.loop, go: function () { state.mode = 'practice'; state.cfg.timerOn = true; go('config'); } },
      { id: 'quiz',     icon: ICON.timer, go: function () { state.mode = 'quiz'; go('config'); } }
    ];
    defs.forEach(function (d) {
      const meta = L.tiles[d.id];
      const tile = el('button', 'tile');
      tile.type = 'button';
      tile.innerHTML =
        '<span class="tile-icon">' + d.icon + '</span>' +
        '<span class="tile-title">' + esc(meta.t) + '</span>' +
        '<span class="tile-sub">' + esc(meta.s) + '</span>' +
        '<span class="tile-go"><span class="arrow">→</span></span>';
      tile.addEventListener('click', d.go);
      tiles.appendChild(tile);
    });
    v.appendChild(tiles);
    return v;
  }

  /* ----------------------------------------------------------------
     7) ÜBERSICHT — Raster aller Tonleitern
     ---------------------------------------------------------------- */
  function renderOverview() {
    const L = t();
    const v = el('section', 'screen' + (state.overviewType === 'minor' ? ' is-minor' : ''));

    const backBtn = el('button', 'backlink mono');
    backBtn.type = 'button';
    backBtn.innerHTML = '<span class="arrow">←</span> ' + esc(L.title);
    backBtn.addEventListener('click', function () { go('home'); });
    v.appendChild(backBtn);

    // Kopf
    const head = el('div', 'ov-head');
    head.innerHTML =
      '<div><div class="kicker">' + esc(L.kicker) + ' · ' + esc(L.overviewTitle) + '</div>' +
      '<h1 class="title">' + esc(L.overviewTitle) + '</h1>' +
      '<p class="sub">' + esc(L.overviewSub) + '</p></div>';
    // Dur/Moll-Umschalter
    const toggle = el('div', 'seg');
    ['major', 'minor'].forEach(function (ty) {
      const b = el('button', 'seg-btn' + (state.overviewType === ty ? ' is-active' : ''));
      b.type = 'button';
      b.textContent = L.typeToggle[ty];
      b.addEventListener('click', function () { state.overviewType = ty; render(); });
      toggle.appendChild(b);
    });
    head.appendChild(toggle);
    v.appendChild(head);

    // Legende
    const legend = el('div', 'ov-legend');
    legend.innerHTML =
      '<span class="ovl-item"><span class="ovl-deg mono">1</span>' + esc(L.legendDeg) + '</span>' +
      '<span class="ovl-item"><span class="ovl-bracket"></span>' + esc(L.halfstepLbl) + '</span>';
    v.appendChild(legend);

    // Zeilen
    const list = el('div', 'ov-list');
    keysOf(state.overviewType).forEach(function (key) {
      list.appendChild(overviewRow(state.overviewType, key));
    });
    v.appendChild(list);
    return v;
  }

  function overviewRow(type, key) {
    const L = t();
    const scale = computeScale(type, key);

    const row = el('div', 'ov-row');

    // Tonart-Name
    const nameCol = el('div', 'ov-name');
    nameCol.innerHTML =
      '<span class="ov-key">' + esc(key.id) + '</span>' +
      '<span class="ov-type mono">' + esc(L.typeToggle[type]) + '</span>';
    row.appendChild(nameCol);

    // Stufen + Töne + Halbton-Klammern
    const tones = el('div', 'ov-tones');
    const half = new Set(scale.halfsteps);
    for (let i = 0; i < 8; i++) {
      const c = el('div', 'tone-col');
      c.innerHTML =
        '<span class="tone-deg mono">' + scale.degrees[i] + '</span>' +
        '<span class="tone-name">' + esc(scale.names[i]) + '</span>';
      tones.appendChild(c);
      if (half.has(i)) {
        const br = el('div', 'tone-half');
        br.title = L.halfstepLbl;
        br.innerHTML = '<span class="half-bracket"></span>';
        tones.appendChild(br);
      } else if (i < 7) {
        tones.appendChild(el('div', 'tone-gap'));
      }
    }
    row.appendChild(tones);

    // Klaviatur — Hauptorientierung (groß, Stufenzahlen)
    const mini = el('div', 'ov-kbd');
    mini.appendChild(buildKeyboard(scale.positions, {
      whiteW: 22, showDeg: true, degreeMap: degreeMapOf(scale)
    }));
    row.appendChild(mini);

    return row;
  }

  /* ----------------------------------------------------------------
     8) KONFIG
     ---------------------------------------------------------------- */
  function renderConfig() {
    const L = t();
    const v = el('section', 'screen');

    const backBtn = el('button', 'backlink mono');
    backBtn.type = 'button';
    backBtn.innerHTML = '<span class="arrow">←</span> ' + esc(L.title);
    backBtn.addEventListener('click', function () { go('home'); });
    v.appendChild(backBtn);

    v.appendChild(htmlEl(
      '<div class="kicker">' + esc(L.configKicker) + ' · ' + esc(L.tiles[state.mode === 'quiz' ? 'quiz' : 'practice'].t) + '</div>' +
      '<h1 class="title">' + esc(L.configTitle) + '</h1>'
    ));

    // Block: Typ
    v.appendChild(blockLabel(L.blockType));
    const typeOpts = el('div', 'opts');
    ['major', 'minor'].forEach(function (ty, idx) {
      typeOpts.appendChild(optionCard(ty, L.typeOpts[ty].t, L.typeOpts[ty].d, idx + 1, state.cfg.type === ty, function () {
        state.cfg.type = ty;
        if (state.cfg.key !== 'random' && !findKeyExists(ty, state.cfg.key)) state.cfg.key = 'random';
        render();
      }));
    });
    v.appendChild(wrapBlock(typeOpts));

    // Block: Pattern
    v.appendChild(blockLabel(L.blockPattern));
    const patOpts = el('div', 'opts');
    ['up', 'down', 'thirds'].forEach(function (p, idx) {
      patOpts.appendChild(optionCard(p, L.patternOpts[p].t, L.patternOpts[p].d, idx + 1, state.cfg.pattern === p, function () {
        state.cfg.pattern = p; render();
      }));
    });
    v.appendChild(wrapBlock(patOpts));

    // Block: Tonart (Chips)
    const keyHint = el('span', 'hint mono');
    keyHint.textContent = state.cfg.key === 'random' ? L.randomKey : state.cfg.key;
    v.appendChild(blockLabel(L.blockKey, keyHint));
    const chips = el('div', 'chips');
    const chipDefs = [{ id: 'random', label: L.randomKey }].concat(
      keysOf(state.cfg.type).map(function (k) { return { id: k.id, label: k.id }; })
    );
    chipDefs.forEach(function (item) {
      const b = el('button', 'chip mono' + (item.id === 'random' ? ' chip-random' : '') + (item.id === state.cfg.key ? ' is-active' : ''));
      b.type = 'button';
      b.textContent = item.label;
      b.addEventListener('click', function () { state.cfg.key = item.id; render(); });
      chips.appendChild(b);
    });
    v.appendChild(wrapBlock(chips));

    // Block: Timer
    v.appendChild(blockLabel(L.blockTimer));
    const timer = el('div', 'timer');
    if (state.mode === 'quiz') {
      timer.innerHTML =
        '<div class="locked">' + ICON.lock +
        '<span class="locked-text"><b>' + esc(L.timerLockedTitle) + '</b>' +
        '<span class="sm">' + esc(L.timerLockedSub) + '</span></span></div>';
    } else {
      const lbl = el('label', 'switch');
      lbl.innerHTML =
        '<input type="checkbox" id="timerChk"' + (state.cfg.timerOn ? ' checked' : '') + ' />' +
        '<span class="switch-track"><span class="switch-knob"></span></span>' +
        '<span class="switch-text"><b>' + esc(L.timerSwitch) + '</b></span>';
      timer.appendChild(lbl);
      setTimeout(function () {
        const c = $('timerChk');
        if (c) c.addEventListener('change', function () { state.cfg.timerOn = this.checked; });
      }, 0);
    }
    v.appendChild(wrapBlock(timer));

    // Start
    const start = el('button', 'start');
    start.type = 'button';
    start.innerHTML = '<span>' + esc(L.start) + '</span><span class="arrow">→</span>';
    start.addEventListener('click', startDrill);
    v.appendChild(start);
    return v;
  }

  function findKeyExists(type, id) {
    return keysOf(type).some(function (k) { return k.id === id; });
  }

  function optionCard(id, title, desc, no, active, onClick) {
    const b = el('button', 'opt' + (active ? ' is-active' : ''));
    b.type = 'button';
    b.innerHTML =
      '<span class="radio"></span>' +
      '<span class="opt-body"><span class="opt-title">' + esc(title) + '</span>' +
      '<span class="opt-desc">' + esc(desc) + '</span></span>' +
      '<span class="opt-no mono">' + (no < 10 ? '0' + no : no) + '</span>';
    b.addEventListener('click', onClick);
    return b;
  }

  function blockLabel(text, extra) {
    const d = el('div', 'block-label');
    d.innerHTML = '<span>' + esc(text) + '</span>';
    if (extra) d.appendChild(extra);
    return d;
  }
  function wrapBlock(child) {
    const d = el('div', 'block');
    d.appendChild(child);
    return d;
  }

  /* ----------------------------------------------------------------
     9) DRILL
     ---------------------------------------------------------------- */
  function startDrill() {
    const cfg = state.cfg;
    const keyId = cfg.key === 'random' ? randomKeyId(cfg.type) : cfg.key;
    state.drill = {
      type: cfg.type, key: keyId, pattern: cfg.pattern,
      dir: cfg.pattern === 'down' ? 'down' : 'up',
      step: 1, hits: 0, total: state.mode === 'quiz' ? 20 : null,
      cur: 0,
      played: new Set(), showFingers: false,
      timerOn: state.mode === 'quiz' ? true : cfg.timerOn
    };
    go('drill');
  }

  function randomKeyId(type) {
    const list = keysOf(type);
    return list[Math.floor(Math.random() * list.length)].id;
  }

  function renderDrill() {
    const L = t();
    const d = state.drill;
    const key = findKey(d.type, d.key);
    const scale = computeScale(d.type, key);
    const v = el('section', 'screen' + (d.type === 'minor' ? ' is-minor' : ''));

    // Zurück
    const backBtn = el('button', 'backlink mono');
    backBtn.type = 'button';
    backBtn.innerHTML = '<span class="arrow">←</span> ' + esc(L.configTitle);
    backBtn.addEventListener('click', function () { go('config'); });
    v.appendChild(backBtn);

    // Aufgaben-Karte
    const patLabel = d.pattern === 'thirds' ? L.patThirds : (d.dir === 'down' ? L.dirDown : L.dirUp);
    const task = el('div', 'drill-task');
    task.innerHTML =
      '<div class="dt-left">' +
        '<div class="kicker">' + esc(L.drillKicker) + '</div>' +
        '<div class="dt-headline"><span class="dt-play mono">' + esc(L.play) + '</span> ' +
          '<span class="dt-scale">' + esc(key.id) + ' ' + esc(L.typeToggle[d.type]) + '</span>' +
          '<span class="dt-dir">' + (d.dir === 'down' ? '↓' : '↑') + ' ' + esc(patLabel) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="dt-stats mono">' +
        '<span class="dt-stat"><span class="dt-stat-n">' + d.step + (d.total ? '<span class="dt-stat-d">/' + d.total + '</span>' : '') + '</span><span class="dt-stat-l">' + esc(L.step) + '</span></span>' +
        '<span class="dt-stat"><span class="dt-stat-n">' + d.hits + '</span><span class="dt-stat-l">' + esc(L.hits) + '</span></span>' +
      '</div>';
    v.appendChild(task);

    // Timer-Balken
    if (d.timerOn) {
      const tb = el('div', 'timerbar');
      tb.innerHTML = '<span class="timerbar-fill" id="timerFill"></span>';
      v.appendChild(tb);
      setTimeout(function () {
        const f = $('timerFill');
        if (f) { f.style.transition = 'none'; f.style.width = '100%'; void f.offsetWidth;
          f.style.transition = 'width 15s linear'; f.style.width = '0%'; }
      }, 30);
    }

    // Richtungs-Indikator
    const dir = el('div', 'drill-dir');
    dir.innerHTML =
      '<button class="dir-btn mono' + (d.dir === 'up' ? ' is-active' : '') + '" type="button" data-dir="up">↑ ' + esc(L.dirUp) + '</button>' +
      '<button class="dir-btn mono' + (d.dir === 'down' ? ' is-active' : '') + '" type="button" data-dir="down">↓ ' + esc(L.dirDown) + '</button>';
    dir.querySelectorAll('.dir-btn').forEach(function (b) {
      b.addEventListener('click', function () { d.dir = this.dataset.dir; render(); });
    });
    if (d.pattern !== 'thirds') v.appendChild(dir);

    // Legende (Stufen auf den Tasten)
    const lg = el('div', 'drill-legend');
    lg.innerHTML =
      '<span class="dl-item"><span class="dl-chip dl-deg mono">1</span>' + esc(L.legendDeg) + '</span>' +
      '<span class="dl-item"><span class="dl-chip dl-fing mono">2</span>' + esc(L.legendFinger) + ' → ' + esc(L.handsHint) + '</span>';
    v.appendChild(lg);

    // Aktuell fälliger Ton
    const cur = d.cur || 0;
    const curPos = scale.positions[cur];
    const rFinger = scale.fingering ? scale.fingering.r[cur] : null;
    const lFinger = scale.fingering ? scale.fingering.l[cur] : null;

    // Große Klaviatur (Hauptorientierung) — nur Stufenzahlen
    const kbWrap = el('div', 'drill-kbd');
    const kb = buildKeyboard(scale.positions, {
      whiteW: 50, interactive: true, played: d.played,
      showDeg: true, currentPos: curPos,
      degreeMap: degreeMapOf(scale),
      onSelect: function (p) {
        const idx = scale.positions.indexOf(p);
        if (idx !== -1) { d.cur = idx; render(); }
      }
    });
    kbWrap.appendChild(kb);
    v.appendChild(kbWrap);

    // Schritt-Stepper für den aktuellen Ton
    const stepper = el('div', 'drill-cur');
    stepper.innerHTML =
      '<button class="cur-step" type="button" data-d="-1">‹</button>' +
      '<button class="cur-step" type="button" data-d="1">›</button>' +
      '<span class="cur-readout"><b>' + esc(scale.names[cur]) + '</b> · ' + esc(L.step) + ' ' + (cur + 1) + '/8</span>';
    stepper.querySelectorAll('.cur-step').forEach(function (b) {
      b.addEventListener('click', function () {
        const dir = parseInt(this.dataset.d, 10);
        d.cur = (cur + dir + 8) % 8;
        render();
      });
    });
    v.appendChild(stepper);

    // Hände-Grafik (Fingersatz, aktiver Finger leuchtet rot)
    const handsBox = el('div', 'drill-hands');
    const hhead = el('div', 'drill-hands-head');
    hhead.innerHTML =
      '<span class="dh-title">' + esc(L.legendFinger) + '</span>' +
      '<span class="dh-current"><span class="dh-dot mono">' + scale.degrees[cur] + '</span>' +
        esc(L.handsCurrent) + ' <b>' + esc(scale.names[cur]) + '</b>' +
        (scale.fingering ? ' · R ' + rFinger + ' · L ' + lFinger : '') + '</span>';
    handsBox.appendChild(hhead);
    if (window.PianoHands) {
      const pair = window.PianoHands.buildPair({
        leftLabel: L.fingerL + ' · ' + L.dirLeft,
        rightLabel: L.fingerR + ' · ' + L.dirRight,
        active: { right: rFinger, left: lFinger }
      });
      handsBox.appendChild(pair);
    }
    v.appendChild(handsBox);

    // Aktionen
    const actions = el('div', 'drill-actions');
    const tip = el('button', 'btn btn-ghost');
    tip.type = 'button';
    tip.textContent = L.tip;
    tip.addEventListener('click', function () { d.cur = (cur + 1) % 8; render(); });
    const next = el('button', 'btn btn-primary drill-next');
    next.type = 'button';
    next.innerHTML = esc(L.next) + ' <span class="arrow">→</span>';
    next.addEventListener('click', nextTask);
    actions.appendChild(tip);
    actions.appendChild(next);
    v.appendChild(actions);

    return v;
  }

  function renderDrillStats() { /* Platzhalter für Live-Trefferzählung (MIDI später) */ }

  function nextTask() {
    const d = state.drill;
    d.hits += 1;
    d.step += 1;
    if (d.total && d.step > d.total) { go('config'); return; }
    if (state.cfg.key === 'random') d.key = randomKeyId(d.type);
    d.played = new Set();
    d.cur = 0;
    render();
  }

  /* ----------------------------------------------------------------
     10) ICONS (Inline-SVG, Linien)
     ---------------------------------------------------------------- */
  const ICON = {
    grid: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
      '<rect x="11" y="14" width="42" height="36" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="11" y1="26" x2="53" y2="26" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="11" y1="38" x2="53" y2="38" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="25" y1="14" x2="25" y2="50" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="39" y1="14" x2="39" y2="50" stroke="#16150f" stroke-width="2"/></svg>',
    loop: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
      '<path d="M32 32 C 28 24, 17 24, 17 32 C 17 40, 28 40, 32 32 C 36 24, 47 24, 47 32 C 47 40, 36 40, 32 32 Z" stroke="#16150f" stroke-width="2" stroke-linejoin="miter"/></svg>',
    timer: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
      '<circle cx="32" cy="38" r="17" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="32" y1="38" x2="32" y2="27" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="32" y1="38" x2="40" y2="42" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="26" y1="13" x2="38" y2="13" stroke="#16150f" stroke-width="2"/>' +
      '<line x1="32" y1="13" x2="32" y2="20" stroke="#16150f" stroke-width="2"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="5" y="11" width="14" height="9" stroke="#2a63b0" stroke-width="1.8"/>' +
      '<path d="M8 11 V8 a4 4 0 0 1 8 0 V11" stroke="#2a63b0" stroke-width="1.8"/></svg>',
    hand: '<svg class="ov-handicon" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M8 12 V6.5 a1.4 1.4 0 0 1 2.8 0 V11 M10.8 11 V5 a1.4 1.4 0 0 1 2.8 0 V11 M13.6 11 V5.6 a1.4 1.4 0 0 1 2.8 0 V12 M16.4 12 V7.5 a1.4 1.4 0 0 1 2.8 0 V15 c0 3.3-2.4 5.5-5.6 5.5 -2.2 0-3.6-0.7-5-2.4 L5 16.2 a1.4 1.4 0 0 1 2.2-1.7 L8 15.4" stroke="#16150f" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  };

  /* ----------------------------------------------------------------
     11) HELFER
     ---------------------------------------------------------------- */
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function htmlEl(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------------
     12) SPRACHE
     ---------------------------------------------------------------- */
  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem('tt_lang', lang); } catch (e) {}
    render();
  }

  /* ----------------------------------------------------------------
     13) START
     ---------------------------------------------------------------- */
  // In die App einbetten: Scaffold injizieren, Sprache übernehmen, rendern.
  // Back-Link + Sprachumschalter kommen von der App (renderScalePraxis / setLang).
  function mount(root) {
    try {
      const saved = localStorage.getItem('tt_lang');
      if (saved === 'de' || saved === 'en') state.lang = saved;
    } catch (e) {}
    if (state.view === 'drill' && !state.drill) state.view = 'home';
    root.classList.add('invtrainer', 'scaletrainer');
    root.innerHTML = '<div id="stView"></div><p id="stNote" class="notation"></p>';
    render();
  }

  // Export für App-Einbettung
  window.ScaleTrainer = {
    mount: mount, setLang: setLang,
    MAJOR_KEYS: MAJOR_KEYS, MINOR_KEYS: MINOR_KEYS,
    computeScale: computeScale, state: state, go: go
  };
})();
