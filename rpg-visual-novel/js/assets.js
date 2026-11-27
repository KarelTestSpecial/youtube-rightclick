/* =====================================================================
 *  VELMARA — ASSETS & PLACEHOLDERS
 *  ---------------------------------------------------------------------
 *  1. Probeert je eigen afbeelding te laden (bv. assets/backgrounds/bg_tavern.png,
 *     daarna ook .jpg / .jpeg / .webp met dezelfde naam).
 *  2. Bestaat die niet? Dan wordt er een sfeervolle SVG-placeholder
 *     gegenereerd, zodat het spel er meteen goed uitziet.
 *  Je hoeft hier dus niets aan te veranderen: zet gewoon je bestanden in
 *  de juiste map en herlaad de pagina.
 * ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------- helpers ---------------------------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = (typeof seed === 'string' ? hash(seed) : seed) >>> 0 || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  const f = (n) => Math.round(n * 10) / 10;
  const svgWrap = (w, h, defs, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
  const toDataUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  const commonDefs = `
    <filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
    <radialGradient id="glowW"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="vign" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".65"/></radialGradient>`;

  function stars(r, n, x0, y0, w, h, color = '#fff', maxR = 2.2) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + Math.pow(r(), 1.4) * h, rad = 0.4 + r() * maxR, o = 0.3 + r() * 0.7;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${color}" opacity="${f(o)}"/>`;
      if (rad > maxR * 0.85) s += `<path d="M${f(x - rad * 5)} ${f(y)}H${f(x + rad * 5)}M${f(x)} ${f(y - rad * 5)}V${f(y + rad * 5)}" stroke="${color}" stroke-width=".8" opacity="${f(o * 0.6)}"/>`;
    }
    return s;
  }
  function motes(r, n, x0, y0, w, h, color, maxR = 5, blur = true) {
    let s = `<g ${blur ? 'filter="url(#b4)"' : ''}>`;
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h, rad = 1 + r() * maxR;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad * 3)}" fill="${color}" opacity="${f(0.15 + r() * 0.25)}"/>`;
    }
    s += '</g>';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h, rad = 0.8 + r() * maxR * 0.5;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${color}" opacity="${f(0.5 + r() * 0.5)}"/>`;
    }
    return s;
  }
  function treeLayer(r, opts) {
    const { y, color, count, minW, maxW, top = -50, sway = 30, canopy = true, avoid = null } = opts;
    let s = `<g fill="${color}">`;
    for (let i = 0; i < count; i++) {
      const x = (i / count) * 2000 - 40 + r() * (2000 / count);
      const w = minW + r() * (maxW - minW);
      const lean = (r() - 0.5) * sway;
      if (avoid && x + w > avoid[0] && x - w < avoid[1]) continue;
      s += `<path d="M${f(x - w / 2)} ${y + 40} C ${f(x - w * 0.35 + lean * 0.3)} ${f(y * 0.6)}, ${f(x - w * 0.25 + lean)} ${f(y * 0.3)}, ${f(x - w * 0.22 + lean)} ${top} L ${f(x + w * 0.22 + lean)} ${top} C ${f(x + w * 0.25 + lean)} ${f(y * 0.3)}, ${f(x + w * 0.35 + lean * 0.3)} ${f(y * 0.6)}, ${f(x + w / 2)} ${y + 40} Z"/>`;
      // roots
      s += `<path d="M${f(x - w * 1.1)} ${y + 40} Q ${f(x - w * 0.5)} ${y - 10} ${f(x)} ${y - 30} Q ${f(x + w * 0.5)} ${y - 10} ${f(x + w * 1.1)} ${y + 40} Z"/>`;
      // a few branches
      const nb = 1 + Math.floor(r() * 3);
      for (let b = 0; b < nb; b++) {
        const by = top + 80 + r() * (y * 0.45);
        const dir = r() > 0.5 ? 1 : -1;
        const len = w * (1.5 + r() * 2.5);
        s += `<path d="M${f(x + lean * 0.5)} ${f(by)} q ${f(dir * len * 0.5)} ${f(-len * 0.2)} ${f(dir * len)} ${f(-len * 0.45)} l ${f(-dir * 6)} ${f(10)} q ${f(-dir * len * 0.5)} ${f(len * 0.25)} ${f(-dir * len + dir * 6)} ${f(len * 0.45 + 12)} Z"/>`;
      }
    }
    if (canopy) {
      for (let i = 0; i < 26; i++) {
        s += `<ellipse cx="${f(r() * 2000 - 40)}" cy="${f(top + r() * 120)}" rx="${f(120 + r() * 200)}" ry="${f(60 + r() * 90)}"/>`;
      }
    }
    s += '</g>';
    return s;
  }
  function fireflies(r, n, color = '#d8ffb0') {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 1920, y = 250 + r() * 700, rad = 2 + r() * 3.5;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad * 7)}" fill="url(#ffGlow)" opacity="${f(0.4 + r() * 0.5)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${color}"/>`;
    }
    return s;
  }

  /* ======================= BACKGROUND PLACEHOLDERS ======================= */
  const BG = {};

  BG.forest = function (variant) {
    const r = rng('forest' + (variant || ''));
    const defs = commonDefs + `
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a2328"/><stop offset=".35" stop-color="#14403d"/>
        <stop offset=".6" stop-color="#2d6a59"/><stop offset=".8" stop-color="#173a32"/><stop offset="1" stop-color="#07130f"/></linearGradient>
      <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ffd9" stop-opacity=".28"/><stop offset="1" stop-color="#e9ffd9" stop-opacity="0"/></linearGradient>
      <radialGradient id="ffGlow"><stop offset="0" stop-color="#e8ffb8" stop-opacity=".9"/><stop offset="1" stop-color="#e8ffb8" stop-opacity="0"/></radialGradient>
      <radialGradient id="runeGlow"><stop offset="0" stop-color="#7ff5e0" stop-opacity=".9"/><stop offset="1" stop-color="#7ff5e0" stop-opacity="0"/></radialGradient>
      <radialGradient id="doorGlow"><stop offset="0" stop-color="#fff4d0" stop-opacity="1"/><stop offset=".35" stop-color="#f7c66b" stop-opacity=".6"/><stop offset="1" stop-color="#5fe0d0" stop-opacity="0"/></radialGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16302a"/><stop offset="1" stop-color="#050c0a"/></linearGradient>`;
    let b = `<rect width="1920" height="1080" fill="url(#sky)"/>`;
    b += `<ellipse cx="1180" cy="430" rx="700" ry="380" fill="#bfffe0" opacity=".12" filter="url(#b60)"/>`;
    // light rays
    b += `<g opacity=".9">`;
    for (let i = 0; i < 7; i++) {
      const x = 900 + i * 110 + r() * 60, w = 40 + r() * 90;
      b += `<polygon points="${f(x)},-20 ${f(x + w)},-20 ${f(x + w - 380)},1080 ${f(x - 480)},1080" fill="url(#ray)" opacity="${f(0.25 + r() * 0.4)}"/>`;
    }
    b += `</g>`;
    b += treeLayer(r, { y: 760, color: '#2a5a50', count: 22, minW: 18, maxW: 40, top: -40 }).replace('<g ', '<g opacity=".55" ');
    b += `<rect y="560" width="1920" height="300" fill="#a8e0c8" opacity=".10" filter="url(#b30)"/>`;
    b += treeLayer(r, { y: 820, color: '#173a33', count: 14, minW: 40, maxW: 80, top: -60 });
    b += `<rect y="680" width="1920" height="220" fill="#b8f0d8" opacity=".08" filter="url(#b30)"/>`;
    // ground + path
    b += `<path d="M0 820 Q 480 780 960 800 T 1920 790 V1080 H0 Z" fill="url(#ground)"/>`;
    b += `<path d="M760 1080 C 860 960, 900 880, 960 820 C 1010 880, 1080 960, 1240 1080 Z" fill="#2b4a3c" opacity=".55"/>`;
    if (variant === 'stones') {
      b += `<ellipse cx="960" cy="860" rx="560" ry="110" fill="#7ff5e0" opacity=".08" filter="url(#b30)"/>`;
      b += `<rect x="900" y="200" width="120" height="700" fill="#7ff5e0" opacity=".07" filter="url(#b30)"/>`;
      const pos = [[520, 860, 0.85], [700, 800, 0.7], [880, 775, 0.6], [1050, 775, 0.6], [1230, 800, 0.7], [1410, 860, 0.85], [960, 930, 1.05]];
      pos.sort((a, c) => a[1] - c[1]).forEach(([x, y, s], i) => {
        const w = 70 * s, h = 210 * s;
        b += `<path d="M${f(x - w / 2)} ${y} L ${f(x - w * 0.42)} ${f(y - h * 0.8)} Q ${f(x)} ${f(y - h * 1.12)} ${f(x + w * 0.42)} ${f(y - h * 0.82)} L ${f(x + w / 2)} ${y} Z" fill="#3c4a48"/>`;
        b += `<path d="M${f(x - w / 2)} ${y} L ${f(x - w * 0.42)} ${f(y - h * 0.8)} Q ${f(x - w * 0.2)} ${f(y - h * 0.95)} ${f(x - w * 0.1)} ${f(y - h * 0.98)} L ${f(x - w * 0.15)} ${y} Z" fill="#56706a" opacity=".6"/>`;
        b += `<ellipse cx="${f(x)}" cy="${f(y - h * 0.15)}" rx="${f(w * 0.55)}" ry="${f(h * 0.12)}" fill="#3f6b45" opacity=".55"/>`;
        b += `<circle cx="${f(x)}" cy="${f(y - h * 0.55)}" r="${f(w * 0.9)}" fill="url(#runeGlow)" opacity=".55"/>`;
        b += `<path d="M${f(x - w * 0.12)} ${f(y - h * 0.7)} v ${f(h * 0.3)} M${f(x - w * 0.12)} ${f(y - h * 0.6)} l ${f(w * 0.22)} ${f(-h * 0.08)} M${f(x + w * 0.1)} ${f(y - h * 0.45)} l ${f(-w * 0.18)} ${f(h * 0.08)}" stroke="#aaffee" stroke-width="${f(3 * s)}" stroke-linecap="round" fill="none"/>`;
      });
    }
    if (variant === 'title') {
      b += `<circle cx="960" cy="610" r="420" fill="url(#doorGlow)" opacity=".75"/>`;
      b += `<path d="M860 830 V560 A100 110 0 0 1 1060 560 V830 Z" fill="#fff6dc"/>`;
      b += `<path d="M860 830 V560 A100 110 0 0 1 1060 560 V830 Z" fill="none" stroke="#3a2a1a" stroke-width="18"/>`;
      b += `<polygon points="860,830 1060,830 1400,1080 520,1080" fill="#ffe7a8" opacity=".18"/>`;
    }
    b += treeLayer(r, { y: 1000, color: '#040b09', count: 6, minW: 90, maxW: 170, top: -80, sway: 60, avoid: variant ? [640, 1280] : null });
    b += `<g>${fireflies(r, 34)}</g>`;
    b += `<rect width="1920" height="1080" fill="url(#vign)"/>`;
    return svgWrap(1920, 1080, defs, b);
  };
  BG.forest_stones = () => BG.forest('stones');
  BG.title = () => BG.forest('title');

  BG.archive = function (variant) {
    const r = rng('archive');
    const door = variant === 'door';
    const defs = commonDefs + `
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${door ? '#363849' : '#2c323c'}"/><stop offset="1" stop-color="#191c23"/></linearGradient>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5868"/><stop offset="1" stop-color="#232b36"/></linearGradient>
      <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd99a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd99a" stop-opacity="0"/></linearGradient>
      <radialGradient id="doorGlow"><stop offset="0" stop-color="#fff8e0" stop-opacity="1"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".7"/><stop offset=".65" stop-color="#6fe6d6" stop-opacity=".25"/><stop offset="1" stop-color="#6fe6d6" stop-opacity="0"/></radialGradient>
      <linearGradient id="spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".45"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient>`;
    let b = `<rect width="1920" height="1080" fill="url(#wall)"/>`;
    // window (back center-right)
    b += `<rect x="1080" y="130" width="380" height="560" fill="url(#win)"/>`;
    let rain = '';
    for (let i = 0; i < 90; i++) { const x = 1080 + r() * 380, y = 130 + r() * 560, l = 20 + r() * 40; rain += `<path d="M${f(x)} ${f(y)} l -6 ${f(l)}" stroke="#a9c3d8" stroke-width="1.4" opacity="${f(0.2 + r() * 0.4)}"/>`; }
    b += rain;
    b += `<path d="M1080 130 h380 v560 h-380 Z M1270 130 v560 M1080 410 h380" fill="none" stroke="#1a1e25" stroke-width="16"/>`;
    b += `<rect x="1060" y="690" width="420" height="22" fill="#1e2229"/>`;
    // fluorescent tube
    b += `<rect x="560" y="40" width="800" height="18" rx="9" fill="${door ? '#c7d0d8' : '#e8f6ff'}"/><ellipse cx="960" cy="60" rx="600" ry="70" fill="#dff2ff" opacity="${door ? '.08' : '.18'}" filter="url(#b30)"/>`;
    // shelves
    const shelf = (x, w) => {
      let s = `<rect x="${x}" y="120" width="${w}" height="800" fill="#1d2129"/>`;
      for (let k = 0; k < 6; k++) {
        const y = 150 + k * 125;
        s += `<rect x="${x + 10}" y="${y + 100}" width="${w - 20}" height="12" fill="#2b313b"/>`;
        let bx = x + 18;
        while (bx < x + w - 60) {
          const bw = 50 + r() * 70, bh = 60 + r() * 34;
          const c = ['#6b6152', '#5d5548', '#7a6e5c', '#4f5560', '#665c4c'][Math.floor(r() * 5)];
          s += `<rect x="${f(bx)}" y="${f(y + 100 - bh)}" width="${f(bw - 6)}" height="${f(bh)}" fill="${c}"/><rect x="${f(bx + bw * 0.25)}" y="${f(y + 100 - bh * 0.7)}" width="${f(bw * 0.4)}" height="12" fill="#d8d0bd" opacity=".55"/>`;
          bx += bw;
        }
      }
      return s;
    };
    b += shelf(60, 460) + shelf(1560, 360);
    b += `<text x="290" y="112" font-family="Georgia,serif" font-size="30" fill="#8b8f99" text-anchor="middle">14</text>`;
    b += `<text x="1740" y="112" font-family="Georgia,serif" font-size="30" fill="#8b8f99" text-anchor="middle">15</text>`;
    if (door) {
      b += `<circle cx="760" cy="560" r="520" fill="url(#doorGlow)"/>`;
      b += `<polygon points="640,880 880,880 1180,1080 340,1080" fill="url(#spill)"/>`;
      b += `<path d="M640 880 V470 A120 130 0 0 1 880 470 V880 Z" fill="#fff4d6"/>`;
      b += `<path d="M640 880 V470 A120 130 0 0 1 880 470 V880 Z" fill="none" stroke="#4a3320" stroke-width="22"/>`;
      b += `<path d="M640 600 h240 M640 760 h240" stroke="#4a3320" stroke-width="10" opacity=".5"/>`;
      b += `<circle cx="850" cy="690" r="9" fill="#4a3320"/>`;
      b += motes(r, 40, 500, 300, 560, 700, '#fff0c0', 4);
    }
    // floor
    b += `<rect y="880" width="1920" height="200" fill="#14171c"/>`;
    b += `<path d="M0 880 H1920" stroke="#262b33" stroke-width="4"/>`;
    // desk foreground
    b += `<rect x="1000" y="800" width="760" height="40" fill="#3b3229"/><rect x="1020" y="840" width="30" height="240" fill="#2a231d"/><rect x="1710" y="840" width="30" height="240" fill="#2a231d"/>`;
    b += `<rect x="1080" y="640" width="250" height="160" rx="8" fill="#20252c"/><rect x="1092" y="652" width="226" height="130" fill="#7d93a8" opacity=".55"/><rect x="1190" y="800" width="30" height="0"/>`;
    b += `<path d="M1380 800 l20 -16 h180 l-14 16 Z" fill="#e9e3d2"/><path d="M1390 784 l16 -14 h170 l-10 14 Z" fill="#d8d1bf"/>`;
    b += `<polygon points="1620,640 1660,640 1760,800 1520,800" fill="url(#lampCone)"/>`;
    b += `<path d="M1600 640 h80 l-15 -40 h-50 Z" fill="#2f3b33"/><rect x="1636" y="640" width="8" height="160" fill="#2a2a2a"/>`;
    b += `<rect width="1920" height="1080" fill="#3b4a60" opacity="${door ? '.05' : '.18'}"/>`;
    b += `<rect width="1920" height="1080" fill="url(#vign)"/>`;
    return svgWrap(1920, 1080, defs, b);
  };
  BG.archive_door = () => BG.archive('door');

  BG.tavern = function () {
    const r = rng('tavern');
    const defs = commonDefs + `
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c160c"/><stop offset=".6" stop-color="#4b2a17"/><stop offset="1" stop-color="#1c0e07"/></linearGradient>
      <radialGradient id="fire"><stop offset="0" stop-color="#fff0b0" stop-opacity="1"/><stop offset=".25" stop-color="#ffb347" stop-opacity=".8"/><stop offset=".6" stop-color="#ff6b1a" stop-opacity=".25"/><stop offset="1" stop-color="#ff6b1a" stop-opacity="0"/></radialGradient>
      <radialGradient id="lamp"><stop offset="0" stop-color="#ffe6a6" stop-opacity=".95"/><stop offset=".4" stop-color="#ffb04a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3b1f"/><stop offset="1" stop-color="#2a150a"/></linearGradient>`;
    let b = `<rect width="1920" height="1080" fill="url(#wall)"/>`;
    for (let x = 0; x < 1920; x += 64) b += `<rect x="${x}" y="0" width="62" height="900" fill="#000" opacity="${f(0.05 + r() * 0.12)}"/>`;
    // shelves w/ bottles left
    for (let k = 0; k < 3; k++) {
      const y = 260 + k * 150;
      b += `<rect x="80" y="${y}" width="620" height="16" fill="#2a1609"/>`;
      let x = 100;
      while (x < 660) {
        const h = 50 + r() * 60, w = 22 + r() * 18;
        const c = ['#3d6b4a', '#6b2a2a', '#8a6a2a', '#2a3d6b', '#5a3a6b'][Math.floor(r() * 5)];
        b += `<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" rx="5" fill="${c}"/><rect x="${f(x + w * 0.35)}" y="${f(y - h - 22)}" width="${f(w * 0.3)}" height="24" fill="${c}"/><rect x="${f(x + 4)}" y="${f(y - h + 8)}" width="4" height="${f(h - 16)}" fill="#fff" opacity=".25"/>`;
        x += w + 10 + r() * 14;
      }
    }
    // hearth
    b += `<circle cx="1450" cy="760" r="620" fill="url(#fire)" opacity=".55"/>`;
    b += `<path d="M1220 900 V520 Q1450 420 1680 520 V900 Z" fill="#3a3a40"/>`;
    for (let i = 0; i < 26; i++) { const x = 1230 + (i % 6) * 76 + (Math.floor(i / 6) % 2) * 38, y = 520 + Math.floor(i / 6) * 76; b += `<rect x="${x}" y="${y}" width="70" height="70" rx="8" fill="#4a4a52" opacity=".6"/>`; }
    b += `<path d="M1300 900 V640 Q1450 570 1600 640 V900 Z" fill="#120806"/>`;
    b += `<ellipse cx="1450" cy="860" rx="170" ry="60" fill="url(#fire)"/>`;
    b += `<path d="M1380 880 Q1390 780 1430 740 Q1420 800 1460 820 Q1470 760 1500 720 Q1520 800 1520 880 Z" fill="#ffb347"/>`;
    b += `<path d="M1410 880 Q1420 820 1445 790 Q1450 830 1470 840 Q1480 810 1495 790 Q1500 840 1495 880 Z" fill="#fff0b0"/>`;
    b += `<rect x="1180" y="500" width="540" height="30" fill="#2a1609"/>`;
    // beams
    b += `<rect y="0" width="1920" height="70" fill="#1a0d06"/><rect y="170" width="1920" height="44" fill="#1f1008"/>`;
    b += `<rect x="900" y="0" width="56" height="1080" fill="#1f1008"/><rect x="0" y="0" width="40" height="1080" fill="#1a0d06"/><rect x="1880" y="0" width="40" height="1080" fill="#1a0d06"/>`;
    // lanterns
    [[300, 300], [720, 340], [1130, 300], [1780, 320]].forEach(([x, y]) => {
      b += `<line x1="${x}" y1="214" x2="${x}" y2="${y - 40}" stroke="#120804" stroke-width="4"/>`;
      b += `<circle cx="${x}" cy="${y}" r="240" fill="url(#lamp)" opacity=".7"/>`;
      b += `<path d="M${x - 26} ${y - 40} h52 l8 70 h-68 Z" fill="#ffd27a"/><path d="M${x - 30} ${y - 46} h60 v10 h-60 Z M${x - 34} ${y + 30} h68 v10 h-68 Z" fill="#1a0d06"/>`;
    });
    // floor
    b += `<rect y="900" width="1920" height="180" fill="#1a0c05"/>`;
    for (let x = -200; x < 2100; x += 140) b += `<path d="M${x} 900 L${x - 160} 1080" stroke="#0e0603" stroke-width="3" opacity=".7"/>`;
    // bar counter
    b += `<path d="M0 760 H820 V1080 H0 Z" fill="url(#bar)"/><rect y="740" width="860" height="34" rx="6" fill="#8a5530"/><rect y="740" width="860" height="6" fill="#d9a066" opacity=".6"/>`;
    for (let x = 60; x < 820; x += 160) b += `<rect x="${x}" y="800" width="120" height="240" rx="6" fill="#000" opacity=".15"/>`;
    b += `<path d="M560 740 v-50 h30 v50 Z M600 740 v-36 q0 -16 18 -16 h20 q18 0 18 16 v36 Z" fill="#c9a36a" opacity=".85"/>`;
    // table silhouettes
    b += `<ellipse cx="1100" cy="930" rx="160" ry="30" fill="#2a150a"/><rect x="1090" y="930" width="20" height="110" fill="#1a0c05"/>`;
    b += `<ellipse cx="1760" cy="980" rx="180" ry="34" fill="#22110a"/><rect x="1750" y="980" width="20" height="100" fill="#140803"/>`;
    b += motes(r, 50, 0, 100, 1920, 800, '#ffd9a0', 3);
    b += `<rect width="1920" height="1080" fill="#ff9a40" opacity=".05"/>`;
    b += `<rect width="1920" height="1080" fill="url(#vign)"/>`;
    return svgWrap(1920, 1080, defs, b);
  };

  BG.ruins = function () {
    const r = rng('ruins');
    const defs = commonDefs + `
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#170f2b"/><stop offset=".32" stop-color="#43275a"/><stop offset=".55" stop-color="#b75d6c"/><stop offset=".7" stop-color="#f0a873"/><stop offset=".78" stop-color="#ffd59a"/></linearGradient>
      <radialGradient id="moon"><stop offset="0" stop-color="#fff6e2"/><stop offset=".6" stop-color="#ffe9c4"/><stop offset="1" stop-color="#ffe0b0" stop-opacity="0"/></radialGradient>
      <radialGradient id="heart"><stop offset="0" stop-color="#8ff7ee" stop-opacity=".9"/><stop offset="1" stop-color="#8ff7ee" stop-opacity="0"/></radialGradient>
      <linearGradient id="col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1a35"/><stop offset=".4" stop-color="#4d3550"/><stop offset="1" stop-color="#1c1124"/></linearGradient>`;
    let b = `<rect width="1920" height="1080" fill="url(#sky)"/>`;
    b += stars(r, 120, 0, 0, 1920, 420, '#fff', 1.8);
    b += `<circle cx="1460" cy="240" r="190" fill="url(#moon)" opacity=".6"/><circle cx="1460" cy="240" r="78" fill="#fff4dc"/>`;
    b += `<path d="M0 760 L180 640 L330 700 L520 560 L700 690 L880 610 L1080 720 L1260 600 L1460 690 L1680 590 L1920 700 V1080 H0 Z" fill="#6b3c63" opacity=".55"/>`;
    b += `<path d="M0 820 L240 720 L460 790 L700 700 L980 800 L1240 710 L1520 790 L1780 720 L1920 760 V1080 H0 Z" fill="#3f2446" opacity=".85"/>`;
    b += `<path d="M0 860 Q 500 800 960 830 T 1920 840 V1080 H0 Z" fill="#1d1226"/>`;
    // arch center
    b += `<path d="M700 860 V420 Q960 230 1220 420 V860 H1120 V470 Q960 340 800 470 V860 Z" fill="url(#col)"/>`;
    b += `<path d="M700 420 Q960 230 1220 420" fill="none" stroke="#6d4b6e" stroke-width="10"/>`;
    b += `<path d="M1080 330 l40 30 l-20 20 Z" fill="#170f1e"/>`;
    // columns
    const cols = [[120, 300, 90], [330, 470, 80], [1380, 360, 85], [1600, 250, 95], [1820, 520, 70], [560, 600, 60]];
    cols.forEach(([x, top, w]) => {
      b += `<path d="M${x} 880 V${top + 20} l${f(w * 0.25)} -24 l${f(w * 0.2)} 30 l${f(w * 0.3)} -18 l${f(w * 0.25)} 22 V880 Z" fill="url(#col)"/>`;
      for (let k = 1; k < 4; k++) b += `<path d="M${f(x + (w * k) / 4)} ${top + 30} V880" stroke="#170f1e" stroke-width="3" opacity=".6"/>`;
      b += `<rect x="${x - 14}" y="860" width="${w + 28}" height="24" fill="#1a1022"/>`;
      // vines
      let vp = `M${f(x + w * 0.2)} ${top + 40}`; let vy = top + 40;
      while (vy < 860) { vy += 40; vp += ` Q ${f(x + w * (0.1 + r() * 0.9))} ${f(vy - 20)} ${f(x + w * (0.2 + r() * 0.6))} ${f(vy)}`; }
      b += `<path d="${vp}" fill="none" stroke="#2e4a2e" stroke-width="5"/>`;
    });
    b += `<path d="M380 900 l90 -40 l120 10 l40 40 Z M1240 910 l60 -50 l110 6 l30 44 Z" fill="#26172e"/>`;
    b += `<circle cx="960" cy="830" r="260" fill="url(#heart)" opacity=".35"/>`;
    b += `<path d="M0 940 Q 960 880 1920 950 V1080 H0 Z" fill="#110a17"/>`;
    for (let i = 0; i < 70; i++) { const x = r() * 1920; b += `<path d="M${f(x)} 1080 q ${f((r() - 0.5) * 30)} ${f(-50 - r() * 60)} ${f((r() - 0.5) * 50)} ${f(-90 - r() * 80)}" stroke="#0b0710" stroke-width="4" fill="none"/>`; }
    b += motes(r, 40, 0, 300, 1920, 700, '#ffe0b8', 3);
    b += `<rect width="1920" height="1080" fill="url(#vign)"/>`;
    return svgWrap(1920, 1080, defs, b);
  };

  BG.ruins_gate = function () {
    const r = rng('gate');
    const defs = commonDefs + `
      <radialGradient id="hall" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#22365e"/><stop offset=".5" stop-color="#121c36"/><stop offset="1" stop-color="#05080f"/></radialGradient>
      <radialGradient id="ring"><stop offset="0" stop-color="#8ff7ee" stop-opacity=".35"/><stop offset="1" stop-color="#8ff7ee" stop-opacity="0"/></radialGradient>
      <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8ff" stop-opacity=".35"/><stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="pil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d1426"/><stop offset=".5" stop-color="#26375c"/><stop offset="1" stop-color="#0a1020"/></linearGradient>`;
    let b = `<rect width="1920" height="1080" fill="url(#hall)"/>`;
    for (let i = 0; i < 16; i++) b += `<path d="M960 880 L${f(-400 + i * 180)} 1080" stroke="#33466e" stroke-width="2" opacity=".35"/>`;
    b += `<rect y="880" width="1920" height="200" fill="#0b1222" opacity=".6"/>`;
    b += `<polygon points="860,-10 1060,-10 1260,1080 660,1080" fill="url(#shaft)"/>`;
    b += `<circle cx="960" cy="500" r="520" fill="url(#ring)"/>`;
    b += `<circle cx="960" cy="500" r="360" fill="#1a2440" stroke="#3d5280" stroke-width="10"/>`;
    [330, 270, 200].forEach((rad, i) => {
      b += `<circle cx="960" cy="500" r="${rad}" fill="none" stroke="#5fd8d0" stroke-width="${4 - i}" opacity="${0.35 + i * 0.15}"/>`;
      const n = 48 - i * 10;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, x1 = 960 + Math.cos(a) * (rad - 14), y1 = 500 + Math.sin(a) * (rad - 14), x2 = 960 + Math.cos(a) * (rad - 30), y2 = 500 + Math.sin(a) * (rad - 30);
        b += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="#7ff0e6" stroke-width="3" opacity="${f(0.25 + r() * 0.5)}"/>`;
      }
    });
    // three symbol medallions: tree, lantern, gate
    const med = (x, y, inner) => `<circle cx="${x}" cy="${y}" r="58" fill="#0f1830" stroke="#7ff0e6" stroke-width="4" opacity=".95"/><g stroke="#aaf7f0" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
    b += med(960, 340, `<path d="M960 372 V320 M960 340 l-20 -16 M960 330 l18 -14 M940 312 q20 -30 40 0"/>`);
    b += med(820, 590, `<path d="M808 568 h24 l4 40 h-32 Z M820 556 v12 M804 612 h32"/>`);
    b += med(1100, 590, `<path d="M1080 618 V580 a20 22 0 0 1 40 0 V618 Z"/>`);
    b += `<circle cx="960" cy="500" r="26" fill="#05080f" stroke="#c8d6f0" stroke-width="5"/><rect x="954" y="500" width="12" height="44" fill="#05080f"/>`;
    // pillars
    [[160, 200], [1580, 200]].forEach(([x, w]) => {
      b += `<rect x="${x}" y="60" width="${w}" height="840" fill="url(#pil)"/><rect x="${x - 30}" y="40" width="${w + 60}" height="50" fill="#1b2848"/><rect x="${x - 30}" y="880" width="${w + 60}" height="40" fill="#141e38"/>`;
      for (let k = 1; k < 5; k++) b += `<path d="M${x + (w * k) / 5} 90 V880" stroke="#0a1020" stroke-width="4" opacity=".6"/>`;
    });
    b += motes(r, 60, 600, 0, 720, 1000, '#d8f4ff', 3);
    b += `<rect width="1920" height="1080" fill="url(#vign)"/>`;
    return svgWrap(1920, 1080, defs, b);
  };

  BG.starwell = function () {
    const r = rng('starwell');
    const defs = commonDefs + `
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050f"/><stop offset=".4" stop-color="#0e1438"/><stop offset=".62" stop-color="#2b2156"/></linearGradient>
      <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1846"/><stop offset="1" stop-color="#03040c"/></linearGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#e6fbff" stop-opacity=".9"/><stop offset="1" stop-color="#9ff3ff" stop-opacity="1"/></linearGradient>
      <radialGradient id="src"><stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#bff7ff" stop-opacity=".8"/><stop offset=".6" stop-color="#7f8cff" stop-opacity=".2"/><stop offset="1" stop-color="#7f8cff" stop-opacity="0"/></radialGradient>
      <clipPath id="lakeClip"><rect x="0" y="650" width="1920" height="430"/></clipPath>`;
    const starField = stars(r, 340, 0, 0, 1920, 640, '#fff', 2.4);
    let b = `<rect width="1920" height="1080" fill="url(#sky)"/>`;
    b += `<g filter="url(#b60)" opacity=".55"><ellipse cx="560" cy="260" rx="520" ry="140" fill="#6a3fa0" transform="rotate(-18 560 260)"/><ellipse cx="1320" cy="200" rx="480" ry="120" fill="#2f7fa0" transform="rotate(12 1320 200)"/><ellipse cx="960" cy="420" rx="700" ry="110" fill="#8a4fb0" opacity=".6"/></g>`;
    b += starField;
    b += `<path d="M0 650 L140 600 L300 630 L460 580 L640 640 L800 610 L960 640 L1120 600 L1300 635 L1480 590 L1680 630 L1920 600 V660 H0 Z" fill="#0a0b1e"/>`;
    b += `<rect y="650" width="1920" height="430" fill="url(#lake)"/>`;
    b += `<g clip-path="url(#lakeClip)" opacity=".35"><g transform="translate(0 1300) scale(1 -1)">${starField}</g></g>`;
    for (let i = 0; i < 40; i++) { const y = 670 + r() * 400, x = r() * 1920, w = 60 + r() * 240; b += `<path d="M${f(x)} ${f(y)} h${f(w)}" stroke="#9fb8ff" stroke-width="1.5" opacity="${f(0.08 + r() * 0.18)}"/>`; }
    // source
    b += `<circle cx="960" cy="620" r="420" fill="url(#src)" opacity=".7"/>`;
    b += `<rect x="930" y="120" width="60" height="520" fill="url(#beam)" filter="url(#b12)"/>`;
    b += `<rect x="950" y="200" width="20" height="440" fill="url(#beam)"/>`;
    b += `<ellipse cx="960" cy="650" rx="140" ry="22" fill="#e6fbff" opacity=".8" filter="url(#b4)"/>`;
    b += `<rect x="935" y="660" width="50" height="320" fill="#bff7ff" opacity=".25" filter="url(#b12)"/>`;
    b += `<path d="M700 690 Q 960 640 1220 690 Q 960 720 700 690 Z" fill="#c8f6ff" opacity=".12"/>`;
    b += motes(r, 70, 600, 150, 720, 800, '#d0f8ff', 3);
    b += `<path d="M0 960 Q 300 900 560 940 Q 380 1000 0 1080 Z M1920 940 Q 1600 890 1340 950 Q 1560 1010 1920 1080 Z" fill="#05060f"/>`;
    b += `<rect width="1920" height="1080" fill="url(#vign)"/>`;
    return svgWrap(1920, 1080, defs, b);
  };

  /* ------------------------------ MAP ------------------------------ */
  function mapSvg() {
    const r = rng('map');
    const W = 1600, H = 1000;
    const defs = `
      <radialGradient id="paper" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#f3e6c6"/><stop offset=".7" stop-color="#e3cd9c"/><stop offset="1" stop-color="#b8935a"/></radialGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 7 H14" stroke="#6d8aa0" stroke-width="1.4" opacity=".5"/></pattern>`;
    const ink = '#4a3220';
    let b = `<rect width="${W}" height="${H}" fill="url(#paper)"/><rect width="${W}" height="${H}" filter="url(#grain)" fill="#000"/>`;
    // sea at right/bottom-right
    b += `<path d="M1600 560 C 1480 600, 1450 700, 1380 760 C 1300 830, 1340 920, 1260 1000 H1600 Z" fill="url(#hatch)" stroke="${ink}" stroke-width="3"/>`;
    // river
    b += `<path d="M560 0 C 600 160, 520 300, 640 420 C 720 500, 700 600, 752 690 C 800 780, 760 880, 820 1000" fill="none" stroke="#6d8aa0" stroke-width="10" opacity=".75"/>`;
    b += `<path d="M560 0 C 600 160, 520 300, 640 420 C 720 500, 700 600, 752 690 C 800 780, 760 880, 820 1000" fill="none" stroke="${ink}" stroke-width="1.5" opacity=".6"/>`;
    // forest
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 190;
      const x = 432 + Math.cos(a) * d * 1.3, y = 560 + Math.sin(a) * d * 0.8, s = 14 + r() * 10;
      b += `<path d="M${f(x)} ${f(y - s * 2)} L${f(x - s)} ${f(y)} H${f(x + s)} Z" fill="#5b7a4a" stroke="${ink}" stroke-width="1.6"/><path d="M${f(x)} ${f(y)} v${f(s * 0.5)}" stroke="${ink}" stroke-width="2"/>`;
    }
    // mountains
    for (let i = 0; i < 14; i++) {
      const x = 1000 + r() * 420, y = 220 + r() * 220, s = 40 + r() * 40;
      b += `<path d="M${f(x - s)} ${f(y)} L${f(x)} ${f(y - s * 1.4)} L${f(x + s)} ${f(y)} Z" fill="#c9b38a" stroke="${ink}" stroke-width="2"/><path d="M${f(x)} ${f(y - s * 1.4)} L${f(x + s * 0.3)} ${f(y)}" stroke="${ink}" stroke-width="1.2" opacity=".6"/>`;
    }
    // village
    for (let i = 0; i < 7; i++) {
      const x = 710 + (i % 4) * 28 + r() * 10, y = 670 + Math.floor(i / 4) * 30 + r() * 8;
      b += `<path d="M${f(x)} ${f(y)} v-14 l10 -10 l10 10 v14 Z" fill="#b2774a" stroke="${ink}" stroke-width="1.6"/>`;
    }
    // ruins pillars
    b += `<g stroke="${ink}" stroke-width="2" fill="#d9c7a0"><rect x="1150" y="300" width="12" height="40"/><rect x="1172" y="310" width="12" height="30"/><rect x="1194" y="296" width="12" height="44"/><path d="M1140 342 h76" /></g>`;
    // starwell sparkle
    b += `<g transform="translate(1344 170)"><path d="M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6 Z" fill="#e8d28a" stroke="${ink}" stroke-width="2"/></g>`;
    // paths
    b += `<path d="M432 560 Q 600 640 752 690 Q 960 560 1168 330 Q 1260 240 1344 170" fill="none" stroke="#7a2a1a" stroke-width="4" stroke-dasharray="14 12" opacity=".8"/>`;
    // compass rose
    b += `<g transform="translate(170 830)" stroke="${ink}" stroke-width="2"><circle r="70" fill="none"/><circle r="56" fill="none" opacity=".5"/><path d="M0 -90 L14 0 L0 90 L-14 0 Z" fill="#a8432a"/><path d="M-90 0 L0 14 L90 0 L0 -14 Z" fill="#e8d6ae"/><text y="-100" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="${ink}" stroke="none">N</text></g>`;
    // cartouche
    b += `<g transform="translate(80 70)"><rect width="380" height="110" rx="10" fill="#efe0bd" stroke="${ink}" stroke-width="3"/><text x="190" y="62" text-anchor="middle" font-family="Palatino Linotype,Book Antiqua,Georgia,serif" font-size="50" fill="${ink}" letter-spacing="6">VELMARA</text><text x="190" y="92" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="20" fill="${ink}">getekend door O.</text></g>`;
    b += `<rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${ink}" stroke-width="5"/><rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${ink}" stroke-width="1.5"/>`;
    return svgWrap(W, H, defs, b);
  }

  /* ====================== CHARACTER PLACEHOLDERS ====================== */
  function moodOf(e) {
    e = (e || '').toLowerCase();
    if (/laugh|lach/.test(e)) return 'laugh';
    if (/happy|smile|warm|blij/.test(e)) return 'happy';
    if (/surpris|verbaasd|shock/.test(e)) return 'surprised';
    if (/suspic|wantrouw/.test(e)) return 'suspicious';
    if (/determ|vastbe|serious|stern|angry|ernst/.test(e)) return 'determined';
    if (/sad|worr|bezorgd|verdriet/.test(e)) return 'sad';
    if (/dormant|sleep|slaap/.test(e)) return 'sleep';
    if (/awake|ontwaakt/.test(e)) return 'awake';
    return 'neutral';
  }

  function face(mood, p) {
    const hair = p.hair, eye = p.eyes || '#333';
    const L = 345, R = 455, EY = 455;
    let s = '';
    // brows
    const brow = (x, dy1, dy2, side) => `<path d="M${x - 30 * side} ${EY - 50 + dy1} Q ${x} ${EY - 62 + (dy1 + dy2) / 2} ${x + 30 * side} ${EY - 50 + dy2}" stroke="${shade(hair, -30)}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    const browsBy = {
      neutral: [0, 0, 0, 0], happy: [-4, -4, -4, -4], laugh: [-8, -6, -8, -6], surprised: [-16, -14, -16, -14],
      determined: [-6, 10, -6, 10], suspicious: [-2, 8, -18, -10], sad: [6, -10, 6, -10], sleep: [0, 0, 0, 0], awake: [0, 0, 0, 0]
    }[mood] || [0, 0, 0, 0];
    // left brow: outer->inner ; right brow: inner->outer mirrored
    s += brow(L, browsBy[0], browsBy[1], 1).replace(`M${L - 30}`, `M${L - 30}`);
    s += `<path d="M${R + 30} ${EY - 50 + browsBy[2]} Q ${R} ${EY - 62 + (browsBy[2] + browsBy[3]) / 2} ${R - 30} ${EY - 50 + browsBy[3]}" stroke="${shade(hair, -30)}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    // eyes
    const openEye = (x, ry, irisDy = 0, rx = 20) =>
      `<ellipse cx="${x}" cy="${EY}" rx="${rx + 4}" ry="${ry + 3}" fill="#fff" opacity=".95"/>` +
      `<ellipse cx="${x}" cy="${EY + irisDy}" rx="${Math.min(rx - 4, 15)}" ry="${Math.min(ry, 17)}" fill="${eye}"/>` +
      `<circle cx="${x}" cy="${EY + irisDy}" r="${Math.min(ry, 8)}" fill="#111"/>` +
      `<circle cx="${x + 6}" cy="${EY - 6 + irisDy}" r="4.5" fill="#fff"/>` +
      `<path d="M${x - rx - 6} ${EY - 2} Q ${x} ${EY - ry - 12} ${x + rx + 6} ${EY - 2}" stroke="#2a1a14" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const closedEye = (x, up = true) => `<path d="M${x - 22} ${EY + 2} Q ${x} ${EY + (up ? -18 : 12)} ${x + 22} ${EY + 2}" stroke="#2a1a14" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    switch (mood) {
      case 'laugh': s += closedEye(L) + closedEye(R); break;
      case 'happy': s += openEye(L, 14, 2) + openEye(R, 14, 2) + `<path d="M${L - 20} ${EY + 16} Q ${L} ${EY + 6} ${L + 20} ${EY + 16} M${R - 20} ${EY + 16} Q ${R} ${EY + 6} ${R + 20} ${EY + 16}" stroke="${shade(p.skin, -40)}" stroke-width="3" fill="none"/>`; break;
      case 'surprised': s += openEye(L, 24, 0, 22) + openEye(R, 24, 0, 22); break;
      case 'determined': s += openEye(L, 12, 2) + openEye(R, 12, 2); break;
      case 'suspicious': s += openEye(L, 9, 2) + openEye(R, 15, 1); break;
      case 'sad': s += openEye(L, 16, 5) + openEye(R, 16, 5); break;
      default: s += openEye(L, 18) + openEye(R, 18);
    }
    // nose
    s += `<path d="M400 480 q -8 30 4 40" stroke="${shade(p.skin, -45)}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    // blush
    if (/happy|laugh|surprised/.test(mood)) s += `<ellipse cx="320" cy="515" rx="30" ry="14" fill="#ff7a8a" opacity=".25"/><ellipse cx="480" cy="515" rx="30" ry="14" fill="#ff7a8a" opacity=".25"/>`;
    // mouth
    const MY = 560, lip = shade(p.skin, -70);
    const mouths = {
      neutral: `<path d="M375 ${MY} Q 400 ${MY + 6} 425 ${MY}" stroke="${lip}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
      happy: `<path d="M362 ${MY - 6} Q 400 ${MY + 30} 438 ${MY - 6}" stroke="${lip}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
      laugh: `<path d="M360 ${MY - 8} Q 400 ${MY - 2} 440 ${MY - 8} Q 432 ${MY + 40} 400 ${MY + 42} Q 368 ${MY + 40} 360 ${MY - 8} Z" fill="#5a2228"/><path d="M372 ${MY + 26} Q 400 ${MY + 14} 428 ${MY + 26} Q 414 ${MY + 40} 400 ${MY + 40} Q 386 ${MY + 40} 372 ${MY + 26} Z" fill="#d86a78"/>`,
      surprised: `<ellipse cx="400" cy="${MY + 8}" rx="15" ry="20" fill="#5a2228"/>`,
      determined: `<path d="M370 ${MY + 4} L 400 ${MY} L 430 ${MY + 4}" stroke="${lip}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      suspicious: `<path d="M372 ${MY + 4} Q 405 ${MY + 4} 432 ${MY - 8}" stroke="${lip}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
      sad: `<path d="M372 ${MY + 10} Q 400 ${MY - 10} 428 ${MY + 10}" stroke="${lip}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    };
    s += mouths[mood] || mouths.neutral;
    if (p.age) s += `<path d="M300 480 q 10 6 22 4 M478 484 q 12 2 22 -4 M362 590 q 38 14 76 0" stroke="${shade(p.skin, -35)}" stroke-width="2.5" fill="none" opacity=".6"/>`;
    return s;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function humanSvg(id, expr, p) {
    const mood = moodOf(expr);
    const defs = `
      <linearGradient id="outfit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.outfit, 25)}"/><stop offset="1" stop-color="${p.outfit2}"/></linearGradient>
      <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.skin, 12)}"/><stop offset="1" stop-color="${shade(p.skin, -18)}"/></linearGradient>
      <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.hair, 30)}"/><stop offset="1" stop-color="${shade(p.hair, -25)}"/></linearGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>`;
    let b = '';
    // back hair
    if (p.hairStyle === 'long') b += `<path d="M240 400 C 220 620, 200 820, 250 900 L 550 900 C 600 820, 580 620, 560 400 Z" fill="url(#hair)"/>`;
    if (p.hairStyle === 'bun') b += `<circle cx="400" cy="235" r="78" fill="url(#hair)"/><path d="M350 220 q 50 -40 100 0" stroke="${shade(p.hair, -30)}" stroke-width="5" fill="none"/>`;
    if (p.hood) b += `<path d="M190 520 C 180 300, 300 200, 400 200 C 500 200, 620 300, 610 520 L 640 800 L 160 800 Z" fill="${p.outfit2}"/>`;
    // body
    b += `<path d="M120 1200 C 120 940, 200 800, 330 770 L 470 770 C 600 800, 680 940, 680 1200 Z" fill="url(#outfit)"/>`;
    // neck
    b += `<path d="M345 590 L 345 790 Q 400 830 455 790 L 455 590 Z" fill="url(#skin)"/><path d="M345 700 Q 400 740 455 700 L 455 650 Q 400 700 345 650 Z" fill="#000" opacity=".12"/>`;
    // outfit details
    if (p.hood) b += `<path d="M200 820 C 260 760, 330 760, 400 830 C 470 760, 540 760, 600 820 L 660 1200 L 520 1200 L 400 900 L 280 1200 L 140 1200 Z" fill="${p.outfit2}" opacity=".9"/><circle cx="400" cy="850" r="18" fill="${p.accent}"/>`;
    else if (p.shawl) b += `<path d="M180 900 C 240 790, 330 780, 400 860 C 470 780, 560 790, 620 900 L 560 1000 Q 400 900 240 1000 Z" fill="${shade(p.accent, -40)}"/><path d="M300 1040 h200 v160 h-200 Z" fill="#e8dcc4" opacity=".85"/>`;
    else b += `<path d="M320 775 Q 400 860 480 775 L 500 800 Q 400 900 300 800 Z" fill="${shade(p.outfit, -25)}"/><path d="M290 800 C 330 840, 470 840, 510 800 L 520 830 C 470 880, 330 880, 280 830 Z" fill="${p.accent}" opacity=".85"/>`;
    // ears + head
    b += `<ellipse cx="268" cy="460" rx="22" ry="34" fill="${shade(p.skin, -10)}"/><ellipse cx="532" cy="460" rx="22" ry="34" fill="${shade(p.skin, -10)}"/>`;
    b += `<path d="M265 420 C 265 300, 330 260, 400 260 C 470 260, 535 300, 535 420 C 535 540, 480 630, 400 630 C 320 630, 265 540, 265 420 Z" fill="url(#skin)"/>`;
    b += face(mood, p);
    // front hair
    if (p.hairStyle === 'long') b += `<path d="M250 450 C 230 300, 310 230, 400 232 C 500 230, 575 300, 552 450 C 540 380, 500 330, 450 320 C 420 360, 360 380, 300 370 C 280 390, 262 420, 250 450 Z" fill="url(#hair)"/><path d="M262 430 C 240 560, 250 700, 290 780 L 300 560 Z M540 430 C 560 560, 552 700, 512 780 L 500 560 Z" fill="url(#hair)"/>`;
    if (p.hairStyle === 'short') b += `<path d="M258 430 C 240 300, 320 230, 405 236 C 500 232, 560 300, 545 430 L 520 360 L 490 390 L 470 340 L 430 380 L 405 330 L 370 378 L 345 335 L 315 385 L 290 350 Z" fill="url(#hair)"/>`;
    if (p.hairStyle === 'bun') b += `<path d="M262 430 C 250 310, 320 250, 400 252 C 480 250, 552 310, 538 430 C 520 360, 470 310, 400 312 C 330 310, 280 360, 262 430 Z" fill="url(#hair)"/>`;
    if (p.hood) b += `<path d="M215 520 C 210 330, 300 230, 400 228 C 500 230, 590 330, 585 520 C 575 380, 500 290, 400 290 C 300 290, 225 380, 215 520 Z" fill="${p.outfit}"/>`;
    // rim light (alleen op de rand van het silhouet)
    b += `<path d="M535 400 C 540 520, 490 625, 410 632 M600 820 C 650 880, 675 980, 680 1200" stroke="${p.accent}" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/>`;
    return svgWrap(800, 1200, defs, `<g>${b}</g>`).replace('preserveAspectRatio="xMidYMid slice"', 'preserveAspectRatio="xMidYMax meet"');
  }

  function golemSvg(id, expr, p) {
    const mood = moodOf(expr);
    const glow = mood === 'sleep' ? null : (/warm/.test(expr) ? '#ffd27a' : p.accent);
    const defs = `
      <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.stone, 20)}"/><stop offset="1" stop-color="${p.stone2}"/></linearGradient>
      <radialGradient id="g"><stop offset="0" stop-color="${glow || '#000'}" stop-opacity=".9"/><stop offset="1" stop-color="${glow || '#000'}" stop-opacity="0"/></radialGradient>
      <filter id="bl"><feGaussianBlur stdDeviation="8"/></filter>`;
    let b = '';
    b += `<path d="M40 1200 L 80 820 L 200 720 L 330 690 L 470 690 L 600 720 L 720 820 L 760 1200 Z" fill="url(#stone)"/>`;
    b += `<path d="M80 820 L 200 720 L 230 1200 L 60 1200 Z M720 820 L 600 720 L 570 1200 L 740 1200 Z" fill="#000" opacity=".18"/>`;
    b += `<path d="M300 690 L 330 600 L 470 600 L 500 690 Z" fill="${shade(p.stone, -10)}"/>`;
    // head
    b += `<path d="M260 380 L 300 250 L 400 210 L 500 250 L 540 380 L 520 560 L 460 620 L 340 620 L 280 560 Z" fill="url(#stone)"/>`;
    b += `<path d="M300 250 L 260 160 L 330 230 Z M500 250 L 540 160 L 470 230 Z" fill="${shade(p.stone, -15)}"/>`;
    b += `<path d="M300 420 L 500 420" stroke="#000" stroke-width="22" opacity=".25"/>`;
    // cracks + moss
    b += `<path d="M420 230 l -20 60 l 26 40 l -14 50 M180 820 l 50 80 l -20 70 l 40 90 M600 760 l -30 90 l 30 60" stroke="#1d1e2a" stroke-width="4" fill="none" opacity=".7"/>`;
    b += `<ellipse cx="300" cy="700" rx="90" ry="26" fill="${p.moss}" opacity=".8"/><ellipse cx="560" cy="250" rx="50" ry="18" fill="${p.moss}" opacity=".7"/><ellipse cx="660" cy="820" rx="60" ry="20" fill="${p.moss}" opacity=".7"/>`;
    // eyes
    if (glow) {
      b += `<ellipse cx="350" cy="420" rx="60" ry="30" fill="url(#g)"/><ellipse cx="450" cy="420" rx="60" ry="30" fill="url(#g)"/>`;
      b += `<path d="M320 420 h60 M420 420 h60" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`;
      b += `<path d="M320 420 h60 M420 420 h60" stroke="${glow}" stroke-width="16" stroke-linecap="round" opacity=".6" filter="url(#bl)"/>`;
      // chest runes
      b += `<circle cx="400" cy="900" r="120" fill="url(#g)" opacity=".7"/>`;
      b += `<g stroke="${glow}" stroke-width="7" fill="none" stroke-linecap="round"><circle cx="400" cy="900" r="70"/><path d="M400 840 v120 M350 880 l50 30 l50 -30"/></g>`;
    } else {
      b += `<path d="M322 424 q 28 10 56 0 M422 424 q 28 10 56 0" stroke="#1d1e2a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      b += `<g stroke="#2a2c3a" stroke-width="7" fill="none" opacity=".7"><circle cx="400" cy="900" r="70"/><path d="M400 840 v120 M350 880 l50 30 l50 -30"/></g>`;
    }
    return svgWrap(800, 1200, defs, b).replace('preserveAspectRatio="xMidYMid slice"', 'preserveAspectRatio="xMidYMax meet"');
  }

  /* ------------------------------ ITEMS ------------------------------ */
  function itemSvg(id, item) {
    const hue = hash(id) % 360;
    const defs = `<radialGradient id="ib" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="hsl(${hue},45%,38%)"/><stop offset="1" stop-color="hsl(${hue},40%,12%)"/></radialGradient>`;
    const b = `<rect x="8" y="8" width="240" height="240" rx="40" fill="url(#ib)" stroke="hsl(${hue},60%,70%)" stroke-opacity=".5" stroke-width="3"/>
      <circle cx="128" cy="118" r="80" fill="hsl(${hue},80%,70%)" opacity=".12"/>
      <text x="128" y="160" text-anchor="middle" font-size="120" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${item.glyph || '✦'}</text>`;
    return svgWrap(256, 256, defs, b);
  }

  /* ============================ RESOLVER ============================ */
  const cache = new Map();
  let STORY = null;

  function probe(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
  async function findFile(dir, file) {
    if (!STORY.meta || STORY.meta.probeAssets !== false) {
      const base = file.replace(/\.[a-z0-9]+$/i, '');
      const ext = (file.match(/\.[a-z0-9]+$/i) || ['.png'])[0];
      const candidates = [file, ...['.png', '.jpg', '.jpeg', '.webp'].filter((e) => e !== ext.toLowerCase()).map((e) => base + e)];
      for (const c of candidates) { if (await probe(dir + c)) return dir + c; }
    }
    return null;
  }
  async function resolve(key, dir, file, makeSvg, size) {
    if (cache.has(key)) return cache.get(key);
    const p = (async () => {
      const real = file ? await findFile(dir, file) : null;
      if (real) return { url: real, placeholder: false, file, size };
      return { url: toDataUri(makeSvg()), placeholder: true, file, size };
    })();
    cache.set(key, p);
    return p;
  }

  const api = {
    init(story) { STORY = story; },
    background(id) {
      const bg = STORY.backgrounds[id];
      if (!bg) { console.warn('[assets] Onbekende achtergrond:', id); return Promise.resolve({ url: '', placeholder: true, file: id }); }
      const size = bg.size || STORY.assetSizes.backgrounds;
      return resolve('bg:' + id, STORY.assetPaths.backgrounds, bg.file, () => (BG[bg.placeholder] || BG[id] || BG.forest)(), size);
    },
    character(id, expr) {
      const ch = STORY.characters[id];
      const file = ch && ch.expressions && ch.expressions[expr];
      const size = (ch && ch.size) || STORY.assetSizes.characters;
      const p = (ch && ch.placeholder) || { type: 'human', skin: '#e0c0a8', hair: '#333333', hairStyle: 'short', outfit: '#555577', outfit2: '#333344', accent: '#ffffff', eyes: '#333333' };
      return resolve('ch:' + id + ':' + expr, STORY.assetPaths.characters, file, () => (p.type === 'golem' ? golemSvg : humanSvg)(id, expr, p), size);
    },
    item(id) {
      const it = STORY.items[id];
      return resolve('it:' + id, STORY.assetPaths.items, it && it.icon, () => itemSvg(id, it || {}), STORY.assetSizes.items);
    },
    map() {
      const m = STORY.map || { file: 'map_world.png' };
      return resolve('map', STORY.assetPaths.ui, m.file, mapSvg, STORY.assetSizes.map);
    },
    preloadScene(scene) {
      if (scene && scene.background) api.background(scene.background);
    }
  };

  window.VNAssets = api;
})();
