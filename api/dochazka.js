/**
 * Zápis docházky → Google tabulka.
 *
 * Proč to jde přes tuhle funkci a ne rovnou z prohlížeče:
 * token k Apps Scriptu tak zůstane na serveru a nikdo si ho nevyčte
 * z kódu stránky. Prohlížeč volá /api/dochazka, tahle funkce teprve
 * volá Google.
 *
 * Ve Vercelu nastav v Settings → Environment Variables:
 *   APPS_SCRIPT_URL    = https://script.google.com/macros/s/…/exec
 *   APPS_SCRIPT_TOKEN  = stejné heslo jako TOKEN ve skriptu
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, chyba: 'jen-post' });
  }

  const url = process.env.APPS_SCRIPT_URL;
  const token = process.env.APPS_SCRIPT_TOKEN;
  if (!url || !token) {
    return res.status(500).json({ ok: false, chyba: 'chybi-nastaveni-na-serveru' });
  }

  let data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, chyba: 'necitelna-data' });
  }

  // jednoduchá obrana proti nesmyslům
  const jmeno = String(data.jmeno || '').trim().slice(0, 60);
  const datum = String(data.datum || '').trim();
  if (!jmeno || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    return res.status(400).json({ ok: false, chyba: 'chybi-jmeno-nebo-datum' });
  }

  try {
    // Bez hlavičky Content-Type: Apps Script neumí odpovědět na preflight.
    const odpoved = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        token,
        jmeno,
        datum,
        cas: String(data.cas || '').slice(0, 30),
        skupina: String(data.skupina || '').slice(0, 80),
        role: data.role === 'Trenér' ? 'Trenér' : 'Hráč',
        zpetne: !!data.zpetne
      })
    });
    const text = await odpoved.text();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(502).json({ ok: false, chyba: 'google-odpovedel-necekane', telo: text.slice(0, 300) });
    }
  } catch (e) {
    return res.status(502).json({ ok: false, chyba: 'google-nedostupny', detail: String(e) });
  }
}
