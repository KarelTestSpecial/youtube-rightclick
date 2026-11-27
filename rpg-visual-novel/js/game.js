/* =====================================================================
 *  VELMARA — GAME ENGINE
 *  ---------------------------------------------------------------------
 *  Leest alles uit window.STORY_DATA (storyData.js). Voor nieuwe scènes,
 *  locaties of hoofdstukken hoef je dit bestand niet aan te passen.
 *
 *  Overzicht:
 *    1. Setup & helpers          6. Locaties, hub & reizen
 *    2. Instellingen & state     7. Effecten & voorwaarden
 *    3. Achtergrond & podium     8. Opslaan / laden
 *    4. Tekst & dialoog          9. UI: zijbalk, modals, kaart, eindes
 *    5. Scène-interpreter       10. Input & opstarten
 * ===================================================================== */
(function () {
  'use strict';

  /* =========================== 1. SETUP =========================== */
  const S = window.STORY_DATA;
  const A = window.VNAssets;
  A.init(S);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  const has = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const el = {
    game: $('#game'), body: document.body,
    bgLayers: $$('.bg-layer'), stage: $('#stage'), bgBadge: $('#bg-badge'),
    locName: $('#loc-name'), chapterName: $('#chapter-name'), hudButtons: $('#hud-buttons'),
    choices: $('#choices'), dialogue: $('#dialogue'), nameplate: $('#nameplate'), text: $('#text'), hubActions: $('#hub-actions'),
    btnAuto: $('#btn-auto'), btnSkip: $('#btn-skip'),
    drawer: $('#drawer'), drawerBody: $('#drawer-body'),
    modal: $('#modal'), modalCard: $('#modal .modal-card'), modalContent: $('#modal-content'),
    titleCard: $('#title-card'), tcTitle: $('#tc-title'), tcSub: $('#tc-sub'),
    titleScreen: $('#title-screen'), btnContinue: $('#btn-continue'), tsFoot: $('#ts-foot'),
    ending: $('#ending-screen'), toasts: $('#toasts'), fade: $('#fade'), flash: $('#flash'), journalDot: $('#journal-dot')
  };

  const KEYS = { settings: 'velmara.settings.v1', saves: 'velmara.saves.v1', meta: 'velmara.meta.v1' };
  const SAVE_SLOTS = ['auto', '1', '2', '3', '4', '5', '6'];

  const ICONS = {
    talk: '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H9l-5 4V5Z"/></svg>',
    look: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>',
    ear:  '<svg viewBox="0 0 24 24"><path d="M7 10a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5 1"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M8 13V6a1.5 1.5 0 0 1 3 0v5m0-6a1.5 1.5 0 0 1 3 0v6m0-4a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0m5 0c2-4 6-3 5 0"/></svg>',
    door: '<svg viewBox="0 0 24 24"><path d="M6 21V5a6 6 0 0 1 12 0v16M4 21h16M14 13h.01"/></svg>',
    map:  '<svg viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14"/></svg>'
  };

  /* ===================== 2. INSTELLINGEN & STATE ===================== */
  const DEFAULT_SETTINGS = { textSpeed: 24, autoDelay: 1.6, phLabels: true, reduceMotion: false };
  function readJSON(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { console.error(e); toast({ title: 'Opslaan mislukt', text: 'localStorage is vol of niet beschikbaar.', icon: '⚠️' }); return false; } }

  let settings = Object.assign({}, DEFAULT_SETTINGS, readJSON(KEYS.settings, {}));
  function applySettings() {
    el.body.classList.toggle('hide-ph', !settings.phLabels);
    el.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
  }

  let state = null;
  const rt = {
    waiting: null,            // 'text' | 'choice' | 'title' | 'hub' | null
    typing: false, typeTimer: null, finishType: null, lastLen: 0,
    auto: false, skip: false, autoTimer: null,
    bgToken: 0, activeBg: 0, labels: {}, playTimer: null, titleTimer: null, choiceOpts: [], hubOpts: [], drawerTab: 'inventory', invSel: null
  };

  function newState(name) {
    const stats = {}; Object.keys(S.stats || {}).forEach((k) => (stats[k] = S.stats[k].initial || 0));
    const unlocked = {}; Object.keys(S.locations).forEach((k) => { if (S.locations[k].unlockedAtStart) unlocked[k] = true; });
    return {
      v: 1, name, sceneId: null, nodeIndex: 0, mode: 'scene', location: null, chapter: '',
      flags: {}, stats, items: [], lore: [], loreUnread: {}, seenScenes: {}, done: {}, unlocked,
      stage: {}, met: {}, bg: null, playtime: 0, backlog: [], endingId: null
    };
  }

  const interp = (t) => String(t == null ? '' : t).replace(/\{name\}/g, state ? state.name : S.meta.defaultName);
  function charName(id) { const c = S.characters[id]; return c ? interp(c.name) : id; }

  /* ===================== 3. ACHTERGROND & PODIUM ===================== */
  function preloadImg(url) {
    return new Promise((res) => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = url; });
  }
  function badgeHTML(res) { return `<b>${esc(res.file || '?')}</b> · ${res.size ? res.size[0] + '×' + res.size[1] : ''} · placeholder`; }

  async function setBg(id) {
    if (!id) return;
    if (state) state.bg = id;
    const token = ++rt.bgToken;
    const res = await A.background(id);
    if (token !== rt.bgToken) return;
    await preloadImg(res.url);
    if (token !== rt.bgToken) return;
    const cur = el.bgLayers[rt.activeBg], next = el.bgLayers[1 - rt.activeBg];
    if (cur.dataset.id === id && cur.classList.contains('active')) return;
    next.style.backgroundImage = `url("${res.url}")`;
    next.dataset.id = id;
    next.classList.remove('active'); void next.offsetWidth; next.classList.add('active');
    cur.classList.remove('active');
    rt.activeBg = 1 - rt.activeBg;
    el.bgBadge.hidden = !res.placeholder;
    if (res.placeholder) el.bgBadge.innerHTML = 'Achtergrond: ' + badgeHTML(res);
  }

  function stageEl(id) { return el.stage.querySelector(`.char[data-id="${id}"]:not([data-leaving])`); }

  function showChar(id, expr, pos) {
    const ch = S.characters[id];
    if (!ch || !ch.expressions) return;
    const cur = state.stage[id];
    expr = expr || (cur && cur.expr) || ch.defaultExpr || Object.keys(ch.expressions)[0];
    if (!ch.expressions[expr]) { console.warn(`[engine] ${id} heeft geen expressie "${expr}"`); expr = ch.defaultExpr || Object.keys(ch.expressions)[0]; }
    pos = pos || (cur && cur.pos) || ch.defaultPos || 'center';
    Object.keys(state.stage).forEach((o) => { if (o !== id && state.stage[o].pos === pos) hideChar(o); });
    state.stage[id] = { expr, pos };
    state.met[id] = true;
    renderChar(id);
  }

  function hideChar(id) {
    if (id === 'all') { Object.keys(state.stage).forEach(hideChar); $$('.char', el.stage).forEach((n) => hideNode(n)); return; }
    delete state.stage[id];
    const node = stageEl(id);
    if (node) hideNode(node);
  }
  function hideNode(node) {
    if (node.dataset.leaving) return;
    node.dataset.leaving = '1'; node.classList.remove('in');
    setTimeout(() => node.remove(), 520);
  }

  async function renderChar(id) {
    const st = state.stage[id]; if (!st) return;
    let node = stageEl(id);
    if (!node) {
      node = document.createElement('div');
      node.className = 'char entering';
      node.dataset.id = id;
      el.stage.appendChild(node);
    }
    node.className = node.className.replace(/\bpos-\w+/g, '').trim() + ' pos-' + st.pos;
    if (node.dataset.expr === st.expr) return;
    node.dataset.expr = st.expr;
    const token = (node._tok = (node._tok || 0) + 1);
    const res = await A.character(id, st.expr);
    if (node._tok !== token || !node.isConnected) return;
    const img = new Image();
    img.alt = ''; img.draggable = false; img.src = res.url;
    const show = () => {
      if (node._tok !== token || !node.isConnected) return;
      node.appendChild(img);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        img.classList.add('show');
        node.classList.add('in'); node.classList.remove('entering');
      }));
      $$('img', node).forEach((o) => { if (o !== img) { o.classList.remove('show'); setTimeout(() => o.remove(), 500); } });
      let badge = $('.ph-badge', node);
      if (res.placeholder) {
        if (!badge) { badge = document.createElement('div'); badge.className = 'ph-badge'; node.appendChild(badge); }
        badge.innerHTML = badgeHTML(res);
      } else if (badge) badge.remove();
    };
    if (img.decode) img.decode().then(show, show); else img.onload = show;
  }

  function setSpeaker(who) {
    const onStage = who && state.stage[who];
    $$('.char', el.stage).forEach((n) => {
      const me = n.dataset.id === who;
      n.classList.toggle('speaking', !!onStage && me);
      n.classList.toggle('dim', !!onStage && !me);
    });
    if (who) {
      const ch = S.characters[who] || {};
      el.nameplate.hidden = false;
      el.nameplate.textContent = charName(who);
      el.nameplate.style.setProperty('--np-color', ch.color || 'var(--gold)');
      el.nameplate.style.animation = 'none'; void el.nameplate.offsetWidth; el.nameplate.style.animation = '';
    } else {
      el.nameplate.hidden = true;
    }
  }

  function fx(name) {
    if (settings.reduceMotion && name !== 'flash') return;
    if (name === 'flash') { el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go'); return; }
    el.game.classList.remove(name); void el.game.offsetWidth; el.game.classList.add(name);
    setTimeout(() => el.game.classList.remove(name), 1300);
  }
  async function fadeOut() { el.fade.classList.add('on'); await wait(settings.reduceMotion ? 120 : 560); }
  function fadeIn() { el.fade.classList.remove('on'); }

  /* ======================== 4. TEKST & DIALOOG ======================== */
  function tokenize(t) {
    const parts = [], re = /\*([^*]+)\*/g; let last = 0, m;
    while ((m = re.exec(t))) { if (m.index > last) parts.push({ s: t.slice(last, m.index), em: false }); parts.push({ s: m[1], em: true }); last = re.lastIndex; }
    if (last < t.length) parts.push({ s: t.slice(last), em: false });
    return parts;
  }
  function renderPartial(tokens, n) {
    let out = '', left = n;
    for (const tk of tokens) { if (left <= 0) break; const p = tk.s.slice(0, left); left -= p.length; out += tk.em ? `<em>${esc(p)}</em>` : esc(p); }
    return out.replace(/\n/g, '<br>');
  }
  const formatText = (t) => { const tk = tokenize(interp(t)); return renderPartial(tk, Infinity); };

  function typeText(raw, cls) {
    const tokens = tokenize(interp(raw));
    const total = tokens.reduce((a, t) => a + t.s.length, 0);
    rt.lastLen = total;
    el.text.className = cls || '';
    clearInterval(rt.typeTimer); clearTimeout(rt.autoTimer);
    el.dialogue.classList.remove('ready');
    rt.typing = true;
    rt.finishType = () => { clearInterval(rt.typeTimer); el.text.innerHTML = renderPartial(tokens, total); rt.typing = false; el.dialogue.classList.add('ready'); scheduleAuto(); };
    const speed = rt.skip ? 0 : settings.textSpeed;
    if (speed <= 0) return rt.finishType();
    let n = 0; const step = speed < 12 ? 2 : 1;
    el.text.innerHTML = '';
    rt.typeTimer = setInterval(() => { n += step; el.text.innerHTML = renderPartial(tokens, n); if (n >= total) rt.finishType(); }, speed);
  }

  function isBlocked() { return !el.modal.hidden || el.drawer.classList.contains('open') || !el.titleCard.hidden || !el.titleScreen.classList.contains('out'); }

  function scheduleAuto() {
    clearTimeout(rt.autoTimer);
    if (rt.waiting !== 'text' || rt.typing) return;
    const tick = () => { if (isBlocked()) return scheduleAuto(); advance(); };
    if (rt.skip) rt.autoTimer = setTimeout(tick, 70);
    else if (rt.auto) rt.autoTimer = setTimeout(tick, settings.autoDelay * 1000 + rt.lastLen * 22);
  }

  function logLine(entry) {
    state.backlog.push(entry);
    if (state.backlog.length > 200) state.backlog.shift();
  }

  function showLine(node) {
    let who = null, cls = '', text;
    if (node.say) {
      who = node.say; text = node.text;
      const ch = S.characters[who];
      if (ch && ch.expressions) showChar(who, node.expr, node.pos);
    } else if (node.think != null) {
      who = 'protagonist'; cls = 'thought'; text = node.think;
      if (node.expr) showChar('protagonist', node.expr, node.pos);
    } else {
      cls = 'narration'; text = node.narrate;
    }
    setSpeaker(who);
    logLine({ who: who ? charName(who) : null, color: who && S.characters[who] ? S.characters[who].color : null, text: interp(text), kind: cls || 'say' });
    rt.waiting = 'text';
    typeText(text, cls);
    updateHudButtons();
  }

  /* ======================= 5. SCÈNE-INTERPRETER ======================= */
  function currentScene() { return state && state.sceneId ? S.scenes[state.sceneId] : null; }
  function labelsFor(id) {
    if (!rt.labels[id]) { const m = {}; S.scenes[id].nodes.forEach((n, i) => { if (n.label) m[n.label] = i; }); rt.labels[id] = m; }
    return rt.labels[id];
  }
  function jumpTo(label) {
    const idx = labelsFor(state.sceneId)[label];
    if (idx == null) { console.error(`[engine] Label "${label}" bestaat niet in scène "${state.sceneId}"`); toast({ title: 'Verhaalfout', text: `Label "${label}" ontbreekt.`, icon: '⚠️' }); return false; }
    state.nodeIndex = idx; return true;
  }

  function setMode(m) {
    el.game.classList.toggle('mode-hub', m === 'hub');
    if (state) state.mode = m;
  }

  function startScene(id, opts = {}) {
    const sc = S.scenes[id];
    if (!sc) { console.error('[engine] Onbekende scène', id); toast({ title: 'Verhaalfout', text: `Scène "${id}" bestaat niet.`, icon: '⚠️' }); return; }
    hideChoices();
    setMode('scene');
    state.sceneId = id;
    state.nodeIndex = opts.index || 0;
    if (sc.location) state.location = sc.location;
    if (sc.chapter) state.chapter = sc.chapter;
    if (!opts.restoring) {
      state.seenScenes[id] = true;
      if (sc.background) setBg(sc.background);
      autosave(true);
    }
    updateHud();
    runNode(!!opts.restoring);
  }

  function runNode(restoring = false) {
    clearTimeout(rt.autoTimer);
    rt.waiting = null;
    let guard = 0;
    for (;;) {
      if (++guard > 2000) { console.error('[engine] Oneindige lus in scène', state.sceneId); return; }
      const sc = currentScene(); if (!sc) return;
      const node = sc.nodes[state.nodeIndex];
      if (!node) { endScene(); return; }
      if (node.if && !check(node.if)) { state.nodeIndex++; restoring = false; continue; }

      if (node.bg) setBg(node.bg);
      if (node.hide) hideChar(node.hide);
      if (node.show) showChar(node.show, node.expr, node.pos);
      if (node.fx && !restoring) fx(node.fx);
      if (node.do && !restoring) applyEffects(node.do);
      restoring = false;

      if (node.title != null) { showTitleCard(node.title, node.subtitle); return; }
      if (node.say || node.narrate != null || node.think != null) { showLine(node); return; }
      if (node.choice) { showChoices(node.choice); return; }
      if (node.test) {
        const target = check(node.test) ? node.goto : node.else;
        if (target != null) { if (!jumpTo(target)) return; } else state.nodeIndex++;
        continue;
      }
      if (node.goto != null) { if (!jumpTo(node.goto)) return; continue; }
      if (node.scene) { startScene(node.scene); return; }
      if (node.travel) { travel(node.travel); return; }
      if (node.ending) { showEnding(node.ending); return; }
      if (node.end) { endScene(); return; }
      state.nodeIndex++;
    }
  }

  function advance() {
    if (rt.waiting !== 'text') return;
    rt.waiting = null;
    state.nodeIndex++;
    runNode();
  }

  function showChoices(options) {
    rt.skip = false; updateControlButtons();
    const visible = options.filter((o) => check(o.showIf)).map((o) => ({ o, ok: check(o.if) })).filter((x) => x.ok || x.o.showLocked);
    if (!visible.some((x) => x.ok)) { console.warn('[engine] Geen beschikbare keuzes in', state.sceneId, state.nodeIndex); state.nodeIndex++; runNode(); return; }
    rt.waiting = 'choice';
    el.dialogue.classList.remove('ready');
    rt.choiceOpts = [];
    el.choices.innerHTML = '';
    let n = 0;
    visible.forEach(({ o, ok }, i) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.style.animationDelay = i * 70 + 'ms';
      b.disabled = !ok;
      const num = ok ? ++n : '🔒';
      b.innerHTML = `<span class="num">${num}</span><span>${formatText(o.text)}${!ok && o.lockedHint ? `<span class="lock">${esc(interp(o.lockedHint))}</span>` : ''}</span>`;
      if (ok) { rt.choiceOpts.push(o); b.addEventListener('click', (e) => { e.stopPropagation(); chooseOption(o); }); }
      el.choices.appendChild(b);
    });
    updateHudButtons();
  }
  function hideChoices() { el.choices.innerHTML = ''; rt.choiceOpts = []; }

  function chooseOption(o) {
    if (rt.waiting !== 'choice') return;
    rt.waiting = null;
    hideChoices();
    logLine({ kind: 'choice-log', text: '➜ ' + interp(o.text).replace(/\*/g, '') });
    if (o.do) applyEffects(o.do);
    if (o.scene) return startScene(o.scene);
    if (o.ending) return showEnding(o.ending);
    if (o.travel) return travel(o.travel);
    if (o.end) return endScene();
    if (o.goto != null) { if (jumpTo(o.goto)) runNode(); return; }
    state.nodeIndex++; runNode();
  }

  function showTitleCard(title, sub) {
    rt.waiting = 'title';
    setSpeaker(null);
    el.tcTitle.textContent = interp(title);
    el.tcSub.textContent = interp(sub || '');
    el.titleCard.classList.remove('out');
    el.titleCard.hidden = false;
    clearTimeout(rt.titleTimer);
    rt.titleTimer = setTimeout(dismissTitleCard, rt.skip ? 600 : 3200);
    updateHudButtons();
  }
  function dismissTitleCard() {
    if (rt.waiting !== 'title') return;
    clearTimeout(rt.titleTimer);
    rt.waiting = null;
    el.titleCard.classList.add('out');
    setTimeout(() => { el.titleCard.hidden = true; el.titleCard.classList.remove('out'); }, 700);
    state.nodeIndex++;
    runNode();
  }

  function endScene() {
    const loc = state.location;
    if (loc && S.locations[loc]) enterHub(loc);
    else { console.warn('[engine] Scène eindigt zonder locatie:', state.sceneId); toTitle(); }
  }

  /* =================== 6. LOCATIES, HUB & REIZEN =================== */
  function pickText(v) {
    if (Array.isArray(v)) { const hit = v.find((d) => check(d.if)); return hit ? hit.text : ''; }
    return v || '';
  }
  function actionKey(locId, a) { return locId + ':' + (a.id || a.scene); }
  function visibleActions(locId) {
    const L = S.locations[locId];
    return (L.actions || []).filter((a) => check(a.if) && !(a.once && state.done[actionKey(locId, a)]));
  }
  function unlockedCount() { return Object.keys(state.unlocked).filter((k) => state.unlocked[k]).length; }

  function enterHub(locId) {
    const L = S.locations[locId];
    if (!L) return;
    hideChoices();
    state.sceneId = null; state.nodeIndex = 0; state.location = locId;
    setMode('hub');
    rt.waiting = 'hub'; rt.skip = false; updateControlButtons();
    setBg(L.background);
    const present = (L.present || []).filter((p) => check(p.if));
    const keep = new Set(present.map((p) => p.char));
    Object.keys(state.stage).forEach((id) => { if (!keep.has(id)) hideChar(id); });
    present.forEach((p) => showChar(p.char, p.expr, p.pos));
    setSpeaker(null);
    renderHub();
    updateHud();
    autosave();
  }

  function renderHub() {
    const L = S.locations[state.location];
    el.nameplate.hidden = false;
    el.nameplate.textContent = L.name;
    el.nameplate.style.setProperty('--np-color', 'var(--gold)');
    el.text.className = 'hub-desc';
    el.text.innerHTML = formatText(pickText(L.description));
    el.dialogue.classList.remove('ready');
    el.hubActions.innerHTML = '';
    rt.hubOpts = [];
    visibleActions(state.location).forEach((a) => {
      rt.hubOpts.push(() => doAction(a));
      el.hubActions.appendChild(hubButton(a.label, a.icon || 'look', rt.hubOpts.length, () => doAction(a)));
    });
    if (unlockedCount() > 1) {
      const fn = () => openMap();
      rt.hubOpts.push(fn);
      const b = hubButton('Reizen', 'map', rt.hubOpts.length, fn);
      b.classList.add('travel');
      el.hubActions.appendChild(b);
    }
  }
  function hubButton(label, icon, n, fn) {
    const b = document.createElement('button');
    b.className = 'hub-btn';
    b.innerHTML = `<span class="ic">${ICONS[icon] || ICONS.look}</span><span>${esc(interp(label))}</span><kbd>${n}</kbd>`;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }
  function doAction(a) {
    if (rt.waiting !== 'hub') return;
    if (a.once) state.done[actionKey(state.location, a)] = true;
    startScene(a.scene);
  }

  async function travel(locId) {
    const L = S.locations[locId]; if (!L) return;
    closeModal(); closeDrawer();
    rt.waiting = null;
    await fadeOut();
    state.location = locId;
    hideChar('all');
    setBg(L.background);
    const ev = (L.arrive || []).find((a) => check(a.if) && !(a.once && state.seenScenes[a.scene]));
    if (ev) startScene(ev.scene); else enterHub(locId);
    await wait(120);
    fadeIn();
  }

  /* =================== 7. EFFECTEN & VOORWAARDEN =================== */
  function check(c) {
    if (!c) return true;
    if (Array.isArray(c)) return c.every(check);
    for (const k of Object.keys(c)) {
      const v = c[k];
      switch (k) {
        case 'flag': if (!arr(v).every((f) => !!state.flags[f])) return false; break;
        case 'notFlag': if (arr(v).some((f) => !!state.flags[f])) return false; break;
        case 'item': if (!arr(v).every((i) => state.items.includes(i))) return false; break;
        case 'noItem': if (arr(v).some((i) => state.items.includes(i))) return false; break;
        case 'lore': if (!arr(v).every((i) => state.lore.includes(i))) return false; break;
        case 'stat': for (const s of Object.keys(v)) if ((state.stats[s] || 0) < v[s]) return false; break;
        case 'statBelow': for (const s of Object.keys(v)) if ((state.stats[s] || 0) >= v[s]) return false; break;
        case 'seen': if (!arr(v).every((s) => !!state.seenScenes[s])) return false; break;
        case 'unlocked': if (!arr(v).every((s) => !!state.unlocked[s])) return false; break;
        case 'any': if (!arr(v).some(check)) return false; break;
        case 'not': if (check(v)) return false; break;
        default: console.warn('[engine] Onbekende voorwaarde', k);
      }
    }
    return true;
  }

  function applyEffects(list) {
    arr(list).forEach((e) => {
      if (has(e, 'flag')) state.flags[e.flag] = e.value === undefined ? true : e.value;
      if (e.item) addItem(e.item);
      if (e.removeItem) removeItem(e.removeItem);
      if (e.lore) addLore(e.lore);
      if (e.stat) changeStat(e.stat, e.add || 0, e.set);
      if (e.unlock) unlockLocation(e.unlock);
      if (e.notify) toast({ title: 'Notitie', text: interp(e.notify), icon: '✦' });
    });
  }
  function addItem(id) {
    if (state.items.includes(id) || !S.items[id]) return;
    state.items.push(id);
    rt.invSel = id;
    A.item(id).then((r) => toast({ title: 'Voorwerp gevonden', text: S.items[id].name, img: r.url }));
    refreshDrawer();
  }
  function removeItem(id) {
    if (!state.items.includes(id)) return;
    state.items = state.items.filter((i) => i !== id);
    A.item(id).then((r) => toast({ title: 'Voorwerp gegeven', text: S.items[id].name, img: r.url }));
    refreshDrawer();
  }
  function addLore(id) {
    if (state.lore.includes(id) || !S.lore[id]) return;
    state.lore.push(id);
    state.loreUnread[id] = true;
    toast({ title: 'Dagboek bijgewerkt', text: S.lore[id].title, icon: '📖' });
    renderJournalDot(); refreshDrawer();
  }
  function changeStat(id, add, set) {
    const def = S.stats[id] || {}; const max = def.max != null ? def.max : 99;
    const before = state.stats[id] || 0;
    const after = Math.max(0, Math.min(max, set != null ? set : before + add));
    state.stats[id] = after;
    if (after > before && def.notifyUp) toast({ title: def.label || id, text: def.notifyUp, icon: id === 'moed' ? '🔥' : '💛' });
    refreshDrawer();
  }
  function unlockLocation(id) {
    if (state.unlocked[id]) return;
    state.unlocked[id] = true;
    toast({ title: 'Nieuwe locatie op de kaart', text: S.locations[id].name, icon: '🗺️' });
  }

  /* ========================== 8. OPSLAAN / LADEN ========================== */
  const readSaves = () => readJSON(KEYS.saves, {}) || {};
  const readMeta = () => Object.assign({ endings: {} }, readJSON(KEYS.meta, {}));

  function canSave() { return state && ['text', 'choice', 'title', 'hub'].includes(rt.waiting) && state.mode !== 'ending'; }
  function locationLabel() {
    const sc = currentScene();
    if (state.location && S.locations[state.location]) return S.locations[state.location].name;
    return (sc && sc.locationName) || '—';
  }
  function snapshot(pending) {
    const last = [...state.backlog].reverse().find((b) => b.kind !== 'choice-log');
    return {
      version: 1, date: Date.now(), pending: !!pending,
      state: JSON.parse(JSON.stringify(state)),
      meta: { location: locationLabel(), chapter: state.chapter, bg: state.bg, playtime: state.playtime, name: state.name, snippet: last ? last.text.slice(0, 90) : '' }
    };
  }
  function saveTo(slot, pending) {
    const saves = readSaves();
    saves[slot] = snapshot(pending);
    return writeJSON(KEYS.saves, saves);
  }
  function autosave(pending) { if (state && state.mode !== 'ending') saveTo('auto', pending); }

  function latestSlot() {
    const saves = readSaves(); let best = null;
    Object.keys(saves).forEach((k) => { if (!best || saves[k].date > saves[best].date) best = k; });
    return best;
  }

  async function loadFromSlot(slot) {
    const sv = readSaves()[slot];
    if (!sv) return;
    closeModal(); closeDrawer();
    await fadeOut();
    el.ending.hidden = true; el.game.classList.remove('is-ending');
    el.titleCard.hidden = true;
    clearTimeout(rt.titleTimer);
    state = Object.assign(newState(sv.state.name), sv.state);
    rt.auto = false; rt.skip = false; updateControlButtons();
    leaveTitle();
    el.stage.innerHTML = '';
    const stage = state.stage; state.stage = {};
    if (state.bg) setBg(state.bg);
    Object.keys(stage).forEach((id) => showChar(id, stage[id].expr, stage[id].pos));
    renderJournalDot();
    if (state.mode === 'hub' || !state.sceneId) enterHub(state.location);
    else startScene(state.sceneId, { index: state.nodeIndex, restoring: !sv.pending });
    startPlaytime();
    await wait(100);
    fadeIn();
    toast({ title: 'Voortgang geladen', text: `${sv.meta.location} — ${slot === 'auto' ? 'automatische opslag' : 'slot ' + slot}`, icon: '💾' });
  }

  function startPlaytime() {
    clearInterval(rt.playTimer);
    rt.playTimer = setInterval(() => { if (state && !document.hidden && el.titleScreen.classList.contains('out') && state.mode !== 'ending') state.playtime++; }, 1000);
  }
  const fmtTime = (s) => { s = s || 0; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}u ${m}m` : `${m}m ${s % 60}s`; };
  const fmtDate = (t) => new Date(t).toLocaleString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  /* ================= 9. UI: HUD, ZIJBALK, MODALS, KAART, EINDES ================= */
  function updateHud() {
    if (!state) return;
    el.locName.textContent = locationLabel();
    el.chapterName.textContent = state.chapter || '';
    updateHudButtons();
  }
  function updateHudButtons() {
    if (!state) return;
    const mapBtn = $('[data-action="map"]', el.hudButtons);
    mapBtn.disabled = state.mode !== 'hub';
    mapBtn.title = state.mode === 'hub' ? 'Kaart (M)' : 'Kaart — beschikbaar wanneer het gesprek voorbij is';
    $('[data-action="save"]', el.hudButtons).disabled = !canSave();
  }
  function updateControlButtons() {
    el.btnAuto.classList.toggle('on', rt.auto);
    el.btnSkip.classList.toggle('on', rt.skip);
  }
  function renderJournalDot() { el.journalDot.hidden = !state || !Object.keys(state.loreUnread || {}).length; }

  /* ---------- toasts ---------- */
  function toast({ title, text, icon, img }) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="t-ic">${img ? `<img src="${img}" alt="">` : esc(icon || '✦')}</div><div><small>${esc(title || '')}</small>${esc(text || '')}</div>`;
    el.toasts.appendChild(t);
    while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 420); }, 3400);
  }

  /* ---------- zijbalk ---------- */
  function openDrawer(tab) {
    if (!state) return;
    if (el.drawer.classList.contains('open') && rt.drawerTab === tab) return closeDrawer();
    rt.drawerTab = tab || rt.drawerTab;
    el.drawer.classList.add('open');
    el.drawer.setAttribute('aria-hidden', 'false');
    renderDrawer();
  }
  function closeDrawer() { el.drawer.classList.remove('open'); el.drawer.setAttribute('aria-hidden', 'true'); scheduleAuto(); }
  function refreshDrawer() { if (el.drawer.classList.contains('open')) renderDrawer(); }

  function renderDrawer() {
    $$('.tab', el.drawer).forEach((t) => t.classList.toggle('active', t.dataset.tab === rt.drawerTab));
    const body = el.drawerBody;
    if (rt.drawerTab === 'inventory') {
      const items = state.items;
      if (!items.includes(rt.invSel)) rt.invSel = items[0] || null;
      let h = `<div class="section-title">Je tas</div><div class="inv-grid">`;
      const slots = Math.max(12, Math.ceil(items.length / 4) * 4);
      for (let i = 0; i < slots; i++) {
        const id = items[i];
        h += id ? `<button class="inv-slot${id === rt.invSel ? ' sel' : ''}" data-item="${id}" title="${esc(S.items[id].name)}"><img data-icon="${id}" alt=""></button>` : `<div class="inv-slot emptyslot"></div>`;
      }
      h += `</div>`;
      if (rt.invSel) {
        const it = S.items[rt.invSel];
        h += `<div class="inv-detail"><img data-icon="${rt.invSel}" alt=""><div><h4>${esc(it.name)}</h4><p>${esc(it.description)}</p><div class="file">${esc(S.assetPaths.items + it.icon)}</div></div></div>`;
      } else h += `<p class="empty">Je tas is nog leeg.</p>`;
      body.innerHTML = h;
      $$('img[data-icon]', body).forEach((img) => A.item(img.dataset.icon).then((r) => (img.src = r.url)));
      $$('.inv-slot[data-item]', body).forEach((b) => b.addEventListener('click', () => { rt.invSel = b.dataset.item; renderDrawer(); }));
    } else if (rt.drawerTab === 'journal') {
      const total = Object.keys(S.lore).length;
      let h = `<div class="lore-progress">${state.lore.length} van ${total} geheimen ontdekt</div>`;
      const cats = S.loreCategories || [...new Set(Object.values(S.lore).map((l) => l.category))];
      cats.forEach((cat) => {
        const all = Object.keys(S.lore).filter((id) => S.lore[id].category === cat);
        if (!all.length) return;
        const found = all.filter((id) => state.lore.includes(id));
        h += `<div class="section-title">${esc(cat)} <span style="opacity:.6">${found.length}/${all.length}</span></div>`;
        found.forEach((id) => {
          const l = S.lore[id];
          h += `<details class="lore-entry" data-lore="${id}"><summary>${state.loreUnread[id] ? '<span class="new">NIEUW</span>' : ''}${esc(interp(l.title))}</summary><div class="body">${formatText(l.text)}</div></details>`;
        });
        for (let i = found.length; i < all.length; i++) h += `<div class="lore-locked">??? — nog niet ontdekt</div>`;
      });
      body.innerHTML = h;
      $$('.lore-entry', body).forEach((d) => d.addEventListener('toggle', () => {
        if (d.open && state.loreUnread[d.dataset.lore]) {
          delete state.loreUnread[d.dataset.lore];
          const n = $('.new', d); if (n) n.remove();
          renderJournalDot();
        }
      }));
    } else {
      let h = `<div class="section-title">Relaties & eigenschappen</div>`;
      Object.keys(S.stats).forEach((id) => {
        const st = S.stats[id], v = state.stats[id] || 0, max = st.max || 5;
        const ch = S.characters[st.icon];
        if (ch && ch.expressions && !state.met[st.icon]) { h += `<div class="rel"><div class="avatar icon">?</div><div><h4>???</h4><small>Nog niet ontmoet</small></div></div>`; return; }
        h += `<div class="rel" style="--c:${ch ? ch.color : 'var(--gold)'}"><div class="avatar${ch ? '' : ' icon'}">${ch ? `<img data-av="${st.icon}" alt="">` : '🔥'}</div><div><h4>${esc(st.label)}</h4><div class="bar"><i style="width:${(v / max) * 100}%"></i></div><small>${v} / ${max}</small></div></div>`;
      });
      body.innerHTML = h;
      $$('img[data-av]', body).forEach((img) => { const c = S.characters[img.dataset.av]; A.character(img.dataset.av, c.defaultExpr).then((r) => (img.src = r.url)); });
    }
  }

  /* ---------- modals ---------- */
  function openModal(html, opts = {}) {
    el.modalContent.innerHTML = html;
    el.modalCard.classList.toggle('small', !!opts.small);
    el.modal.hidden = false;
    return el.modalContent;
  }
  function closeModal() { if (el.modal.hidden) return; el.modal.hidden = true; el.modalContent.innerHTML = ''; scheduleAuto(); }

  function confirmModal(title, text, okLabel = 'Ja') {
    return new Promise((resolve) => {
      const c = openModal(`<h2>${esc(title)}</h2><p class="sub">${esc(text)}</p><div class="row-actions"><button class="btn-ghost" data-r="0">Annuleren</button><button class="btn-primary" data-r="1">${esc(okLabel)}</button></div>`, { small: true });
      $$('[data-r]', c).forEach((b) => b.addEventListener('click', () => { closeModal(); resolve(b.dataset.r === '1'); }));
    });
  }

  function openNameModal() {
    const c = openModal(`<h2>Wie ben jij?</h2><p class="sub">Geef je hoofdpersoon een naam. Je kunt ook de standaardnaam houden.</p>
      <div class="field"><input type="text" id="name-input" maxlength="18" autocomplete="off" value="${esc(S.meta.defaultName)}"></div>
      <div class="row-actions"><button class="btn-ghost" data-action="close-modal">Annuleren</button><button class="btn-primary" id="name-go">Begin het verhaal</button></div>`, { small: true });
    const input = $('#name-input', c);
    setTimeout(() => { input.focus(); input.select(); }, 50);
    const go = () => { const n = input.value.trim() || S.meta.defaultName; closeModal(); startNewGame(n); };
    $('#name-go', c).addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  function openSettings() {
    const c = openModal(`<h2>Instellingen</h2><p class="sub">Worden automatisch bewaard in je browser.</p>
      <div class="field"><label>Tekstsnelheid <span id="ts-val"></span></label><input type="range" id="set-speed" min="0" max="60" step="2" value="${60 - settings.textSpeed}"></div>
      <div class="field"><label>Wachttijd bij Auto <span id="ad-val"></span></label><input type="range" id="set-auto" min="0.5" max="5" step="0.25" value="${settings.autoDelay}"></div>
      <label class="toggle"><span>Placeholder-labels tonen<small>Toont bestandsnaam en afmetingen op tijdelijke afbeeldingen.</small></span><input type="checkbox" id="set-ph" ${settings.phLabels ? 'checked' : ''}></label>
      <label class="toggle"><span>Minder beweging<small>Schakelt de meeste animaties en schermschuddingen uit.</small></span><input type="checkbox" id="set-rm" ${settings.reduceMotion ? 'checked' : ''}></label>
      <div class="row-actions"><button class="btn-sm danger" id="set-reset">Alle data wissen</button><button class="btn-primary" data-action="close-modal">Klaar</button></div>
      <p class="sub" style="margin-top:18px">Sneltoetsen: <b>Spatie/Enter</b> verder · <b>1–9</b> keuze · <b>M</b> kaart · <b>I</b> tas · <b>J</b> dagboek · <b>L</b> log · <b>A</b> auto · <b>S</b> skip · <b>H</b> interface verbergen · <b>Esc</b> sluiten</p>`, { small: true });
    const sp = $('#set-speed', c), ad = $('#set-auto', c);
    const upd = () => {
      settings.textSpeed = 60 - Number(sp.value);
      settings.autoDelay = Number(ad.value);
      settings.phLabels = $('#set-ph', c).checked;
      settings.reduceMotion = $('#set-rm', c).checked;
      $('#ts-val', c).textContent = settings.textSpeed === 0 ? 'Direct' : settings.textSpeed < 20 ? 'Snel' : settings.textSpeed < 40 ? 'Normaal' : 'Langzaam';
      $('#ad-val', c).textContent = settings.autoDelay + ' s';
      writeJSON(KEYS.settings, settings); applySettings();
    };
    [sp, ad, $('#set-ph', c), $('#set-rm', c)].forEach((i) => i.addEventListener('input', upd));
    upd();
    $('#set-reset', c).addEventListener('click', async () => {
      if (await confirmModal('Alle data wissen?', 'Dit verwijdert alle opgeslagen spellen, ontdekte eindes en instellingen.', 'Wissen')) {
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
        settings = Object.assign({}, DEFAULT_SETTINGS); applySettings();
        toast({ title: 'Gewist', text: 'Alle data is verwijderd.', icon: '🗑️' });
        refreshTitle();
      }
    });
  }

  function openSaveLoad(mode) {
    if (mode === 'save' && !canSave()) { toast({ title: 'Nu niet', text: 'Je kunt opslaan zodra de tekst of keuze in beeld is.', icon: '⏳' }); return; }
    const saves = readSaves();
    let h = `<h2>${mode === 'save' ? 'Opslaan' : 'Laden'}</h2><p class="sub">${mode === 'save' ? 'Kies een slot om je voortgang op te slaan.' : 'Kies een opgeslagen spel.'} Het spel slaat ook automatisch op bij elke nieuwe scène.</p><div class="slots">`;
    SAVE_SLOTS.forEach((slot) => {
      const sv = saves[slot];
      const label = slot === 'auto' ? 'Automatisch' : 'Slot ' + slot;
      if (sv) {
        h += `<div class="slot"><div class="thumb" data-thumb="${esc(sv.meta.bg || '')}"><span class="tag">${label}</span></div><div class="info"><h4>${esc(sv.meta.location)}</h4><p>${esc(sv.meta.chapter || '')}</p><p>${esc(sv.meta.name)} · ${fmtTime(sv.meta.playtime)} · ${fmtDate(sv.date)}</p>${sv.meta.snippet ? `<p style="font-style:italic;opacity:.8">“${esc(sv.meta.snippet)}…”</p>` : ''}</div>
          <div class="acts">${mode === 'save' ? (slot === 'auto' ? '' : `<button class="btn-sm primary" data-save="${slot}">Overschrijven</button>`) : `<button class="btn-sm primary" data-load="${slot}">Laden</button>`}<button class="btn-sm danger" data-del="${slot}">Verwijder</button></div></div>`;
      } else {
        h += `<div class="slot empty-slot"><div class="thumb">${label} — leeg</div><div class="info"><h4>—</h4><p>Nog niets opgeslagen.</p></div><div class="acts">${mode === 'save' && slot !== 'auto' ? `<button class="btn-sm primary" data-save="${slot}">Hier opslaan</button>` : ''}</div></div>`;
      }
    });
    h += `</div>`;
    const c = openModal(h);
    $$('[data-thumb]', c).forEach((t) => { if (t.dataset.thumb) A.background(t.dataset.thumb).then((r) => (t.style.backgroundImage = `url("${r.url}")`)); });
    $$('[data-save]', c).forEach((b) => b.addEventListener('click', async () => {
      const slot = b.dataset.save;
      if (saves[slot] && !(await confirmModal('Overschrijven?', `Slot ${slot} bevat al een opgeslagen spel.`, 'Overschrijven'))) return openSaveLoad('save');
      if (saveTo(slot, false)) toast({ title: 'Opgeslagen', text: `Slot ${slot} — ${locationLabel()}`, icon: '💾' });
      openSaveLoad('save');
    }));
    $$('[data-load]', c).forEach((b) => b.addEventListener('click', () => loadFromSlot(b.dataset.load)));
    $$('[data-del]', c).forEach((b) => b.addEventListener('click', async () => {
      if (!(await confirmModal('Verwijderen?', 'Dit opgeslagen spel wordt definitief verwijderd.', 'Verwijderen'))) return openSaveLoad(mode);
      const all = readSaves(); delete all[b.dataset.del]; writeJSON(KEYS.saves, all);
      refreshTitle(); openSaveLoad(mode);
    }));
  }

  function openLog() {
    if (!state) return;
    const items = state.backlog.slice(-120).map((b) => {
      if (b.kind === 'choice-log') return `<div class="log-item choice-log">${esc(b.text)}</div>`;
      const cls = b.kind === 'narration' ? 'narr' : b.kind === 'thought' ? 'thought' : '';
      return `<div class="log-item ${cls}">${b.who ? `<b style="color:${b.color || 'var(--gold)'}">${esc(b.who)}</b>` : ''}${formatText(b.text)}</div>`;
    }).join('');
    const c = openModal(`<h2>Geschiedenis</h2><p class="sub">Alles wat er tot nu toe gezegd is.</p><div class="log-list">${items || '<p class="empty">Nog niets.</p>'}</div>`);
    const list = $('.log-list', c); list.scrollTop = list.scrollHeight;
  }

  async function openMap() {
    if (!state) return;
    if (state.mode !== 'hub') { toast({ title: 'Nu niet', text: 'Je kunt reizen zodra het gesprek voorbij is.', icon: '🗺️' }); return; }
    const res = await A.map();
    let pins = '';
    Object.keys(S.locations).forEach((id) => {
      const L = S.locations[id]; if (!L.mapPos) return;
      const un = !!state.unlocked[id], cur = id === state.location;
      pins += `<button class="pin${cur ? ' current' : ''}${un ? '' : ' locked'}" data-loc="${id}" style="left:${L.mapPos.x}%;top:${L.mapPos.y}%"><span class="label">${un ? esc(L.name) : '???'}${un && L.subtitle ? `<small>${esc(L.subtitle)}</small>` : ''}</span><span class="marker"></span></button>`;
    });
    const c = openModal(`<h2>Kaart van Velmara</h2><p class="sub">Kies een bestemming. Nieuwe plekken verschijnen naarmate je meer ontdekt.</p>
      <div class="map-wrap" style="background-image:url('${res.url}')">${pins}${res.placeholder ? `<div class="ph-badge">${badgeHTML(res)}</div>` : ''}</div>
      <p class="map-help">Je bent nu in <b>${esc(locationLabel())}</b>.</p>`);
    $$('.pin[data-loc]', c).forEach((p) => p.addEventListener('click', () => {
      const id = p.dataset.loc;
      if (id === state.location) { closeModal(); return; }
      travel(id);
    }));
  }

  /* ---------- eindes ---------- */
  function showEnding(id) {
    const E = S.endings[id];
    if (!E) { console.error('[engine] Onbekend einde', id); return; }
    rt.waiting = null; rt.skip = false; rt.auto = false; updateControlButtons();
    hideChoices();
    state.mode = 'ending'; state.endingId = id;
    const meta = readMeta(); meta.endings[id] = true; writeJSON(KEYS.meta, meta);
    setTimeout(() => {
      hideChar('all');
      if (E.background) setBg(E.background);
      el.ending.hidden = false;
      el.game.classList.add('is-ending');
      $('#end-title').textContent = interp(E.title);
      $('#end-sub').textContent = interp(E.subtitle || '');
      $('#end-text').innerHTML = arr(E.text).map((p, i) => `<p style="animation-delay:${0.4 + i * 0.6}s">${formatText(p)}</p>`).join('');
      const found = Object.keys(meta.endings).filter((k) => S.endings[k]).length;
      const stats = Object.keys(S.stats).map((k) => `<div class="st"><b>${state.stats[k] || 0}</b>${esc(S.stats[k].label)}</div>`).join('');
      $('#end-stats').innerHTML = stats +
        `<div class="st"><b>${state.lore.length}/${Object.keys(S.lore).length}</b>Geheimen</div>` +
        `<div class="st"><b>${found}/${Object.keys(S.endings).length}</b>Eindes ontdekt</div>` +
        `<div class="st"><b>${fmtTime(state.playtime)}</b>Speeltijd</div>`;
      el.ending.scrollTop = 0;
    }, 1300);
  }

  /* ---------- titelscherm ---------- */
  function refreshTitle() {
    el.btnContinue.disabled = !latestSlot();
    const meta = readMeta();
    const found = Object.keys(meta.endings).filter((k) => S.endings[k]).length;
    el.tsFoot.textContent = `v${S.meta.version} · Eindes ontdekt: ${found}/${Object.keys(S.endings).length}`;
  }
  function showTitle() {
    el.game.classList.add('is-title');
    el.titleScreen.classList.remove('out');
    el.titleScreen.hidden = false;
    $('#ts-title').textContent = S.meta.title;
    $('#ts-sub').textContent = S.meta.subtitle;
    document.title = `${S.meta.title} — ${S.meta.subtitle}`;
    refreshTitle();
    setBg('title');
  }
  function leaveTitle() {
    el.game.classList.remove('is-title');
    el.titleScreen.classList.add('out');
  }
  async function toTitle() {
    closeModal(); closeDrawer();
    clearTimeout(rt.autoTimer); clearTimeout(rt.titleTimer);
    rt.waiting = null; rt.auto = rt.skip = false; updateControlButtons();
    await fadeOut();
    el.ending.hidden = true; el.game.classList.remove('is-ending'); el.titleCard.hidden = true;
    hideChoices(); el.text.innerHTML = ''; el.nameplate.hidden = true;
    if (state) hideChar('all'); else el.stage.innerHTML = '';
    setMode('scene');
    showTitle();
    fadeIn();
  }

  async function startNewGame(name) {
    await fadeOut();
    state = newState(name);
    rt.auto = rt.skip = false; updateControlButtons();
    el.stage.innerHTML = ''; el.ending.hidden = true; el.game.classList.remove('is-ending');
    leaveTitle();
    renderJournalDot();
    startScene(S.meta.startScene);
    startPlaytime();
    await wait(150);
    fadeIn();
  }

  /* ============================ 10. INPUT ============================ */
  function onAdvanceInput() {
    if (!state || isBlocked()) return;
    if (el.game.classList.contains('ui-hidden')) { el.game.classList.remove('ui-hidden'); return; }
    if (rt.waiting === 'text') { if (rt.typing) rt.finishType(); else advance(); }
  }

  const actions = {
    'new-game': () => openNameModal(),
    'continue': () => { const s = latestSlot(); if (s) loadFromSlot(s); },
    'load': () => openSaveLoad('load'),
    'save': () => openSaveLoad('save'),
    'settings': () => openSettings(),
    'map': () => openMap(),
    'inventory': () => openDrawer('inventory'),
    'journal': () => openDrawer('journal'),
    'log': () => openLog(),
    'hide': () => { if (state) el.game.classList.toggle('ui-hidden'); },
    'menu': async () => { if (await confirmModal('Terug naar het titelscherm?', 'Je voortgang wordt automatisch opgeslagen bij elke scène en locatie. Wil je zeker zijn, sla dan eerst handmatig op.', 'Naar titelscherm')) toTitle(); },
    'to-title': () => toTitle(),
    'auto': () => { rt.auto = !rt.auto; if (rt.auto) rt.skip = false; updateControlButtons(); scheduleAuto(); },
    'skip': () => { rt.skip = !rt.skip; if (rt.skip) { rt.auto = false; if (rt.typing) rt.finishType(); } updateControlButtons(); scheduleAuto(); },
    'close-modal': () => closeModal(),
    'close-drawer': () => closeDrawer()
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn && !btn.disabled) { e.stopPropagation(); const fn = actions[btn.dataset.action]; if (fn) fn(); return; }
    const tab = e.target.closest('.tab');
    if (tab) { rt.drawerTab = tab.dataset.tab; renderDrawer(); return; }
    if (e.target === el.modal) { closeModal(); return; }
    if (e.target.closest('#title-card')) { dismissTitleCard(); return; }
    if (e.target.closest('#drawer, #modal, #hud, #choices, .overlay, button, a, input')) return;
    if (el.drawer.classList.contains('open')) { closeDrawer(); return; }
    if (e.target.closest('#game')) onAdvanceInput();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') {
      if (!el.modal.hidden) closeModal();
      else if (el.drawer.classList.contains('open')) closeDrawer();
      else if (el.game.classList.contains('ui-hidden')) el.game.classList.remove('ui-hidden');
      return;
    }
    if (!el.modal.hidden || !el.titleScreen.classList.contains('out') || !state) return;
    if (!el.titleCard.hidden && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); dismissTitleCard(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!el.drawer.classList.contains('open')) onAdvanceInput(); return; }
    if (/^[1-9]$/.test(e.key)) {
      const i = Number(e.key) - 1;
      if (rt.waiting === 'choice' && rt.choiceOpts[i]) chooseOption(rt.choiceOpts[i]);
      else if (rt.waiting === 'hub' && rt.hubOpts[i]) rt.hubOpts[i]();
      return;
    }
    const map = { m: 'map', i: 'inventory', j: 'journal', l: 'log', h: 'hide', a: 'auto', s: 'skip' };
    if (map[k] && actions[map[k]]) { e.preventDefault(); actions[map[k]](); }
  });

  /* =========================== OPSTARTEN =========================== */
  function boot() {
    applySettings();
    if (window.validateStory) {
      const r = window.validateStory(S);
      r.warnings.forEach((w) => console.warn('[story]', w));
      r.errors.forEach((er) => console.error('[story]', er));
      if (r.errors.length) setTimeout(() => toast({ title: 'Verhaaldata', text: `${r.errors.length} fout(en) gevonden — zie console (F12).`, icon: '⚠️' }), 800);
    }
    showTitle();
    // Achtergronden van locaties alvast op de achtergrond voorbereiden
    setTimeout(() => Object.keys(S.backgrounds).forEach((id) => A.background(id)), 600);
  }

  // Kleine debug-API voor in de console: VN.state(), VN.jump('sceneId'), VN.give('item')
  window.VN = {
    state: () => state,
    jump: (id) => { if (!state) state = newState(S.meta.defaultName); leaveTitle(); startScene(id); },
    give: (id) => state && addItem(id),
    travel: (id) => state && (state.unlocked[id] = true, travel(id))
  };

  boot();
})();
