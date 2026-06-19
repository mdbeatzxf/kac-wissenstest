// =====================================================================
// UI-Texte in Deutsch und Englisch. Frage-Inhalte stehen in questions.json
// (Feld 'frage' / 'frage_en' und 'optionen' / 'optionen_en').
// =====================================================================

export const I18N = {
  de: {
    appTitel: "KAC Production Team – Wissenstest",
    // Login
    loginUnter: "Melde dich mit deinem Namen an.",
    vorname: "Vorname",
    nachname: "Nachname",
    weiter: "Weiter",
    nameNichtGefunden: "Name nicht gefunden. Bitte prüfe die Schreibweise oder frag dein Team-Lead.",
    bitteNameEingeben: "Bitte Vor- und Nachnamen eingeben.",
    // Bereichswahl
    hallo: "Hallo",
    bereichWaehlen: "Welchen Test möchtest du machen?",
    testStarten: "Test starten",
    abmelden: "Abmelden",
    // Quiz
    frage: "Frage",
    von: "von",
    sekunden: "s",
    antwortBestaetigen: "Antwort bestätigen",
    keineAntwort: "(keine Antwort)",
    quizAbbrechen: "Abbrechen",
    abbrechenBestaetigen: "Test wirklich abbrechen? Der Fortschritt geht verloren.",
    // Ergebnis
    ergebnis: "Dein Ergebnis",
    bestanden: "Bestanden 🎉",
    nichtBestanden: "Nicht bestanden",
    richtigVon: "richtig von",
    benoetigt: "benötigt zum Bestehen",
    gespeichert: "Ergebnis gespeichert.",
    nichtGespeichert: "Ergebnis konnte nicht online gespeichert werden (Internet?). Es liegt lokal vor – bitte deinem Team-Lead melden.",
    speichern: "Speichere Ergebnis …",
    nochmal: "Zur Startseite",
    test: "Test",
    // Fehler
    ladefehler: "Fragen konnten nicht geladen werden. Bitte die Seite über einen Webserver öffnen (siehe README), nicht per Doppelklick.",
    keineSitzung: "Keine aktive Sitzung. Zurück zur Anmeldung.",
  },

  en: {
    appTitel: "KAC Production Team – Knowledge Test",
    loginUnter: "Sign in with your name.",
    vorname: "First name",
    nachname: "Last name",
    weiter: "Continue",
    nameNichtGefunden: "Name not found. Please check the spelling or ask your team lead.",
    bitteNameEingeben: "Please enter first and last name.",
    hallo: "Hello",
    bereichWaehlen: "Which test would you like to take?",
    testStarten: "Start test",
    abmelden: "Sign out",
    frage: "Question",
    von: "of",
    sekunden: "s",
    antwortBestaetigen: "Confirm answer",
    keineAntwort: "(no answer)",
    quizAbbrechen: "Cancel",
    abbrechenBestaetigen: "Really cancel the test? Your progress will be lost.",
    ergebnis: "Your result",
    bestanden: "Passed 🎉",
    nichtBestanden: "Not passed",
    richtigVon: "correct out of",
    benoetigt: "needed to pass",
    gespeichert: "Result saved.",
    nichtGespeichert: "Result could not be saved online (internet?). It is stored locally – please tell your team lead.",
    speichern: "Saving result …",
    nochmal: "Back to start",
    test: "Test",
    ladefehler: "Could not load the questions. Please open the page through a web server (see README), not by double-clicking.",
    keineSitzung: "No active session. Back to sign-in.",
  },
};

const LANG_KEY = "kac_lang";

export function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === "en" || stored === "de" ? stored : null;
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang === "en" ? "en" : "de");
}

export function t(lang, key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.de[key] || key;
}
