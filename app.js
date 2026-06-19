/* ============================================================
   Technik-Test — Projection & Sound
   Vanilla JS. No framework, no build. Runs on GitHub Pages.
   ============================================================ */

/* ------------------------------------------------------------------
   1) ZENTRALE KONFIGURATION  ·  CENTRAL CONFIGURATION
   Alles hier leicht änderbar. Werte = null → aus questions.json.
   ------------------------------------------------------------------ */
const CONFIG = {
  QUESTIONS_FILE: 'questions.json',

  // Google-Apps-Script-URL für die Ergebnis-Übermittlung.
  // Leer lassen → Ergebnis wird nur lokal gespeichert.
  SAVE_URL: '',

  DEFAULT_LANG: 'de',          // 'de' | 'en'

  // Optionale Overrides der meta.bewertung-Werte (null = aus JSON):
  OVERRIDE: {
    sekundenProFrage: null,     // z. B. 25
    fragenProSitzung: null,     // z. B. 8
    bestehensgrenzeProzent: null, // z. B. 70
  },

  QUESTIONS_FILE_LEARN: 'learn.json',

  // Guide-ID, die zusätzlich als eigener "Checkliste"-Eintrag auf der Production-Startseite erscheint.
  CHECKLIST_GUIDE: 'rollen-ablauf',

  STORAGE_KEY_LANG: 'tt_lang',
  STORAGE_KEY_RESULTS: 'tt_results',
  STORAGE_KEY_CHECK: 'tt_check',
  STORAGE_KEY_USER: 'tt_user',
};

/* ------------------------------------------------------------------
   2) UI-TEXTE  ·  UI STRINGS
   ------------------------------------------------------------------ */
const I18N = {
  de: {
    brand: 'KAC Production Team',
    brand_academy: 'KAC Music Academy',
    brand_portal: 'KAC · Music Academy & Production Team',
    area_kicker: 'Lern- & Test-Portal',
    area_title: 'KAC',
    area_intro: 'Wähle deinen Bereich.',
    area_academy_name: 'Music Academy',
    area_academy_sub: 'Musiktheorie lernen & üben — Tonleitern, Nashville, Inversionen',
    area_academy_go: 'Zum Lernbereich',
    area_production_name: 'Production Team',
    area_production_sub: 'Sound & Projection — Lernbereich und Wissens-Test',
    area_production_go: 'Lernen & Test',
    back_areas: 'Übersicht',
    learn_academy_kicker: 'Music Academy · Lernbereich',
    learn_academy_title: 'Lernen',
    learn_academy_intro: 'Theorie und Beispiele zum Nachlesen. Lies von oben nach unten und spiel die Beispiele am Klavier mit.',
    ac_home_kicker: 'Music Academy',
    ac_home_intro: 'Theorie, Übungen oder Praxis wählen.',
    ac_learn: 'Lernen',
    ac_learn_sub: 'Theorie & Beispiele zum Nachlesen',
    ac_theorie: 'Theorie-Übungen',
    ac_theorie_sub: 'Arbeitsblätter zum Ausfüllen & Drucken',
    ac_praxis: 'Praxis',
    ac_praxis_sub: 'Interaktiv am Klavier — Akkorde & Umkehrungen',
    learn_theorie_kicker: 'Music Academy · Theorie-Übungen',
    learn_theorie_title: 'Theorie-Übungen',
    learn_theorie_intro: 'Tippe deine Antworten direkt ein, prüfe sie und blende bei Bedarf die Lösung ein. Unten gibt es „Drucken".',
    learn_praxis_kicker: 'Music Academy · Praxis',
    learn_praxis_title: 'Praxis',
    learn_praxis_intro: 'Interaktive Übungen am Klavier. Wähle eine Übung.',
    tf_true: 'Richtig',
    tf_false: 'Falsch',
    px_key: 'Tonart',
    px_degree: 'Stufe',
    px_inversion: 'Umkehrung',
    px_inv0: 'Grundstellung',
    px_inv1: '1. Umkehrung',
    px_inv2: '2. Umkehrung',
    px_target: 'Zieltöne',
    px_check: 'Prüfen',
    px_clear: 'Tasten leeren',
    px_correct: 'Richtig gespielt! 🎯',
    px_hint_missing: 'Es fehlt noch',
    px_hint_extra: 'Zu viel',
    px_tap: 'Tippe die Tasten, die du spielst — dann „Prüfen". (Bald auch per MIDI.)',
    show_solutions: 'Lösungen anzeigen',
    hide_solutions: 'Lösungen ausblenden',
    ws_check: 'Prüfen',
    ws_solve: 'Lösung zeigen',
    ws_reset: 'Leeren',
    ws_print: 'Drucken',
    ws_result: (x, y) => `${x} von ${y} richtig`,
    home_kicker: 'Production Team · Sound & Projection',
    home_intro: 'Lerne die Abläufe und teste dein Wissen.',
    home_learn: 'Lernen',
    home_learn_sub: 'Abläufe, Rollen & Checklisten zum Nachlesen',
    home_test: 'Test',
    home_test_sub: 'Wissens-Check für Projection & Sound',
    home_check: 'Checkliste',
    home_check_sub: 'Auf- & Abbau zum Abhaken',
    learn_kicker: 'Lernbereich',
    learn_title: 'Lernen',
    learn_intro: 'Anleitungen und Checklisten für das Team. Frei zugänglich — kein Login nötig.',
    learn_empty: 'Aktuell sind keine Inhalte hinterlegt.',
    back: 'Zurück',
    back_home: 'Startseite',
    back_learn: 'Lernbereich',
    updated: 'Stand',
    to_test: 'Wissen testen',
    reset_checks: 'Haken zurücksetzen',
    section_of: (x, y) => `Abschnitt ${x} / ${y}`,
    login_kicker: 'KAC · Lern- & Test-Portal',
    login_title: 'KAC',
    login_intro: 'Melde dich mit deinem Namen an, um loszulegen.',
    first_name: 'Vorname',
    last_name: 'Nachname',
    first_name_ph: 'z. B. Anna',
    last_name_ph: 'z. B. Müller',
    start: 'Anmelden',
    not_found: 'Wir konnten dich nicht in der Teilnehmerliste finden. Bitte prüfe die Schreibweise von Vor- und Nachname.',
    need_both: 'Bitte gib Vor- und Nachnamen ein.',
    select_kicker: 'Test wählen',
    hello: 'Hallo',
    select_intro: 'Welchen Bereich möchtest du testen?',
    no_tests: 'Für dich sind aktuell keine Tests freigeschaltet.',
    questions: 'Fragen',
    minutes_approx: 'Sek. pro Frage',
    logout: 'Abmelden',
    question_of: (x, y) => `Frage ${x} von ${y}`,
    seconds: 'Sek.',
    confirm: 'Bestätigen',
    abort: 'Test abbrechen',
    abort_title: 'Test abbrechen?',
    abort_text: 'Dein Fortschritt geht verloren und wird nicht gewertet.',
    abort_yes: 'Ja, abbrechen',
    abort_no: 'Weiter testen',
    no_answer: 'keine Antwort',
    result_kicker: 'Ergebnis',
    passed: 'Bestanden',
    failed: 'Nicht bestanden',
    your_score: 'Dein Ergebnis',
    correct: 'Richtig',
    test_label: 'Test',
    threshold: 'Grenze',
    save_pending: 'Ergebnis wird übermittelt …',
    save_ok: 'Ergebnis übermittelt und lokal gesichert.',
    save_local: 'Keine Übermittlungs-URL hinterlegt — Ergebnis lokal im Browser gesichert.',
    save_fail: 'Übermittlung fehlgeschlagen — Ergebnis lokal im Browser gesichert.',
    back_home: 'Zur Startseite',
    of: 'von',
  },
  en: {
    brand: 'KAC Production Team',
    brand_academy: 'KAC Music Academy',
    brand_portal: 'KAC · Music Academy & Production Team',
    area_kicker: 'Learning & Test Portal',
    area_title: 'KAC',
    area_intro: 'Choose your area.',
    area_academy_name: 'Music Academy',
    area_academy_sub: 'Learn & practise music theory — scales, Nashville, inversions',
    area_academy_go: 'To the learning area',
    area_production_name: 'Production Team',
    area_production_sub: 'Sound & Projection — learning area and knowledge test',
    area_production_go: 'Learn & test',
    back_areas: 'Overview',
    learn_academy_kicker: 'Music Academy · Learning area',
    learn_academy_title: 'Learn',
    learn_academy_intro: 'Theory and examples to read up on. Read top to bottom and play the examples along on the piano.',
    ac_home_kicker: 'Music Academy',
    ac_home_intro: 'Choose theory, exercises or practice.',
    ac_learn: 'Learn',
    ac_learn_sub: 'Theory & examples to read up on',
    ac_theorie: 'Theory exercises',
    ac_theorie_sub: 'Worksheets to fill in & print',
    ac_praxis: 'Practice',
    ac_praxis_sub: 'Interactive at the piano — chords & inversions',
    learn_theorie_kicker: 'Music Academy · Theory exercises',
    learn_theorie_title: 'Theory exercises',
    learn_theorie_intro: 'Type your answers directly, check them and reveal the solution if needed. Use "Print" at the bottom.',
    learn_praxis_kicker: 'Music Academy · Practice',
    learn_praxis_title: 'Practice',
    learn_praxis_intro: 'Interactive exercises at the piano. Pick an exercise.',
    tf_true: 'True',
    tf_false: 'False',
    px_key: 'Key',
    px_degree: 'Degree',
    px_inversion: 'Inversion',
    px_inv0: 'Root position',
    px_inv1: '1st inversion',
    px_inv2: '2nd inversion',
    px_target: 'Target notes',
    px_check: 'Check',
    px_clear: 'Clear keys',
    px_correct: 'Played correctly! 🎯',
    px_hint_missing: 'Still missing',
    px_hint_extra: 'Too many',
    px_tap: 'Tap the keys you play — then "Check". (MIDI coming soon.)',
    show_solutions: 'Show solutions',
    hide_solutions: 'Hide solutions',
    ws_check: 'Check',
    ws_solve: 'Show solution',
    ws_reset: 'Clear',
    ws_print: 'Print',
    ws_result: (x, y) => `${x} of ${y} correct`,
    home_kicker: 'Production Team · Sound & Projection',
    home_intro: 'Learn the workflows and test your knowledge.',
    home_learn: 'Learn',
    home_learn_sub: 'Workflows, roles & checklists to read up on',
    home_test: 'Test',
    home_test_sub: 'Knowledge check for Projection & Sound',
    home_check: 'Checklist',
    home_check_sub: 'Setup & teardown to tick off',
    learn_kicker: 'Learning area',
    learn_title: 'Learn',
    learn_intro: 'Guides and checklists for the team. Freely accessible — no login needed.',
    learn_empty: 'No content available yet.',
    back: 'Back',
    back_home: 'Home',
    back_learn: 'Learning area',
    updated: 'Updated',
    to_test: 'Test your knowledge',
    reset_checks: 'Reset checkmarks',
    section_of: (x, y) => `Section ${x} / ${y}`,
    login_kicker: 'KAC · Learning & Test Portal',
    login_title: 'KAC',
    login_intro: 'Sign in with your name to get started.',
    first_name: 'First name',
    last_name: 'Last name',
    first_name_ph: 'e.g. Anna',
    last_name_ph: 'e.g. Müller',
    start: 'Sign in',
    not_found: 'We could not find you on the participant list. Please check the spelling of your first and last name.',
    need_both: 'Please enter both first and last name.',
    select_kicker: 'Choose test',
    hello: 'Hello',
    select_intro: 'Which area would you like to test?',
    no_tests: 'No tests are currently available for you.',
    questions: 'questions',
    minutes_approx: 'sec. per question',
    logout: 'Sign out',
    question_of: (x, y) => `Question ${x} of ${y}`,
    seconds: 'sec.',
    confirm: 'Confirm',
    abort: 'Abort test',
    abort_title: 'Abort test?',
    abort_text: 'Your progress will be lost and will not be scored.',
    abort_yes: 'Yes, abort',
    abort_no: 'Keep testing',
    no_answer: 'no answer',
    result_kicker: 'Result',
    passed: 'Passed',
    failed: 'Not passed',
    your_score: 'Your score',
    correct: 'Correct',
    test_label: 'Test',
    threshold: 'Threshold',
    save_pending: 'Submitting result …',
    save_ok: 'Result submitted and saved locally.',
    save_local: 'No submission URL configured — result saved locally in the browser.',
    save_fail: 'Submission failed — result saved locally in the browser.',
    back_home: 'Back to start',
    of: 'of',
  },
};

/* ------------------------------------------------------------------
   3) ZUSTAND  ·  STATE
   ------------------------------------------------------------------ */
const state = {
  data: null,
  learn: null,
  area: null,
  academyGroup: 'lernen',  // 'lernen' | 'uebungen' (Untermenü der Music Academy)
  currentGuide: null,
  guideFrom: 'learn',  // 'home' (über Checkliste) | 'learn' (über Lernbereich)
  rules: null,        // effective bewertung
  lang: CONFIG.DEFAULT_LANG,
  participant: null,  // matched teilnehmer
  testKey: null,
  session: [],        // [{ q, options:[{de,en,orig}], correctIndex, selected, secondsUsed }]
  current: 0,
  remaining: 0,
  ticker: null,
  qStart: 0,
  tabSwitches: 0,
};

const app = document.getElementById('app');
const t = () => I18N[state.lang];

/* ------------------------------------------------------------------
   4) HELFER  ·  HELPERS
   ------------------------------------------------------------------ */
function normalizeName(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip remaining accents
    .replace(/[^a-z0-9]/g, '');                        // drop spaces & punctuation
}

function themeFromQuelle(quelle) {
  if (!quelle) return '';
  const i = quelle.indexOf(', S.');
  return (i >= 0 ? quelle.slice(0, i) : quelle).trim();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHTML(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/* ------------------------------------------------------------------
   5) SPRACHE  ·  LANGUAGE
   ------------------------------------------------------------------ */
const langToggle = document.getElementById('langToggle');

function setLang(lang, rerender = true) {
  state.lang = lang;
  document.documentElement.lang = lang;
  try { localStorage.setItem(CONFIG.STORAGE_KEY_LANG, lang); } catch (e) {}
  langToggle.querySelectorAll('[data-lang-opt]').forEach(s => {
    s.classList.toggle('is-active', s.dataset.langOpt === lang);
  });
  if (rerender) rerenderCurrent();
}

langToggle.addEventListener('click', () => {
  setLang(state.lang === 'de' ? 'en' : 'de');
});

/* Re-render the current screen live (used by language switch) */
let currentScreen = 'boot';
function rerenderCurrent() {
  if (currentScreen === 'area') renderArea();
  else if (currentScreen === 'academyHome') renderAcademyHome();
  else if (currentScreen === 'praxis') { const g = ((state.learn && state.learn.guides) || []).find(x => x.id === state.currentGuide); if (g) renderInversionPraxis(g); }
  else if (currentScreen === 'home') renderHome();
  else if (currentScreen === 'learn') renderLearnHome();
  else if (currentScreen === 'guide') renderGuide(state.currentGuide, true);
  else if (currentScreen === 'login') renderLogin(true);
  else if (currentScreen === 'select') renderSelect();
  else if (currentScreen === 'quiz') updateQuizTexts();   // keep timer running
  else if (currentScreen === 'result') renderResult(state._lastResult);
}

/* ------------------------------------------------------------------
   6) START  ·  BOOTSTRAP
   ------------------------------------------------------------------ */
async function boot() {
  document.documentElement.classList.add('js-ready');
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY_LANG);
    if (saved === 'de' || saved === 'en') state.lang = saved;
  } catch (e) {}
  setLang(state.lang, false);

  try {
    const res = await fetch(CONFIG.QUESTIONS_FILE, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.data = await res.json();
  } catch (e) {
    app.innerHTML =
      '<div class="screen"><div class="kicker">Fehler · Error</div>' +
      '<h1 class="display">Daten<br>nicht geladen</h1>' +
      '<p style="margin-top:18px;color:var(--ink-soft)">Die Datei <span class="mono">questions.json</span> konnte nicht geladen werden.<br>The questions could not be loaded.</p></div>';
    return;
  }

  const b = state.data.meta.bewertung;
  state.rules = {
    sekundenProFrage: CONFIG.OVERRIDE.sekundenProFrage ?? b.sekundenProFrage,
    fragenProSitzung: CONFIG.OVERRIDE.fragenProSitzung ?? b.fragenProSitzung,
    bestehensgrenzeProzent: CONFIG.OVERRIDE.bestehensgrenzeProzent ?? b.bestehensgrenzeProzent,
    punkteProFrage: b.punkteProFrage,
  };

  // Learning content (optional — site still works without it)
  try {
    const lr = await fetch(CONFIG.QUESTIONS_FILE_LEARN, { cache: 'no-store' });
    if (lr.ok) state.learn = await lr.json();
  } catch (e) { state.learn = null; }

  // Globaler Name-Login beim Start; danach das Bereichs-Portal.
  try {
    const u = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEY_USER) || 'null');
    if (u && u.vorname && u.nachname) state.participant = u;
  } catch (e) {}
  state.participant ? renderArea() : renderLogin();
}

/* ------------------------------------------------------------------
   6a) SCREEN: AREA  ·  Music Academy | Production Team
   ------------------------------------------------------------------ */
function renderArea() {
  currentScreen = 'area';
  state.area = null;
  const L = t();

  app.innerHTML = `
    <section class="screen">
      <div class="kicker">${escapeHTML(L.area_kicker)}</div>
      <h1 class="display">${escapeHTML(L.area_title)}</h1>
      <p style="margin:18px 0 0;color:var(--ink-soft)">${escapeHTML(L.area_intro)}</p>
      <div class="area-grid">
        <button class="area-tile" id="areaAcademy" type="button">
          <span class="area-idx mono">01</span>
          <span class="area-name">${escapeHTML(L.area_academy_name)}</span>
          <span class="area-sub">${escapeHTML(L.area_academy_sub)}</span>
          <span class="area-go mono">${escapeHTML(L.area_academy_go)} <span class="arrow">→</span></span>
        </button>
        <button class="area-tile" id="areaProduction" type="button">
          <span class="area-idx mono">02</span>
          <span class="area-name">${escapeHTML(L.area_production_name)}</span>
          <span class="area-sub">${escapeHTML(L.area_production_sub)}</span>
          <span class="area-go mono">${escapeHTML(L.area_production_go)} <span class="arrow">→</span></span>
        </button>
      </div>
      <div class="spacer"></div>
      <div class="area-foot">
        <span class="area-user mono">${state.participant ? escapeHTML(L.hello + ', ' + state.participant.vorname) : ''}</span>
        <button class="linkbtn" id="areaLogout" type="button">${escapeHTML(L.logout)}</button>
      </div>
      <div class="brandline mono">${escapeHTML(L.brand_portal)}</div>
    </section>`;

  document.getElementById('areaAcademy').addEventListener('click', () => renderAcademyHome());
  document.getElementById('areaProduction').addEventListener('click', () => renderHome());
  document.getElementById('areaLogout').addEventListener('click', () => {
    state.participant = null;
    try { sessionStorage.removeItem(CONFIG.STORAGE_KEY_USER); } catch (e) {}
    renderLogin();
  });
}

/* ------------------------------------------------------------------
   6b) SCREEN: HOME  ·  Production-Hub: Lernen / Test
   ------------------------------------------------------------------ */
function renderHome() {
  currentScreen = 'home';
  const L = t();
  const guides = (state.learn && state.learn.guides) || [];
  const prodGuides = guides.filter(g => (g.area || 'production') === 'production');
  const hasLearn = prodGuides.length > 0;
  const hasCheck = prodGuides.some(g => g.id === CONFIG.CHECKLIST_GUIDE);

  // 01 Checkliste · 02 Lernen · 03 Test
  const rows = [];
  if (hasCheck) rows.push({ id: 'goCheck', name: L.home_check, sub: L.home_check_sub });
  if (hasLearn) rows.push({ id: 'goLearn', name: L.home_learn, sub: L.home_learn_sub });
  rows.push({ id: 'goTest', name: L.home_test, sub: L.home_test_sub });
  const rowsHTML = rows.map((r, i) => `
        <button class="test-row" type="button" id="${r.id}">
          <span class="idx mono">${String(i + 1).padStart(2, '0')}</span>
          <span>
            <span class="name">${escapeHTML(r.name)}</span><br>
            <span class="meta">${escapeHTML(r.sub)}</span>
          </span>
          <span class="arrow">→</span>
        </button>`).join('');

  app.innerHTML = `
    <section class="screen">
      <button class="backlink" id="homeBack" type="button"><span class="backarrow">←</span> ${escapeHTML(L.back_areas)}</button>
      <div class="kicker">${escapeHTML(L.home_kicker)}</div>
      <h1 class="display">Projection<br>&amp; Sound</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft)">${escapeHTML(L.home_intro)}</p>
      <div class="test-list">${rowsHTML}
      </div>
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(L.brand)}</div>
    </section>`;

  document.getElementById('homeBack').addEventListener('click', () => renderArea());
  const gc = document.getElementById('goCheck');
  if (gc) gc.addEventListener('click', () => { state.area = 'production'; state.guideFrom = 'home'; renderGuide(CONFIG.CHECKLIST_GUIDE); });
  const gl = document.getElementById('goLearn');
  if (gl) gl.addEventListener('click', () => { state.area = 'production'; renderLearnHome(); });
  document.getElementById('goTest').addEventListener('click', () => {
    state.participant ? renderSelect() : renderLogin();
  });
}

/* ------------------------------------------------------------------
   7) SCREEN: LOGIN
   ------------------------------------------------------------------ */
function renderLogin(keepValues = false) {
  currentScreen = 'login';
  const prevFirst = keepValues ? (document.getElementById('vorname')?.value || '') : '';
  const prevLast = keepValues ? (document.getElementById('nachname')?.value || '') : '';
  const L = t();
  const title = L.login_title.split('\n').map(escapeHTML).join('<br>');

  app.innerHTML = `
    <section class="screen">
      <div class="kicker">${escapeHTML(L.login_kicker)}</div>
      <h1 class="display">${title}</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft);max-width:34ch">${escapeHTML(L.login_intro)}</p>

      <form id="loginForm" autocomplete="off" novalidate>
        <div class="field">
          <label for="vorname">${escapeHTML(L.first_name)}</label>
          <input id="vorname" name="vorname" type="text" inputmode="text"
                 placeholder="${escapeHTML(L.first_name_ph)}" value="${escapeHTML(prevFirst)}" />
        </div>
        <div class="field">
          <label for="nachname">${escapeHTML(L.last_name)}</label>
          <input id="nachname" name="nachname" type="text" inputmode="text"
                 placeholder="${escapeHTML(L.last_name_ph)}" value="${escapeHTML(prevLast)}" />
        </div>

        <div id="loginNotice" class="notice is-hidden"></div>

        <div class="spacer"></div>
        <button class="btn" type="submit">
          <span>${escapeHTML(L.start)}</span><span class="arrow">→</span>
        </button>
      </form>
    </section>`;

  document.getElementById('loginForm').addEventListener('submit', onLogin);
}

function showNotice(msg) {
  const n = document.getElementById('loginNotice');
  n.textContent = msg;
  n.classList.remove('is-hidden');
  // restart shake animation
  n.style.animation = 'none'; void n.offsetWidth; n.style.animation = '';
}

function onLogin(e) {
  e.preventDefault();
  const L = t();
  const first = document.getElementById('vorname').value;
  const last = document.getElementById('nachname').value;
  if (!first.trim() || !last.trim()) { showNotice(L.need_both); return; }

  const nf = normalizeName(first), nl = normalizeName(last);
  const match = state.data.teilnehmer.find(p =>
    normalizeName(p.vorname) === nf && normalizeName(p.nachname) === nl);

  if (!match) { showNotice(L.not_found); return; }

  state.participant = match;
  try { sessionStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(match)); } catch (e) {}
  renderArea();
}

/* ------------------------------------------------------------------
   8) SCREEN: TEST SELECTION
   ------------------------------------------------------------------ */
function renderSelect() {
  currentScreen = 'select';
  const L = t();
  const allowed = (state.participant.bereiche || []).filter(k => state.data.tests[k]);

  let rows = '';
  if (allowed.length === 0) {
    rows = `<p class="notice" style="animation:none">${escapeHTML(L.no_tests)}</p>`;
  } else {
    rows = '<div class="test-list">' + allowed.map((key, i) => {
      const test = state.data.tests[key];
      const count = state.rules.fragenProSitzung;
      return `
        <button class="test-row" type="button" data-test="${escapeHTML(key)}">
          <span class="idx mono">0${i + 1}</span>
          <span>
            <span class="name">${escapeHTML(test.label)}</span><br>
            <span class="meta">${count} ${escapeHTML(L.questions)} · ${state.rules.sekundenProFrage} ${escapeHTML(L.minutes_approx)}</span>
          </span>
          <span class="arrow">→</span>
        </button>`;
    }).join('') + '</div>';
  }

  app.innerHTML = `
    <section class="screen">
      <div class="kicker">${escapeHTML(L.select_kicker)}</div>
      <h1 class="display">${escapeHTML(L.hello)},<br>${escapeHTML(state.participant.vorname)}.</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft)">${escapeHTML(L.select_intro)}</p>
      ${rows}
      <div class="spacer"></div>
      <div class="abort-row"><button class="linkbtn" id="logoutBtn" type="button">← ${escapeHTML(L.back_home)}</button></div>
    </section>`;

  app.querySelectorAll('.test-row').forEach(b =>
    b.addEventListener('click', () => startQuiz(b.dataset.test)));
  document.getElementById('logoutBtn').addEventListener('click', () => renderHome());
}

/* ------------------------------------------------------------------
   8b) LERNBEREICH  ·  LEARNING AREA
   ------------------------------------------------------------------ */
function tagLabel(tag) {
  if (tag === 'projection') return state.data?.tests?.projection?.label || 'Projection';
  if (tag === 'sound') return state.data?.tests?.sound?.label || 'Sound';
  return '';
}

/* 6c) SCREEN: MUSIC ACADEMY HOME — Lernen | Übungen */
function renderAcademyHome() {
  currentScreen = 'academyHome';
  state.area = 'academy';
  const L = t();
  const rows = [
    { id: 'acLearn', group: 'lernen', name: L.ac_learn, sub: L.ac_learn_sub },
    { id: 'acTheorie', group: 'theorie', name: L.ac_theorie, sub: L.ac_theorie_sub },
    { id: 'acPraxis', group: 'praxis', name: L.ac_praxis, sub: L.ac_praxis_sub },
  ];
  const rowsHTML = rows.map((r, i) => `
        <button class="test-row" type="button" id="${r.id}">
          <span class="idx mono">${String(i + 1).padStart(2, '0')}</span>
          <span>
            <span class="name">${escapeHTML(r.name)}</span><br>
            <span class="meta">${escapeHTML(r.sub)}</span>
          </span>
          <span class="arrow">→</span>
        </button>`).join('');
  app.innerHTML = `
    <section class="screen">
      <button class="backlink" id="acBack" type="button"><span class="backarrow">←</span> ${escapeHTML(L.back_areas)}</button>
      <div class="kicker">${escapeHTML(L.ac_home_kicker)}</div>
      <h1 class="display">${escapeHTML(L.area_academy_name)}</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft)">${escapeHTML(L.ac_home_intro)}</p>
      <div class="test-list">${rowsHTML}
      </div>
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(L.brand_academy)}</div>
    </section>`;
  document.getElementById('acBack').addEventListener('click', () => renderArea());
  rows.forEach(r => document.getElementById(r.id).addEventListener('click', () => { state.academyGroup = r.group; renderLearnHome(); }));
}

function renderLearnHome() {
  currentScreen = 'learn';
  const L = t();
  const isAcademy = state.area === 'academy';
  const grp = state.academyGroup;
  const acKicker = grp === 'theorie' ? L.learn_theorie_kicker : grp === 'praxis' ? L.learn_praxis_kicker : L.learn_academy_kicker;
  const acTitle = grp === 'theorie' ? L.learn_theorie_title : grp === 'praxis' ? L.learn_praxis_title : L.learn_academy_title;
  const acIntro = grp === 'theorie' ? L.learn_theorie_intro : grp === 'praxis' ? L.learn_praxis_intro : L.learn_academy_intro;
  const guides = ((state.learn && state.learn.guides) || []).filter(g =>
    (g.area || 'production') === state.area &&
    (!isAcademy || (g.group || 'lernen') === state.academyGroup));
  const lang = state.lang;
  const tx = (o) => o ? (o[lang] ?? o.de ?? '') : '';

  let rows;
  if (!guides.length) {
    rows = `<p class="notice" style="animation:none">${escapeHTML(L.learn_empty)}</p>`;
  } else {
    rows = '<div class="test-list">' + guides.map((g, i) => {
      const meta = g.meta ? tx(g.meta) : (g.bereiche || []).map(tagLabel).filter(Boolean).join(' · ');
      return `
        <button class="test-row" type="button" data-guide="${escapeHTML(g.id)}">
          <span class="idx mono">${String(i + 1).padStart(2, '0')}</span>
          <span>
            <span class="name name--sm">${escapeHTML(tx(g.title))}</span><br>
            <span class="meta">${escapeHTML(meta)}</span>
          </span>
          <span class="arrow">→</span>
        </button>`;
    }).join('') + '</div>';
  }

  app.innerHTML = `
    <section class="screen">
      <button class="backlink" id="learnBack" type="button"><span class="backarrow">←</span> ${escapeHTML(L.back_areas)}</button>
      <div class="kicker">${escapeHTML(isAcademy ? acKicker : L.learn_kicker)}</div>
      <h1 class="display">${escapeHTML(isAcademy ? acTitle : L.learn_title)}</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft);max-width:42ch">${escapeHTML(isAcademy ? acIntro : L.learn_intro)}</p>
      ${rows}
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(isAcademy ? L.brand_academy : L.brand)}</div>
    </section>`;

  document.getElementById('learnBack').addEventListener('click', () => isAcademy ? renderAcademyHome() : renderHome());
  app.querySelectorAll('.test-row[data-guide]').forEach(b =>
    b.addEventListener('click', () => { state.guideFrom = 'learn'; renderGuide(b.dataset.guide); }));
}

/* --- checklist persistence --- */
function checkKey(guideId) { return CONFIG.STORAGE_KEY_CHECK + ':' + guideId; }
function loadChecks(guideId) {
  try { return JSON.parse(localStorage.getItem(checkKey(guideId)) || '{}'); } catch (e) { return {}; }
}
function saveChecks(guideId, obj) {
  try { localStorage.setItem(checkKey(guideId), JSON.stringify(obj)); } catch (e) {}
}

/* --- lazy load a guide's sections (inline or from its own file) --- */
const guideCache = {};
async function loadGuideSections(g) {
  if (guideCache[g.id]) return guideCache[g.id];
  if (Array.isArray(g.sections)) { guideCache[g.id] = g.sections; return g.sections; }
  if (g.file) {
    try {
      const r = await fetch(g.file, { cache: 'no-store' });
      if (r.ok) { const j = await r.json(); guideCache[g.id] = j.sections || []; return guideCache[g.id]; }
    } catch (e) {}
  }
  guideCache[g.id] = [];
  return [];
}

/* --- one tickable checklist item --- */
function makeCheck(id, label, checks) {
  const on = checks[id] ? ' is-on' : '';
  return `<button class="check${on}" type="button" data-cid="${escapeHTML(id)}">
      <span class="check-box">${checks[id] ? '✓' : ''}</span>
      <span class="check-label">${escapeHTML(label)}</span>
    </button>`;
}

/* --- render one content block to HTML --- */
function renderBlock(b, ctx) {
  const { tx, checks, guideId, path, L } = ctx;
  switch (b.type) {
    case 'text':
      return `<p class="g-text">${escapeHTML(tx(b.text))}</p>`;
    case 'lead':
      return `<p class="g-lead">${escapeHTML(tx(b.text))}</p>`;
    case 'sub': {
      let h = `<div class="g-sub"><h3 class="g-sub-title">${escapeHTML(tx(b.title))}</h3>`;
      if (b.text) h += `<p class="g-text">${escapeHTML(tx(b.text))}</p>`;
      if (b.items) h += '<ul class="bullets">' + b.items.map(it => `<li>${escapeHTML(tx(it))}</li>`).join('') + '</ul>';
      return h + '</div>';
    }
    case 'bullets':
      return '<ul class="bullets">' + (b.items || []).map(it => `<li>${escapeHTML(tx(it))}</li>`).join('') + '</ul>';
    case 'steps':
      return '<ol class="steps">' + (b.items || []).map(it => `<li><span class="step-text">${escapeHTML(tx(it))}</span></li>`).join('') + '</ol>';
    case 'check':
      return '<div class="checks">' + (b.items || []).map((it, i) => makeCheck(path + 'i' + i, tx(it), checks)).join('') + '</div>';
    case 'positions':
      return '<div class="poslist">' + (b.items || []).map((p, pi) => {
        const items = (p.items || []).map((it, ii) => makeCheck(path + 'p' + pi + 'i' + ii, tx(it), checks)).join('');
        const subs = (p.sub || []).map((s, sj) => `
          <div class="subpos">
            <div class="subpos-name mono">${escapeHTML(tx(s.name))}</div>
            <div class="checks">${(s.items || []).map((it, ii) => makeCheck(path + 'p' + pi + 's' + sj + 'i' + ii, tx(it), checks)).join('')}</div>
          </div>`).join('');
        return `<div class="poscard">
            <div class="pos-head">
              <span class="pos-idx mono">P${pi + 1}</span>
              <span class="pos-name">${escapeHTML(tx(p.name))}</span>
              ${p.who ? `<span class="pos-who mono">${escapeHTML(tx(p.who))}</span>` : ''}
            </div>
            ${p.desc ? `<p class="pos-desc">${escapeHTML(tx(p.desc))}</p>` : ''}
            <div class="checks">${items}</div>
            ${subs}
          </div>`;
      }).join('') + '</div>';
    case 'roles':
      return '<div class="rolelist">' + (b.items || []).map(r => `
        <div class="rolecard">
          <div class="role-head">
            <span class="role-name">${escapeHTML(tx(r.name))}</span>
            ${r.hint ? `<span class="role-hint mono">${escapeHTML(tx(r.hint))}</span>` : ''}
          </div>
          <ul class="bullets">${(r.items || []).map(it => `<li>${escapeHTML(tx(it))}</li>`).join('')}</ul>
        </div>`).join('') + '</div>';
    case 'table': {
      const head = '<tr>' + (b.head || []).map(h => `<th>${escapeHTML(tx(h))}</th>`).join('') + '</tr>';
      const rows = (b.rows || []).map(r => '<tr>' + r.map(c => `<td>${escapeHTML(tx(c))}</td>`).join('') + '</tr>').join('');
      return `<div class="g-tablewrap"><table class="g-table"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
    }
    case 'figure': {
      const sid = 'fig-' + guideId + '-' + path;
      const cap = escapeHTML(tx(b.caption));
      const ar = b.aspect || '16 / 10';
      // Echtes Bild: figure-Feld "image" (+ optional "image_en"). "fit" = contain|cover.
      const chosen = (state.lang === 'en' && b.image_en) ? b.image_en : b.image;
      const imgSrc = chosen ? ` src="${escapeHTML(chosen)}"` : '';
      const fit = b.fit ? ` fit="${escapeHTML(b.fit)}"` : '';
      return `<figure class="g-fig">
          <image-slot id="${sid}" class="g-slot" placeholder="${cap}" shape="rect"${imgSrc}${fit} style="width:100%;height:auto;aspect-ratio:${ar}"></image-slot>
          <figcaption class="g-figcap mono">${cap}</figcaption>
        </figure>`;
    }
    case 'note':
      return `<div class="callout"><span class="callout-mark mono">!</span><span>${escapeHTML(tx(b.text))}</span></div>`;
    case 'solution': {
      const label = tx(b.label) || (L ? L.show_solutions : 'Lösungen');
      const inner = (b.blocks || []).map((bb, bi) => renderBlock(bb, Object.assign({}, ctx, { path: path + 'x' + bi }))).join('');
      return `<div class="solution">
          <button class="sol-toggle" type="button" data-soltoggle><span class="sol-ic mono">+</span><span data-soltext>${escapeHTML(label)}</span></button>
          <div class="sol-body" hidden>${inner}</div>
        </div>`;
    }
    case 'closing':
      return `<p class="sec-closing">${escapeHTML(tx(b.text))}</p>`;
    default:
      return '';
  }
}

/* ------------------------------------------------------------------
   8c) INTERAKTIVES ARBEITSBLATT  ·  worksheet (table) + solution
   Leere Zellen werden Eingabefelder; die Lösungstabelle ist der
   Antwortschlüssel. Prüfen (grün/rot), Lösung zeigen, Leeren, Drucken.
   ------------------------------------------------------------------ */
// Antwort tolerant vergleichen: Reihenfolge-unabhängige Token (für "C, E"),
// Gross/Klein egal, ♯/♭ -> #/b, Leerzeichen raus.
function wsTokens(s) {
  return (s == null ? '' : String(s)).toLowerCase()
    .replace(/♯/g, '#').replace(/♭/g, 'b')
    .split(/[,/]+/).map(x => x.replace(/\s+/g, '')).filter(Boolean).sort();
}
function wsMatch(input, answer) {
  const a = wsTokens(input), b = wsTokens(answer);
  return a.length > 0 && a.length === b.length && a.every((v, i) => v === b[i]);
}
// Erkennt ein Worksheet-Paar: table direkt gefolgt von solution{table} gleicher Spaltenzahl.
function isWorksheetPair(b, next) {
  return b && b.type === 'table' && next && next.type === 'solution'
    && next.blocks && next.blocks[0] && next.blocks[0].type === 'table'
    && (next.blocks[0].head || []).length === (b.head || []).length;
}
function renderWorksheet(table, solTable, ctx) {
  const { tx, L } = ctx;
  const head = (table.head || []).map(h => `<th>${escapeHTML(tx(h))}</th>`).join('');
  let body = '';
  (table.rows || []).forEach((row, r) => {
    let cells = '';
    row.forEach((cell, c) => {
      const given = tx(cell);
      const ans = tx(((solTable.rows || [])[r] || [])[c]);
      if (given !== '') cells += `<td class="ws-given">${escapeHTML(given)}</td>`;
      else if (ans !== '') cells += `<td class="ws-cell"><input class="ws-inp" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" data-ans="${escapeHTML(ans)}"></td>`;
      else cells += `<td></td>`;
    });
    body += `<tr>${cells}</tr>`;
  });
  return `<div class="ws" data-ws>
      <div class="g-tablewrap"><table class="g-table ws-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <div class="ws-controls">
        <button class="ws-btn" type="button" data-ws-check>${escapeHTML(L.ws_check)}</button>
        <button class="ws-btn ws-btn--ghost" type="button" data-ws-solve>${escapeHTML(L.ws_solve)}</button>
        <button class="ws-btn ws-btn--ghost" type="button" data-ws-reset>${escapeHTML(L.ws_reset)}</button>
        <span class="ws-result mono" data-ws-result></span>
      </div>
    </div>`;
}
function wireWorksheets(root) {
  root.querySelectorAll('[data-ws]').forEach(ws => {
    const inps = [...ws.querySelectorAll('.ws-inp')];
    const result = ws.querySelector('[data-ws-result]');
    const clear = inp => inp.classList.remove('ok', 'bad', 'revealed');
    ws.querySelector('[data-ws-check]').addEventListener('click', () => {
      let ok = 0;
      inps.forEach(inp => {
        clear(inp);
        if (inp.value.trim() === '') return;
        if (wsMatch(inp.value, inp.dataset.ans)) { inp.classList.add('ok'); ok++; }
        else inp.classList.add('bad');
      });
      result.textContent = t().ws_result(ok, inps.length);
    });
    ws.querySelector('[data-ws-solve]').addEventListener('click', () => {
      inps.forEach(inp => { inp.value = inp.dataset.ans; clear(inp); inp.classList.add('revealed'); });
      result.textContent = '';
    });
    ws.querySelector('[data-ws-reset]').addEventListener('click', () => {
      inps.forEach(inp => { inp.value = ''; clear(inp); });
      result.textContent = '';
    });
    inps.forEach(inp => inp.addEventListener('input', () => clear(inp)));
  });
}

/* ---- interaktiv: "richtig oder falsch?" (bullets + solution-Tabelle) ---- */
function isTrueFalsePair(b, next) {
  if (!b || b.type !== 'bullets' || !next || next.type !== 'solution') return false;
  const tbl = next.blocks && next.blocks[0];
  if (!tbl || tbl.type !== 'table') return false;
  return (tbl.head || []).some(h => {
    const s = (h.de || '').toLowerCase(); return s.includes('richtig') && s.includes('falsch');
  });
}
function renderTrueFalse(bullets, solTable, ctx) {
  const { tx, L } = ctx;
  const head = solTable.head || [];
  const ansCol = head.findIndex(h => { const s = (h.de || '').toLowerCase(); return s.includes('richtig') && s.includes('falsch'); });
  const corrCol = head.length - 1;
  const items = (bullets.items || []).map((it, i) => {
    const row = (solTable.rows || [])[i] || [];
    const ans = tx(row[ansCol] || {}).toLowerCase().trim();
    const correctVal = ans.startsWith('r') ? 'true' : 'false';
    let corr = tx(row[corrCol] || {});
    if (!corr || corr === '–' || corr === '-') corr = '';
    return `<div class="tf-item" data-tf data-correct="${correctVal}" data-corr="${escapeHTML(corr)}">
        <div class="tf-stmt">${escapeHTML(tx(it))}</div>
        <div class="tf-pick">
          <button class="tf-btn" type="button" data-tf-val="true">${escapeHTML(L.tf_true)}</button>
          <button class="tf-btn" type="button" data-tf-val="false">${escapeHTML(L.tf_false)}</button>
        </div>
        <div class="tf-corr" hidden></div>
      </div>`;
  }).join('');
  return `<div class="tf" data-tfgroup>${items}
      <div class="ws-controls">
        <button class="ws-btn" type="button" data-tf-check>${escapeHTML(L.ws_check)}</button>
        <button class="ws-btn ws-btn--ghost" type="button" data-tf-solve>${escapeHTML(L.ws_solve)}</button>
        <button class="ws-btn ws-btn--ghost" type="button" data-tf-reset>${escapeHTML(L.ws_reset)}</button>
        <span class="ws-result mono" data-tf-result></span>
      </div>
    </div>`;
}
function wireTrueFalse(root) {
  root.querySelectorAll('[data-tfgroup]').forEach(grp => {
    const items = [...grp.querySelectorAll('[data-tf]')];
    const result = grp.querySelector('[data-tf-result]');
    const showCorr = (it, on) => { const c = it.querySelector('.tf-corr'); if (on && it.dataset.corr) { c.textContent = it.dataset.corr; c.hidden = false; } else c.hidden = true; };
    items.forEach(it => it.querySelectorAll('[data-tf-val]').forEach(btn => btn.addEventListener('click', () => {
      it.dataset.pick = btn.dataset.tfVal;
      it.querySelectorAll('[data-tf-val]').forEach(b => b.classList.toggle('is-sel', b === btn));
      it.classList.remove('ok', 'bad'); showCorr(it, false);
    })));
    grp.querySelector('[data-tf-check]').addEventListener('click', () => {
      let ok = 0;
      items.forEach(it => {
        it.classList.remove('ok', 'bad'); showCorr(it, false);
        if (!it.dataset.pick) return;
        if (it.dataset.pick === it.dataset.correct) { it.classList.add('ok'); ok++; }
        else { it.classList.add('bad'); showCorr(it, true); }
      });
      result.textContent = t().ws_result(ok, items.length);
    });
    grp.querySelector('[data-tf-solve]').addEventListener('click', () => {
      items.forEach(it => {
        it.classList.remove('ok', 'bad'); it.dataset.pick = it.dataset.correct;
        it.querySelectorAll('[data-tf-val]').forEach(b => b.classList.toggle('is-sel', b.dataset.tfVal === it.dataset.correct));
        showCorr(it, true);
      });
      result.textContent = '';
    });
    grp.querySelector('[data-tf-reset]').addEventListener('click', () => {
      items.forEach(it => {
        it.classList.remove('ok', 'bad'); delete it.dataset.pick; showCorr(it, false);
        it.querySelectorAll('[data-tf-val]').forEach(b => b.classList.remove('is-sel'));
      });
      result.textContent = '';
    });
  });
}

/* ==================================================================
   PRAXIS-MODUL: Inversionen am Klavier  (Phase 1 — Tippen + Prüfen)
   Tonart · Stufe (1–7) · Umkehrung → Zieltöne auf der Klaviatur.
   MIDI folgt in Phase 2 (gedrückte Tasten leuchten + Live-Abgleich).
   ================================================================== */
const PX = {
  KEYS: [
    { pc: 0, name: 'C', flat: false }, { pc: 1, name: 'Db', flat: true }, { pc: 2, name: 'D', flat: false },
    { pc: 3, name: 'Eb', flat: true }, { pc: 4, name: 'E', flat: false }, { pc: 5, name: 'F', flat: true },
    { pc: 6, name: 'F#', flat: false }, { pc: 7, name: 'G', flat: false }, { pc: 8, name: 'Ab', flat: true },
    { pc: 9, name: 'A', flat: false }, { pc: 10, name: 'Bb', flat: true }, { pc: 11, name: 'B', flat: false },
  ],
  MAJOR: [0, 2, 4, 5, 7, 9, 11],
  QUAL: ['', 'm', 'm', '', '', 'm', 'dim'],   // Stufen 1..7
  SHARP: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  FLAT: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
};
function pxName(pc, flat) { return (flat ? PX.FLAT : PX.SHARP)[((pc % 12) + 12) % 12]; }
function pxChord(tonicPc, degree, inversion) {
  const i = degree - 1, S = PX.MAJOR;
  const deg = k => S[(i + k) % 7] + 12 * Math.floor((i + k) / 7);
  const root = tonicPc + deg(0), third = tonicPc + deg(2), fifth = tonicPc + deg(4);
  let notes;
  if (inversion === 0) notes = [root, third, fifth];
  else if (inversion === 1) notes = [third, fifth, root + 12];
  else notes = [fifth, root + 12, third + 12];
  const lo = Math.min(...notes), sh = -12 * Math.floor(lo / 12);   // tiefster Ton in [0,12)
  return notes.map(n => n + sh).sort((a, b) => a - b);
}
function pxChordName(tonicPc, degree, flat) {
  const i = degree - 1; return pxName((tonicPc + PX.MAJOR[i]) % 12, flat) + PX.QUAL[i];
}
function pxKeyboard(target, played) {
  const start = 0, end = 24, Ww = 100, Hh = 320;
  const isW = c => PX.MAJOR.includes(((c % 12) + 12) % 12);
  const whites = [], blacks = [];
  for (let c = start; c <= end; c++) (isW(c) ? whites : blacks).push(c);
  const wx = {}; whites.forEach((c, i) => wx[c] = i * Ww);
  const Wb = Math.round(Ww * 0.62), Hb = Math.round(Hh * 0.62);
  const tgt = new Set(target), pl = new Set(played);
  let s = '';
  whites.forEach(c => {
    const cls = ['px-key', 'px-white']; if (pl.has(c)) cls.push('is-played'); if (tgt.has(c)) cls.push('is-target');
    s += `<rect class="${cls.join(' ')}" data-px-note="${c}" x="${wx[c]}" y="0" width="${Ww}" height="${Hh}" rx="6"/>`;
  });
  whites.forEach(c => { if (tgt.has(c)) s += `<circle class="px-dot" data-px-note="${c}" cx="${wx[c] + Ww / 2}" cy="${Hh - 46}" r="24"/>`; });
  const bx = {};
  blacks.forEach(c => {
    const x = wx[c - 1] + Ww - Math.round(Wb / 2); bx[c] = x;
    const cls = ['px-key', 'px-black']; if (pl.has(c)) cls.push('is-played'); if (tgt.has(c)) cls.push('is-target');
    s += `<rect class="${cls.join(' ')}" data-px-note="${c}" x="${x}" y="0" width="${Wb}" height="${Hb}" rx="4"/>`;
  });
  blacks.forEach(c => { if (tgt.has(c)) s += `<circle class="px-dot px-dot--b" data-px-note="${c}" cx="${bx[c] + Wb / 2}" cy="${Hb - 32}" r="16"/>`; });
  return `<svg class="px-kbd" viewBox="0 0 ${whites.length * Ww} ${Hh}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
function renderInversionPraxis(g) {
  currentScreen = 'praxis';
  state.currentGuide = g.id;
  state.area = g.area || 'academy';
  if (!state.praxis) state.praxis = { key: 0, degree: 1, inversion: 0, played: [] };
  const P = state.praxis, L = t(), tx = o => o ? (o[state.lang] ?? o.de ?? '') : '';
  const flat = PX.KEYS[P.key].flat;
  const target = pxChord(PX.KEYS[P.key].pc, P.degree, P.inversion);
  const chordName = pxChordName(PX.KEYS[P.key].pc, P.degree, flat);
  const targetNames = target.map(n => pxName(n % 12, flat)).join(' – ');
  const keyBtns = PX.KEYS.map((k, i) => `<button class="px-chip${i === P.key ? ' is-on' : ''}" data-px-key="${i}" type="button">${escapeHTML(k.name)}</button>`).join('');
  const degBtns = [1, 2, 3, 4, 5, 6, 7].map(d => `<button class="px-chip${d === P.degree ? ' is-on' : ''}" data-px-deg="${d}" type="button">${d}</button>`).join('');
  const invBtns = [0, 1, 2].map(iv => `<button class="px-chip px-chip--wide${iv === P.inversion ? ' is-on' : ''}" data-px-inv="${iv}" type="button">${escapeHTML([L.px_inv0, L.px_inv1, L.px_inv2][iv])}</button>`).join('');

  app.innerHTML = `
    <section class="screen guide">
      <button class="backlink" id="pxBack" type="button"><span class="backarrow">←</span> ${escapeHTML(L.back_learn)}</button>
      <div class="kicker">${escapeHTML(L.learn_praxis_kicker)}</div>
      <h1 class="display guide-title">${escapeHTML(tx(g.title))}</h1>
      <p class="guide-intro">${escapeHTML(tx(g.intro))}</p>
      <div class="hairline" style="margin:8px 0 22px"></div>
      <div class="px-row"><span class="px-lbl mono">${escapeHTML(L.px_key)}</span><div class="px-chips">${keyBtns}</div></div>
      <div class="px-row"><span class="px-lbl mono">${escapeHTML(L.px_degree)}</span><div class="px-chips">${degBtns}</div></div>
      <div class="px-row"><span class="px-lbl mono">${escapeHTML(L.px_inversion)}</span><div class="px-chips">${invBtns}</div></div>
      <div class="px-chord">
        <span class="px-chord-name">${escapeHTML(chordName)}</span>
        <span class="px-chord-meta mono">${escapeHTML(L.px_target)}: ${escapeHTML(targetNames)}</span>
      </div>
      <div class="px-kbd-wrap">${pxKeyboard(target, P.played)}</div>
      <div class="ws-controls">
        <button class="ws-btn" type="button" id="pxCheck">${escapeHTML(L.px_check)}</button>
        <button class="ws-btn ws-btn--ghost" type="button" id="pxClear">${escapeHTML(L.px_clear)}</button>
        <span class="ws-result mono" id="pxResult"></span>
      </div>
      <p class="px-tap mono">${escapeHTML(L.px_tap)}</p>
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(L.brand_academy)}</div>
    </section>`;

  document.getElementById('pxBack').addEventListener('click', () => renderLearnHome());
  app.querySelectorAll('[data-px-key]').forEach(b => b.addEventListener('click', () => { P.key = +b.dataset.pxKey; P.played = []; renderInversionPraxis(g); }));
  app.querySelectorAll('[data-px-deg]').forEach(b => b.addEventListener('click', () => { P.degree = +b.dataset.pxDeg; P.played = []; renderInversionPraxis(g); }));
  app.querySelectorAll('[data-px-inv]').forEach(b => b.addEventListener('click', () => { P.inversion = +b.dataset.pxInv; P.played = []; renderInversionPraxis(g); }));
  app.querySelectorAll('[data-px-note]').forEach(k => k.addEventListener('click', () => {
    const n = +k.dataset.pxNote, idx = P.played.indexOf(n);
    if (idx >= 0) P.played.splice(idx, 1); else P.played.push(n);
    renderInversionPraxis(g);
  }));
  document.getElementById('pxClear').addEventListener('click', () => { P.played = []; renderInversionPraxis(g); });
  document.getElementById('pxCheck').addEventListener('click', () => {
    const tgt = new Set(target), pl = new Set(P.played);
    const missing = [...tgt].filter(n => !pl.has(n)), extra = [...pl].filter(n => !tgt.has(n));
    app.querySelectorAll('[data-px-note]').forEach(k => {
      const n = +k.dataset.pxNote; k.classList.remove('is-ok', 'is-bad');
      if (tgt.has(n) && pl.has(n)) k.classList.add('is-ok'); else if (pl.has(n)) k.classList.add('is-bad');
    });
    const res = document.getElementById('pxResult');
    if (!missing.length && !extra.length) res.textContent = L.px_correct;
    else {
      const parts = [];
      if (missing.length) parts.push(`${L.px_hint_missing}: ${missing.map(n => pxName(n % 12, flat)).join(', ')}`);
      if (extra.length) parts.push(`${L.px_hint_extra}: ${extra.map(n => pxName(n % 12, flat)).join(', ')}`);
      res.textContent = parts.join(' · ');
    }
  });
}

function guideShell(g, kicker, L, tx, bodyHTML, showTest, brand) {
  return `
    <section class="screen guide">
      <button class="backlink" id="guideBack" type="button"><span class="backarrow">←</span> ${escapeHTML(state.guideFrom === 'home' ? L.back_home : L.back_learn)}</button>
      <div class="kicker">${escapeHTML(kicker)}</div>
      <h1 class="display guide-title">${escapeHTML(tx(g.title))}</h1>
      <p class="guide-sub">${escapeHTML(tx(g.subtitle))}</p>
      ${g.updated ? `<div class="guide-meta mono">${escapeHTML(L.updated)}: ${escapeHTML(g.updated)}</div>` : ''}
      <p class="guide-intro">${escapeHTML(tx(g.intro))}</p>
      <div class="hairline" style="margin:8px 0 30px"></div>
      <div id="guideBody">${bodyHTML}</div>
      <div class="guide-foot">
        <button class="linkbtn" id="resetChecks" type="button">${escapeHTML(L.reset_checks)}</button>
        <button class="linkbtn" id="guidePrint" type="button">${escapeHTML(L.ws_print)}</button>
        ${showTest ? `<button class="btn" id="guideToTest" type="button"><span>${escapeHTML(L.to_test)}</span><span class="arrow">→</span></button>` : ''}
      </div>
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(brand)}</div>
    </section>`;
}

async function renderGuide(guideId, keepScroll = false) {
  const guides = (state.learn && state.learn.guides) || [];
  const g = guides.find(x => x.id === guideId);
  if (!g) { renderLearnHome(); return; }
  if (g.module === 'inversion-praxis') { renderInversionPraxis(g); return; }
  currentScreen = 'guide';
  state.currentGuide = guideId;
  state.area = g.area || 'production';
  const isAcademy = state.area === 'academy';
  const L = t();
  const lang = state.lang;
  const tx = (o) => o ? (o[lang] ?? o.de ?? '') : '';
  const scrollY = keepScroll ? window.scrollY : 0;
  const kicker = g.kicker ? tx(g.kicker) : (g.bereiche || []).map(tagLabel).filter(Boolean).join(' · ');
  const brand = isAcademy ? L.brand_academy : L.brand;
  const showTest = !isAcademy;
  const hasChecks = () => app.querySelector('.check');

  // 1) paint header immediately with a loading line
  app.innerHTML = guideShell(g, kicker, L, tx, `<div class="g-loading mono">…</div>`, showTest, brand);
  wireGuideChrome(guideId);

  // 2) load sections (inline or lazily from file) and render the body
  const sections = await loadGuideSections(g);
  if (currentScreen !== 'guide' || state.currentGuide !== guideId) return; // navigated away
  const checks = loadChecks(guideId);

  let html = '';
  sections.forEach((sec, si) => {
    const tagBadge = sec.tag ? `<span class="sec-tag mono">${escapeHTML(tagLabel(sec.tag))}</span>` : '';
    html += `<div class="guide-sec">
      <div class="sec-head">
        <span class="sec-num mono">${String(si + 1).padStart(2, '0')}</span>
        <h2 class="sec-title">${escapeHTML(tx(sec.title))}</h2>
        ${tagBadge}
      </div>`;
    if (sec.intro) html += `<p class="sec-intro">${escapeHTML(tx(sec.intro))}</p>`;
    const blks = sec.blocks || [];
    for (let bi = 0; bi < blks.length; bi++) {
      const b = blks[bi];
      if (isTrueFalsePair(b, blks[bi + 1])) {
        html += renderTrueFalse(b, blks[bi + 1].blocks[0], { tx, L });
        bi++; // Lösungs-Block überspringen — er ist jetzt der Antwortschlüssel
        continue;
      }
      if (isWorksheetPair(b, blks[bi + 1])) {
        html += renderWorksheet(b, blks[bi + 1].blocks[0], { tx, L });
        bi++; // Lösungs-Block überspringen — er ist jetzt der Antwortschlüssel der Eingabefelder
        continue;
      }
      html += renderBlock(b, { tx, checks, guideId, path: 's' + si + 'b' + bi, L });
    }
    html += '</div>';
  });

  const body = document.getElementById('guideBody');
  if (body) body.innerHTML = html || `<p class="g-text">${escapeHTML(L.learn_empty)}</p>`;

  // interaktive Arbeitsblätter + richtig/falsch aktivieren
  wireWorksheets(app);
  wireTrueFalse(app);

  // hide reset button if this guide has no checklists
  const resetBtn = document.getElementById('resetChecks');
  if (resetBtn && !hasChecks()) resetBtn.style.display = 'none';

  // wire solution reveals
  app.querySelectorAll('[data-soltoggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sol = btn.parentElement;
      const sbody = sol.querySelector('.sol-body');
      const txt = btn.querySelector('[data-soltext]');
      const ic = btn.querySelector('.sol-ic');
      const open = !sbody.hasAttribute('hidden');
      if (open) { sbody.setAttribute('hidden', ''); txt.textContent = t().show_solutions; ic.textContent = '+'; btn.classList.remove('is-open'); }
      else { sbody.removeAttribute('hidden'); txt.textContent = t().hide_solutions; ic.textContent = '–'; btn.classList.add('is-open'); }
    });
  });

  // wire checklist toggles
  app.querySelectorAll('.check').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.cid;
      const c = loadChecks(guideId);
      c[id] = !c[id];
      saveChecks(guideId, c);
      btn.classList.toggle('is-on', !!c[id]);
      btn.querySelector('.check-box').textContent = c[id] ? '✓' : '';
    });
  });

  if (keepScroll) window.scrollTo(0, scrollY);
}

function wireGuideChrome(guideId) {
  document.getElementById('guideBack').addEventListener('click', () => {
    state.guideFrom === 'home' ? renderHome() : renderLearnHome();
  });
  const toTest = document.getElementById('guideToTest');
  if (toTest) toTest.addEventListener('click', () => {
    state.participant ? renderSelect() : renderLogin();
  });
  document.getElementById('resetChecks').addEventListener('click', () => {
    saveChecks(guideId, {});
    renderGuide(guideId, true);
  });
  const pr = document.getElementById('guidePrint');
  if (pr) pr.addEventListener('click', () => window.print());
}

/* ------------------------------------------------------------------
   9) QUIZ-AUFBAU  ·  BUILD SESSION
   ------------------------------------------------------------------ */
function buildSession(testKey) {
  const test = state.data.tests[testKey];
  let all = [];
  (test.pools || []).forEach(poolKey => {
    const pool = state.data.pools[poolKey] || [];
    all = all.concat(pool);
  });
  const picked = shuffle(all).slice(0, state.rules.fragenProSitzung);

  return picked.map(q => {
    const optDe = q.optionen || [];
    const optEn = q.optionen_en || q.optionen || [];
    // build option objects carrying original index, then shuffle order
    let opts = optDe.map((txt, idx) => ({ de: txt, en: optEn[idx] ?? txt, orig: idx }));
    opts = shuffle(opts);
    const correctIndex = opts.findIndex(o => o.orig === q.antwortIndex);
    return { q, options: opts, correctIndex, selected: null, secondsUsed: 0 };
  });
}

function startQuiz(testKey) {
  state.testKey = testKey;
  state.session = buildSession(testKey);
  state.current = 0;
  state.tabSwitches = 0;
  enableAntiCheat();
  renderQuiz();
}

/* ------------------------------------------------------------------
   10) SCREEN: QUIZ
   ------------------------------------------------------------------ */
function renderQuiz() {
  currentScreen = 'quiz';
  const L = t();
  const total = state.session.length;
  const item = state.session[state.current];

  app.innerHTML = `
    <div class="timebar" id="timebar"><div class="fill" id="timefill"></div></div>
    <section class="screen quiz">
      <div class="quiz-head">
        <div class="quiz-theme" id="quizTheme"></div>
        <div class="quiz-progress" id="quizProgress"></div>
      </div>
      <div class="hairline"></div>

      <div class="countdown" id="countdown">
        <span class="secs mono" id="secs"></span>
        <span class="unit" id="secUnit"></span>
      </div>

      <h2 class="question q-anim" id="questionText"></h2>

      <div class="options" id="options"></div>

      <div class="quiz-foot">
        <button class="btn" id="confirmBtn" type="button" disabled>
          <span id="confirmLabel"></span><span class="arrow">→</span>
        </button>
        <div class="abort-row"><button class="linkbtn" id="abortBtn" type="button"></button></div>
      </div>
    </section>`;

  renderOptions();
  updateQuizTexts();

  document.getElementById('confirmBtn').addEventListener('click', () => commitAnswer(false));
  document.getElementById('abortBtn').addEventListener('click', openAbort);

  startTimer();
}

function renderOptions() {
  const item = state.session[state.current];
  const box = document.getElementById('options');
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  box.innerHTML = item.options.map((o, i) => `
    <button class="option ${item.selected === i ? 'is-selected' : ''}" type="button" data-i="${i}">
      <span class="marker mono">${letters[i]}</span>
      <span class="opt-text">${escapeHTML(o[state.lang] ?? o.de)}</span>
    </button>`).join('');

  box.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      item.selected = parseInt(btn.dataset.i, 10);
      box.querySelectorAll('.option').forEach(b =>
        b.classList.toggle('is-selected', parseInt(b.dataset.i, 10) === item.selected));
      document.getElementById('confirmBtn').disabled = false;
    });
  });
}

/* Update all text on the quiz screen for current question + language
   WITHOUT resetting the timer (used by live language switch). */
function updateQuizTexts() {
  if (currentScreen !== 'quiz') return;
  const L = t();
  const total = state.session.length;
  const item = state.session[state.current];

  document.getElementById('quizTheme').textContent = themeFromQuelle(item.q.quelle);
  document.getElementById('quizProgress').textContent = L.question_of(state.current + 1, total);
  document.getElementById('secUnit').textContent = L.seconds;
  document.getElementById('questionText').textContent =
    state.lang === 'en' ? (item.q.frage_en || item.q.frage) : item.q.frage;
  document.getElementById('confirmLabel').textContent = L.confirm;
  document.getElementById('abortBtn').textContent = L.abort;

  // refresh option texts (keep selection)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  document.querySelectorAll('#options .option').forEach((btn, i) => {
    const o = item.options[i];
    btn.querySelector('.opt-text').textContent = o[state.lang] ?? o.de;
  });
  document.getElementById('secs').textContent = state.remaining;
}

/* ------------------------------------------------------------------
   11) TIMER
   ------------------------------------------------------------------ */
function startTimer() {
  stopTimer();
  state.remaining = state.rules.sekundenProFrage;
  state.qStart = Date.now();
  const fill = document.getElementById('timefill');
  const bar = document.getElementById('timebar');
  const cd = document.getElementById('countdown');

  const paint = () => {
    document.getElementById('secs').textContent = state.remaining;
    const frac = state.remaining / state.rules.sekundenProFrage;
    fill.style.transform = `scaleX(${Math.max(0, frac)})`;
    const urgent = state.remaining <= 5;
    bar.classList.toggle('is-urgent', urgent);
    cd.classList.toggle('is-urgent', urgent);
  };
  paint();

  state.ticker = setInterval(() => {
    state.remaining -= 1;
    if (state.remaining <= 0) {
      state.remaining = 0;
      paint();
      commitAnswer(true);   // timeout → auto advance, count current selection
      return;
    }
    paint();
  }, 1000);
}

function stopTimer() {
  if (state.ticker) { clearInterval(state.ticker); state.ticker = null; }
}

/* ------------------------------------------------------------------
   12) ANTWORT WERTEN + WEITER  ·  COMMIT & ADVANCE
   ------------------------------------------------------------------ */
function commitAnswer(byTimeout) {
  stopTimer();
  const item = state.session[state.current];
  item.secondsUsed = Math.min(
    state.rules.sekundenProFrage,
    Math.round((Date.now() - state.qStart) / 1000)
  );
  if (byTimeout && item.selected === null) item.secondsUsed = state.rules.sekundenProFrage;

  if (state.current < state.session.length - 1) {
    state.current += 1;
    renderQuiz();
  } else {
    finishQuiz();
  }
}

/* ------------------------------------------------------------------
   13) ABBRUCH-MODAL  ·  ABORT
   ------------------------------------------------------------------ */
function openAbort() {
  const L = t();
  const back = el(`
    <div class="modal-back" id="modalBack">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="kicker">${escapeHTML(L.abort)}</div>
        <h2>${escapeHTML(L.abort_title)}</h2>
        <p>${escapeHTML(L.abort_text)}</p>
        <div class="modal-actions">
          <button class="btn" id="abortYes" type="button"><span>${escapeHTML(L.abort_yes)}</span><span class="arrow">→</span></button>
          <button class="btn btn--ghost" id="abortNo" type="button">${escapeHTML(L.abort_no)}</button>
        </div>
      </div>
    </div>`);
  document.body.appendChild(back);
  document.getElementById('abortYes').addEventListener('click', () => {
    back.remove();
    stopTimer();
    disableAntiCheat();
    renderSelect();
  });
  document.getElementById('abortNo').addEventListener('click', () => back.remove());
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
}

/* ------------------------------------------------------------------
   14) ABSCHLUSS + ERGEBNIS  ·  FINISH & RESULT
   ------------------------------------------------------------------ */
function finishQuiz() {
  disableAntiCheat();
  const rules = state.rules;
  const total = state.session.length;
  let correct = 0;
  const perFrage = state.session.map(item => {
    const isCorrect = item.selected !== null && item.selected === item.correctIndex;
    if (isCorrect) correct += 1;
    const chosenOrig = item.selected !== null ? item.options[item.selected].orig : null;
    return {
      id: item.q.id,
      gewaehlt: chosenOrig,           // original option index (or null)
      richtig: isCorrect,
      sekundenGebraucht: item.secondsUsed,
    };
  });

  const punkte = correct * rules.punkteProFrage;
  const maxPunkte = total * rules.punkteProFrage;
  const prozent = maxPunkte > 0 ? Math.round((punkte / maxPunkte) * 100) : 0;
  const bestanden = prozent >= rules.bestehensgrenzeProzent;

  const record = {
    vorname: state.participant.vorname,
    nachname: state.participant.nachname,
    test: state.testKey,
    testLabel: state.data.tests[state.testKey].label,
    score: punkte,
    maxScore: maxPunkte,
    richtig: correct,
    gesamt: total,
    prozent,
    bestanden,
    sprache: state.lang,
    tabWechsel: state.tabSwitches,
    zeitstempel: new Date().toISOString(),
    fragen: perFrage,
  };

  state._lastResult = record;
  renderResult(record);
  submitResult(record);
}

function renderResult(r) {
  currentScreen = 'result';
  const L = t();
  const pass = r.bestanden;

  app.innerHTML = `
    <section class="screen">
      <div class="kicker">${escapeHTML(L.result_kicker)}</div>
      <div class="result-badge ${pass ? 'pass' : 'fail'}">${pass ? escapeHTML(L.passed) : escapeHTML(L.failed)}</div>
      <div class="score-big mono">${r.prozent}<span class="pct">%</span></div>

      <div class="result-grid">
        <div class="cell"><div class="k">${escapeHTML(L.correct)}</div><div class="v">${r.richtig} / ${r.gesamt}</div></div>
        <div class="cell"><div class="k">${escapeHTML(L.your_score)}</div><div class="v">${r.score} / ${r.maxScore}</div></div>
        <div class="cell"><div class="k">${escapeHTML(L.test_label)}</div><div class="v">${escapeHTML(r.testLabel)}</div></div>
        <div class="cell"><div class="k">${escapeHTML(L.threshold)}</div><div class="v">${state.rules.bestehensgrenzeProzent}%</div></div>
      </div>

      <div class="save-status" id="saveStatus">
        <span class="dot pending"></span><span id="saveText">${escapeHTML(L.save_pending)}</span>
      </div>

      <div class="spacer"></div>
      <button class="btn btn--ghost" id="homeBtn" type="button">${escapeHTML(L.back_home)}</button>
    </section>`;

  // reflect any save status already determined
  if (state._saveState) applySaveStatus(state._saveState);

  document.getElementById('homeBtn').addEventListener('click', () => {
    state._saveState = null;
    renderHome();
  });
}

function applySaveStatus(kind) {
  const L = t();
  const dot = document.querySelector('#saveStatus .dot');
  const txt = document.getElementById('saveText');
  if (!dot || !txt) return;
  dot.className = 'dot ' + (kind === 'ok' ? 'ok' : kind === 'local' ? 'ok' : kind === 'fail' ? 'warn' : 'pending');
  txt.textContent = kind === 'ok' ? L.save_ok
    : kind === 'local' ? L.save_local
    : kind === 'fail' ? L.save_fail
    : L.save_pending;
}

/* ------------------------------------------------------------------
   15) ERGEBNIS-SPEICHERUNG  ·  RESULT STORAGE
   ------------------------------------------------------------------ */
function saveLocal(record) {
  try {
    const arr = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_RESULTS) || '[]');
    arr.push(record);
    localStorage.setItem(CONFIG.STORAGE_KEY_RESULTS, JSON.stringify(arr));
  } catch (e) { /* storage may be unavailable */ }
}

async function submitResult(record) {
  saveLocal(record); // always keep a local fallback

  if (!CONFIG.SAVE_URL) {
    state._saveState = 'local';
    applySaveStatus('local');
    return;
  }

  try {
    await fetch(CONFIG.SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(record),
      // Apps Script web apps commonly need no-cors; result is opaque but delivered.
      mode: 'no-cors',
      cache: 'no-store',
    });
    state._saveState = 'ok';
    applySaveStatus('ok');
  } catch (e) {
    state._saveState = 'fail';
    applySaveStatus('fail');
  }
}

/* ------------------------------------------------------------------
   16) ANTI-CHEAT
   ------------------------------------------------------------------ */
function onVisibility() {
  if (document.hidden && currentScreen === 'quiz') state.tabSwitches += 1;
}
function blockContext(e) { if (currentScreen === 'quiz') e.preventDefault(); }
function blockSelect(e) {
  if (currentScreen === 'quiz') {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') e.preventDefault();
  }
}
function enableAntiCheat() {
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onVisibility);
  document.addEventListener('contextmenu', blockContext);
  document.addEventListener('selectstart', blockSelect);
}
function disableAntiCheat() {
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('blur', onVisibility);
  document.removeEventListener('contextmenu', blockContext);
  document.removeEventListener('selectstart', blockSelect);
}

/* ------------------------------------------------------------------
   GO
   ------------------------------------------------------------------ */
boot();
