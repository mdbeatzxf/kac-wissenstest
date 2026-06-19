// =====================================================================
// Zentrale Konfiguration – hier alles anpassen, was sich ändern soll.
// =====================================================================

export const CONFIG = {
  // ---- Ergebnis-Speicherung (Google Apps Script Web-App) -------------
  // Nach dem Deploy (siehe README) die /exec-URL hier eintragen.
  // Leer lassen = es wird nichts gepostet (nur lokaler Fallback im Browser).
  appsScriptUrl: "",

  // ---- Quiz-Regeln ---------------------------------------------------
  sekundenProFrage: 12,          // Timer pro Frage (Sekunden)
  bestehensgrenzeProzent: 80,    // ab wie viel % gilt der Test als bestanden
  punkteProFrage: 1,
  fragenProSitzung: 12,          // wie viele Fragen pro Sitzung ziehen;
                                 // null oder 0 = ALLE Fragen des Tests

  // ---- Anti-Cheat ----------------------------------------------------
  antiCheat: {
    fragenMischen: true,         // Fragen-Reihenfolge mischen
    antwortenMischen: true,      // Antwort-Optionen mischen
    tabWechselErkennen: true,    // Tab-/Fensterwechsel zählen und mit ins Sheet schreiben
    rechtsklickSperren: true,    // Rechtsklick-Menü unterdrücken (kosmetisch)
    textauswahlSperren: true,    // Markieren/Kopieren erschweren (kosmetisch)
  },

  // ---- Sprache -------------------------------------------------------
  standardSprache: "de",         // "de" oder "en"
};
