/* =====================================================================
 *  VELMARA — STORY VALIDATOR
 *  Controleert storyData.js op typfouten: onbekende scènes, labels,
 *  voorwerpen, lore, personages, expressies, achtergronden, enz.
 *  - In de browser: fouten verschijnen in de console (F12).
 *  - In Node:  node tools/validate.js
 * ===================================================================== */
(function (root) {
  'use strict';

  function validateStory(S) {
    const errors = [], warnings = [];
    const err = (where, msg) => errors.push(where + ': ' + msg);
    const warn = (where, msg) => warnings.push(where + ': ' + msg);
    const has = (obj, k) => obj && Object.prototype.hasOwnProperty.call(obj, k);
    const list = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

    if (!S || !S.scenes) { err('story', 'STORY_DATA ontbreekt of heeft geen scenes'); return { errors, warnings }; }
    if (!has(S.scenes, S.meta && S.meta.startScene)) err('meta.startScene', `onbekende scène "${S.meta && S.meta.startScene}"`);

    function checkCond(c, where) {
      if (!c) return;
      if (Array.isArray(c)) return c.forEach((x) => checkCond(x, where));
      Object.keys(c).forEach((k) => {
        const v = c[k];
        switch (k) {
          case 'flag': case 'notFlag': break;
          case 'item': case 'noItem': list(v).forEach((i) => has(S.items, i) || err(where, `voorwaarde: onbekend voorwerp "${i}"`)); break;
          case 'lore': list(v).forEach((i) => has(S.lore, i) || err(where, `voorwaarde: onbekende lore "${i}"`)); break;
          case 'stat': case 'statBelow': Object.keys(v).forEach((s) => has(S.stats, s) || err(where, `voorwaarde: onbekende stat "${s}"`)); break;
          case 'seen': list(v).forEach((s) => has(S.scenes, s) || err(where, `voorwaarde: onbekende scène "${s}"`)); break;
          case 'unlocked': list(v).forEach((s) => has(S.locations, s) || err(where, `voorwaarde: onbekende locatie "${s}"`)); break;
          case 'any': list(v).forEach((x) => checkCond(x, where)); break;
          case 'not': checkCond(v, where); break;
          default: warn(where, `onbekende voorwaarde-sleutel "${k}"`);
        }
      });
    }
    function checkEffects(list_, where) {
      list(list_).forEach((e) => {
        if (has(e, 'item') && !has(S.items, e.item)) err(where, `effect: onbekend voorwerp "${e.item}"`);
        if (has(e, 'removeItem') && !has(S.items, e.removeItem)) err(where, `effect: onbekend voorwerp "${e.removeItem}"`);
        if (has(e, 'lore') && !has(S.lore, e.lore)) err(where, `effect: onbekende lore "${e.lore}"`);
        if (has(e, 'stat') && !has(S.stats, e.stat)) err(where, `effect: onbekende stat "${e.stat}"`);
        if (has(e, 'unlock') && !has(S.locations, e.unlock)) err(where, `effect: onbekende locatie "${e.unlock}"`);
      });
    }
    function checkChar(id, expr, where) {
      const ch = S.characters[id];
      if (!ch) return err(where, `onbekend personage "${id}"`);
      if (expr && (!ch.expressions || !has(ch.expressions, expr))) err(where, `personage "${id}" heeft geen expressie "${expr}"`);
    }

    Object.keys(S.backgrounds || {}).forEach((id) => { if (!S.backgrounds[id].file) warn('backgrounds.' + id, 'geen bestandsnaam (file)'); });

    Object.keys(S.scenes).forEach((sid) => {
      const sc = S.scenes[sid], W = 'scene "' + sid + '"';
      if (!Array.isArray(sc.nodes) || !sc.nodes.length) return err(W, 'geen nodes');
      if (sc.location && !has(S.locations, sc.location)) err(W, `onbekende locatie "${sc.location}"`);
      if (sc.background && !has(S.backgrounds, sc.background)) err(W, `onbekende achtergrond "${sc.background}"`);
      const labels = {};
      sc.nodes.forEach((n, i) => { if (n.label) { if (labels[n.label] != null) err(W, `dubbel label "${n.label}"`); labels[n.label] = i; } });
      const jump = (lbl, where) => { if (lbl != null && !has(labels, lbl)) err(where, `onbekend label "${lbl}"`); };

      sc.nodes.forEach((n, i) => {
        const w = `${W} node #${i}${n.label ? ' (' + n.label + ')' : ''}`;
        checkCond(n.if, w); checkEffects(n.do, w);
        if (n.bg && !has(S.backgrounds, n.bg)) err(w, `onbekende achtergrond "${n.bg}"`);
        if (n.say) { if (!S.characters[n.say]) err(w, `onbekende spreker "${n.say}"`); else if (n.expr) checkChar(n.say, n.expr, w); if (n.text == null) err(w, 'say zonder text'); }
        if (n.think != null && n.expr) checkChar('protagonist', n.expr, w);
        if (n.show) checkChar(n.show, n.expr, w);
        if (n.hide && n.hide !== 'all' && !S.characters[n.hide]) err(w, `onbekend personage "${n.hide}"`);
        if (n.test) { checkCond(n.test, w); jump(n.goto, w); jump(n.else, w); }
        else if (n.goto != null) jump(n.goto, w);
        if (n.scene && !has(S.scenes, n.scene)) err(w, `onbekende scène "${n.scene}"`);
        if (n.travel && !has(S.locations, n.travel)) err(w, `onbekende locatie "${n.travel}"`);
        if (n.ending && !has(S.endings, n.ending)) err(w, `onbekend einde "${n.ending}"`);
        if (n.end && !sc.location) warn(w, 'end:true in een scène zonder location — de engine weet niet naar welke locatie terug te keren');
        if (n.choice) {
          if (!Array.isArray(n.choice) || !n.choice.length) err(w, 'choice is leeg');
          n.choice.forEach((o, j) => {
            const ww = w + ` keuze ${j + 1}`;
            if (!o.text) err(ww, 'keuze zonder text');
            checkCond(o.if, ww); checkCond(o.showIf, ww); checkEffects(o.do, ww);
            jump(o.goto, ww);
            if (o.scene && !has(S.scenes, o.scene)) err(ww, `onbekende scène "${o.scene}"`);
            if (o.ending && !has(S.endings, o.ending)) err(ww, `onbekend einde "${o.ending}"`);
          });
          if (n.choice.every((o) => o.if)) warn(w, 'alle keuzes hebben een voorwaarde — zorg dat er altijd minstens één beschikbaar is');
        }
      });
      const last = sc.nodes[sc.nodes.length - 1];
      if (!sc.location && !(last.scene || last.ending || last.travel || last.choice || last.goto)) warn(W, 'scène zonder location eindigt zonder scene/travel/ending');
    });

    Object.keys(S.locations || {}).forEach((lid) => {
      const L = S.locations[lid], W = 'location "' + lid + '"';
      if (!L.background || !has(S.backgrounds, L.background)) err(W, `onbekende achtergrond "${L.background}"`);
      if (!L.mapPos) warn(W, 'geen mapPos — locatie verschijnt niet op de kaart');
      list(L.arrive).forEach((a, i) => { if (!has(S.scenes, a.scene)) err(W + ` arrive #${i}`, `onbekende scène "${a.scene}"`); checkCond(a.if, W); });
      list(L.actions).forEach((a, i) => { if (!has(S.scenes, a.scene)) err(W + ` actie #${i}`, `onbekende scène "${a.scene}"`); checkCond(a.if, W); });
      list(L.present).forEach((p) => { checkChar(p.char, p.expr, W + ' present'); checkCond(p.if, W); });
      if (Array.isArray(L.description)) L.description.forEach((d) => checkCond(d.if, W));
    });

    Object.keys(S.endings || {}).forEach((eid) => {
      const e = S.endings[eid];
      if (e.background && !has(S.backgrounds, e.background)) err('ending "' + eid + '"', `onbekende achtergrond "${e.background}"`);
    });

    return { errors, warnings };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { validateStory };
  else root.validateStory = validateStory;
})(typeof window !== 'undefined' ? window : globalThis);
