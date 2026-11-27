# Velmara — De Fluisterende Poort

Een speelbaar prototype van een verhalende fantasy-RPG / visual novel in puur **HTML, CSS en JavaScript**. Er is geen build-stap en je hebt geen dependencies nodig.

> Mira (of hoe jij haar ook noemt) werkt in een grijs stadsarchief. Op een regenachtige dinsdag vindt ze een doos zonder inventarisnummer, met daarin een kompas dat niet naar het noorden wijst. Even later staat ze in het Fluisterwoud van Velmara, een wereld waar het licht langzaam dooft.

## Starten

**Optie 1 (de eenvoudigste):** dubbelklik op `index.html`. Het spel werkt ook via `file://`, zonder server.

**Optie 2 (lokale server):**

```bash
cd rpg-visual-novel
python3 -m http.server 8000      # of:  npx serve .
# open http://localhost:8000
```

## Wat zit erin

| Functie | Waar / hoe |
|---|---|
| **Locatie-navigatie** | De kaart (knop **Kaart** of **M**) toont 4 locaties: Het Fluisterwoud, De Gouden Lantaarn, De Oude Ruïne en De Sterrenbron. Nieuwe plekken worden ontgrendeld naarmate je verder komt. In elke locatie kun je uit acties kiezen (praten, onderzoeken, …). |
| **Vertakkende dialogen** | Keuzes beïnvloeden vertrouwen (Fenn, Odile), moed, voorwerpen en vlaggen. Er zijn 3 eindes, waarvan 1 geheim. Vergrendelde keuzes tonen wat je nog nodig hebt. |
| **Expressies** | Elk personage heeft meerdere gezichtsuitdrukkingen, met crossfade bij het wisselen. Wie spreekt wordt uitgelicht, de anderen worden gedimd. |
| **Tas & Dagboek** | Zijbalk (**I** / **J**) met tabbladen *Tas*, *Dagboek* (lore per categorie, met "NIEUW"-markeringen) en *Relaties* (vertrouwensbalken). |
| **Opslaan/Laden** | 6 slots plus een automatische opslag bij elke scène en locatie, via `localStorage`. Opslaan kan ook midden in een dialoog of keuze. |
| **Extra's** | Typewriter-tekst, Auto- en Skip-modus, geschiedenis-log (**L**), UI verbergen om de illustratie te bekijken (**H**), hoofdstukkaarten, scherm-effecten (flash/shake/flicker), instellingen en een responsieve layout. |

**Sneltoetsen:** `Spatie`/`Enter` verder · `1–9` keuze of actie · `M` kaart · `I` tas · `J` dagboek · `L` log · `A` auto · `S` skip · `H` UI verbergen · `Esc` sluiten.

## Bestandsstructuur

```
rpg-visual-novel/
├── index.html              ← openen om te spelen
├── css/
│   └── style.css           ← alle styling (kleuren/fonts via CSS-variabelen bovenaan)
├── js/
│   ├── storyData.js        ← ★ ALLE verhaalinhoud: scènes, dialogen, keuzes, locaties, items, lore
│   ├── assets.js           ← laadt jouw afbeeldingen, of genereert SVG-placeholders
│   ├── validator.js        ← controleert storyData op typfouten (console bij opstarten)
│   └── game.js             ← de engine (hoef je niet aan te passen)
├── assets/
│   ├── backgrounds/        ← achtergronden   1920×1080
│   ├── characters/         ← portretten      800×1200 (transparante PNG)
│   ├── items/              ← voorwerp-iconen 256×256
│   └── ui/                 ← wereldkaart     1600×1000
└── tools/
    ├── validate.js         ← node tools/validate.js
    └── playtest.js         ← automatische playthrough van alle eindes
```

## 🎨 Je eigen afbeeldingen plaatsen

1. Zet je bestand in de juiste map **met exact de bestandsnaam uit de tabellen hieronder**.
2. Herlaad de pagina. Klaar.

Bestaat een bestand niet, dan genereert de engine automatisch een sfeervolle SVG-placeholder met een label (bestandsnaam en afmetingen). Zo zie je altijd welk bestand er nog ontbreekt. De labels kun je uitzetten via **Opties → Placeholder-labels tonen**.

Je mag ook **`.jpg`, `.jpeg` of `.webp`** gebruiken met dezelfde naam (bv. `bg_tavern.jpg`). De engine probeert die varianten automatisch.

### Achtergronden: `assets/backgrounds/` (1920×1080, 16:9)

| Bestand | Gebruikt voor |
|---|---|
| `bg_title.png` | Titelscherm |
| `bg_archive.png` | Proloog: het grijze stadsarchief (en het einde *Terug, maar Anders*) |
| `bg_archive_door.png` | Het archief met de magische deur (en het geheime einde) |
| `bg_forest.png` | Het Fluisterwoud |
| `bg_forest_stones.png` | De stenen kring in het woud |
| `bg_tavern.png` | De Gouden Lantaarn |
| `bg_ruins.png` | De ruïne van Aster-Hal |
| `bg_ruins_gate.png` | De Poort onder de ruïne |
| `bg_starwell.png` | De Sterrenbron (finale) |

### Personages: `assets/characters/` (800×1200, transparante PNG)

Tip: laat de figuur onderaan het canvas "staan". Het hoofd ligt idealiter tussen 15% en 40% van de hoogte, zodat het dialoogvenster het gezicht niet bedekt.

| Personage | Bestanden |
|---|---|
| Protagonist | `char_protagonist_neutral.png` · `_surprised` · `_determined` · `_happy` · `_worried` |
| Fenn (woudwachter) | `char_fenn_neutral.png` · `_smile` · `_suspicious` · `_surprised` · `_sad` |
| Odile (taverne-eigenares) | `char_odile_neutral.png` · `_laugh` · `_serious` · `_surprised` |
| De Wachter (stenen bewaker) | `char_wachter_dormant.png` · `_awakened` · `_warm` |

### Voorwerpen: `assets/items/` (256×256)

`item_kompas.png` · `item_archiefpas.png` · `item_lantaarn.png` · `item_nachtbloem.png` · `item_kaart.png` · `item_sleutel.png` · `item_dagboek.png`

### Kaart: `assets/ui/` (1600×1000)

`map_world.png`. De posities van de pinnen staan per locatie in `storyData.js` (`mapPos: { x: %, y: % }`). Pas die aan zodat ze op je eigen kaart kloppen.

## ✍️ Verhaal schrijven (zonder code te wijzigen)

Alles staat in `js/storyData.js`. De structuur:

```js
window.STORY_DATA = {
  meta:        { title, startScene, defaultName, ... },
  stats:       { fenn: { label, max, notifyUp }, ... },
  characters:  { fenn: { name, color, defaultPos, expressions: { smile: "char_fenn_smile.png" } } },
  backgrounds: { forest: { file: "bg_forest.png" } },
  items:       { kompas: { name, description, icon, glyph } },
  lore:        { velmara: { category, title, text } },
  locations:   { forest: { name, background, mapPos, arrive, present, actions } },
  endings:     { wachter: { title, background, text: [ ... ] } },
  scenes:      { prologue: { background, location, chapter, nodes: [ ... ] } }
};
```

### Nodes (stappen in een scène)

```js
{ narrate: "Regen tikt tegen de ramen." }                 // verteltekst
{ say: "fenn", expr: "smile", text: "Hoi, {name}!" }      // dialoog + expressie
{ think: "Wat was dat?", expr: "worried" }                 // gedachte van de protagonist
{ show: "odile", expr: "neutral", pos: "right" }           // left | center | right | farleft | farright
{ hide: "odile" }   { hide: "all" }
{ bg: "tavern" }    { fx: "flash" | "shake" | "flicker" }
{ title: "Hoofdstuk 5", subtitle: "De Kust" }              // hoofdstukkaart
{ choice: [
    { text: "Help haar", goto: "help", do: [{ stat: "odile", add: 1 }] },
    { text: "Geheime optie", goto: "x", if: { item: "sleutel" },
      showLocked: true, lockedHint: "Je hebt een sleutel nodig." },
    { text: "Ga weg", end: true }
] }
{ label: "help", say: "odile", text: "Dank je." }          // elk node kan een label hebben
{ test: { stat: { fenn: 2 } }, goto: "vriend", else: "vreemde" }
{ goto: "label" }  { scene: "andereScene" }  { end: true }  // end = terug naar de locatie
{ travel: "ruins" }  { ending: "wachter" }
```

Elk node mag ook `if: {...}` hebben (het node wordt overgeslagen als de voorwaarde faalt) en `do: [...]` (effecten).

Bij keuzes bepaalt `if` of een keuze **klikbaar** is en `showIf` of ze **zichtbaar** is.

**Effecten:** `{flag:"x"}` · `{flag:"x", value:false}` · `{item:"id"}` · `{removeItem:"id"}` · `{lore:"id"}` · `{stat:"fenn", add:1}` · `{unlock:"locatie"}` · `{notify:"tekst"}`

**Voorwaarden** (alle sleutels moeten kloppen): `{flag}` · `{notFlag}` · `{item}` · `{noItem}` · `{lore}` · `{stat:{fenn:2}}` (≥) · `{statBelow:{fenn:2}}` (<) · `{seen:"scene"}` · `{unlocked:"loc"}` · `{any:[…]}` · `{not:{…}}`

**Tekst:** `{name}` wordt de spelersnaam, `*tekst*` wordt cursief.

### Een nieuwe locatie toevoegen (voorbeeld)

```js
// 1. achtergrond
backgrounds: { harbor: { file: "bg_harbor.png", placeholder: "ruins" } },
// 2. locatie
locations: {
  harbor: {
    name: "De Haven", subtitle: "Zilverkust", background: "harbor", mapPos: { x: 90, y: 70 },
    description: "Meeuwen krijsen boven de kade.",
    arrive:  [{ scene: "harbor_arrival", once: true }],
    present: [{ char: "odile", expr: "neutral", pos: "right" }],
    actions: [{ id: "boat", label: "Bekijk de boten", icon: "look", scene: "harbor_boats", once: true }]
  }
},
// 3. scènes (met location: "harbor", zodat { end: true } terugkeert naar de haven)
scenes: { harbor_arrival: { location: "harbor", nodes: [ { narrate: "Zout in de lucht…" }, { end: true } ] } },
// 4. ontgrendelen vanuit een bestaande scène
{ narrate: "Odile wijst naar de kust.", do: [{ unlock: "harbor" }] }
```

Beschikbare actie-iconen: `talk`, `look`, `ear`, `hand`, `gift`, `door`, `map`.

### Controleren

- In de browser: open de console (F12). Fouten in je verhaaldata worden bij het opstarten gemeld.
- Via Node: `node tools/validate.js`
- Automatische playthrough van alle 3 eindes: `npm install --no-save jsdom && node tools/playtest.js`
- Debug in de console: `VN.jump('gate_puzzle')`, `VN.give('sleutel')`, `VN.travel('ruins')`, `VN.state()`

## Spoiler: hoe haal je elk einde?

<details><summary>Klik om te tonen</summary>

- **De Nieuwe Wachter** / **Terug, maar Anders**: open de Poort (sleutel van Odile en de drie verzen: woud, taverne, ruïne) en kies bij de Sterrenbron.
- **De Brug tussen Werelden (geheim)**: lees het dagboek van Agnes in de ruïne-bibliotheek, en bereik vertrouwen ≥ 2 bij zowel Fenn als Odile.

</details>
