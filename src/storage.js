// =====================================================================
// Ergebnis an die Google-Apps-Script-Web-App posten.
// 'text/plain' = "simple request" -> kein CORS-Preflight, Apps Script
// liest den Body über e.postData.contents.
// =====================================================================

import { CONFIG } from "./config.js";

export async function speichereErgebnis(datensatz) {
  // Immer lokal sichern (Fallback / Nachweis), unabhängig vom Online-Post.
  try {
    const liste = JSON.parse(localStorage.getItem("kac_ergebnisse") || "[]");
    liste.push(datensatz);
    localStorage.setItem("kac_ergebnisse", JSON.stringify(liste));
  } catch (_) {
    /* localStorage evtl. voll/blockiert – nicht kritisch */
  }

  if (!CONFIG.appsScriptUrl) {
    return { ok: false, grund: "keine-url" };
  }

  try {
    const res = await fetch(CONFIG.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datensatz),
      redirect: "follow",
    });
    // Apps Script antwortet i. d. R. mit JSON {ok:true}. Antwort kann je
    // nach Deploy nicht lesbar sein – HTTP-200 reicht uns als Erfolg.
    if (res.ok) {
      try {
        const j = await res.json();
        return { ok: j.ok !== false };
      } catch (_) {
        return { ok: true };
      }
    }
    return { ok: false, grund: "http-" + res.status };
  } catch (err) {
    return { ok: false, grund: String(err) };
  }
}
