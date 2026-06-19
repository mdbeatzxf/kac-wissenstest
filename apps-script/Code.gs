/**
 * KAC Wissenstest – Google Apps Script Web-App.
 * Nimmt POST-Ergebnisse entgegen und schreibt sie als Zeile ins Sheet
 * "Ergebnisse" der verbundenen Tabelle.
 *
 * Deploy: siehe README.md im Projekt ("Ergebnisse ins Google Sheet").
 */

var SHEET_NAME = "Ergebnisse";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Kopfzeile einmalig anlegen
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Zeitstempel",
        "Vorname",
        "Nachname",
        "Test",
        "Richtig",
        "Gesamt",
        "Prozent",
        "Bestanden",
        "Sprache",
        "Tab-Wechsel",
        "Details (JSON)",
      ]);
    }

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.zeitstempel || new Date().toISOString(),
      data.vorname || "",
      data.nachname || "",
      data.testLabel || data.bereich || "",
      data.richtig != null ? data.richtig : "",
      data.gesamt != null ? data.gesamt : "",
      data.prozent != null ? data.prozent : "",
      data.bestanden ? "JA" : "NEIN",
      data.sprache || "",
      data.tabWechsel != null ? data.tabWechsel : 0,
      JSON.stringify(data.proFrage || []),
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput(
    "KAC Wissenstest endpoint OK"
  ).setMimeType(ContentService.MimeType.TEXT);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
