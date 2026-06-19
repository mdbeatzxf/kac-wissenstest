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

  // Guide-ID, die zusätzlich als eigener "Checkliste"-Eintrag auf der Startseite erscheint.
  CHECKLIST_GUIDE: 'rollen-ablauf',

  STORAGE_KEY_LANG: 'tt_lang',
  STORAGE_KEY_RESULTS: 'tt_results',
  STORAGE_KEY_CHECK: 'tt_check',
};

/* ------------------------------------------------------------------
   2) UI-TEXTE  ·  UI STRINGS
   ------------------------------------------------------------------ */
const I18N = {
  de: {
    brand: 'KAC Production Team',
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
    login_kicker: 'Production Team · Wissens-Test',
    login_title: 'Projection\n&\nSound',
    login_intro: 'Melde dich mit deinem Namen an, um deinen Test zu starten.',
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
    login_kicker: 'Production Team · Knowledge Test',
    login_title: 'Projection\n&\nSound',
    login_intro: 'Sign in with your name to start your test.',
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
  if (currentScreen === 'home') renderHome();
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

  renderHome();
}

/* ------------------------------------------------------------------
   6b) SCREEN: HOME  ·  zwei Wege: Lernen / Test
   ------------------------------------------------------------------ */
function renderHome() {
  currentScreen = 'home';
  const L = t();
  const guides = (state.learn && state.learn.guides) || [];
  const hasLearn = guides.length > 0;
  const hasCheck = hasLearn && guides.some(g => g.id === CONFIG.CHECKLIST_GUIDE);

  // Reihenfolge: 01 Checkliste · 02 Lernen · 03 Test (Einträge fallen weg, wenn nicht vorhanden)
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
      <div class="kicker">${escapeHTML(L.home_kicker)}</div>
      <h1 class="display">Projection<br>&amp; Sound</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft)">${escapeHTML(L.home_intro)}</p>
      <div class="test-list">${rowsHTML}
      </div>
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(L.brand)}</div>
    </section>`;

  const gc = document.getElementById('goCheck');
  if (gc) gc.addEventListener('click', () => { state.guideFrom = 'home'; renderGuide(CONFIG.CHECKLIST_GUIDE); });
  const gl = document.getElementById('goLearn');
  if (gl) gl.addEventListener('click', () => renderLearnHome());
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
      <button class="backlink" id="loginBack" type="button"><span class="backarrow">←</span> ${escapeHTML(L.back_home)}</button>
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
  document.getElementById('loginBack').addEventListener('click', () => renderHome());
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
  renderSelect();
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
      <div class="abort-row"><button class="linkbtn" id="logoutBtn" type="button">${escapeHTML(L.logout)}</button></div>
    </section>`;

  app.querySelectorAll('.test-row').forEach(b =>
    b.addEventListener('click', () => startQuiz(b.dataset.test)));
  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.participant = null;
    renderHome();
  });
}

/* ------------------------------------------------------------------
   8b) LERNBEREICH  ·  LEARNING AREA
   ------------------------------------------------------------------ */
function tagLabel(tag) {
  if (tag === 'projection') return state.data?.tests?.projection?.label || 'Projection';
  if (tag === 'sound') return state.data?.tests?.sound?.label || 'Sound';
  return '';
}

function renderLearnHome() {
  currentScreen = 'learn';
  const L = t();
  const guides = (state.learn && state.learn.guides) || [];
  const lang = state.lang;
  const tx = (o) => o ? (o[lang] ?? o.de ?? '') : '';

  let rows;
  if (!guides.length) {
    rows = `<p class="notice" style="animation:none">${escapeHTML(L.learn_empty)}</p>`;
  } else {
    rows = '<div class="test-list">' + guides.map((g, i) => {
      const tags = (g.bereiche || []).map(tagLabel).filter(Boolean).join(' · ');
      return `
        <button class="test-row" type="button" data-guide="${escapeHTML(g.id)}">
          <span class="idx mono">${String(i + 1).padStart(2, '0')}</span>
          <span>
            <span class="name name--sm">${escapeHTML(tx(g.title))}</span><br>
            <span class="meta">${escapeHTML(tags)}</span>
          </span>
          <span class="arrow">→</span>
        </button>`;
    }).join('') + '</div>';
  }

  app.innerHTML = `
    <section class="screen">
      <button class="backlink" id="learnBack" type="button"><span class="backarrow">←</span> ${escapeHTML(L.back_home)}</button>
      <div class="kicker">${escapeHTML(L.learn_kicker)}</div>
      <h1 class="display">${escapeHTML(L.learn_title)}</h1>
      <p style="margin:20px 0 0;color:var(--ink-soft);max-width:40ch">${escapeHTML(L.learn_intro)}</p>
      ${rows}
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(L.brand)}</div>
    </section>`;

  document.getElementById('learnBack').addEventListener('click', () => renderHome());
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
  const { tx, checks, guideId, path } = ctx;
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
      // Echtes Bild: figure-Feld "image" (+ optional "image_en" für EN-Version).
      // "fit" = contain | cover (Default cover). Fehlt das Bild, bleibt der Platzhalter.
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
    case 'closing':
      return `<p class="sec-closing">${escapeHTML(tx(b.text))}</p>`;
    default:
      return '';
  }
}

function guideShell(g, tags, L, tx, bodyHTML) {
  return `
    <section class="screen guide">
      <button class="backlink" id="guideBack" type="button"><span class="backarrow">←</span> ${escapeHTML(state.guideFrom === 'home' ? L.back_home : L.back_learn)}</button>
      <div class="kicker">${escapeHTML(tags)}</div>
      <h1 class="display guide-title">${escapeHTML(tx(g.title))}</h1>
      <p class="guide-sub">${escapeHTML(tx(g.subtitle))}</p>
      ${g.updated ? `<div class="guide-meta mono">${escapeHTML(L.updated)}: ${escapeHTML(g.updated)}</div>` : ''}
      <p class="guide-intro">${escapeHTML(tx(g.intro))}</p>
      <div class="hairline" style="margin:8px 0 30px"></div>
      <div id="guideBody">${bodyHTML}</div>
      <div class="guide-foot">
        <button class="linkbtn" id="resetChecks" type="button">${escapeHTML(L.reset_checks)}</button>
        <button class="btn" id="guideToTest" type="button"><span>${escapeHTML(L.to_test)}</span><span class="arrow">→</span></button>
      </div>
      <div class="spacer"></div>
      <div class="brandline mono">${escapeHTML(L.brand)}</div>
    </section>`;
}

async function renderGuide(guideId, keepScroll = false) {
  const guides = (state.learn && state.learn.guides) || [];
  const g = guides.find(x => x.id === guideId);
  if (!g) { renderLearnHome(); return; }
  currentScreen = 'guide';
  state.currentGuide = guideId;
  const L = t();
  const lang = state.lang;
  const tx = (o) => o ? (o[lang] ?? o.de ?? '') : '';
  const scrollY = keepScroll ? window.scrollY : 0;
  const tags = (g.bereiche || []).map(tagLabel).filter(Boolean).join(' · ');
  const hasChecks = () => app.querySelector('.check');

  // 1) paint header immediately with a loading line
  app.innerHTML = guideShell(g, tags, L, tx, `<div class="g-loading mono">…</div>`);
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
    (sec.blocks || []).forEach((b, bi) => {
      html += renderBlock(b, { tx, checks, guideId, path: 's' + si + 'b' + bi });
    });
    html += '</div>';
  });

  const body = document.getElementById('guideBody');
  if (body) body.innerHTML = html || `<p class="g-text">${escapeHTML(L.learn_empty)}</p>`;

  // hide reset button if this guide has no checklists
  const resetBtn = document.getElementById('resetChecks');
  if (resetBtn && !hasChecks()) resetBtn.style.display = 'none';

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
  document.getElementById('guideToTest').addEventListener('click', () => {
    state.participant ? renderSelect() : renderLogin();
  });
  document.getElementById('resetChecks').addEventListener('click', () => {
    saveChecks(guideId, {});
    renderGuide(guideId, true);
  });
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
