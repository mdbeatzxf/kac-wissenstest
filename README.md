# KAC Production Team – Wissenstest

Kleine, statische Web-App zum Testen des KAC Production Teams in zwei Bereichen:
**Projection** und **Sound**. Inhalte stammen 1:1 aus den Team-PDFs.
Ergebnisse landen (optional) in einem **Google Sheet**.

Tech: Vanilla HTML/CSS/JS (Variante A, kein Build). Läuft auf jedem Static-Host
(GitHub Pages, Netlify, Cloudflare Pages – gratis).

---

## 1. Wie es funktioniert

- **Login:** Vor- + Nachname → Abgleich gegen die Teilnehmerliste in
  `questions.json` (tolerant gegen Gross/Klein, Leerzeichen, Umlaute).
  Der Abgleich **identifiziert**, er **authentifiziert nicht** (wer einen Namen
  kennt, kann ihn eingeben) – für diesen Zweck ausreichend.
- **Testauswahl:** Die Person sieht nur die Tests, die in ihrem Feld `bereiche`
  erlaubt sind (`projection` und/oder `sound`).
- **Quiz:** eine Frage pro Bildschirm, **12 s Timer** mit Auto-Advance,
  kein Zurück / kein Überspringen, Fragen- und Antwort-Reihenfolge gemischt,
  Fortschrittsanzeige + Countdown. Pro Sitzung werden **12 zufällige Fragen**
  gezogen (konfigurierbar).
- **Ergebnis:** Score in % + bestanden/nicht bestanden (Default 80 %).
  Datensatz wird ans Google Sheet gepostet (und lokal als Fallback gesichert).

### Drei Frage-Pools, zwei Tests

In `questions.json` liegen die Fragen in drei Pools, jede Frage hat ein Feld
`bereich`:

| Pool         | Inhalt                                             |
| ------------ | -------------------------------------------------- |
| `projection` | Projection-Technik (Dock, DisplayLink, HDMI, …)    |
| `production` | **gemeinsame** Rollen/Ablauf-Fragen (in BEIDEN Tests) |
| `sound`      | Sound-Technik (Signale, PA, Pult, Patchlist, …)    |

Die beiden Tests setzen sich daraus zusammen (Feld `tests` in `questions.json`):

- **Projection-Test** = `projection` + `production`
- **Sound-Test** = `sound` + `production`

> Eine Frage in einen anderen Pool verschieben? Einfach ihr `bereich`-Feld
> ändern und sie in den passenden Pool-Array umhängen.

---

## 2. Lokal starten

`questions.json` wird per `fetch` geladen – das funktioniert **nicht** per
Doppelklick (file://). Starte einen kleinen lokalen Webserver im Projektordner:

```bash
cd kac-wissenstest
python3 -m http.server 5173
# dann im Browser öffnen:  http://localhost:5173
```

(Alternativ `npx serve` oder die „Live Server"-Extension in VS Code.)

Test-Logins aus der Beispielliste:
`Max Mustermann` (darf Projection + Sound) · `Erika Beispiel` (nur Sound).

---

## 3. Teilnehmer pflegen

In `questions.json` den Block `teilnehmer` bearbeiten:

```json
{ "vorname": "Anna", "nachname": "Schmidt", "bereiche": ["projection", "sound"] }
```

- `bereiche` = welche Tests die Person machen darf (`projection`, `sound`).
- Die Platzhalter (Max/Erika) löschen.

---

## 4. Fragen ergänzen / ändern

Eine Frage in den passenden Pool-Array (`pools.projection` / `pools.production`
/ `pools.sound`) eintragen:

```json
{
  "id": "S46",
  "bereich": "sound",
  "frage": "Deutsche Frage?",
  "frage_en": "English question?",
  "optionen": ["A", "B", "C", "D"],
  "optionen_en": ["A", "B", "C", "D"],
  "antwortIndex": 0,
  "quelle": "Quelle, S.x"
}
```

- `antwortIndex` ist **0-basiert** und gilt für `optionen` **und** `optionen_en`
  (gleiche Reihenfolge).
- `frage_en` / `optionen_en` sind die englischen Texte (für den DE/EN-Umschalter).
  Fehlen sie, fällt die App automatisch auf Deutsch zurück.

---

## 5. Ergebnisse ins Google Sheet (Apps Script)

1. Neues **Google Sheet** anlegen (z. B. „KAC Wissenstest Ergebnisse").
2. Im Sheet: **Erweiterungen → Apps Script**.
3. Den Inhalt von `apps-script/Code.gs` komplett in den Script-Editor kopieren
   (vorhandenen Code ersetzen) und **speichern**.
4. **Bereitstellen → Neue Bereitstellung** → Typ **Web-App**.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder** (damit die Seite anonym posten darf)
   - **Bereitstellen** klicken, Zugriff autorisieren.
5. Die **Web-App-URL** (endet auf `/exec`) kopieren.
6. In `src/config.js` eintragen:

   ```js
   appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec",
   ```

7. Fertig: Beim Beenden eines Tests wird eine Zeile ins Tabellenblatt
   **„Ergebnisse"** geschrieben (Spalten: Zeitstempel, Vorname, Nachname, Test,
   Richtig, Gesamt, Prozent, Bestanden, Sprache, Tab-Wechsel, Details-JSON).

> Lässt du `appsScriptUrl` leer, läuft alles trotzdem – Ergebnisse werden dann
> nur lokal im Browser (`localStorage`, Key `kac_ergebnisse`) gesichert.
> Bei jeder Änderung am Script: **neue Bereitstellung** bzw. „Bereitstellung
> verwalten → Bearbeiten → Neue Version".

---

## 6. Deployen (Hosting)

Es sind nur statische Dateien – einfach den ganzen Ordner hochladen:

- **Netlify / Cloudflare Pages:** Ordner per Drag-&-Drop hochladen, fertig.
- **GitHub Pages:** Repo pushen, Pages auf den Branch/Root zeigen lassen.

Wichtig: `questions.json`, `index.html`, `quiz.html`, `result.html` und der
`src/`-Ordner müssen zusammen im selben Verzeichnis liegen.

---

## 7. Konfiguration (`src/config.js`)

| Einstellung               | Default | Bedeutung                                              |
| ------------------------- | ------- | ------------------------------------------------------ |
| `appsScriptUrl`           | `""`    | Apps-Script-/exec-URL fürs Sheet (leer = nur lokal)    |
| `sekundenProFrage`        | `12`    | Timer pro Frage                                        |
| `bestehensgrenzeProzent`  | `80`    | ab wie viel % „bestanden"                              |
| `fragenProSitzung`        | `12`    | Fragen pro Sitzung; `null`/`0` = **alle** Fragen       |
| `antiCheat.*`             | an      | Mischen, Tab-Wechsel zählen, Rechtsklick/Auswahl sperren |
| `standardSprache`         | `"de"`  | `"de"` oder `"en"`                                     |

---

## 8. Anti-Cheat – ehrliche Grenzen

**Aktiv & sinnvoll:** 12-s-Timer + Auto-Advance, eine Frage zur Zeit, kein
Zurück, gemischte Reihenfolgen, Tab-Wechsel werden gezählt und ins Sheet
geschrieben, Rechtsklick/Textauswahl unterdrückt.

**Grenzen (Variante A):** Eine reine Frontend-Seite kann Schummeln **nicht**
vollständig verhindern. Der **Antwortschlüssel liegt im Browser** (`questions.json`
ist über die DevTools lesbar), und ein zweites Gerät mit PDF danebenzulegen lässt
sich technisch nicht ausschliessen. Der **Timer ist der eigentliche Hebel**.

Wenn echte Sicherheit nötig ist → **Variante B**: Fragen ohne Lösung ausliefern,
Antworten serverseitig prüfen und werten (z. B. Next.js + kleine DB). Dann ist
der Schlüssel nie im Browser.

---

## 9. Projektstruktur

```
kac-wissenstest/
├─ README.md
├─ questions.json          # Fragen (3 Pools) + Teilnehmer + Tests + Konfig
├─ index.html              # Login + Testauswahl
├─ quiz.html               # Quiz (eine Frage, 12-s-Timer)
├─ result.html             # Endergebnis
├─ src/
│  ├─ config.js            # zentrale Einstellungen
│  ├─ i18n.js              # DE/EN UI-Texte
│  ├─ login.js             # Namensabgleich/Normalisierung
│  ├─ app.js               # Ablauf-Logik (Laden, Mischen, Timer, Scoring)
│  ├─ storage.js           # POST an Apps-Script-Webhook
│  └─ styles.css
├─ apps-script/
│  └─ Code.gs              # Google Apps Script (Sheet-Endpoint)
└─ pdfs/                   # (optional) Quell-PDFs als Referenz
```
