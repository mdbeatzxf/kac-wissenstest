/* ==================================================================
   Inversionen am Klavier — KAC Music Academy
   Vanilla JS. Engine (Musiktheorie) sauber getrennt vom Rendering.
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
    return {
      degs: degs,
      semis: semis,
      positions: positions,   // bottom→top, alle innerhalb 0..23 (2 Oktaven)
      names: names,           // bottom→top
      quality: QUAL[i],
      rootName: key.scale[i]
    };
  }

  // Akkordname inkl. Qualitäts-Suffix.
  function chordLabel(rootName, quality) {
    if (quality === 'min') return rootName + 'm';
    if (quality === 'dim') return rootName + '°';
    return rootName;
  }

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
      // Modal
      practice: 'Üben',
      targetNotes: 'Zieltöne',
      tapHint: 'Tippe die Tasten, die du spielen würdest — dann „Prüfen".',
      check: 'Prüfen',
      clear: 'Tasten leeren',
      close: 'Schließen',
      correct: 'Richtig gespielt!',
      missingLbl: 'fehlt noch',
      extraLbl: 'zu viel',
      none: '—'
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
      practice: 'Practise',
      targetNotes: 'Target notes',
      tapHint: 'Tap the keys you would play — then “Check”.',
      check: 'Check',
      clear: 'Clear keys',
      close: 'Close',
      correct: 'Played correctly!',
      missingLbl: 'still missing',
      extraLbl: 'too many',
      none: '—'
    }
  };

  /* ----------------------------------------------------------------
     3) ZUSTAND
     ---------------------------------------------------------------- */
  const state = {
    lang: 'de',
    keyId: 'C',
    showHint: true,
    modal: null   // { i, inv, positions:[], names:[], played:Set, feedback:null }
  };

  function t() { return I18N[state.lang]; }
  function getKey() { return KEYS.find(function (k) { return k.id === state.keyId; }); }

  const $ = function (id) { return document.getElementById(id); };

  /* ----------------------------------------------------------------
     4) KLAVIATUR-BAUSTEIN  (wiederverwendbar: Mini + groß)
     ---------------------------------------------------------------- */
  // targetPositions: Array<number 0..23>. opts: { whiteW, interactive, played:Set,
  //   feedback:{correct,missing,extra}, nameMap:{pos:name} }
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
      } else {
        if (targetSet.has(p)) el.classList.add('is-target');
        if (played.has(p)) el.classList.add('is-played');
      }
      if (opts.labels && nameMap[p]) {
        const s = document.createElement('span');
        s.className = 'pkey-lbl';
        s.textContent = nameMap[p];
        el.appendChild(s);
      }
      if (opts.interactive) {
        el.type = 'button';
        el.addEventListener('click', function () { onKeyTap(p); });
      }
      return el;
    }

    // weiße Tasten zuerst (Fluss), schwarze danach absolut positioniert
    let w = 0;
    const blacks = [];
    for (let p = 0; p < 24; p++) {
      const isBlack = BLACK_PC.indexOf(p % 12) !== -1;
      if (!isBlack) {
        wrap.appendChild(makeKey(p, 'w', whiteW, whiteH));
        w++;
      } else {
        blacks.push({ p: p, left: w * whiteW - blackW / 2 });
      }
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
    grid.innerHTML = '';

    // Kopfzeile
    grid.appendChild(cell('ghead corner', ''));
    L.columns.forEach(function (c) {
      const h = cell('ghead', '');
      h.innerHTML = '<span class="ghead-txt">' + esc(c) + '</span>';
      grid.appendChild(h);
    });

    for (let i = 0; i < 7; i++) {
      const quality = QUAL[i];
      const label = chordLabel(key.scale[i], quality);

      // Zeilen-Label
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

      // drei Umkehrungen
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

        const kb = buildKeyboard(ch.positions, { whiteW: 13 });
        c.appendChild(kb);

        const notes = document.createElement('div');
        notes.className = 'cell-notes mono';
        notes.innerHTML = ch.names.map(function (n, idx) {
          return '<span class="' + (idx === 0 ? 'bassnote' : '') + '">' + esc(n) + '</span>';
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
     6) CONTROLS + LEGENDE
     ---------------------------------------------------------------- */
  function renderControls() {
    const L = t();
    const c = $('controls');
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
        state.keyId = k.id;
        renderControls();
        renderGrid();
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
      state.showHint = this.checked;
      renderGrid();
    });
  }

  function renderLegend() {
    const L = t();
    const el = $('legend');
    el.innerHTML =
      '<span class="legend-title mono">' + esc(L.legendTitle) + ':</span>' +
      ['maj', 'min', 'dim'].map(function (q) {
        return '<span class="legend-item"><span class="legend-swatch q-' + q + '"></span>' +
          '<span class="q-dot q-dot-' + q + '"></span>' + esc(L.quality[q]) + '</span>';
      }).join('');
  }

  /* ----------------------------------------------------------------
     7) MODAL  (große Klaviatur, antippen, prüfen)
     ---------------------------------------------------------------- */
  function openModal(i, inv) {
    const key = getKey();
    const ch = computeChord(key, i, inv);
    state.modal = {
      i: i, inv: inv,
      positions: ch.positions,
      names: ch.names,
      rootName: ch.rootName,
      quality: ch.quality,
      played: new Set(),
      feedback: null
    };
    renderModal();
  }

  function closeModal() {
    state.modal = null;
    $('modalRoot').innerHTML = '';
  }

  function onKeyTap(pos) {
    const m = state.modal;
    if (!m) return;
    if (m.played.has(pos)) m.played.delete(pos);
    else m.played.add(pos);
    m.feedback = null;   // Eingabe ändert sich → alte Prüfung verwerfen
    renderModal();
  }

  function checkModal() {
    const m = state.modal;
    if (!m) return;
    const target = new Set(m.positions);
    const correct = new Set(), missing = new Set(), extra = new Set();
    target.forEach(function (p) { (m.played.has(p) ? correct : missing).add(p); });
    m.played.forEach(function (p) { if (!target.has(p)) extra.add(p); });
    m.feedback = {
      correct: correct, missing: missing, extra: extra,
      ok: missing.size === 0 && extra.size === 0
    };
    renderModal();
  }

  function renderModal() {
    const m = state.modal;
    const root = $('modalRoot');
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

    // Kopf
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

    // Zieltöne
    const tn = document.createElement('div');
    tn.className = 'mh-target mono';
    tn.innerHTML = '<span class="mh-target-lbl">' + esc(L.targetNotes) + ':</span> ' +
      m.names.map(function (n, idx) {
        return '<span class="' + (idx === 0 ? 'bassnote' : '') + '">' + esc(n) + (idx === 0 ? ' <span class="bass-tag">' + esc(L.bass) + '</span>' : '') + '</span>';
      }).join(' <span class="sep">–</span> ');
    panel.appendChild(tn);

    // 7.-Stufe-Hinweis im Modal
    if (m.i === 6 && state.showHint) {
      const five = key.scale[4], seven = key.scale[6], slash = five + '/' + seven;
      const note = document.createElement('div');
      note.className = 'modal-note';
      note.innerHTML = '<span class="callout-mark mono">!</span><span>' + esc(L.sevenHint(slash, chordLabel(five, 'maj'), seven)) + '</span>';
      panel.appendChild(note);
    }

    // große Klaviatur
    const kbWrap = document.createElement('div');
    kbWrap.className = 'modal-kbd';
    const kb = buildKeyboard(m.positions, {
      whiteW: 40, interactive: true, labels: true,
      played: m.played, feedback: m.feedback, nameMap: nameMap
    });
    kbWrap.appendChild(kb);
    panel.appendChild(kbWrap);

    // Hinweis / Feedback
    const msg = document.createElement('div');
    msg.className = 'modal-msg';
    if (m.feedback) {
      if (m.feedback.ok) {
        msg.className += ' is-ok';
        msg.textContent = '✓ ' + L.correct;
      } else {
        msg.className += ' is-bad';
        const parts = [];
        if (m.feedback.missing.size) parts.push(namesOf(m.feedback.missing, nameMap, m) + ' ' + L.missingLbl);
        if (m.feedback.extra.size) parts.push(m.feedback.extra.size + '× ' + L.extraLbl);
        msg.textContent = parts.join(' · ');
      }
    } else {
      msg.textContent = L.tapHint;
    }
    panel.appendChild(msg);

    // Buttons
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML =
      '<button class="btn btn-primary" id="mCheck" type="button">' + esc(L.check) + '</button>' +
      '<button class="btn btn-ghost" id="mClear" type="button">' + esc(L.clear) + '</button>';
    panel.appendChild(actions);
    actions.querySelector('#mCheck').addEventListener('click', checkModal);
    actions.querySelector('#mClear').addEventListener('click', function () {
      m.played.clear(); m.feedback = null; renderModal();
    });

    back.appendChild(panel);
    root.appendChild(back);
  }

  // Namen einer Positions-Menge (für Zieltöne: aus nameMap; sortiert)
  function namesOf(set, nameMap) {
    return Array.from(set).sort(function (a, b) { return a - b; })
      .map(function (p) { return nameMap[p] || ('#' + p); }).join(', ');
  }

  /* ----------------------------------------------------------------
     8) SPRACHE + STATISCHE TEXTE
     ---------------------------------------------------------------- */
  function applyStaticTexts() {
    const L = t();
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i]').forEach(function (el) {
      const k = el.getAttribute('data-i');
      if (L[k]) el.textContent = L[k];
    });
    $('title').textContent = L.title;
    $('subtitle').textContent = L.subtitle;
    $('notation').textContent = L.notation;
  }

  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem('tt_lang', lang); } catch (e) {}
    applyStaticTexts();
    renderControls();
    renderLegend();
    renderGrid();
    if (state.modal) renderModal();
  }

  /* ----------------------------------------------------------------
     9) HELFER
     ---------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------------
     10) START
     ---------------------------------------------------------------- */
  let escWired = false;
  function mount(root) {
    try {
      const saved = localStorage.getItem('tt_lang');
      if (saved === 'de' || saved === 'en') state.lang = saved;
    } catch (e) {}
    root.classList.add('invtrainer');
    root.innerHTML =
      '<div class="kicker" data-i="kicker"></div>' +
      '<h1 id="title" class="title"></h1>' +
      '<p id="subtitle" class="sub"></p>' +
      '<div id="controls" class="controls"></div>' +
      '<div id="legend" class="legend"></div>' +
      '<div class="gridwrap"><div id="grid" class="grid"></div></div>' +
      '<p id="notation" class="notation"></p>' +
      '<div id="modalRoot"></div>';
    if (!escWired) {
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.modal) closeModal(); });
      escWired = true;
    }
    applyStaticTexts();
    renderControls();
    renderLegend();
    renderGrid();
  }

  /* ==================================================================
     11) VORBEREITET FÜR SPÄTER  (noch nicht aktiv)
     ------------------------------------------------------------------
     A) Web-MIDI-Eingang:
        Echte USB-Keyboard-Tasten sollen dieselben „gespielt"-Markierungen
        und denselben Live-Abgleich auslösen wie das Antippen. Andockpunkt
        ist onKeyTap(pos) bzw. state.modal.played — eine MIDI-Note muss nur
        in eine Tastatur-Position (0..23) übersetzt werden.

     function midiToPosition(midiNote) {
       // unteres C der aktuellen 2-Oktav-Ansicht bestimmen und mappen
       // return 0..23 oder null, wenn außerhalb
     }
     function initMidi() {
       if (!navigator.requestMIDIAccess) return;
       navigator.requestMIDIAccess().then(function (access) {
         access.inputs.forEach(function (input) {
           input.onmidimessage = function (msg) {
             const cmd = msg.data[0] & 0xf0, note = msg.data[1], vel = msg.data[2];
             const pos = midiToPosition(note);
             if (pos == null) return;
             if (cmd === 0x90 && vel > 0) { if (state.modal && !state.modal.played.has(pos)) onKeyTap(pos); }
             // Note-Off optional: live-Markierung wieder entfernen
           };
         });
       });
     }

     B) Akkord-Progressionen-Modus:
        Eine Folge von Schritten, die nacheinander in der richtigen Umkehrung
        gespielt werden müssen. Jeder Schritt nutzt computeChord(key,i,inv);
        die Prüf-Logik (checkModal) lässt sich pro Schritt wiederverwenden.

     const progression = { active: false, steps: [], index: 0 };
     // steps: [{ i, inv }, ...]  →  computeChord(getKey(), step.i, step.inv)
     ================================================================== */

  // Exportiert für spätere Erweiterungen / Tests:
  window.InversionTrainer = {
    mount: mount, setLang: setLang,
    KEYS: KEYS, computeChord: computeChord, chordLabel: chordLabel, state: state
  };
})();
