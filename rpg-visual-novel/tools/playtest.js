/* Automatische playthrough-test: speelt alle drie de eindes uit in een headless DOM
 * en controleert save/load, vergrendelde keuzes en soft-locks.
 * Gebruik (eenmalig jsdom installeren):
 *   cd rpg-visual-novel && npm install --no-save jsdom && node tools/playtest.js
 */
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (e) { console.error('jsdom ontbreekt. Installeer met:  npm install --no-save jsdom'); process.exit(1); }
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function makeGame() {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if (src.includes('storyData')) code = code.replace('probeAssets: true', 'probeAssets: false');
    return `<script>${code}</script>`;
  }).replace(/<link rel="stylesheet"[^>]+>/, '');
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/',
    beforeParse(w) {
      w.localStorage.setItem('velmara.settings.v1', JSON.stringify({ textSpeed: 0, autoDelay: 1, phLabels: true, reduceMotion: true }));
      w.console.error = (...a) => { errors.push(a.join(' ')); };
      w.console.warn = (...a) => { errors.push('WARN ' + a.join(' ')); };
      w.HTMLElement.prototype.scrollIntoView = () => {};
    }
  });
  dom.window.addEventListener('error', (e) => errors.push('UNCAUGHT ' + e.message));
  await sleep(50);
  return { dom, w: dom.window, d: dom.window.document, errors };
}

function ui(g) {
  const d = g.d;
  if (!d.querySelector('#ending-screen').hidden && d.querySelector('#end-title').textContent) return 'ending';
  if (d.querySelector('#fade').classList.contains('on')) return 'busy';
  if (!d.querySelector('#modal').hidden) return 'modal';
  if (!d.querySelector('#title-card').hidden && !d.querySelector('#title-card').classList.contains('out')) return 'titlecard';
  if (d.querySelectorAll('#choices .choice').length) return 'choice';
  if (d.querySelector('#game').classList.contains('mode-hub') && d.querySelectorAll('#hub-actions .hub-btn').length) return 'hub';
  return 'text';
}
const key = (g, k) => g.d.dispatchEvent(new g.w.KeyboardEvent('keydown', { key: k, bubbles: true }));
const click = (g, el) => el.dispatchEvent(new g.w.MouseEvent('click', { bubbles: true }));
const st = (g) => g.w.VN.state();

// Advance until a choice / hub / ending appears.
async function until(g, want) {
  for (let i = 0; i < 3000; i++) {
    const u = ui(g);
    if (u === 'busy') { await sleep(30); continue; }
    if (u === 'titlecard') { click(g, g.d.querySelector('#title-card')); await sleep(5); continue; }
    if (u === 'text') { key(g, ' '); await sleep(1); continue; }
    if (!want || want.includes(u)) return u;
    throw new Error('Onverwachte UI: ' + u + ' (verwacht ' + want + ')');
  }
  throw new Error('Timeout in until()');
}
async function choose(g, sub) {
  await until(g, ['choice']);
  const btns = [...g.d.querySelectorAll('#choices .choice')];
  const b = btns.find((x) => x.textContent.includes(sub));
  if (!b) throw new Error(`Keuze "${sub}" niet gevonden. Beschikbaar: ${btns.map((x) => x.textContent.trim()).join(' | ')}`);
  if (b.disabled) throw new Error(`Keuze "${sub}" is vergrendeld`);
  click(g, b); await sleep(2);
}
function choiceList(g) { return [...g.d.querySelectorAll('#choices .choice')].map((x) => ({ t: x.textContent.trim(), dis: x.disabled })); }
async function act(g, sub) {
  await until(g, ['hub']);
  const btns = [...g.d.querySelectorAll('#hub-actions .hub-btn')];
  const b = btns.find((x) => x.textContent.includes(sub));
  if (!b) throw new Error(`Actie "${sub}" niet gevonden in ${st(g).location}. Beschikbaar: ${btns.map((x) => x.textContent.trim()).join(' | ')}`);
  click(g, b); await sleep(2);
}
function actions(g) { return [...g.d.querySelectorAll('#hub-actions .hub-btn')].map((x) => x.textContent.trim()); }
async function travel(g, loc) {
  await act(g, 'Reizen');
  for (let i = 0; i < 100 && g.d.querySelector('#modal').hidden; i++) await sleep(10);
  const pin = g.d.querySelector(`.pin[data-loc="${loc}"]`);
  if (!pin) throw new Error('pin ontbreekt ' + loc);
  if (pin.classList.contains('locked')) throw new Error('locatie vergrendeld ' + loc);
  click(g, pin);
  await sleep(400);
}
async function saveSlot(g, slot) {
  click(g, g.d.querySelector('[data-action="save"]'));
  await sleep(5);
  const b = g.d.querySelector(`[data-save="${slot}"]`);
  if (!b) throw new Error('save-knop ontbreekt');
  click(g, b); await sleep(10);
  click(g, g.d.querySelector('[data-action="close-modal"]')); await sleep(5);
}
async function loadSlot(g, slot) {
  click(g, g.d.querySelector('[data-action="load"]')); await sleep(5);
  click(g, g.d.querySelector(`[data-load="${slot}"]`)); await sleep(500);
}
async function newGame(g, name) {
  click(g, g.d.querySelector('[data-action="new-game"]')); await sleep(5);
  g.d.querySelector('#name-input').value = name;
  click(g, g.d.querySelector('#name-go')); await sleep(400);
}
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('  ✔ ' + m); };

async function pathBridge() {
  console.log('\n=== Pad A: maximaal vertrouwen → geheim einde "brug" ===');
  const g = await makeGame();
  await newGame(g, 'Lotte');
  assert(st(g).name === 'Lotte', 'naam ingesteld');
  await choose(g, 'Open de doos');
  await choose(g, 'Stap erdoorheen');
  await choose(g, 'Ik ben Lotte');
  // mid-dialogue save/restore test
  await until(g, ['choice']);
  await choose(g, 'Dwaler?');
  await until(g, ['hub']);
  assert(st(g).location === 'forest' && st(g).unlocked.tavern, 'in het woud, taverne ontgrendeld');
  assert(st(g).items.includes('kompas') && st(g).items.includes('archiefpas'), 'kompas + pas in tas');
  await act(g, 'Praat met Fenn');
  await choose(g, 'Fluisterwoud');
  await choose(g, 'stenen te lezen');
  await choose(g, 'iets over jezelf');
  await choose(g, 'Als ik daar kom');
  await choose(g, 'weer verder');
  assert(st(g).items.includes('lantaarn'), 'lantaarn gekregen');
  await act(g, 'stenen kring');
  await choose(g, 'Zonder jouw lantaarn');
  await until(g, ['hub']);
  assert(st(g).flags.verse1, 'vers 1 gevonden');
  assert(st(g).stats.fenn === 3, 'Fenn vertrouwen = 3 (' + st(g).stats.fenn + ')');
  await act(g, 'gloeiende bloem');
  await act(g, 'fluisteren');
  await until(g, ['hub']);
  assert(!actions(g).some((a) => a.includes('bloem')), 'eenmalige actie verdwijnt');
  await travel(g, 'tavern');
  await choose(g, 'Iets warms');
  await until(g, ['hub']);
  assert(st(g).unlocked.ruins && st(g).items.includes('kaart'), 'kaart + ruïne ontgrendeld');
  await saveSlot(g, '1');
  await act(g, 'Help Odile');
  await choose(g, 'twee cider');
  await act(g, 'sluitingstijd');
  await act(g, 'nachtbloei');
  // save in the middle of the line that carries the stat effect
  for (let i = 0; i < 50; i++) { if (g.d.querySelector('#text').textContent.includes('goede rare')) break; key(g, ' '); await sleep(2); }
  const odileBefore = st(g).stats.odile;
  await saveSlot(g, '3');
  await loadSlot(g, '3');
  assert(g.d.querySelector('#text').textContent.includes('goede rare'), 'zelfde dialoogregel na laden');
  assert(st(g).stats.odile === odileBefore, 'stat-effect niet dubbel toegepast na laden (' + st(g).stats.odile + ')');
  await act(g, 'Praat met Odile');
  await choose(g, 'sleutel');
  await choose(g, 'gestopt met kaarten');
  await choose(g, 'Tot straks');
  assert(st(g).items.includes('sleutel'), 'sleutel gekregen');
  await travel(g, 'ruins');
  await until(g, ['hub']);
  assert(st(g).flags.fenn_at_ruins, 'Fenn reist mee naar de ruïne');
  await act(g, 'inscripties');
  await act(g, 'bibliotheek');
  await act(g, 'Praat met Fenn');
  await choose(g, 'Samen');
  await act(g, 'Poort');
  await choose(g, 'Wat de steen bewaart');   // fout
  await choose(g, 'Wat het woud fluistert');
  await choose(g, 'Wat de lantaarn draagt');
  await choose(g, 'Wat de steen bewaart');
  await until(g, ['hub']);
  assert(st(g).flags.gate_open && st(g).unlocked.starwell, 'Poort open, Sterrenbron ontgrendeld');
  await travel(g, 'tavern');
  await act(g, 'achter de Poort');
  await travel(g, 'starwell');
  await until(g, ['choice']);
  const cl = choiceList(g);
  assert(cl.length === 3 && !cl[2].dis, 'derde (geheime) keuze beschikbaar');
  await choose(g, 'derde weg');
  await until(g, ['ending']); await sleep(1500);
  assert(g.d.querySelector('#end-title').textContent === 'De Brug tussen Werelden', 'einde: ' + g.d.querySelector('#end-title').textContent);
  console.log('  stats:', JSON.stringify(st(g).stats), 'lore', st(g).lore.length);
  // load slot 1
  click(g, g.d.querySelector('#ending-screen [data-action="load"]')); await sleep(5);
  assert(!g.d.querySelector('#modal').hidden, 'laad-venster opent vanaf eindscherm');
  click(g, g.d.querySelector('[data-load="1"]')); await sleep(600);
  assert(st(g).mode === 'hub' && st(g).location === 'tavern' && !st(g).items.includes('sleutel'), 'slot 1 geladen (taverne, nog geen sleutel)');
  report(g);
}

async function pathHome() {
  console.log('\n=== Pad B: minimaal vertrouwen → "thuis" en "wachter" ===');
  const g = await makeGame();
  await newGame(g, '');
  assert(st(g).name === 'Mira', 'standaardnaam Mira');
  await choose(g, 'Doe alsof');
  await choose(g, 'Raak alleen');
  await choose(g, 'toerist');
  await choose(g, 'Kan ik terug');
  await act(g, 'stenen kring');
  await until(g, ['hub']);
  assert(!st(g).flags.verse1 && st(g).flags.saw_stones, 'stenen onleesbaar zonder lantaarn');
  await act(g, 'Praat met Fenn');
  await choose(g, 'stenen te lezen');
  await choose(g, 'iets over jezelf');
  await choose(g, 'iets over jezelf'); // nog steeds gesloten
  await choose(g, 'weer verder');
  assert(st(g).stats.fenn === 0 && !st(g).flags.fenn_story, 'Fenn blijft gesloten');
  await act(g, 'stenen kring');
  await choose(g, 'Het eerste van drie');
  await act(g, 'gloeiende bloem');
  await travel(g, 'tavern');
  await choose(g, 'geen geld');
  await act(g, 'Praat met Odile');
  await choose(g, 'sleutel');
  await until(g, ['choice']);
  const lockedStory = choiceList(g).find((c) => c.t.includes('gestopt'));
  assert(lockedStory && lockedStory.dis, 'Odile-verhaal vergrendeld getoond');
  await choose(g, 'Tot straks');
  assert(!st(g).items.includes('sleutel'), 'sleutel geweigerd');
  await act(g, 'Help Odile');
  await choose(g, 'sterkste drank');
  await act(g, 'sluitingstijd');
  await act(g, 'nachtbloei');
  await act(g, 'Praat met Odile');
  await choose(g, 'sleutel');
  await choose(g, 'Tot straks');
  assert(st(g).items.includes('sleutel') && !st(g).items.includes('nachtbloem'), 'sleutel na cadeau, bloem weg');
  await travel(g, 'ruins');
  await until(g, ['hub']);
  assert(!st(g).flags.fenn_at_ruins && !actions(g).some((a) => a.includes('Fenn')), 'Fenn niet aanwezig bij laag vertrouwen');
  await act(g, 'Poort');
  await until(g, ['hub']);
  assert(!st(g).flags.gate_open, 'Poort nog dicht zonder vers 3');
  await act(g, 'inscripties');
  await act(g, 'Poort');
  await choose(g, 'Wat het woud fluistert');
  await choose(g, 'Wat de lantaarn draagt');
  await choose(g, 'Wat de steen bewaart');
  await until(g, ['hub']);
  await saveSlot(g, '2');
  await travel(g, 'starwell');
  await until(g, ['choice']);
  const cl = choiceList(g);
  assert(cl[2] && cl[2].dis, 'geheime keuze vergrendeld');
  await choose(g, 'keer terug naar huis');
  await until(g, ['ending']); await sleep(1500);
  assert(g.d.querySelector('#end-title').textContent === 'Terug, maar Anders', 'einde thuis');
  click(g, g.d.querySelector('#ending-screen [data-action="load"]')); await sleep(5);
  click(g, g.d.querySelector('[data-load="2"]')); await sleep(600);
  await travel(g, 'starwell');
  await choose(g, 'Blijf in Velmara');
  await until(g, ['ending']); await sleep(1500);
  assert(g.d.querySelector('#end-title').textContent === 'De Nieuwe Wachter', 'einde wachter');
  const meta = JSON.parse(g.w.localStorage.getItem('velmara.meta.v1'));
  assert(Object.keys(meta.endings).length === 2, 'twee eindes geregistreerd');
  click(g, g.d.querySelector('[data-action="to-title"]')); await sleep(700);
  assert(!g.d.querySelector('#title-screen').classList.contains('out'), 'terug op titelscherm');
  // drawer + journal + map render sanity
  click(g, g.d.querySelector('[data-action="continue"]')); await sleep(600);
  key(g, 'j'); await sleep(5);
  assert(g.d.querySelectorAll('.lore-entry').length > 5, 'dagboek toont lore');
  key(g, 'i'); await sleep(5); key(g, 'i'); await sleep(5);
  report(g);
}

function report(g) {
  const errs = g.errors.filter((e) => !/Not implemented/.test(e));
  if (errs.length) { console.log('  console-meldingen:'); errs.forEach((e) => console.log('   - ' + e)); }
  else console.log('  geen console-fouten');
}

(async () => {
  try { await pathBridge(); await pathHome(); console.log('\nALLES OK'); process.exit(0); }
  catch (e) { console.error('\nFAIL', e.stack); process.exit(1); }
})();
