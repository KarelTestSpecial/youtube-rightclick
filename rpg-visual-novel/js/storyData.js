/* =====================================================================
 *  VELMARA — STORY DATA
 *  ---------------------------------------------------------------------
 *  Dit bestand bevat ALLE verhaalinhoud: personages, achtergronden,
 *  voorwerpen, lore, locaties, scènes en eindes. Je kunt hier nieuwe
 *  hoofdstukken toevoegen zonder de engine (game.js) aan te passen.
 *
 *  Het is een gewoon .js-bestand (geen .json) zodat het spel ook werkt
 *  als je index.html direct opent via dubbelklik (file://), zonder server.
 *
 *  Volledige uitleg van alle node-types, effecten en voorwaarden staat
 *  in README.md (sectie “Verhaal schrijven”). Snelle referentie:
 *
 *  NODES (in scene.nodes):
 *    { narrate: "tekst" }                         verteltekst
 *    { say: "fenn", expr: "smile", text: "..." }  dialoog (+ expressie)
 *    { think: "tekst", expr: "worried" }          gedachte van protagonist
 *    { show: "fenn", expr: "neutral", pos: "right" }  personage tonen
 *    { hide: "fenn" }  /  { hide: "all" }        personage(s) verbergen
 *    { bg: "forest" }                             achtergrond wisselen
 *    { fx: "flash" | "shake" | "flicker" }        visueel effect
 *    { title: "Hoofdstuk 1", subtitle: "..." }    hoofdstukkaart
 *    { choice: [ { text, goto|scene|end|ending, do, if, showIf, showLocked, lockedHint } ] }
 *        if = keuze klikbaar, showIf = keuze zichtbaar, showLocked = toon (vergrendeld) als `if` faalt
 *    { test: {voorwaarde}, goto: "label", else: "label" }
 *    { goto: "label" }  { scene: "sceneId" }  { end: true }
 *    { travel: "locatieId" }  { ending: "eindeId" }
 *    Elke node mag ook hebben: label, if (node overslaan als false), do (effecten)
 *
 *  EFFECTEN (do: [...]):
 *    {flag:"x"} {flag:"x", value:false} {item:"id"} {removeItem:"id"}
 *    {lore:"id"} {stat:"fenn", add:1} {unlock:"locatieId"} {notify:"tekst"}
 *
 *  VOORWAARDEN (if: {...}, alle sleutels moeten kloppen):
 *    {flag:"x"} {notFlag:"x"} {item:"id"} {noItem:"id"} {lore:"id"}
 *    {stat:{fenn:2}}  (>=)   {statBelow:{fenn:2}}  (<)
 *    {seen:"sceneId"} {any:[...]} {not:{...}}
 *
 *  Tekst: {name} wordt vervangen door de naam van de speler,
 *         *tekst* wordt cursief weergegeven.
 * ===================================================================== */

window.STORY_DATA = {
  /* ------------------------------------------------------------------ */
  meta: {
    title: "Velmara",
    subtitle: "De Fluisterende Poort",
    version: "0.1.0",
    startScene: "prologue",
    defaultName: "Mira",
    // Zet op false om nooit naar echte afbeeldingen te zoeken (alleen placeholders).
    probeAssets: true
  },

  /* Mappen waar de engine je eigen afbeeldingen zoekt (relatief t.o.v. index.html).
     Als een bestand niet bestaat, wordt automatisch een placeholder gegenereerd.
     De engine probeert ook .jpg / .jpeg / .webp met dezelfde bestandsnaam. */
  assetPaths: {
    backgrounds: "assets/backgrounds/",
    characters: "assets/characters/",
    items: "assets/items/",
    ui: "assets/ui/"
  },

  /* Aanbevolen afmetingen (alleen ter info + voor de placeholders). */
  assetSizes: {
    backgrounds: [1920, 1080],
    characters: [800, 1200],
    items: [256, 256],
    map: [1600, 1000]
  },

  /* ------------------------------------------------------------------ */
  stats: {
    fenn:  { label: "Vertrouwen — Fenn",  icon: "fenn",  initial: 0, max: 5, notifyUp: "Fenn zal dit onthouden." },
    odile: { label: "Vertrouwen — Odile", icon: "odile", initial: 0, max: 5, notifyUp: "Odile zal dit onthouden." },
    moed:  { label: "Moed",               icon: "moed",  initial: 0, max: 5, notifyUp: "Je voelt je moediger." }
  },

  /* ------------------------------------------------------------------ */
  characters: {
    protagonist: {
      name: "{name}",
      color: "#f0b6c9",
      defaultPos: "left",
      defaultExpr: "neutral",
      expressions: {
        neutral:    "char_protagonist_neutral.png",
        surprised:  "char_protagonist_surprised.png",
        determined: "char_protagonist_determined.png",
        happy:      "char_protagonist_happy.png",
        worried:    "char_protagonist_worried.png"
      },
      placeholder: { type: "human", skin: "#f2d2bf", hair: "#4a2c22", hairStyle: "long", outfit: "#5d6b8f", outfit2: "#3c4766", accent: "#f0b6c9", eyes: "#3b5a46" }
    },
    fenn: {
      name: "Fenn",
      color: "#8fd6b0",
      defaultPos: "right",
      defaultExpr: "neutral",
      expressions: {
        neutral:    "char_fenn_neutral.png",
        smile:      "char_fenn_smile.png",
        suspicious: "char_fenn_suspicious.png",
        surprised:  "char_fenn_surprised.png",
        sad:        "char_fenn_sad.png"
      },
      placeholder: { type: "human", skin: "#d9b08f", hair: "#8a4b25", hairStyle: "short", outfit: "#2f5a45", outfit2: "#1d3a2d", accent: "#8fd6b0", eyes: "#6b4a1f", hood: true }
    },
    odile: {
      name: "Odile",
      color: "#f2c47c",
      defaultPos: "right",
      defaultExpr: "neutral",
      expressions: {
        neutral:   "char_odile_neutral.png",
        laugh:     "char_odile_laugh.png",
        serious:   "char_odile_serious.png",
        surprised: "char_odile_surprised.png"
      },
      placeholder: { type: "human", skin: "#e8c2a4", hair: "#c9c6cf", hairStyle: "bun", outfit: "#7a3b2e", outfit2: "#4a2219", accent: "#f2c47c", eyes: "#4a3a6b", shawl: true, age: true }
    },
    wachter: {
      name: "De Wachter",
      color: "#7fe0e6",
      defaultPos: "center",
      defaultExpr: "dormant",
      expressions: {
        dormant:  "char_wachter_dormant.png",
        awakened: "char_wachter_awakened.png",
        warm:     "char_wachter_warm.png"
      },
      placeholder: { type: "golem", stone: "#6d6f80", stone2: "#43455a", accent: "#7fe0e6", moss: "#4f6b45" }
    },
    /* Personage zonder portret (alleen naam in het dialoogvenster) */
    stem: {
      name: "Fluisterstem",
      color: "#9fe3d3"
    }
  },

  /* ------------------------------------------------------------------ */
  backgrounds: {
    title:        { file: "bg_title.png",        placeholder: "title" },
    archive:      { file: "bg_archive.png",      placeholder: "archive" },
    archive_door: { file: "bg_archive_door.png", placeholder: "archive_door" },
    forest:       { file: "bg_forest.png",       placeholder: "forest" },
    forest_stones:{ file: "bg_forest_stones.png",placeholder: "forest_stones" },
    tavern:       { file: "bg_tavern.png",       placeholder: "tavern" },
    ruins:        { file: "bg_ruins.png",        placeholder: "ruins" },
    ruins_gate:   { file: "bg_ruins_gate.png",   placeholder: "ruins_gate" },
    starwell:     { file: "bg_starwell.png",     placeholder: "starwell" }
  },

  /* De wereldkaart (kaartscherm). */
  map: { file: "map_world.png", placeholder: "map" },

  /* ------------------------------------------------------------------ */
  items: {
    kompas:     { name: "Wachterskompas",            glyph: "🧭", icon: "item_kompas.png",     description: "Een bronzen kompas met gebarsten glas. De naald wijst niet naar het noorden, maar naar wat verloren is — of naar wat op je wacht." },
    archiefpas: { name: "Toegangspas Stadsarchief",  glyph: "🪪", icon: "item_archiefpas.png", description: "Je pasfoto erop is vreselijk. In Velmara opent hij precies nul deuren." },
    lantaarn:   { name: "Dwaallicht-lantaarn",       glyph: "🏮", icon: "item_lantaarn.png",   description: "Een kleine lantaarn met een rusteloos blauwgroen vlammetje. In het licht ervan worden verborgen runen zichtbaar." },
    nachtbloem: { name: "Nachtbloei",                glyph: "🌸", icon: "item_nachtbloem.png", description: "Een bleke bloem die zacht zilverlicht geeft. Iemand in Velmara zou hier vast blij mee zijn." },
    kaart:      { name: "Odiles Kaart van Velmara",  glyph: "🗺️", icon: "item_kaart.png",      description: "Handgetekend, met prachtige arceringen. De ruïne van Aster-Hal staat er met rode inkt op aangegeven." },
    sleutel:    { name: "Maanzilveren Sleutel",      glyph: "🗝️", icon: "item_sleutel.png",    description: "Een sleutel van metaal dat het licht vasthoudt alsof het water is. Ooit van Agnes Velm." },
    dagboek:    { name: "Dagboek van Agnes Velm",    glyph: "📔", icon: "item_dagboek.png",    description: "Een schrift met gelinieerd papier — uit jouw wereld. Vol schetsen, notities en een boodschap voor wie na haar komt." }
  },

  /* ------------------------------------------------------------------ */
  loreCategories: ["Wereld", "Locaties", "Geschiedenis", "Het Lied", "Geheimen"],

  lore: {
    kompas:        { category: "Geheimen",     title: "Het kompas uit het archief", text: "Een bronzen kompas, gevonden in een doos zonder inventarisnummer met het etiket ‘Nalatenschap A. Velm — niet openen vóór de lantaarns flakkeren’. De naald wees je de weg naar een deur die er eerst niet was." },
    velmara:       { category: "Wereld",       title: "Velmara", text: "Een land van eeuwenoude wouden, rivierdorpen en vergeten ruïnes. Al het licht in Velmara — van lantaarns tot zonsopkomst — wordt gevoed door de Lichtstroom." },
    dwalers:       { category: "Wereld",       title: "Dwalers", text: "Zo noemen de bewoners van Velmara mensen die van ‘de andere kant’ komen. Ze verschijnen zelden, altijd onaangekondigd, en volgens de liedjes nooit zonder reden. De meeste liedjes eindigen goed. De meeste." },
    lichtstroom:   { category: "Wereld",       title: "De Lichtstroom", text: "Een onzichtbare stroom van licht die vanuit de Sterrenbron via wortels, rivieren en lantaarns door heel Velmara vloeit. Al maanden wordt hij zwakker: lantaarns flakkeren, en de bomen van het Fluisterwoud zijn opgehouden met zingen." },
    nachtbloei:    { category: "Wereld",       title: "De Nachtbloei", text: "Een zeldzame bloem die alleen in het Fluisterwoud groeit en zilverig licht geeft. Zestig jaar geleden zette Agnes Velm er een op de bar van een jonge Odile." },
    fluisterwoud:  { category: "Locaties",     title: "Het Fluisterwoud", text: "Een oeroud woud waarvan men zegt dat de bomen de herinneringen van de Wachters bewaren. Vroeger zongen ze; nu fluisteren ze alleen nog — over een poort in een stenen hal, en een lied in drie stemmen." },
    brugvoort:     { category: "Locaties",     title: "Brugvoort & De Gouden Lantaarn", text: "Een rivierdorp van scheve daken en houten bruggetjes. Het hart van het dorp is De Gouden Lantaarn, de taverne van Odile, waar elke avond bij sluitingstijd een lied wordt gezongen dat niemand meer begrijpt." },
    aster_hal:     { category: "Locaties",     title: "Aster-Hal", text: "De ruïne van het paleis van de Wachters. Diep onder de gebroken zuilen ligt een Poort die alleen opengaat voor wie de sleutel draagt én het hele lied kent." },
    wachters:      { category: "Geschiedenis", title: "De Wachters", text: "Geen koningen en geen tovenaars, maar hoeders. Eeuwenlang zorgden ze vanuit Aster-Hal dat de Lichtstroom door het hele land bleef vloeien. Driehonderd jaar geleden viel de laatste Wachter in een stenen slaap." },
    sterrenbron:   { category: "Geschiedenis", title: "De Sterrenbron", text: "De oorsprong van al het licht in Velmara: een bron achter de Poort van Aster-Hal. Ze moet ‘gedragen’ worden door een hart dat haar licht kiest. Zonder drager dooft ze langzaam uit." },
    ilvaren:       { category: "Geschiedenis", title: "Ilvaren, de laatste Wachter", text: "De stenen bewaker van de Poort was ooit Ilvaren, de laatste Wachter van Aster-Hal. Toen het licht begon te doven, werd zijn lichaam steen. Jouw lied heeft hem gewekt." },
    lied_vers1:    { category: "Het Lied",     title: "Vers van het Woud", text: "Gevonden op de wachterstenen in het Fluisterwoud, onder een teken van een boom — ‘het eerste van drie’:\n\n“Wat het woud fluistert, onthoudt de wortel.”" },
    lied_vers2:    { category: "Het Lied",     title: "Vers van de Reiziger", text: "Gezongen door de stamgasten van De Gouden Lantaarn bij sluitingstijd, als tweede couplet:\n\n“Wat de lantaarn draagt, deelt de reiziger.”" },
    lied_vers3:    { category: "Het Lied",     title: "Vers van de Steen", text: "Ontwaakt in de zuilen van Aster-Hal, onder een teken van een poort — ‘het laatste van drie’:\n\n“Wat de steen bewaart, ontwaakt voor de dwaler.”" },
    agnes:         { category: "Geheimen",     title: "Agnes Velm", text: "Een dwaler die zestig jaar geleden in Velmara verscheen en de laatste leerling van de Wachters werd. Toen het licht begon te flakkeren, keerde ze terug naar haar eigen wereld en liet haar kompas achter voor wie na haar zou komen.\n\nIn haar dagboek schreef ze: ‘Begin met wat het woud fluistert. Volg met wat de reiziger deelt. Eindig met wat de steen bewaart. De Poort vraagt niet om een offer, maar om een keuze.’" },
    fenn_verleden: { category: "Geheimen",     title: "Fenns lantaarn", text: "De dwaallicht-lantaarn was van Fenns moeder, de vorige woudwachter. Ze ging naar Aster-Hal om de Lichtstroom te herstellen en keerde nooit terug. Alleen haar lantaarn kwam thuis." },
    fenn_moeder:   { category: "Geheimen",     title: "Het licht van een woudwachter", text: "Volgens Ilvaren kon Fenns moeder de Poort niet openen, maar gaf ze haar eigen licht aan de Bron, zodat Velmara langer kon branden. Ze leeft voort in elke lantaarn die nog gloeit." },
    odile_verleden:{ category: "Geheimen",     title: "Odiles onafgemaakte kaart", text: "Odile was ooit de beste cartograaf van Velmara. Ze daalde af tot de Poort van Aster-Hal, hoorde iets ademen achter de deur, en vluchtte. Haar laatste kaart heeft ze nooit afgemaakt." }
  },

  /* ------------------------------------------------------------------ */
  locations: {
    forest: {
      name: "Het Fluisterwoud",
      subtitle: "Het Mysterieuze Bos",
      background: "forest",
      mapPos: { x: 27, y: 56 },
      unlockedAtStart: true,
      description: [
        { if: { flag: "gate_open" }, text: "Het woud klinkt anders sinds de Poort openging. Tussen het fluisteren door hoor je af en toe iets dat bijna een melodie is." },
        { text: "Mist hangt tussen eeuwenoude stammen. Dwaallichtjes zweven langs het pad, en ergens tussen de bomen staan oude stenen in een kring." }
      ],
      arrive: [
        { scene: "ch1_arrival", once: true }
      ],
      present: [
        { char: "fenn", expr: "neutral", pos: "right", if: { notFlag: "fenn_at_ruins" } }
      ],
      actions: [
        { id: "talk_fenn", label: "Praat met Fenn",              icon: "talk",  scene: "forest_fenn", if: { notFlag: "fenn_at_ruins" } },
        { id: "stones",    label: "Onderzoek de stenen kring",   icon: "look",  scene: "forest_stones" },
        { id: "listen",    label: "Luister naar het fluisteren", icon: "ear",   scene: "forest_listen", once: true },
        { id: "flower",    label: "Pluk de gloeiende bloem",     icon: "hand",  scene: "forest_flower", once: true }
      ]
    },

    tavern: {
      name: "De Gouden Lantaarn",
      subtitle: "De Taverne van Brugvoort",
      background: "tavern",
      mapPos: { x: 47, y: 69 },
      description: "Warm licht, de geur van appelcider en vers brood, en het geroezemoes van reizigers. Achter de bar houdt Odile alles en iedereen scherp in de gaten.",
      arrive: [
        { scene: "tavern_arrival", once: true }
      ],
      present: [
        { char: "odile", expr: "neutral", pos: "right" }
      ],
      actions: [
        { id: "talk_odile", label: "Praat met Odile",                       icon: "talk", scene: "tavern_odile" },
        { id: "help",       label: "Help Odile achter de bar",              icon: "hand", scene: "tavern_help", once: true },
        { id: "song",       label: "Blijf tot sluitingstijd en luister",    icon: "ear",  scene: "tavern_song", once: true },
        { id: "gift",       label: "Geef Odile de nachtbloei",              icon: "gift", scene: "tavern_gift", once: true, if: { item: "nachtbloem" } },
        { id: "tell",       label: "Vertel Odile wat er achter de Poort ligt", icon: "talk", scene: "tavern_tell", once: true, if: { flag: "gate_open" } }
      ]
    },

    ruins: {
      name: "De Oude Ruïne",
      subtitle: "Aster-Hal",
      background: "ruins",
      mapPos: { x: 73, y: 33 },
      description: "Gebroken zuilen steken als botten uit het gras. Klimop kruipt over vergeten beelden, en diep onder de ruïne gloeit iets — heel zwak, als een hartslag.",
      arrive: [
        { scene: "ruins_arrival", once: true }
      ],
      present: [
        { char: "fenn", expr: "neutral", pos: "right", if: { flag: "fenn_at_ruins" } }
      ],
      actions: [
        { id: "inscription", label: "Lees de inscripties op de zuilen",   icon: "look", scene: "ruins_inscription" },
        { id: "library",     label: "Doorzoek de ingestorte bibliotheek", icon: "hand", scene: "ruins_library", once: true },
        { id: "talk_fenn",   label: "Praat met Fenn",                     icon: "talk", scene: "ruins_fenn", once: true, if: { flag: "fenn_at_ruins" } },
        { id: "gate",        label: "Daal af naar de Poort",              icon: "door", scene: "ruins_gate", if: { notFlag: "gate_open" } },
        { id: "gate_open",   label: "Spreek met de Wachter",              icon: "talk", scene: "ruins_wachter", if: { flag: "gate_open" } }
      ]
    },

    starwell: {
      name: "De Sterrenbron",
      subtitle: "Achter de Poort",
      background: "starwell",
      mapPos: { x: 84, y: 17 },
      description: "Een meer vol sterren onder een hemel vol sterren. In het midden flakkert de Bron, als een kaarsvlam die bijna uitgaat.",
      arrive: [
        { scene: "finale" }
      ],
      actions: []
    }
  },

  /* ------------------------------------------------------------------ */
  endings: {
    wachter: {
      title: "De Nieuwe Wachter",
      background: "starwell",
      text: [
        "Het licht van de Sterrenbron stroomt door je heen, en het voelt niet als een last. Het voelt als thuiskomen.",
        "In de weken die volgen beginnen de bomen van het Fluisterwoud weer te zingen. Fenn komt elke ochtend langs met verse appels en verhalen over het woud. Odile maakt haar kaart van Aster-Hal eindelijk af — helemaal onderaan, in kleine, zorgvuldige letters: ‘Hier woont {name}, de Wachter.’",
        "En ergens, in een andere wereld, staat in een stadsarchief een doos zonder barcode te wachten op de volgende dwaler."
      ]
    },
    thuis: {
      title: "Terug, maar Anders",
      background: "archive",
      text: [
        "Je opent je ogen. De tl-buis zoemt. Het is 16:59 op een dinsdag, en de regen tikt tegen de ramen.",
        "Het kompas is weg. Maar op je bureau ligt een bleke bloem die zacht zilverlicht geeft, en aan je vingers kleeft inkt die je je niet herinnert te hebben gebruikt.",
        "De volgende ochtend schrijf je je in voor een opleiding cartografie. Soms, als het regent, hoor je in het archief een zacht fluisteren. Dan glimlach je, want je weet: ergens brandt het licht weer — omdat jij er was."
      ]
    },
    brug: {
      title: "De Brug tussen Werelden",
      subtitle: "Geheim einde",
      background: "archive_door",
      text: [
        "De deur tussen kast 14 en kast 15 verdwijnt niet meer. Overdag ben je archivaris; ’s avonds draag je het licht van de Sterrenbron, dat nu door twee werelden stroomt in plaats van één.",
        "Je brengt Odile een set moderne tekenpennen mee — ze huilt er bijna van, al zal ze dat nooit toegeven. Fenn staat met open mond voor het raam van het archief en kijkt naar een stad vol elektrische lantaarns die nooit flakkeren.",
        "In het archief verschijnt een nieuwe collectie, met een etiket in jouw handschrift: ‘Nalatenschap van Velmara — openen wanneer je maar wilt.’"
      ]
    }
  },

  /* ==================================================================
   *  SCÈNES
   * ================================================================== */
  scenes: {

    /* ---------------------------- PROLOOG ---------------------------- */
    prologue: {
      background: "archive",
      locationName: "Het Stadsarchief",
      chapter: "Proloog",
      nodes: [
        { title: "Proloog", subtitle: "Een dinsdag zoals alle andere" },
        { narrate: "Regen tikt tegen de hoge ramen van het Stadsarchief. Het is 16:47 op een dinsdag, en de tl-buis boven je bureau zoemt al drie jaar dezelfde toon." },
        { show: "protagonist", expr: "neutral", pos: "left" },
        { think: "Nog dertien minuten. Nog één doos. Nog één stapel brieven van mensen die niemand zich herinnert." },
        { narrate: "Je naam is {name}. Je scant, nummert en archiveert. Elke dag. Ooit wilde je cartograaf worden — kaarten tekenen van plekken die nog niemand had gezien." },
        { say: "protagonist", text: "Kom op, {name}. Laatste doos." },
        { narrate: "Op de kar staat een doos die er vanochtend nog niet stond. Geen barcode. Geen inventarisnummer. Alleen een vergeeld etiket in sierlijk handschrift:" },
        { narrate: "*Nalatenschap A. Velm — niet openen vóór de lantaarns flakkeren.*" },
        { say: "protagonist", expr: "surprised", text: "…Vóór de lantaarns flakkeren? Wat is dat nou weer voor een instructie?" },
        { fx: "flicker", narrate: "Boven je hoofd flakkert de tl-buis. Eén keer. Twee keer." },
        { choice: [
          { text: "Open de doos. Nu meteen.", goto: "open", do: [{ stat: "moed", add: 1 }] },
          { text: "Bel eerst de conciërge — dit voelt niet pluis.", goto: "call" },
          { text: "Doe alsof je niets zag en pak je jas.", goto: "ignore" }
        ] },

        { label: "call", say: "protagonist", expr: "worried", text: "Hallo, Dirk? Er staat hier een doos zonder—" },
        { narrate: "De lijn kraakt. Dan hoor je geen Dirk, maar iets dat klinkt als wind door bladeren. Een fluistering, net niet verstaanbaar." },
        { say: "protagonist", expr: "surprised", text: "…Dirk?" },
        { narrate: "Je legt de hoorn neer. Je handen trillen een beetje. Achter je klinkt een zacht *klik*: het deksel van de doos ligt op de grond." },
        { goto: "found" },

        { label: "ignore", narrate: "Je trekt je jas aan en loopt naar de deur. Achter je klinkt een zacht *klik*." },
        { think: "Niet omdraaien. Gewoon naar huis. Soep. Serie. Bed.", expr: "worried" },
        { narrate: "Je draait je om. Natuurlijk draai je je om. Het deksel ligt op de grond." },
        { goto: "found" },

        { label: "open", say: "protagonist", expr: "determined", text: "Wie niet waagt…" },
        { narrate: "Het deksel geeft mee alsof het al jaren op je heeft gewacht." },

        { label: "found", narrate: "In de doos ligt, op een bedje van verdroogde bloemblaadjes, een bronzen kompas. Het glas is gebarsten, maar de naald draait — niet naar het noorden, maar langzaam en zoekend, alsof ze iets probeert te herinneren.", do: [{ item: "kompas" }, { lore: "kompas" }] },
        { say: "protagonist", expr: "surprised", text: "Hij… zoemt." },
        { narrate: "De naald komt tot stilstand. Ze wijst naar de kale muur tussen kast 14 en kast 15. Een muur waar je al drie jaar elke dag langsloopt." },
        { bg: "archive_door", fx: "flash" },
        { narrate: "Waar de muur was, staat nu een deur. Oud hout, ijzeren beslag, en door de kieren valt licht dat niet van deze wereld lijkt — warm als een zomeravond en tegelijk koel als maanlicht op water." },
        { choice: [
          { text: "Stap erdoorheen. Dit is waar je altijd op gewacht hebt.", goto: "brave", do: [{ stat: "moed", add: 1 }] },
          { text: "Raak alleen even voorzichtig de klink aan…", goto: "careful" }
        ] },

        { label: "brave", say: "protagonist", expr: "determined", text: "Als dit een droom is, dan wil ik niet wakker worden." },
        { goto: "portal" },

        { label: "careful", say: "protagonist", expr: "worried", text: "Alleen even kijken. Even maar…" },
        { narrate: "Je vingers raken het koele ijzer van de klink. De deur zwaait open — en het licht trekt je mee als een getijde." },

        { label: "portal", narrate: "Het enige wat je bij je hebt: een kompas, en het toegangspasje van het archief dat nog aan je trui bungelt.", do: [{ item: "archiefpas" }] },
        { fx: "flash", hide: "all", narrate: "Het archief valt weg. De regen, de tl-buis, de dinsdag — alles wordt licht." },
        { scene: "ch1_arrival" }
      ]
    },

    /* -------------------------- HOOFDSTUK 1 -------------------------- */
    ch1_arrival: {
      location: "forest",
      background: "forest",
      chapter: "Hoofdstuk 1 — Het Fluisterwoud",
      nodes: [
        { title: "Hoofdstuk 1", subtitle: "Het Fluisterwoud" },
        { narrate: "Je wordt wakker op een bed van mos. Boven je reiken bomen zo hoog dat hun kruinen in de mist verdwijnen. Tussen de stammen dwarrelen lichtjes — geen vuurvliegjes, iets ouders." },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { say: "protagonist", text: "Oké. Oké oké oké. Dit is geen archief." },
        { narrate: "Het woud fluistert. Niet zoals wind — zoals stemmen. Duizend zachte stemmen die net te ver weg zijn om te verstaan." },
        { say: "stem", text: "…een dwaler… een dwaler met het kompas…" },
        { say: "protagonist", expr: "worried", text: "Wie is daar?" },
        { show: "fenn", expr: "suspicious", pos: "right" },
        { narrate: "Een jongeman stapt uit de schaduw. Groene mantel, een lantaarn aan zijn riem, en ogen die je opnemen zoals een vos een vreemd geluid opneemt." },
        { say: "fenn", text: "Dat zou ik jou willen vragen. Niemand komt zomaar het Fluisterwoud binnen. Zeker niet in… wat dát ook mag zijn wat je draagt." },
        { say: "fenn", expr: "neutral", text: "Ik ben Fenn, woudwachter van Brugvoort. En jij bent?" },
        { choice: [
          { text: "“Ik ben {name}. Ik kom… van ergens anders. Door een deur in een archief.”", goto: "honest", do: [{ stat: "fenn", add: 1 }, { flag: "told_truth" }] },
          { text: "“Een verdwaalde toerist. Is hier ergens een bushalte?”", goto: "joke" },
          { text: "“Eerst jij. Waar ben ik, en waarom fluisteren die bomen?”", goto: "demand", do: [{ stat: "moed", add: 1 }] }
        ] },

        { label: "honest", say: "fenn", expr: "surprised", text: "Een deur? In een… archief?" },
        { say: "fenn", expr: "neutral", text: "Je bent óf gek, óf je spreekt de waarheid. En gekken kijken meestal niet zo bang.", do: [{ lore: "dwalers" }] },
        { goto: "compass" },

        { label: "joke", say: "fenn", expr: "neutral", text: "Een bus… halte." },
        { say: "fenn", expr: "smile", text: "Geen idee wat dat is, maar je zegt het alsof het een grap is. Goed, hou je geheimen maar." },
        { say: "protagonist", expr: "happy", text: "{name}. Ik heet {name}. En nee, ik heb echt geen idee waar ik ben." },
        { goto: "compass" },

        { label: "demand", say: "fenn", expr: "smile", text: "Pittig." },
        { say: "fenn", expr: "neutral", text: "Je bent in het Fluisterwoud, in het land Velmara. En de bomen fluisteren omdat ze bang zijn. Al maanden.", do: [{ lore: "velmara" }] },
        { say: "protagonist", expr: "determined", text: "Ik ben {name}. Bedankt voor het eerlijke antwoord." },

        { label: "compass", narrate: "Het kompas in je hand begint te gloeien. Fenns ogen worden groot." },
        { say: "fenn", expr: "surprised", text: "Dat… waar heb je dat vandaan?" },
        { say: "protagonist", expr: "neutral", text: "Het lag in een doos. Op mijn werk. Het wees me de weg hierheen." },
        { say: "fenn", expr: "neutral", text: "Een wachterskompas. Ik dacht dat die alleen bestonden in de verhalen van Odile." },
        { say: "fenn", text: "Luister. Het licht dat door Velmara stroomt — de Lichtstroom — sterft langzaam weg. De lantaarns flakkeren. En nu verschijnt er een dwaler met een kompas uit de oude verhalen.", do: [{ lore: "lichtstroom" }] },
        { choice: [
          { text: "“Dwaler? Is dat wat ik ben?”", goto: "q_dwaler" },
          { text: "“Kan ik terug naar huis?”", goto: "q_home" }
        ] },

        { label: "q_dwaler", say: "fenn", expr: "smile", text: "Zo noemen we mensen van de andere kant. Er zijn liedjes over jullie. De meeste eindigen goed.", do: [{ lore: "dwalers" }] },
        { say: "fenn", expr: "neutral", text: "…De meeste." },
        { goto: "odile" },

        { label: "q_home", say: "fenn", expr: "sad", text: "Dat weet ik niet. Echt niet. Maar als iemand het weet, is het Odile." },

        { label: "odile", say: "fenn", expr: "neutral", text: "In Brugvoort, net buiten het woud, ligt De Gouden Lantaarn. De taverne van Odile. Ze was vroeger cartograaf en ze kent elk oud verhaal dat Velmara rijk is." },
        { say: "protagonist", expr: "happy", text: "Een cartograaf? Echt?" },
        { say: "fenn", expr: "smile", text: "Je kijkt opeens een stuk minder bang." },
        { say: "fenn", expr: "neutral", text: "Ik blijf in de buurt van het pad. Kijk gerust rond — en als je wilt praten, weet je me te vinden.", do: [{ flag: "met_fenn" }, { unlock: "tavern" }] },
        { narrate: "Tip: in de bovenbalk vind je de *kaart* om te reizen, je *tas* en je *dagboek*. Onderzoek een locatie via de acties onderaan het scherm." },
        { end: true }
      ]
    },

    forest_fenn: {
      location: "forest",
      nodes: [
        { show: "fenn", expr: "neutral", pos: "right" },
        { say: "fenn", text: "Wat wil je weten, {name}?" },
        { goto: "choices" },
        { label: "menu2", say: "fenn", text: "Nog iets?" },
        { label: "choices", choice: [
          { text: "Vertel me over het Fluisterwoud.", goto: "forest_q", if: { notFlag: "asked_forest" } },
          { text: "Kun je me helpen die oude stenen te lezen?", goto: "lantern", if: { noItem: "lantaarn" } },
          { text: "Vertel eens iets over jezelf.", goto: "self", if: { notFlag: "fenn_story" } },
          { text: "Weet jij iets over Aster-Hal?", goto: "ruins", if: { flag: "heard_ruins", notFlag: "asked_ruins_fenn" } },
          { text: "Ik ga weer verder.", end: true }
        ] },

        { label: "forest_q", say: "fenn", text: "Het woud is ouder dan Brugvoort, ouder dan de koningen. Men zegt dat de bomen de herinneringen van de Wachters bewaren. Daarom fluisteren ze.", do: [{ flag: "asked_forest" }, { lore: "fluisterwoud" }, { lore: "velmara" }] },
        { say: "fenn", expr: "sad", text: "Vroeger zongen ze. Nu fluisteren ze alleen nog." },
        { goto: "menu2" },

        { label: "lantern", say: "fenn", expr: "suspicious", text: "Je wilt de wachterstenen lezen? Daar heb je meer voor nodig dan goede ogen." },
        { say: "fenn", expr: "neutral", text: "De runen verschijnen alleen in dwaallicht." },
        { narrate: "Hij haakt een kleine lantaarn van zijn riem. Binnenin zweeft een blauwgroen vlammetje, rusteloos als een vlinder." },
        { test: { stat: { fenn: 1 } }, goto: "lantern_warm", else: "lantern_plain" },
        { label: "lantern_warm", say: "fenn", expr: "smile", text: "Neem hem maar. Ik vertrouw je — al weet ik niet goed waarom.", do: [{ item: "lantaarn" }] },
        { goto: "menu2" },
        { label: "lantern_plain", say: "fenn", expr: "neutral", text: "Ik wil hem wel terug, dwaler. Hij is van mijn moeder geweest." },
        { say: "protagonist", expr: "determined", text: "Ik zal er goed op passen. Beloofd.", do: [{ item: "lantaarn" }] },
        { goto: "menu2" },

        { label: "self", test: { stat: { fenn: 1 } }, goto: "self_open", else: "self_closed" },
        { label: "self_closed", say: "fenn", expr: "suspicious", text: "Mezelf? Daar valt weinig over te vertellen." },
        { say: "fenn", expr: "neutral", text: "Vraag het me nog eens wanneer ik je wat beter ken." },
        { goto: "menu2" },
        { label: "self_open", say: "fenn", expr: "sad", text: "Mijn moeder was woudwachter vóór mij. Ze ging op een nacht naar Aster-Hal, de oude ruïne, omdat ze dacht dat ze de Lichtstroom kon herstellen." },
        { say: "fenn", text: "Ze kwam niet terug. Alleen haar lantaarn wel." },
        { say: "protagonist", expr: "worried", text: "Fenn… wat erg." },
        { choice: [
          { text: "“Als ik daar kom, zoek ik uit wat er met haar gebeurd is.”", goto: "self_end", do: [{ stat: "fenn", add: 1 }, { stat: "moed", add: 1 }] },
          { text: "“Dank je dat je me dit vertelt.”", goto: "self_end", do: [{ stat: "fenn", add: 1 }] }
        ] },
        { label: "self_end", say: "fenn", expr: "smile", text: "…Je bent een vreemde dwaler, {name}. Maar geen slechte.", do: [{ flag: "fenn_story" }, { flag: "heard_ruins" }, { lore: "fenn_verleden" }] },
        { goto: "menu2" },

        { label: "ruins", say: "fenn", expr: "neutral", text: "Aster-Hal. Het oude paleis van de Wachters, in het oosten. Blijf er weg als je verstandig bent.", do: [{ flag: "asked_ruins_fenn" }] },
        { say: "fenn", expr: "smile", text: "Maar jij bent niet verstandig, hè? Je bent een dwaler." },
        { goto: "menu2" }
      ]
    },

    forest_stones: {
      location: "forest",
      nodes: [
        { bg: "forest_stones" },
        { narrate: "Op een open plek staan zeven stenen in een kring, bedekt met mos. Het kompas in je zak trilt zachtjes." },
        { test: { item: "lantaarn" }, goto: "lit" },
        { narrate: "Je ziet vage krassen in de steen, maar in dit schemerlicht zijn het niet meer dan schaduwen." },
        { think: "Er staat iets. Ik weet het zeker. Maar ik kan het niet lezen. Misschien weet Fenn raad.", expr: "worried", do: [{ flag: "saw_stones" }] },
        { end: true },

        { label: "lit", test: { flag: "verse1" }, goto: "again" },
        { narrate: "Je houdt de lantaarn omhoog. Het dwaallicht flakkert — en één voor één beginnen de runen te gloeien, blauwgroen, als water dat het licht vangt." },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { say: "protagonist", text: "Ze veranderen… De tekens herschikken zich tot woorden die ik kan lezen!" },
        { narrate: "*Wat het woud fluistert, onthoudt de wortel.*" },
        { narrate: "Onder de regel staat een klein teken: een boom. Daarnaast drie stipjes, waarvan alleen de eerste oplicht. *Het eerste van drie.*", do: [{ lore: "lied_vers1" }, { flag: "verse1" }, { flag: "heard_ruins" }] },
        { say: "fenn", expr: "surprised", text: "Ik ben hier mijn hele leven al. Die stenen hebben nog nooit gegloeid.", if: { notFlag: "fenn_at_ruins" } },
        { choice: [
          { text: "“Zonder jouw lantaarn had ik dit nooit gezien. Dank je, Fenn.”", goto: "lit_end", do: [{ stat: "fenn", add: 1 }], if: { notFlag: "fenn_at_ruins" } },
          { text: "“Het eerste van drie… Waar zijn de andere twee?”", goto: "lit_end", do: [{ stat: "moed", add: 1 }] }
        ] },
        { label: "lit_end", say: "protagonist", expr: "determined", text: "Het klinkt als een regel uit een lied. Ik moet de rest vinden." },
        { end: true },

        { label: "again", narrate: "De runen gloeien nog zachtjes na: *Wat het woud fluistert, onthoudt de wortel.*" },
        { end: true }
      ]
    },

    forest_listen: {
      location: "forest",
      nodes: [
        { narrate: "Je sluit je ogen en luistert. Langzaam worden de fluisteringen helderder, alsof het woud merkt dat iemand eindelijk de moeite neemt." },
        { say: "stem", text: "…de poort… de poort in de stenen hal… drie stemmen… één lied…" },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { say: "protagonist", text: "Een poort? Welke stenen hal?" },
        { say: "stem", text: "…Aster-Hal… het licht… wacht…", do: [{ lore: "fluisterwoud" }, { flag: "heard_ruins" }, { stat: "moed", add: 1 }] },
        { think: "Drie stemmen, één lied. Dat moet ik onthouden.", expr: "determined" },
        { end: true }
      ]
    },

    forest_flower: {
      location: "forest",
      nodes: [
        { narrate: "Aan de voet van een oude eik bloeit een bloem met bleke, bijna doorzichtige blaadjes. Ze geeft zacht zilverlicht, alsof ze een stukje maan heeft ingeslikt." },
        { show: "protagonist", expr: "happy", pos: "left" },
        { think: "Wat mooi. Die neem ik voorzichtig mee.", do: [{ item: "nachtbloem" }, { lore: "nachtbloei" }] },
        { say: "fenn", expr: "smile", text: "Een nachtbloei. Die zie je niet vaak meer. Ken jij iemand die van mooie dingen houdt? Odile misschien.", if: { notFlag: "fenn_at_ruins" } },
        { end: true }
      ]
    },

    /* -------------------------- HOOFDSTUK 2 -------------------------- */
    tavern_arrival: {
      location: "tavern",
      background: "tavern",
      chapter: "Hoofdstuk 2 — De Gouden Lantaarn",
      nodes: [
        { title: "Hoofdstuk 2", subtitle: "De Gouden Lantaarn" },
        { narrate: "Brugvoort is een dorpje van scheve daken en houten bruggetjes over een kabbelende rivier. Op het plein hangt een uithangbord met een gouden lantaarn — die, valt je op, nauwelijks nog brandt.", do: [{ lore: "brugvoort" }] },
        { narrate: "Binnen is het warm en vol. Een barde stemt haar luit, twee handelaars kibbelen over de prijs van paddenstoelen, en achter de bar staat een vrouw met zilvergrijs haar en een blik als een havik." },
        { show: "protagonist", expr: "neutral", pos: "left" },
        { show: "odile", expr: "neutral", pos: "right" },
        { say: "odile", text: "Nou kijk. Een nieuw gezicht. En wat voor een." },
        { say: "odile", expr: "surprised", text: "Wat dráág je, kind? Is dat… stof met een rits?" },
        { say: "protagonist", expr: "worried", text: "Het is een trui. Hij was in de uitverkoop." },
        { say: "odile", expr: "laugh", text: "Ha! Een dwaler. Dat ik dat nog mag meemaken." },
        { say: "protagonist", expr: "surprised", text: "Hoe weet u—" },
        { say: "odile", expr: "neutral", text: "Niemand in Velmara draagt zulke rare kleren. En niemand kijkt zo rond als jij: alsof alles tegelijk betoverend en onmogelijk is. Ik ben Odile. Ga zitten. Wat mag het zijn?" },
        { choice: [
          { text: "“Iets warms, alstublieft. Het was een lange dag. En een rare.”", goto: "warm", do: [{ stat: "odile", add: 1 }] },
          { text: "“Ik heb geen geld. Of… geen geld van hier.”", goto: "nomoney" },
          { text: "“Geen tijd. Fenn zei dat u iets weet over een wachterskompas.”", goto: "direct", do: [{ stat: "moed", add: 1 }] }
        ] },

        { label: "warm", say: "odile", expr: "laugh", text: "Eerlijk antwoord. Daar hou ik van." },
        { narrate: "Ze schuift een dampende beker appelcider met kaneel naar je toe. Het smaakt naar herfst en thuiskomen." },
        { goto: "compass" },

        { label: "nomoney", say: "odile", expr: "neutral", text: "Dwalers hebben nooit geld. Het eerste kopje is van het huis. Het tweede verdien je maar." },
        { narrate: "Ze schuift een dampende beker appelcider met kaneel naar je toe." },
        { goto: "compass" },

        { label: "direct", say: "odile", expr: "serious", text: "Recht op het doel af. Zo." },
        { say: "odile", text: "Laat zien." },

        { label: "compass", narrate: "Je legt het kompas op de bar. Het geroezemoes in de taverne valt stil. De barde stopt midden in een akkoord." },
        { say: "odile", expr: "surprised", text: "Bij de zeven stenen…" },
        { say: "odile", expr: "serious", text: "Dat is het kompas van Agnes. Agnes Velm." },
        { say: "protagonist", expr: "surprised", text: "Velm? Dat stond op de doos! *Nalatenschap A. Velm.*" },
        { say: "odile", text: "Agnes was een dwaler, net als jij. Ze kwam zestig jaar geleden, toen ik nog een meisje was dat kaarten tekende op servetten. Ze werd de laatste leerling van de Wachters." },
        { say: "odile", expr: "neutral", text: "Toen het licht voor het eerst begon te flakkeren, ging ze terug naar haar eigen wereld. Ze zei dat het kompas vanzelf iemand nieuw zou vinden, wanneer het tijd was.", do: [{ lore: "wachters" }] },
        { say: "protagonist", expr: "determined", text: "En nu is het tijd." },
        { say: "odile", expr: "serious", text: "Lijkt er wel op. De Wachters woonden in Aster-Hal, de oude ruïne in het oosten. Achter hun Poort ligt de Sterrenbron, waar al het licht van Velmara vandaan komt." },
        { say: "odile", expr: "neutral", text: "Ik heb die ruïne ooit in kaart gebracht. Hier." },
        { narrate: "Ze haalt een opgerolde kaart onder de bar vandaan, de randen zacht van het vele gebruik. Je herkent meteen de hand van iemand die van haar vak hield.", do: [{ item: "kaart" }, { unlock: "ruins" }, { flag: "heard_ruins" }] },
        { say: "protagonist", expr: "happy", text: "Hij is prachtig. Die lijnvoering, die arceringen…" },
        { say: "odile", expr: "surprised", text: "Jij weet wat arceringen zijn?" },
        { say: "odile", expr: "laugh", text: "Misschien ben je toch niet helemaal hopeloos, dwaler." },
        { say: "odile", expr: "serious", text: "Maar luister goed: de Poort van Aster-Hal gaat niet zomaar open. Je hebt een sleutel nodig, en een lied. Over die sleutel praten we later — als ik weet wie je bent." },
        { end: true }
      ]
    },

    tavern_odile: {
      location: "tavern",
      nodes: [
        { show: "odile", expr: "neutral", pos: "right" },
        { label: "menu", say: "odile", text: "Nog iets, dwaler?" },
        { choice: [
          { text: "Wat weet u over het lied van de Poort?", goto: "song", if: { notFlag: "asked_song" } },
          { text: "Vertel me meer over de Wachters.", goto: "wachters", if: { notFlag: "asked_wachters" } },
          { text: "Over de sleutel van de Poort…", goto: "key", if: { noItem: "sleutel" } },
          { text: "Waarom bent u gestopt met kaarten tekenen?", goto: "story", showIf: { notFlag: "odile_story" }, if: { stat: { odile: 1 } }, showLocked: true, lockedHint: "Odile vertrouwt je nog niet genoeg." },
          { text: "Tot straks, Odile.", end: true }
        ] },

        { label: "song", say: "odile", text: "Elke avond bij sluitingstijd zingen de stamgasten een oud lied. Niemand weet meer waar het vandaan komt. Blijf eens tot het einde van de avond — en luister goed naar het tweede couplet.", do: [{ flag: "asked_song" }] },
        { goto: "menu" },

        { label: "wachters", say: "odile", expr: "serious", text: "Ze waren geen koningen en geen tovenaars. Ze waren hoeders. Ze zorgden dat het licht van de Sterrenbron door het hele land stroomde, via wortels, rivieren en lantaarns.", do: [{ flag: "asked_wachters" }, { lore: "wachters" }] },
        { say: "odile", expr: "neutral", text: "Toen de laatste Wachter in slaap viel, bleef alleen zijn stenen bewaker over. Dat zegt het verhaal tenminste." },
        { goto: "menu" },

        { label: "key", test: { stat: { odile: 2 } }, goto: "key_yes" },
        { say: "odile", expr: "serious", text: "De sleutel geef ik niet aan de eerste de beste dwaler die binnenwandelt. Ik ken je nog maar net.", do: [{ flag: "key_refused" }] },
        { say: "odile", expr: "neutral", text: "Steek eens een handje toe in de zaak. Of verras me. Dan leer ik je wel kennen." },
        { goto: "menu" },
        { label: "key_yes", say: "odile", expr: "serious", text: "…Ja. Ik denk dat je er klaar voor bent." },
        { narrate: "Ze maakt een kettinkje los van haar hals. Eraan hangt een sleutel van zilverig metaal dat het licht vasthoudt alsof het water is." },
        { say: "odile", expr: "neutral", text: "Maanzilver. Agnes gaf hem aan mij voordat ze vertrok. Ze zei: *Geef hem aan wie het kompas draagt — en je hart.*", do: [{ item: "sleutel" }] },
        { say: "protagonist", expr: "determined", text: "Ik zal haar — en u — niet teleurstellen." },
        { say: "odile", expr: "laugh", text: "Dat weet ik, kind. En zeg toch eens ‘je’ tegen me." },
        { goto: "menu" },

        { label: "story", say: "odile", expr: "serious", text: "Omdat ik ooit Aster-Hal binnenging om mijn laatste kaart af te maken. De diepste zaal. De Poort." },
        { say: "odile", text: "Ik hoorde iets ademen achter die deur. Iets groots en ouds. En ik rende. Ik heb sindsdien geen kaart meer afgemaakt." },
        { say: "protagonist", expr: "worried", text: "Dat is niets om je voor te schamen." },
        { say: "odile", expr: "neutral", text: "Misschien niet. Maar het voelt wel zo. Als jij die Poort opent… vertel me dan wat erachter zit. Dan kan ik mijn kaart eindelijk afmaken.", do: [{ flag: "odile_story" }, { lore: "odile_verleden" }, { stat: "odile", add: 1 }] },
        { goto: "menu" }
      ]
    },

    tavern_help: {
      location: "tavern",
      nodes: [
        { narrate: "Odile gooit je een schort toe. „Tafel drie wil cider, tafel vijf wil iets sterks en de barde wil… nou ja, vraag het haar zelf maar.”" },
        { say: "odile", expr: "neutral", text: "Laat maar eens zien wat je kunt, dwaler." },
        { show: "protagonist", expr: "worried", pos: "left" },
        { narrate: "De twee handelaars aan tafel vijf kibbelen nog steeds. De ene beweert dat de paddenstoelen uit het Fluisterwoud magisch zijn, de andere dat ze gewoon smerig zijn." },
        { choice: [
          { text: "Breng ze twee cider en zeg dat het van het huis is.", goto: "peace", do: [{ stat: "odile", add: 1 }] },
          { text: "Mengel je in de discussie: paddenstoelen zijn fascinerend!", goto: "debate", do: [{ stat: "moed", add: 1 }] },
          { text: "Geef ze de sterkste drank van de kaart, dan zijn ze zo stil.", goto: "strong" }
        ] },

        { label: "peace", narrate: "De handelaars kijken verrast op, heffen hun beker naar je, en binnen een minuut lachen ze samen om iets wat jij niet verstaat." },
        { say: "odile", expr: "laugh", text: "Slim. Je verkoopt vrede voor de prijs van twee cider. Beste deal van de avond." },
        { goto: "done" },

        { label: "debate", say: "protagonist", expr: "happy", text: "Wisten jullie dat sommige paddenstoelen in mijn wereld licht geven? En dat ze onder de grond met elkaar praten?" },
        { narrate: "Twintig minuten later zijn de handelaars het voor het eerst in jaren met elkaar eens: jij bent heel vreemd. Maar ze geven je wel een fooi." },
        { say: "odile", expr: "laugh", text: "Ze maken tenminste geen ruzie meer met elkaar. Ook een resultaat." },
        { goto: "done" },

        { label: "strong", say: "odile", expr: "serious", text: "Draakvuur? Aan déze twee? Wil je dat ik straks de vloer dweil?" },
        { narrate: "Je ruilt de fles snel om voor appelsap. Niemand merkt het verschil." },

        { label: "done", narrate: "Naarmate de avond vordert neurie je zelfs zachtjes mee met de barde. Voor het eerst in jaren voel je je niet onzichtbaar.", do: [{ flag: "helped_tavern" }] },
        { say: "odile", expr: "neutral", text: "Niet slecht, {name}. Helemaal niet slecht." },
        { end: true }
      ]
    },

    tavern_song: {
      location: "tavern",
      nodes: [
        { narrate: "Bij sluitingstijd gaan de stoelen aan de kant. De barde slaat een akkoord aan, en de hele taverne — handelaars, boeren, zelfs de chagrijnige smid — zingt mee, zacht en een beetje vals." },
        { narrate: "Bij het tweede couplet worden de stemmen stiller, bijna eerbiedig:" },
        { narrate: "*Wat de lantaarn draagt, deelt de reiziger.*", do: [{ lore: "lied_vers2" }, { flag: "verse2" }] },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { think: "Hetzelfde ritme als de runen in het woud! Dit is het tweede vers.", if: { flag: "verse1" } },
        { think: "Dat klinkt niet als een gewoon drinklied. Het klinkt als een sleutel.", if: { notFlag: "verse1" } },
        { say: "odile", expr: "neutral", text: "Mooi, hè? Niemand weet meer waarom we het zingen. Maar we stoppen er nooit mee." },
        { end: true }
      ]
    },

    tavern_gift: {
      location: "tavern",
      nodes: [
        { show: "protagonist", expr: "happy", pos: "left" },
        { say: "protagonist", text: "Odile, ik vond dit in het Fluisterwoud. Ik dacht… misschien vind je hem mooi." },
        { say: "odile", expr: "surprised", text: "Een nachtbloei… Die heb ik niet meer gezien sinds…" },
        { say: "odile", expr: "neutral", text: "Sinds Agnes er een op deze bar zette. Zestig jaar geleden." },
        { say: "odile", expr: "laugh", text: "Je bent een rare, {name}. Een goede rare.", do: [{ removeItem: "nachtbloem" }, { stat: "odile", add: 2 }, { flag: "gave_flower" }] },
        { end: true }
      ]
    },

    tavern_tell: {
      location: "tavern",
      nodes: [
        { show: "protagonist", expr: "determined", pos: "left" },
        { say: "protagonist", text: "Ik heb de Poort geopend, Odile. Wat je hoorde ademen, was geen monster. Het was een Wachter. Ilvaren. Hij wachtte al driehonderd jaar." },
        { say: "odile", expr: "surprised", text: "Een… Wachter?" },
        { say: "protagonist", expr: "happy", text: "En erachter ligt een meer vol sterren. Ik zal het voor je beschrijven. Elke steen, elke oever. Dan kun je je kaart afmaken." },
        { say: "odile", expr: "laugh", text: "Zestig jaar heb ik me geschaamd voor een ademhaling. Kind, je hebt geen idee wat je me net gegeven hebt.", do: [{ stat: "odile", add: 1 }, { flag: "told_odile" }] },
        { end: true }
      ]
    },

    /* -------------------------- HOOFDSTUK 3 -------------------------- */
    ruins_arrival: {
      location: "ruins",
      background: "ruins",
      chapter: "Hoofdstuk 3 — De Oude Ruïne",
      nodes: [
        { title: "Hoofdstuk 3", subtitle: "De Oude Ruïne" },
        { narrate: "Odiles kaart leidt je over heuvels en door een vallei waar het gras zilver kleurt in de schemering. Dan, op een rotsplateau: Aster-Hal." },
        { narrate: "Ooit moet het een paleis van licht zijn geweest. Nu is het een skelet van zuilen en bogen, scherp afgetekend tegen een hemel van paars en goud." },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { think: "Het is groter dan op de kaart. En stiller." },
        { test: { stat: { fenn: 2 } }, goto: "fenn_joins" },
        { think: "Alleen dan maar. Ik heb drie jaar alleen in een archief gezeten; een ruïne kan er ook nog wel bij.", expr: "determined" },
        { goto: "rest" },

        { label: "fenn_joins", show: "fenn", expr: "smile", pos: "right" },
        { say: "fenn", text: "Dacht je echt dat ik je hier alleen naartoe liet gaan?" },
        { say: "protagonist", expr: "happy", text: "Fenn! Hoe wist je—" },
        { say: "fenn", expr: "neutral", text: "Het woud fluistert, weet je nog? Het kon niet ophouden over jou.", do: [{ flag: "fenn_at_ruins" }] },
        { say: "fenn", expr: "smile", text: "En je vergat iets. Zonder dwaallicht zie je hier geen hand voor ogen. Neem mijn lantaarn maar.", if: { noItem: "lantaarn" }, do: [{ item: "lantaarn" }] },

        { label: "rest", narrate: "Het kompas trekt aan je hand. De naald wijst omlaag — naar de diepte van de ruïne." },
        { end: true }
      ]
    },

    ruins_inscription: {
      location: "ruins",
      nodes: [
        { test: { item: "lantaarn" }, goto: "lit" },
        { narrate: "In de zuilen zijn tekens gekerfd, half uitgewist door eeuwen van wind en regen. In dit licht kun je er niets van maken." },
        { think: "Als ik maar meer licht had. Of het júíste licht.", expr: "worried" },
        { end: true },

        { label: "lit", test: { flag: "verse3" }, goto: "again" },
        { narrate: "Het dwaallicht van de lantaarn strijkt over de stenen. De runen ontwaken — eerst één, dan tien, dan honderden: een spiraal van licht die om de zuilen heen draait." },
        { narrate: "In het midden van de spiraal, groter dan de rest:" },
        { narrate: "*Wat de steen bewaart, ontwaakt voor de dwaler.*" },
        { narrate: "Eronder een klein teken van een poort, en drie stipjes. Alleen de laatste licht op. *Het laatste van drie.*", do: [{ lore: "lied_vers3" }, { lore: "aster_hal" }, { flag: "verse3" }] },
        { say: "fenn", expr: "surprised", text: "Ontwaakt voor de dwaler… Dat ben jij, {name}.", if: { flag: "fenn_at_ruins" } },
        { end: true },

        { label: "again", narrate: "De spiraal van runen gloeit nog na: *Wat de steen bewaart, ontwaakt voor de dwaler.*" },
        { end: true }
      ]
    },

    ruins_library: {
      location: "ruins",
      nodes: [
        { narrate: "Een half ingestorte zaal vol vermolmde boekenplanken. De meeste boeken zijn tot stof vergaan, maar op een stenen lezenaar ligt een schrift, opvallend goed bewaard." },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { say: "protagonist", text: "Dit is gelinieerd papier. Uit míjn wereld." },
        { narrate: "Op de eerste pagina, in hetzelfde sierlijke handschrift als op de doos in het archief: *Dagboek van Agnes Velm.*", do: [{ item: "dagboek" }] },
        { narrate: "Je bladert. Schetsen van het Fluisterwoud. Een tekening van een jonge Odile met inkt op haar neus. En op de laatste bladzijde:" },
        { narrate: "*Aan wie na mij komt: het lied van de Poort heeft drie regels. Begin met wat het woud fluistert. Volg met wat de reiziger deelt. Eindig met wat de steen bewaart. En onthoud — de Poort vraagt niet om een offer, maar om een keuze.*", do: [{ lore: "agnes" }, { flag: "read_diary" }] },
        { say: "protagonist", expr: "determined", text: "Geen offer, maar een keuze… Wat bedoelde je, Agnes?" },
        { end: true }
      ]
    },

    ruins_fenn: {
      location: "ruins",
      nodes: [
        { show: "fenn", expr: "sad", pos: "right" },
        { say: "fenn", text: "Mijn moeder is hier ook geweest. Ik voel het. Alsof ze net de kamer uit is gelopen." },
        { choice: [
          { text: "“We vinden antwoorden. Samen.”", goto: "together", do: [{ stat: "fenn", add: 1 }] },
          { text: "“Wil je liever buiten wachten?”", goto: "outside" }
        ] },
        { label: "together", say: "fenn", expr: "smile", text: "Samen. Ja. Dat klinkt goed." },
        { end: true },
        { label: "outside", say: "fenn", expr: "neutral", text: "Nee. Ik ben lang genoeg weggebleven." },
        { end: true }
      ]
    },

    ruins_gate: {
      location: "ruins",
      nodes: [
        { bg: "ruins_gate" },
        { narrate: "Een wenteltrap voert je diep onder de ruïne, naar een ronde zaal. In de verste wand: een enorme stenen deur, bedekt met cirkels van runen. In het midden een smal, zilverig sleutelgat." },
        { show: "wachter", expr: "dormant", pos: "center" },
        { narrate: "Voor de deur staat een reusachtig stenen beeld, het hoofd gebogen. Een Wachter. Of wat er nog van over is." },
        { test: { item: "sleutel", flag: ["verse1", "verse2", "verse3"] }, goto: "ready" },

        { say: "wachter", text: "…nog… niet… dwaler…" },
        { narrate: "Het sleutelgat blijft donker. Er ontbreekt een sleutel.", if: { noItem: "sleutel" } },
        { narrate: "Een runencirkel in de vorm van een boom blijft dof.", if: { notFlag: "verse1" } },
        { narrate: "Een runencirkel in de vorm van een lantaarn blijft dof.", if: { notFlag: "verse2" } },
        { narrate: "Een runencirkel in de vorm van een poort blijft dof.", if: { notFlag: "verse3" } },
        { think: "Ik moet terug. Er ontbreekt nog iets. Misschien staat er iets in mijn dagboek.", expr: "worried" },
        { end: true },

        { label: "ready", scene: "gate_puzzle" }
      ]
    },

    gate_puzzle: {
      location: "ruins",
      background: "ruins_gate",
      nodes: [
        { show: "wachter", expr: "dormant", pos: "center" },
        { narrate: "Je steekt de maanzilveren sleutel in het slot. Hij draait vanzelf. De runencirkels lichten zwak op, en een diepe stem vult de zaal — niet in je oren, maar in je borst." },
        { say: "wachter", text: "ZING… DWALER… ZING HET LIED…" },

        { label: "q1", say: "wachter", text: "De eerste regel." },
        { choice: [
          { text: "“Wat de steen bewaart, ontwaakt voor de dwaler.”", goto: "wrong" },
          { text: "“Wat het woud fluistert, onthoudt de wortel.”", goto: "q2" },
          { text: "“Wat de lantaarn draagt, deelt de reiziger.”", goto: "wrong" }
        ] },

        { label: "q2", narrate: "De boomcirkel licht op in diep, levend groen." },
        { say: "wachter", text: "De tweede regel." },
        { choice: [
          { text: "“Wat de lantaarn draagt, deelt de reiziger.”", goto: "q3" },
          { text: "“Wat de steen bewaart, ontwaakt voor de dwaler.”", goto: "wrong" }
        ] },

        { label: "q3", narrate: "De lantaarncirkel gloeit warm goud." },
        { say: "wachter", text: "De laatste regel." },
        { choice: [
          { text: "“Wat de steen bewaart, ontwaakt voor de dwaler.”", goto: "solved" },
          { text: "“Wat het woud fluistert, onthoudt de wortel.”", goto: "wrong" }
        ] },

        { label: "wrong", fx: "shake", narrate: "De runen flakkeren en doven. Stof dwarrelt van het plafond." },
        { say: "wachter", text: "…NIET… DAT… OPNIEUW…" },
        { think: "Rustig. Denk na. Agnes schreef de volgorde op in haar dagboek.", expr: "worried", if: { flag: "read_diary" } },
        { think: "Rustig. Elk vers had een teken en een plaats: ‘het eerste van drie’, ‘het laatste van drie’… Ik kan het nalezen in mijn dagboek.", expr: "worried", if: { notFlag: "read_diary" } },
        { goto: "q1" },

        { label: "solved", fx: "flash", narrate: "De derde cirkel ontvlamt. De drie cirkels draaien, sneller en sneller, tot ze samenvallen in één ring van licht." },
        { show: "wachter", expr: "awakened", pos: "center" },
        { say: "wachter", text: "Eindelijk. Driehonderd jaar heb ik gewacht op een stem die het hele lied kende." },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { say: "protagonist", text: "U… praat. Gewoon. In hele zinnen." },
        { say: "wachter", expr: "warm", text: "Ik ben Ilvaren, de laatste Wachter van Aster-Hal. Of liever: wat er van hem over is. Mijn lichaam werd steen toen het licht begon te doven. Jouw lied heeft mij gewekt.", do: [{ lore: "ilvaren" }] },

        { show: "fenn", expr: "neutral", pos: "right", if: { flag: "fenn_at_ruins" } },
        { say: "fenn", text: "Ilvaren… weet u wat er met mijn moeder is gebeurd? Een woudwachter, met een lantaarn zoals deze.", if: { flag: "fenn_at_ruins" } },
        { say: "wachter", expr: "warm", text: "Zij kwam hier, jaren geleden. Ze kon de Poort niet openen, maar ze gaf haar eigen licht aan de Bron, zodat het land langer zou branden. Ze leeft voort in elke lantaarn die nog gloeit, jongen.", if: { flag: "fenn_at_ruins" }, do: [{ lore: "fenn_moeder" }, { flag: "fenn_closure" }] },
        { say: "fenn", expr: "sad", text: "…Dank u. Dat is meer dan ik ooit durfde te hopen.", if: { flag: "fenn_at_ruins" } },

        { say: "wachter", expr: "awakened", text: "Achter deze Poort ligt de Sterrenbron. Haar licht is bijna gedoofd. Er moet een keuze worden gemaakt, dwaler — dezelfde keuze waar Agnes ooit voor stond.", do: [{ lore: "sterrenbron" }] },
        { say: "protagonist", expr: "determined", text: "Dan ga ik erheen." },
        { say: "wachter", expr: "warm", text: "Ga wanneer je er klaar voor bent. Neem afscheid van wie je wilt. De Bron zal wachten — maar niet lang.", do: [{ flag: "gate_open" }, { unlock: "starwell" }] },
        { end: true }
      ]
    },

    ruins_wachter: {
      location: "ruins",
      nodes: [
        { bg: "ruins_gate" },
        { show: "wachter", expr: "warm", pos: "center" },
        { say: "wachter", text: "De Poort staat open, dwaler. De Sterrenbron is op je kaart te vinden — wanneer je hart er klaar voor is." },
        { say: "wachter", expr: "awakened", text: "Wie de Bron draagt, kiest. Denk aan wat Agnes schreef.", if: { flag: "read_diary" } },
        { end: true }
      ]
    },

    /* -------------------------- HOOFDSTUK 4 -------------------------- */
    finale: {
      location: "starwell",
      background: "starwell",
      chapter: "Hoofdstuk 4 — De Sterrenbron",
      nodes: [
        { title: "Hoofdstuk 4", subtitle: "De Sterrenbron" },
        { narrate: "Achter de Poort is geen zaal, maar een hemel. Je staat aan de oever van een meer zo stil dat de sterren er twee keer in schijnen. In het midden rijst de Bron op — een zuil van zachte gloed, dun als een kaarsvlam die bijna uitgaat." },
        { show: "protagonist", expr: "surprised", pos: "left" },
        { show: "wachter", expr: "warm", pos: "right" },
        { say: "wachter", text: "De Bron moet gedragen worden, door een hart dat haar licht kiest. Agnes kon die keuze niet maken — ze miste haar wereld te veel. Dus ging ze terug, en het licht begon te doven." },
        { say: "protagonist", expr: "worried", text: "En als ik die keuze maak?" },
        { say: "wachter", expr: "awakened", text: "Dan wordt Velmara weer licht. Maar wat je kiest, bindt je." },

        { hide: "wachter", if: { flag: "fenn_at_ruins" } },
        { show: "fenn", expr: "neutral", pos: "right", if: { flag: "fenn_at_ruins" } },
        { say: "fenn", text: "Wat je ook kiest, {name}… je hebt dit land al veranderd. En mij ook.", if: { flag: "fenn_at_ruins" } },

        { think: "Ik denk aan Odile, en aan haar onafgemaakte kaart.", if: { any: [{ flag: "odile_story" }, { flag: "told_odile" }] } },
        { narrate: "Het kompas in je hand trilt. De naald draait zoekend rond — naar het meer, naar de deur achter je, naar iets daartussenin." },
        { choice: [
          { text: "Blijf in Velmara en word de nieuwe Wachter.", goto: "stay" },
          { text: "Geef het kompas aan de Bron en keer terug naar huis.", goto: "home" },
          { text: "Er is een derde weg. “Geen offer, maar een keuze.”", goto: "bridge",
            if: { flag: "read_diary", stat: { fenn: 2, odile: 2 } },
            showLocked: true,
            lockedHint: "Vereist: het dagboek van Agnes én het vertrouwen van Fenn en Odile." }
        ] },

        { label: "stay", say: "protagonist", expr: "determined", text: "Ik heb mijn hele leven gewacht op een plek waar ik ertoe doe. Ik blijf." },
        { fx: "flash", narrate: "Je stapt het meer in. Het water is warm. Het licht van de Bron stroomt door je heen, en overal in Velmara — in het woud, in Brugvoort, langs elke rivier — beginnen lantaarns weer te branden." },
        { ending: "wachter" },

        { label: "home", say: "protagonist", expr: "worried", text: "Mijn wereld is grijs en saai. Maar ze is van mij." },
        { say: "protagonist", expr: "determined", text: "En ik weet nu dat ik meer kan dan ik dacht. Dat neem ik mee." },
        { fx: "flash", narrate: "Je legt het kompas in het water. Het zinkt gloeiend naar de bodem — en de Bron vlamt op, hoog en helder, tot de hele hemel ervan zingt." },
        { ending: "thuis" },

        { label: "bridge", say: "protagonist", expr: "determined", text: "Agnes dacht dat ze moest kiezen tussen twee werelden. Maar een kompas wijst niet maar één kant op. Het verbindt." },
        { narrate: "Je houdt het kompas boven de Bron. De naald draait niet meer — ze staat stil, en wijst tegelijk naar het meer en naar de deur. Een draad van licht spant zich tussen beide." },
        { show: "wachter", expr: "awakened", pos: "right", if: { flag: "fenn_at_ruins" } },
        { say: "wachter", expr: "warm", text: "…Een brug. Daar heb ik in driehonderd jaar nooit aan gedacht." },
        { say: "protagonist", expr: "happy", text: "Daar heb je een dwaler voor nodig." },
        { fx: "flash", ending: "brug" }
      ]
    }
  }
};
