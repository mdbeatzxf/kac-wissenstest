// =====================================================================
// KAC Wissenstest – Ablauf-Logik (Laden, Mischen, Timer, Scoring).
// Eine Datei steuert alle drei Seiten über data-page am <body>.
// =====================================================================

import { CONFIG } from "./config.js";
import { I18N, getLang, setLang, t } from "./i18n.js";
import { findTeilnehmer } from "./login.js";
import { speichereErgebnis } from "./storage.js";

// ---- kleine Helfer ---------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Thema (Kapitel) aus dem 'quelle'-Feld ableiten: alles vor der Seitenangabe.
// "Signale, Kabel & Stecker, S.2" -> "Signale, Kabel & Stecker"
const THEMA_EN = {
  "Rollen & Ablauf": "Roles & Workflow",
  "Equipment-Übersicht": "Equipment Overview",
  "Signale, Kabel & Stecker": "Signals, Cables & Connectors",
  "PA, Monitore & Verstärker": "PA, Monitors & Amplifiers",
  "Das Mischpult bedienen": "Operating the Console",
  "Mixing Station": "Mixing Station",
  "Patchlist 101": "Patch List 101",
};

function themaVon(quelle) {
  const de = (quelle || "").split(/,\s*S\./)[0].trim();
  return { de, en: THEMA_EN[de] || de };
}

async function ladeDaten() {
  const res = await fetch("questions.json", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// aktuelle Sprache (mit Fallback auf Konfig-Standard)
function lang() {
  return getLang() || CONFIG.standardSprache || "de";
}

// Sprache global anwenden: Texte + Platzhalter + Button-Status
function applyI18n() {
  const L = lang();
  document.documentElement.lang = L;
  $$("[data-i18n]").forEach((el) => (el.textContent = t(L, el.dataset.i18n)));
  $$("[data-i18n-ph]").forEach(
    (el) => (el.placeholder = t(L, el.dataset.i18nPh))
  );
  $$("[data-lang]").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.lang === L)
  );
}

function initLangToggle(onChange) {
  $$("[data-lang]").forEach((btn) =>
    btn.addEventListener("click", () => {
      setLang(btn.dataset.lang);
      applyI18n();
      if (onChange) onChange();
    })
  );
}

// =====================================================================
// SEITE 1: Login + Testauswahl  (index.html)
// =====================================================================
async function initLogin() {
  applyI18n();
  initLangToggle();

  let daten;
  try {
    daten = await ladeDaten();
  } catch (e) {
    $("#loginError").textContent = t(lang(), "ladefehler");
    return;
  }

  const loginView = $("#loginView");
  const testView = $("#testView");
  const fehler = $("#loginError");

  $("#loginBtn").addEventListener("click", () => {
    fehler.textContent = "";
    const vorname = $("#vorname").value;
    const nachname = $("#nachname").value;
    if (!vorname.trim() || !nachname.trim()) {
      fehler.textContent = t(lang(), "bitteNameEingeben");
      return;
    }
    const person = findTeilnehmer(daten.teilnehmer, vorname, nachname);
    if (!person) {
      fehler.textContent = t(lang(), "nameNichtGefunden");
      return;
    }
    zeigeTestauswahl(person);
  });

  // Enter im Nachnamen-Feld löst Login aus
  $("#nachname").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#loginBtn").click();
  });

  function zeigeTestauswahl(person) {
    loginView.hidden = true;
    testView.hidden = false;
    const L = lang();
    $("#greeting").textContent = `${t(L, "hallo")}, ${person.vorname}!`;

    const container = $("#testButtons");
    container.innerHTML = "";
    const erlaubt = (person.bereiche || []).filter((k) => daten.tests[k]);
    erlaubt.forEach((key) => {
      const test = daten.tests[key];
      const label = L === "en" ? test.label_en || test.label : test.label;
      const btn = document.createElement("button");
      btn.className = "test-card";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        sessionStorage.setItem(
          "kac_participant",
          JSON.stringify({
            vorname: person.vorname,
            nachname: person.nachname,
            test: key,
          })
        );
        location.href = "quiz.html";
      });
      container.appendChild(btn);
    });

    // Sprachwechsel auf der Testauswahl: Labels neu aufbauen
    initLangToggle(() => zeigeTestauswahl(person));

    $("#logoutBtn").addEventListener("click", () => {
      sessionStorage.removeItem("kac_participant");
      testView.hidden = true;
      loginView.hidden = false;
    });
  }
}

// =====================================================================
// SEITE 2: Quiz  (quiz.html)
// =====================================================================
async function initQuiz() {
  const person = JSON.parse(sessionStorage.getItem("kac_participant") || "null");
  if (!person) {
    location.replace("index.html");
    return;
  }

  applyI18n();

  let daten;
  try {
    daten = await ladeDaten();
  } catch (e) {
    $("#questionText").textContent = t(lang(), "ladefehler");
    return;
  }

  const test = daten.tests[person.test];
  if (!test) {
    location.replace("index.html");
    return;
  }

  // --- Fragenset bauen: Pools sammeln, mischen, Teilmenge ziehen ----
  let pool = [];
  test.pools.forEach((p) => {
    if (daten.pools[p]) pool = pool.concat(daten.pools[p]);
  });

  let fragen = CONFIG.antiCheat.fragenMischen ? shuffle(pool) : pool.slice();
  const limit = CONFIG.fragenProSitzung;
  if (limit && limit > 0 && limit < fragen.length) {
    fragen = fragen.slice(0, limit);
  }

  // Antwort-Optionen je Frage in Arbeitsobjekte umwandeln (+ mischen)
  const arbeitsfragen = fragen.map((q) => {
    let options = (q.optionen || []).map((deText, i) => ({
      de: deText,
      en: (q.optionen_en && q.optionen_en[i]) || deText,
      correct: i === q.antwortIndex,
    }));
    if (CONFIG.antiCheat.antwortenMischen) options = shuffle(options);
    return {
      id: q.id,
      bereich: q.bereich,
      frage: q.frage,
      frage_en: q.frage_en || q.frage,
      thema: themaVon(q.quelle),
      options,
    };
  });

  // --- Zustand -------------------------------------------------------
  const state = {
    index: 0,
    antworten: [],
    auswahl: null, // gewählte Option (Objekt) der aktuellen Frage
    tabWechsel: 0,
    startTs: 0,
    timerId: null,
  };

  // Anti-Cheat: Tabwechsel zählen
  if (CONFIG.antiCheat.tabWechselErkennen) {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) state.tabWechsel++;
    });
  }
  // Anti-Cheat: kosmetisch
  if (CONFIG.antiCheat.rechtsklickSperren) {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  // Kein "Zurück": History-Eintrag festhalten
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", () => {
    history.pushState(null, "", location.href);
  });

  // Sprachumschalter: aktuelle Frage neu rendern (Timer läuft weiter)
  initLangToggle(() => renderFrage(true));

  $("#cancelBtn").addEventListener("click", () => {
    if (confirm(t(lang(), "abbrechenBestaetigen"))) {
      clearInterval(state.timerId);
      sessionStorage.removeItem("kac_participant");
      location.replace("index.html");
    }
  });

  $("#confirmBtn").addEventListener("click", bestaetigen);

  renderFrage();

  // --- Render --------------------------------------------------------
  function renderFrage(nurText = false) {
    const L = lang();
    const q = arbeitsfragen[state.index];

    $("#progressText").textContent = `${t(L, "frage")} ${state.index + 1} ${t(
      L,
      "von"
    )} ${arbeitsfragen.length}`;
    $("#questionText").textContent = L === "en" ? q.frage_en : q.frage;

    const chip = $("#topicChip");
    if (chip) chip.textContent = L === "en" ? q.thema.en : q.thema.de;

    const optBox = $("#options");
    if (!nurText) {
      optBox.innerHTML = "";
      q.options.forEach((opt, i) => {
        const b = document.createElement("button");
        b.className = "option";
        b.dataset.i = String(i);
        b.textContent = L === "en" ? opt.en : opt.de;
        b.addEventListener("click", () => waehle(i, b));
        optBox.appendChild(b);
      });
      state.auswahl = null;
      $("#confirmBtn").disabled = true;
    } else {
      // nur Optionstexte aktualisieren (Sprachwechsel)
      $$(".option", optBox).forEach((b) => {
        const opt = q.options[Number(b.dataset.i)];
        b.textContent = L === "en" ? opt.en : opt.de;
      });
    }

    if (!nurText) startTimer();
  }

  function waehle(i, btn) {
    const q = arbeitsfragen[state.index];
    state.auswahl = q.options[i];
    $$(".option").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    $("#confirmBtn").disabled = false;
  }

  // --- Timer ---------------------------------------------------------
  function startTimer() {
    clearInterval(state.timerId);
    state.startTs = Date.now();
    const total = CONFIG.sekundenProFrage;
    updateTimerUI(total, total);
    state.timerId = setInterval(() => {
      const elapsed = (Date.now() - state.startTs) / 1000;
      const remaining = Math.max(0, total - elapsed);
      updateTimerUI(remaining, total);
      if (remaining <= 0) {
        clearInterval(state.timerId);
        naechste(); // Zeit abgelaufen -> aktuelle Auswahl (oder keine) werten
      }
    }, 100);
  }

  function updateTimerUI(remaining, total) {
    $("#timerText").textContent =
      Math.ceil(remaining) + " " + t(lang(), "sekunden");
    $("#timerBar").style.width = (remaining / total) * 100 + "%";
    $("#timerBar").classList.toggle("warn", remaining <= 4);
  }

  function bestaetigen() {
    naechste();
  }

  function naechste() {
    clearInterval(state.timerId);
    const q = arbeitsfragen[state.index];
    const elapsed = Math.min(
      CONFIG.sekundenProFrage,
      (Date.now() - state.startTs) / 1000
    );
    state.antworten.push({
      id: q.id,
      bereich: q.bereich,
      gewaehlt: state.auswahl ? state.auswahl.de : null,
      richtig: state.auswahl ? state.auswahl.correct : false,
      sekundenGebraucht: Math.round(elapsed * 10) / 10,
    });

    state.index++;
    if (state.index >= arbeitsfragen.length) {
      finish();
    } else {
      renderFrage();
    }
  }

  // --- Abschluss -> Ergebnis berechnen & weiter ----------------------
  function finish() {
    const richtig = state.antworten.filter((a) => a.richtig).length;
    const gesamt = state.antworten.length;
    const score = richtig * (CONFIG.punkteProFrage || 1);
    const prozent = gesamt ? Math.round((richtig / gesamt) * 100) : 0;
    const bestanden = prozent >= CONFIG.bestehensgrenzeProzent;

    const ergebnis = {
      zeitstempel: new Date().toISOString(),
      vorname: person.vorname,
      nachname: person.nachname,
      bereich: person.test, // "projection" | "sound"
      testLabel: test.label,
      sprache: lang(),
      richtig,
      gesamt,
      score,
      prozent,
      bestanden,
      tabWechsel: state.tabWechsel,
      proFrage: state.antworten,
    };
    sessionStorage.setItem("kac_result", JSON.stringify(ergebnis));
    location.replace("result.html");
  }
}

// =====================================================================
// SEITE 3: Ergebnis  (result.html)
// =====================================================================
async function initResult() {
  applyI18n();
  initLangToggle(render);

  const r = JSON.parse(sessionStorage.getItem("kac_result") || "null");
  if (!r) {
    $("#verdict").textContent = t(lang(), "keineSitzung");
    setTimeout(() => location.replace("index.html"), 2000);
    return;
  }

  $("#homeBtn").addEventListener("click", () => {
    sessionStorage.removeItem("kac_participant");
    sessionStorage.removeItem("kac_result");
    location.replace("index.html");
  });

  render();

  // einmalig speichern
  $("#statusText").textContent = t(lang(), "speichern");
  const res = await speichereErgebnis(r);
  $("#statusText").textContent = res.ok
    ? t(lang(), "gespeichert")
    : t(lang(), "nichtGespeichert");
  $("#statusText").classList.toggle("error", !res.ok);

  function render() {
    const L = lang();
    $("#verdict").textContent = r.bestanden
      ? t(L, "bestanden")
      : t(L, "nichtBestanden");
    $("#verdict").className = "verdict " + (r.bestanden ? "pass" : "fail");
    $("#scoreBig").textContent = r.prozent + "%";
    $("#scoreDetail").textContent = `${r.richtig} ${t(L, "richtigVon")} ${
      r.gesamt
    }`;
    $("#passInfo").textContent = `${CONFIG.bestehensgrenzeProzent}% ${t(
      L,
      "benoetigt"
    )} · ${t(L, "test")}: ${r.testLabel || ""}`;
  }
}

// =====================================================================
// Bootstrap
// =====================================================================
const page = document.body.dataset.page;
if (page === "login") initLogin();
else if (page === "quiz") initQuiz();
else if (page === "result") initResult();
