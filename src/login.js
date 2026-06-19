// =====================================================================
// Namensabgleich + Normalisierung.
// WICHTIG (ehrlich): Der Namensabgleich IDENTIFIZIERT, er AUTHENTIFIZIERT
// nicht – wer einen Namen kennt, kann ihn eingeben. Für diesen Zweck ok.
// =====================================================================

// "Müller" / "Mueller" / "  müller " -> "mueller"
export function normalize(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // restliche Akzente entfernen
    .replace(/[^a-z0-9]/g, "");                        // alles ausser a-z0-9 weg
}

// Sucht den Teilnehmer; gibt das Objekt zurück oder null.
export function findTeilnehmer(teilnehmer, vorname, nachname) {
  const v = normalize(vorname);
  const n = normalize(nachname);
  if (!v || !n) return null;
  return (
    teilnehmer.find(
      (p) => normalize(p.vorname) === v && normalize(p.nachname) === n
    ) || null
  );
}
