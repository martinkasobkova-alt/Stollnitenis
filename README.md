# Web SKST Králův Dvůr

Statický web. Žádný build, žádné závislosti — jsou to prostě soubory.
Nasazuje se na Vercel, který po každém pushnutí web sám přenasadí.

---

## Nasazení, poprvé (asi 10 minut)

1. **Založ repozitář na GitHubu** a nahraj do něj obsah téhle složky.
   Git umět nemusíš — na GitHubu jde v novém repozitáři použít
   *uploading an existing file* a soubory tam přetáhnout myší.

2. **Na Vercelu** dej *Add New → Project → Import Git Repository*
   a vyber ten repozitář. Framework nech na **Other**, nic nenastavuj.

3. **Nastav dvě proměnné prostředí** ve Vercelu
   (*Settings → Environment Variables*):

   | Název | Hodnota |
   |---|---|
   | `APPS_SCRIPT_URL` | adresa nasazení Apps Scriptu, končí na `/exec` |
   | `APPS_SCRIPT_TOKEN` | stejné heslo jako konstanta `TOKEN` ve skriptu |

   Bez nich web funguje, jen se docházka neuloží.
   **Token nikdy nedávej do souborů v repozitáři** — proto tu je
   `api/dochazka.js`, které ho drží na serveru.

4. Hotovo. Web běží na `nazev-projektu.vercel.app`.
   Vlastní doménu přidáš ve Vercelu v *Settings → Domains*.

---

## Co kde je

```
index.html          hlavní stránka
metodika.html       metodika, videa, tipy
api/dochazka.js     přeposílá zápisy docházky do Google tabulky
data/obsah.json     turnaje a materiály — tohle upravuje klub

img/                fotky
```

---

## Běžné úpravy

### Video

V `index.html` úplně nahoře je blok `NASTAVENI`:

```js
video: {
  vimeo:   '1223964092',       // vyplněno — video klubu na Vimeu
  youtube: 'IHa4if5xGfE',      // použije se, jen když vimeo vymažeš
  soubor:  'video/skst.mp4'    // použije se, jen když vimeo i youtube vymažeš
}
```

Video je na Vimeu (ne na YouTube), protože jen Vimeo umí přes odkaz
schovat i jméno a fotku toho, kdo video nahrál. V repozitáři žádné
video není a neplatíš za přenosy. Kdybys ho chtěla hostovat sama,
vymaž vimeo i youtube, založ složku `video/` a dej do ní mp4.

### Sdílený žebříček u minihry

Bez nastavení vidí každý jen svoje vlastní skóre (uložené jen v jeho
prohlížeči). Aby žebříček viděli všichni napříč zařízeními, založ
zdarma Firebase projekt:

1. Na [console.firebase.google.com](https://console.firebase.google.com)
   → **Add project** (stačí zdarma tarif Spark).
2. V levém menu **Build → Firestore Database** → **Create database**
   → zvol libovolný region → **Start in production mode**.
3. Tam v záložce **Rules** smaž obsah a vlož:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /zebricek/{doc} {
         allow read: if true;
         allow create: if request.resource.data.keys().hasOnly(['jmeno','vymeny','kdy'])
                       && request.resource.data.jmeno is string
                       && request.resource.data.jmeno.size() <= 18
                       && request.resource.data.vymeny is int
                       && request.resource.data.vymeny >= 0
                       && request.resource.data.vymeny <= 999999
                       && request.resource.data.kdy is string;
         allow update, delete: if false;
       }
     }
   }
   ```

   → **Publish**. Tohle dovolí komukoli žebříček číst a přidat svůj
   vlastní výsledek, ale nikdo (ani útočník z konzole prohlížeče)
   nemůže cizí výsledky smazat ani upravit.
4. V nastavení projektu (ozubené kolo vlevo nahoře → **Project settings**)
   sjeď na **Your apps** → ikona `</>` (Web) → zaregistruj appku
   (stačí libovolný název) → zkopíruj hodnoty `apiKey`, `authDomain`,
   `projectId`, `appId`.
5. Vlož je do `NASTAVENI.firebase` v `index.html`, ulož, pushni.

Tyhle hodnoty (apiKey a spol.) nejsou tajné heslo — u Firebase je
běžné mít je přímo v kódu stránky, ochranu dělají až ta **Rules**
z kroku 3.

### Rozvrh tréninků

V `index.html` je pole `ROZVRH`. U každého dne jsou termíny s časem,
popisem a typem (`deti` nebo `dospeli` — podle toho se obarví).
Z rozvrhu se sama dopočítají konkrétní data pro zápis docházky.

### Los utkání

Pole `ZAPASY` v `index.html`. Data pocházejí z **CSV exportu kalendáře
utkání ze STIS** — v novém ročníku stáhni nový export a nech si ho
převést. Formát: kódování Windows-1250, datumy DD/MM/YYYY.

### Výsledky utkání

Objekt `VYSLEDKY` v `index.html`. Klíč je `datum_cas_družstvo`,
hodnota je `[skóre domácích, skóre hostů]`:

```js
var VYSLEDKY = {
  '2026-10-03_1700_C': [10, 4]
};
```

Vyhraná utkání se ukážou zeleně, prohraná červeně.

### Turnaje a metodika

Soubor `data/obsah.json`. Uprav, ulož, pushni. Je to JSON, takže
pozor na čárky — poslední položka v seznamu za sebou čárku nemá.

---

## Na co si dát pozor

**Jména dětí.** V evidenci klubu jsou ročníky 2015 a mladší.
Zveřejňovat na webu celé jméno a rok narození dítěte je něco jiného
než mít je ve svazovém registru. U nezletilých doporučuju příjmení
a iniciálu, nebo odkázat na STIS.

**Docházka jsou osobní údaje.** U formuláře by měla být jedna věta,
k čemu se sbírají a jak dlouho se uchovávají. Správcem je klub.

**Apps Script po každé změně kódu** vyžaduje nasadit *novou verzi*,
jinak běží pořád ta stará.
