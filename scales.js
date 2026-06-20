/* ==================================================================
   Tonleiter-Engine — KAC Music Academy
   Reine Musiktheorie (DOM-frei, sprachunabhängig, in Node testbar).
   12 Tonarten × {Dur, Moll natürlich/harmonisch/melodisch}, korrekte
   Buchstabierung, Stufen + Halbton-Marker, Übungs-Pattern, Prüf-Logik.
   Fingersätze + Rendering kommen separat (Hände-Grafik / Claude Design).
   ================================================================== */
(function (global) {
  'use strict';

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  // Tonika-Schreibweisen: Dur wie im Inversionen-Modul; Moll konventionell
  // (pc1 = C#-Moll, pc3 = Eb-Moll, pc6 = F#-Moll, pc8 = G#-Moll, pc10 = Bb-Moll).
  const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

  // Modi: Halbton-Schritte in Halbtönen ab Grundton + Halbton-Stufenpaare (1-basiert).
  const MODES = {
    major:    { formula: [0, 2, 4, 5, 7, 9, 11], halfSteps: [[3, 4], [7, 8]] },
    natural:  { formula: [0, 2, 3, 5, 7, 8, 10], halfSteps: [[2, 3], [5, 6]] },
    harmonic: { formula: [0, 2, 3, 5, 7, 8, 11], halfSteps: [[2, 3], [5, 6], [7, 8]] }, // + übermäßige Sekunde 6–7
    melodic:  { formula: [0, 2, 3, 5, 7, 9, 11], halfSteps: [[2, 3], [7, 8]] }           // aufwärts-Form
  };

  function isMinor(mode) { return mode === 'natural' || mode === 'harmonic' || mode === 'melodic'; }
  function tonicsFor(mode) { return isMinor(mode) ? MINOR_TONICS : MAJOR_TONICS; }

  function parseTonic(id) {
    const letter = id[0];
    let pc = LETTER_PC[letter];
    for (let i = 1; i < id.length; i++) pc += (id[i] === '#' ? 1 : -1);
    return { letter: letter, pc: ((pc % 12) + 12) % 12, letterIndex: LETTERS.indexOf(letter) };
  }

  // Halbton-Differenz → Vorzeichen-String (im Skalen-Rahmen immer in -2..+2).
  function accidental(diff) {
    let d = ((diff % 12) + 12) % 12;
    if (d > 6) d -= 12;
    if (d === 0) return '';
    return (d > 0 ? '#' : 'b').repeat(Math.abs(d));
  }

  // Korrekt buchstabierte Tonleiter (7 Töne) für Tonika + Modus.
  function buildScale(tonicId, modeKey) {
    const mode = MODES[modeKey] || MODES.major;
    const t = parseTonic(tonicId);
    const names = [], pcs = [];
    for (let i = 0; i < 7; i++) {
      const letter = LETTERS[(t.letterIndex + i) % 7];
      const targetPc = (t.pc + mode.formula[i]) % 12;
      names.push(letter + accidental(targetPc - LETTER_PC[letter]));
      pcs.push(targetPc);
    }
    return {
      tonic: tonicId, mode: modeKey, isMinor: isMinor(modeKey),
      names: names, pcs: pcs,
      degrees: [1, 2, 3, 4, 5, 6, 7],
      halfSteps: mode.halfSteps, formula: mode.formula
    };
  }

  // Ein Ton an Skalen-Index d (0..N, 7 = Oktave des Grundtons): Name, Stufe (1..7),
  // Pitchclass und eine fortlaufende Halbton-Höhe (für Reihenfolge/Richtung).
  function noteAt(scale, d) {
    const within = ((d % 7) + 7) % 7;
    const oct = Math.floor(d / 7);
    return {
      degree: within + 1,
      name: scale.names[within],
      pc: scale.pcs[within],
      step: scale.formula[within] + 12 * oct   // monotone Tonhöhe über Oktaven
    };
  }

  // Übungs-Pattern → Folge von Tönen (mit Stufe) in Spielreihenfolge.
  //   'up'    : 1 2 3 4 5 6 7 8
  //   'down'  : 8 7 6 5 4 3 2 1
  //   'thirds': 1 3 2 4 3 5 4 6 5 7 6 8   (Terzen, vorwärts)  + Rückweg bei 'thirdsDown'
  function pattern(scale, type) {
    let idx;
    if (type === 'down') idx = [7, 6, 5, 4, 3, 2, 1, 0];
    else if (type === 'thirds') idx = [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7];
    else if (type === 'thirdsDown') idx = [7, 5, 6, 4, 5, 3, 4, 2, 3, 1, 2, 0];
    else idx = [0, 1, 2, 3, 4, 5, 6, 7];   // up
    return idx.map(function (d) { return noteAt(scale, d); });
  }

  // Sequenzielle Prüfung: zählt, wie viele Töne der erwarteten Pitchclass-Folge
  // (oktav-unabhängig) bereits in richtiger Reihenfolge gespielt wurden.
  // played: Folge gespielter Pitchclasses (in Anschlag-Reihenfolge).
  function checkSequence(played, expectedPcs) {
    let i = 0, lastOk = true;
    for (let k = 0; k < played.length && i < expectedPcs.length; k++) {
      if (((played[k] % 12) + 12) % 12 === expectedPcs[i]) i++;
      else lastOk = false;
    }
    return { matched: i, total: expectedPcs.length, complete: i >= expectedPcs.length, lastOk: lastOk };
  }

  const ScaleEngine = {
    LETTERS: LETTERS, MODES: MODES,
    MAJOR_TONICS: MAJOR_TONICS, MINOR_TONICS: MINOR_TONICS,
    tonicsFor: tonicsFor, isMinor: isMinor,
    buildScale: buildScale, noteAt: noteAt, pattern: pattern, checkSequence: checkSequence
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = ScaleEngine;
  else global.ScaleEngine = ScaleEngine;
})(typeof window !== 'undefined' ? window : globalThis);
