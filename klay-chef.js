/* Klay — Chef Build (site-v6)
   Every menu item opens as an exploded "anatomy" (each ingredient floating, labelled),
   then an original cartoon chef in a KLAY apron walks in and builds it layer by layer.
   Ingredient names come only from the item's own description on orderklaydeli.com. */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#3A160E", BRICK = "#833A2A", SAND = "#DCC8A8", PAPER = "#F7F4E5", SKIN = "#EDB98E", HAIR = "#5A2E1E";
  const BASE = 520, CXA = 320, CXB = 410;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const f = n => Math.round(n * 10) / 10, f3 = n => Math.round(n * 1000) / 1000;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sk = (w = 2.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
  const lighten = (h, a) => h[0] !== "#" ? h : `rgb(${rgb(h).map(v => Math.round(v + (255 - v) * a)).join(",")})`;
  const darken = (h, a) => h[0] !== "#" ? h : `rgb(${rgb(h).map(v => Math.round(v * (1 - a))).join(",")})`;

  /* ---------- palette of ingredients ---------- */
  const C = {
    foc: "#E8AF63", crust: "#C67C36", crumb: "#F5DDA8",
    tpesto: "#C9502E", pesto: "#5F8F3A", bals: "#4A1F1A", olive: "#C9B03A", vin: "#D9B54A", tahini: "#E6CC98", buff: "#DA622B", tsauce: "#D2472C", brown: "#6A3418",
    bres: "#8E2A2E", bres2: "#C0484C", rbeef: "#8B4A3A", rbeef2: "#C8786A", sbeef: "#76312A", sbeef2: "#B0534A", turkey: "#E9BCA6", turkey2: "#F6D8C8",
    strac: "#FBF8EF", mozz: "#FFFDF4", feta: "#FAF6EA", goat: "#F6F2E6", melt: "#FFF2CF",
    aru: "#4F7F2E", lett: "#8DBB4C", basil: "#3E8E3A", tom: "#E04A33", onion: "#A8652B", cuc: "#6FA845", onionW: "#F3EEDF",
    tzat: "#EEF1E2", fig: "#7B3F5E", pist: "#9DBB4F", mayo: "#F6E9B8", labneh: "#F7F1E4", hummus: "#E3C88F", hazel: "#5B3020",
    chick: "#D8913A", beet: "#8A1F4A", potato: "#E3B04B", meatball: "#7B3B22", beefc: "#6B3420", gchick: "#E6B87A", tawook: "#E08A3C",
    pasta: "#F2D28A", msauce: "#9E3A22", bech: "#F6EED6", cheese: "#F2C14E", chipP: "#EDC15A", chipB: "#9A2453", dipB: "#C2457A", nut: "#B07A44"
  };
  const col = c => Array.isArray(c) ? c.map(col) : (C[c] || c);
  const LQ = {
    esp: { c: "#3B2015", top: "#B97A45", crema: 1 }, milk: { c: "#FAF6EC", top: "#FFFFFF" }, evap: { c: "#F2E6CC", top: "#F8F0DE" }, cond: { c: "#EEDDB2", top: "#F6EACB", gloss: 1 },
    foam: { c: "#FFFDF6", top: "#FFFFFF", foam: 1 }, froth: { c: "#E9D3B4", top: "#F6E7D0", foam: 1 }, ice: { ice: 1 },
    water: { c: "rgba(190,222,235,.6)", top: "rgba(226,242,248,.9)" }, hwater: { c: "rgba(214,232,238,.7)", top: "rgba(236,246,249,.9)" }, spark: { c: "rgba(190,222,235,.6)", top: "rgba(226,242,248,.9)", bub: 1 },
    choc: { c: "#4A2618", top: "#6A3A26", gloss: 1 }, wchoc: { c: "#F1E1C2", top: "#F8EEDA", gloss: 1 }, car: { c: "#C47A2C", top: "#DA9A4E", gloss: 1 }, bsc: { c: "#D99A3A", top: "#EBB867", gloss: 1 },
    honey: { c: "#E5A92A", top: "#F2C65A", gloss: 1 }, cin: { c: "#9A5A2E", top: "#B87444", gloss: 1 }, van: { c: "#F2E2B0", top: "#F8EDCB", gloss: 1 },
    salt: { c: "#FFFFFF", top: "#FFFFFF", flakes: 1 }, sweet: { c: "#FFF8E6", top: "#FFFFFF", flakes: 1 },
    matcha: { c: "#7BA23F", top: "#97BE57" }, smatcha: { c: "#8DB04E", top: "#A7C66B" }, mango: { c: "#F2A93B", top: "#F7C267", gloss: 1 }, straw: { c: "#E7677B", top: "#EF8B9B", gloss: 1 }, berry: { c: "#8E3B6E", top: "#A9528A", gloss: 1 },
    tea: { c: "#A2561E", top: "#BD7036" }, peach: { c: "#F2A27A", top: "#F7BC9C", gloss: 1 }, spice: { c: "#C08A5A", top: "#D4A274", specks: 1 }, shaken: { c: "#8A5A3A", top: "#A87452" },
    spr: { c: "#5B3020", top: "#74402B", gloss: 1 }
  };

  /* ---------- drawing helpers ---------- */
  function band(x0, x1, yt, yb, amp, n, r) {
    let d = `M${f(x0)},${f(yb)} Q${f(x0 - 5)},${f((yt + yb) / 2)} ${f(x0)},${f(yt)}`;
    for (let k = 1; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, xm = x0 + (x1 - x0) * (k - .5) / n; d += ` Q${f(xm)},${f(yt - amp * (r() * .8 + .4))} ${f(x)},${f(yt)}`; }
    d += ` Q${f(x1 + 5)},${f((yt + yb) / 2)} ${f(x1)},${f(yb)}`;
    for (let k = n - 1; k >= 0; k--) { const x = x0 + (x1 - x0) * k / n, xm = x0 + (x1 - x0) * (k + .5) / n; d += ` Q${f(xm)},${f(yb + amp * .6 * (r() * .8 + .4))} ${f(x)},${f(yb)}`; }
    return d + "Z";
  }
  const drip = (x, y, c, l = 10) => `<path d="M${f(x - 4)},${f(y - 2)} Q${f(x - 4.5)},${f(y + l * .8)} ${f(x)},${f(y + l)} Q${f(x + 4.5)},${f(y + l * .8)} ${f(x + 4)},${f(y - 2)} Z" fill="${c}" ${sk(2)}/>`;
  const lf = "M0,0 C5,-7 11,-9 15,-5 C17,-10 23,-10 25,-5 C29,-7 34,-4 35,0 C34,4 29,7 25,5 C23,10 17,10 15,5 C11,9 5,7 0,0Z";
  const bl = "M0,0 C7,-9 21,-10 28,0 C21,10 7,9 0,0Z";
  const cube = (x, y, s, c) => `<path d="M${f(x)},${f(y)} L${f(x + s * .28)},${f(y - s * .28)} H${f(x + s * 1.28)} L${f(x + s)},${f(y)} Z" fill="${lighten(c, .28)}" ${sk(2)}/><path d="M${f(x + s)},${f(y)} L${f(x + s * 1.28)},${f(y - s * .28)} V${f(y + s * .72)} L${f(x + s)},${f(y + s)} Z" fill="${darken(c, .16)}" ${sk(2)}/><rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="2.5" fill="${c}" ${sk(2)}/>`;
  const straw = (x1, y1, x2, y2) => { const d = `M${x1},${y1} L${x2},${y2}`; return `<g class="kc-straw"><path d="${d}" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="${d}" stroke="${BRICK}" stroke-width="10" stroke-linecap="round"/><path d="${d}" stroke="${PAPER}" stroke-width="10" stroke-dasharray="8 10"/></g>`; };

  /* ---------- solid layers: drawn with bottom-centre at (0,0), growing upward ---------- */
  const D = {
    breadB(w, h, c, r) {
      let s = `<rect x="${f(-w / 2)}" y="${-h}" width="${w}" height="${h}" rx="13" fill="${C.crust}" ${sk(3)}/><rect x="${f(-w / 2 + 6)}" y="${-h + 4}" width="${w - 12}" height="${f(h * .45)}" rx="6" fill="${C.crumb}"/>`;
      for (let k = 0; k < 11; k++) s += `<ellipse cx="${f(-w / 2 + 16 + (w - 32) * r())}" cy="${f(-h + 6 + h * .3 * r())}" rx="${f(2 + r() * 2.5)}" ry="${f(1.4 + r() * 1.2)}" fill="#DDB574"/>`;
      return s + `<path d="M${f(-w / 2 + 16)},-7 H${f(w / 2 - 16)}" stroke="#A35F26" stroke-width="3" stroke-linecap="round" opacity=".4"/>`;
    },
    breadT(w, h, c, r) {
      const d = `M${f(-w / 2)},0 L${f(-w / 2)},${f(-h * .42)} Q${f(-w / 2)},${-h} ${f(-w / 2 + 30)},${-h} L${f(w / 2 - 30)},${-h} Q${f(w / 2)},${-h} ${f(w / 2)},${f(-h * .42)} L${f(w / 2)},0 Z`;
      let s = `<path d="${d}" fill="${C.foc}" ${sk(3)}/><rect x="${f(-w / 2 + 3)}" y="-9" width="${w - 6}" height="7" fill="${C.crumb}"/>`;
      for (let k = 0; k < 13; k++) { const x = (r() * 2 - 1) * (w / 2 - 28), y = -h + 9 + r() * h * .42; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(4 + r() * 2.5)}" ry="${f(2.2 + r())}" fill="#C98A40"/><ellipse cx="${f(x - 1)}" cy="${f(y - 1)}" rx="1.6" ry="1" fill="#F6D9A0"/>`; }
      s += `<path d="M${f(-w / 2 + 26)},${-h + 7} Q0,${-h + 1} ${f(w / 2 - 44)},${-h + 7}" stroke="#FFF3D6" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
      for (let k = 0; k < 7; k++) { const x = (r() * 2 - 1) * (w / 2 - 34), y = -h + 12 + r() * h * .4; s += `<path d="M${f(x)},${f(y)} l${f(5 + r() * 3)},${f(-2 - r() * 3)}" stroke="#4E6B2C" stroke-width="2.4" stroke-linecap="round"/>`; }
      for (let k = 0; k < 9; k++) s += `<rect x="${f((r() * 2 - 1) * (w / 2 - 30))}" y="${f(-h + 8 + r() * h * .45)}" width="2.6" height="2.6" fill="#fff" opacity=".9"/>`;
      return s;
    },
    smear(w, h, c, r) { return drip(-w * .3, -2, c) + drip(w * .22, -2, c, 8) + `<path d="${band(-w / 2 - 6, w / 2 + 6, -h, 0, 2.5, 8, r)}" fill="${c}" ${sk(2.2)}/>`; },
    spread(w, h, c, r) { return drip(-w * .26, -3, c, 12) + drip(w * .3, -3, c, 9) + `<path d="${band(-w / 2 - 4, w / 2 + 4, -h, 0, 3.5, 7, r)}" fill="${c}" ${sk(2.4)}/><path d="M${f(-w * .3)},${f(-h * .6)} q20,-4 40,0" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>`; },
    meat(w, h, c, r, key) {
      const c2 = C[key + "2"] || lighten(c, .3), m = Math.max(5, Math.round(w / 30)), span = w + 18, rx = span / m * .7; let s = "";
      for (let k = 0; k < m; k++) { const x = -span / 2 + span * (k + .5) / m, ry = h / 2 * (.85 + r() * .3), cy = -h / 2 + (r() - .5) * 3; s += `<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}" ${sk(2.4)}/><path d="M${f(x - rx * .55)},${f(cy + ry * .15)} Q${f(x)},${f(cy - ry * .75)} ${f(x + rx * .55)},${f(cy + ry * .15)}" fill="none" stroke="${c2}" stroke-width="2.6" stroke-linecap="round"/>`; }
      return s;
    },
    creamy(w, h, c, r) {
      let s = `<path d="${band(-w / 2 - 2, w / 2 + 2, -h * .5, 0, 2, 9, r)}" fill="${darken(c, .07)}" ${sk(2.2)}/>`;
      const m = Math.round(w / 24);
      for (let k = 0; k < m; k++) { const x = -w / 2 + 10 + (w - 20) * k / (m - 1) + (r() - .5) * 8, rr = h * (.42 + r() * .24), cy = -h * .42 - r() * h * .18; s += `<path d="M${f(x - rr)},${f(cy + rr * .45)} C${f(x - rr * 1.05)},${f(cy - rr * 1.15)} ${f(x + rr * 1.05)},${f(cy - rr * 1.15)} ${f(x + rr)},${f(cy + rr * .45)} Z" fill="${c}" ${sk(2.2)}/><path d="M${f(x - rr * .45)},${f(cy - rr * .15)} q${f(rr * .4)},${f(-rr * .45)} ${f(rr * .8)},0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; }
      return s;
    },
    melt(w, h, c, r) { return drip(-w * .36, -4, c, 14) + drip(w * .12, -4, c, 11) + drip(w * .4, -4, c, 9) + D.creamy(w, h, c, r); },
    rounds(w, h, c, r, key) {
      const m = Math.max(4, Math.round(w / 34)), tom = key === "tom"; let s = "";
      for (let k = 0; k < m; k++) {
        const x = -w / 2 + w * (k + .5) / m, rx = w / m * .64, rot = f((r() - .5) * 14);
        s += `<g transform="rotate(${rot} ${f(x)} ${f(-h / 2)})"><ellipse cx="${f(x)}" cy="${f(-h / 2)}" rx="${f(rx)}" ry="${f(h / 2)}" fill="${c}" ${sk(2.4)}/>`;
        s += tom ? `<ellipse cx="${f(x)}" cy="${f(-h / 2)}" rx="${f(rx * .62)}" ry="${f(h * .26)}" fill="#F26B50"/><circle cx="${f(x - rx * .25)}" cy="${f(-h / 2)}" r="1.8" fill="#F6C34F"/><circle cx="${f(x + rx * .25)}" cy="${f(-h / 2)}" r="1.8" fill="#F6C34F"/></g>` : `<ellipse cx="${f(x - rx * .3)}" cy="${f(-h * .66)}" rx="${f(rx * .3)}" ry="1.8" fill="#fff"/></g>`;
      }
      return s;
    },
    cherry(w, h, c, r) {
      let s = ""; const m = Math.round(w / 30);
      for (let k = 0; k < m; k++) { const x = -w / 2 + 14 + (w - 28) * k / (m - 1) + (r() - .5) * 6, cy = -h * .5 + (r() - .5) * 5, rr = h * .52; s += `<circle cx="${f(x)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" ${sk(2.3)}/><circle cx="${f(x)}" cy="${f(cy)}" r="${f(rr * .6)}" fill="#F26B50"/><circle cx="${f(x - 2.5)}" cy="${f(cy + 1)}" r="1.6" fill="#F6C34F"/><circle cx="${f(x + 2.5)}" cy="${f(cy - 1)}" r="1.6" fill="#F6C34F"/><path d="M${f(x - rr * .5)},${f(cy - rr * .55)} q4,-3 8,-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`; }
      return s;
    },
    leaves(w, h, c, r, key) {
      const lett = key === "lett"; let s = `<path d="${band(-w / 2 + 6, w / 2 - 6, -h * .75, 0, lett ? 5 : 3, lett ? 12 : 9, r)}" fill="${c}" ${sk(2.2)}/>`;
      for (let k = 0; k < 13; k++) {
        const x = (r() * 2 - 1) * (w / 2 + 6), y = -h * (.25 + .55 * r()), out = Math.abs(x) > w * .3;
        const ang = out ? (x < 0 ? 180 : 0) + (r() - .5) * 60 : -90 + (r() - .5) * 90, sc = lett ? 1.1 : .9 + r() * .3;
        s += `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)}) scale(${f3(sc)})"><path d="${lf}" fill="${k % 3 ? c : lighten(c, .2)}" ${sk(2)}/><path d="M3,0 L30,0" stroke="${darken(c, .28)}" stroke-width="1.4"/></g>`;
      }
      return s;
    },
    herbs(w, h, c, r) {
      let s = "";
      for (let k = 0; k < 7; k++) { const x = -w / 2 + 10 + (w - 20) * k / 6, ang = k % 2 ? -150 + r() * 40 : -30 - r() * 40; s += `<g transform="translate(${f(x)},${f(-h * .4)}) rotate(${f(ang)}) scale(1.05)"><path d="${bl}" fill="${k % 2 ? c : lighten(c, .15)}" ${sk(2)}/><path d="M3,0 L24,0" stroke="${darken(c, .3)}" stroke-width="1.4"/></g>`; }
      return s;
    },
    crumble(w, h, c, r) {
      let s = "";
      for (let k = 0; k < 15; k++) { const x = (r() * 2 - 1) * (w / 2 - 4), y = -4 - r() * (h - 6), z = 8 + r() * 5; s += `<rect x="${f(x - z / 2)}" y="${f(y - z / 2)}" width="${f(z)}" height="${f(z)}" rx="2" fill="${k % 4 ? c : darken(c, .06)}" ${sk(2)} transform="rotate(${f((r() - .5) * 50)} ${f(x)} ${f(y)})"/>`; }
      return s;
    },
    onion(w, h, c, r) {
      let s = `<path d="${band(-w / 2 + 4, w / 2 - 4, -h, 0, 2.5, 10, r)}" fill="${c}" ${sk(2)}/>`;
      for (let k = 0; k < 6; k++) { const x = -w / 2 + 14 + (w - 50) * r(); s += `<path d="M${f(x)},${f(-h * .5)} q6,-5 12,0 t12,0 t12,0" fill="none" stroke="${darken(c, .32)}" stroke-width="2" stroke-linecap="round"/>`; }
      return s;
    },
    drizzle(w, h, c, r) {
      let d = ""; const n = Math.round((w - 24) / 20);
      for (let k = 0; k <= n; k++) { const x = -w / 2 + 12 + (w - 24) * k / n, y = (k % 2 ? -h + 1 : -1) + (r() - .5) * 3; d += (k ? " L" : "M") + f(x) + "," + f(y); }
      return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` + drip(-w / 2 + 12, -1, c, 9) + drip(w / 2 - 12, -1, c, 7);
    },
    crispy(w, h, c, r) {
      const p = [], st = 13;
      for (let x = -w / 2; x <= w / 2; x += st) p.push([x, -h + (r() - .5) * 8]);
      p.push([w / 2 + 4, -h * .5]);
      for (let x = w / 2; x >= -w / 2; x -= st) p.push([x, (r() - .5) * 4]);
      p.push([-w / 2 - 4, -h * .5]);
      let s = `<path d="M${p.map(q => f(q[0]) + "," + f(q[1])).join(" L")}Z" fill="${c}" ${sk(2.6)}/>`;
      for (let k = 0; k < 28; k++) s += `<circle cx="${f((r() * 2 - 1) * (w / 2 - 8))}" cy="${f(-4 - r() * (h - 8))}" r="${f(1.4 + r() * 1.8)}" fill="${k % 2 ? "#B86E2A" : "#F2B85E"}"/>`;
      return s;
    },
    cubes(w, h, c, r) {
      const cs = [].concat(c), s0 = h * .5; let s = "", k = 0;
      [0, 1].forEach(row => { const y = row ? -s0 * 1.8 : -s0 - 1, n = Math.floor((w - (row ? s0 : 0)) / (s0 * 1.32)); for (let m = 0; m < n; m++) { const x = -w / 2 + (row ? s0 * .7 : 0) + m * s0 * 1.32 + (r() - .5) * 4; s += cube(x, y, s0 * (.9 + r() * .2), cs[k++ % cs.length]); } });
      return s;
    },
    balls(w, h, c, r) {
      const rr = h / 2, n = Math.max(3, Math.floor(w / (rr * 2.05))); let s = "";
      for (let k = 0; k < n; k++) { const x = -w / 2 + rr + (w - rr * 2) * k / (n - 1), cy = -rr + (r() - .5) * 3; s += `<circle cx="${f(x)}" cy="${f(cy)}" r="${f(rr)}" fill="${c}" ${sk(2.4)}/><ellipse cx="${f(x - rr * .3)}" cy="${f(cy - rr * .35)}" rx="${f(rr * .32)}" ry="${f(rr * .2)}" fill="#fff" opacity=".35"/><circle cx="${f(x + rr * .2)}" cy="${f(cy + rr * .1)}" r="1.6" fill="${darken(c, .35)}"/>`; }
      return s;
    },
    strips(w, h, c, r) {
      const n = Math.max(3, Math.round(w / 44)); let s = "";
      for (let k = 0; k < n; k++) { const x = -w / 2 + (w - 50) * k / (n - 1), y = -h * .85, rot = f((r() - .5) * 16); s += `<g transform="rotate(${rot} ${f(x + 25)} ${f(y + h * .4)})"><rect x="${f(x)}" y="${f(y)}" width="52" height="${f(h * .78)}" rx="${f(h * .36)}" fill="${c}" ${sk(2.4)}/>`; for (let g = 0; g < 3; g++) s += `<path d="M${f(x + 12 + g * 12)},${f(y + 3)} l7,${f(h * .62)}" stroke="${darken(c, .5)}" stroke-width="3" stroke-linecap="round"/>`; s += "</g>"; }
      return s;
    },
    peppers(w, h, c, r) {
      const cs = ["#D63A2A", "#5C9A35", "#F2C230"]; let s = "";
      for (let k = 0; k < 12; k++) { const x = (r() * 2 - 1) * (w / 2 - 18), y = -h * (.2 + .6 * r()); s += `<rect x="${f(x - 17)}" y="${f(y - 4.5)}" width="34" height="9" rx="4.5" fill="${cs[k % 3]}" ${sk(2)} transform="rotate(${f((r() - .5) * 60)} ${f(x)} ${f(y)})"/>`; }
      return s;
    },
    dust(w, h, c, r) {
      const cs = [].concat(c); let s = "";
      for (let k = 0; k < 36; k++) s += `<circle cx="${f((r() * 2 - 1) * w * .45)}" cy="${f(-r() * h)}" r="${f(1.5 + r() * 1.3)}" fill="${cs[k % cs.length]}" stroke="${INK}" stroke-width=".6"/>`;
      return s;
    },
    pasta(w, h, c, r) { return `<path d="${band(-w / 2, w / 2, -h, 0, 3, 11, r)}" fill="${c}" ${sk(2.2)}/><path d="M${f(-w / 2 + 10)},${f(-h * .45)} H${f(w / 2 - 10)}" stroke="#FBE5B0" stroke-width="2" stroke-linecap="round"/>`; },
    msauce(w, h, c, r) { let s = `<path d="${band(-w / 2 - 3, w / 2 + 3, -h, 0, 2.5, 9, r)}" fill="${c}" ${sk(2.2)}/>`; for (let k = 0; k < 18; k++) s += `<circle cx="${f((r() * 2 - 1) * (w / 2 - 8))}" cy="${f(-2 - r() * (h - 4))}" r="${f(1.5 + r() * 1.5)}" fill="${darken(c, .35)}"/>`; return s; },
    bech(w, h, c, r) { return `<path d="${band(-w / 2 - 2, w / 2 + 2, -h, 0, 1.6, 8, r)}" fill="${c}" ${sk(2)}/>`; },
    cheese(w, h, c, r) { let s = `<path d="${band(-w / 2, w / 2, -h, 0, 3, 10, r)}" fill="${c}" ${sk(2.3)}/>`; for (let k = 0; k < 10; k++) s += `<ellipse cx="${f((r() * 2 - 1) * (w / 2 - 12))}" cy="${f(-h * (.3 + .5 * r()))}" rx="${f(3 + r() * 4)}" ry="${f(1.6 + r() * 1.5)}" fill="#C98A2E"/>`; return s; },
    chips(w, h, c, r, key) {
      let s = ""; const beet = key === "chipB";
      for (let k = 0; k < 24; k++) { const t = k / 23, yy = h * t * .8, half = (w / 2) * (1 - t * .7), x = (r() * 2 - 1) * half, a = f((r() - .5) * 70); s += `<g transform="translate(${f(x)},${f(-yy - 11)}) rotate(${a})"><ellipse rx="19" ry="11" fill="${c}" ${sk(2)}/>${beet ? `<ellipse rx="12" ry="6.5" fill="none" stroke="${lighten(c, .35)}" stroke-width="1.8"/>` : `<path d="M-12,-3 Q0,-8 12,-3 M-13,3 Q0,-2 13,3" stroke="${darken(c, .18)}" stroke-width="1.6" fill="none"/>`}</g>`; }
      return s;
    },
    dip(w, h, c) { return `<path d="M-32,0 L-37,${-h} L37,${-h} L32,0 Z" fill="${PAPER}" ${sk(2.6)}/><path d="M-30,${f(-h * .4)} H30" stroke="${BRICK}" stroke-width="4"/><ellipse cx="0" cy="${-h}" rx="37" ry="8" fill="${c}" ${sk(2.4)}/><path d="M-14,${-h} q8,-4 16,0 t12,0" stroke="${lighten(c, .35)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; },
    nuts(w, h, c, r) { let s = ""; const n = Math.round(w / 20); for (let k = 0; k < n; k++) { const x = -w / 2 + 10 + (w - 20) * k / (n - 1), y = -h * .5 + (r() - .5) * 6; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="8" fill="${c}" ${sk(2)}/><path d="M${f(x - 3)},${f(y - 8)} q3,-4 6,0" fill="#8A5A2E" stroke="${INK}" stroke-width="1.4"/><ellipse cx="${f(x - 3)}" cy="${f(y - 2)}" rx="2.5" ry="1.6" fill="#fff" opacity=".4"/>`; } return s; },
    q(w, h) { return `<rect x="${f(-w / 2)}" y="${-h}" width="${w}" height="${h}" rx="12" fill="rgba(247,244,229,.8)" stroke="${BRICK}" stroke-width="2.6" stroke-dasharray="8 6"/><text class="kc-q" x="0" y="${f(-h / 2 + 8)}">?</text>`; },
    qdome(w, h) { return `<path d="M${f(-w / 2)},0 L${f(-w / 2)},${f(-h * .42)} Q${f(-w / 2)},${-h} ${f(-w / 2 + 30)},${-h} L${f(w / 2 - 30)},${-h} Q${f(w / 2)},${-h} ${f(w / 2)},${f(-h * .42)} L${f(w / 2)},0 Z" fill="rgba(247,244,229,.8)" stroke="${BRICK}" stroke-width="2.6" stroke-dasharray="8 6"/>`; },
    lid(w, h, c, r, k, V) { const a = V.hw1 + 7, ry = f(a * .17); return straw(18, -12, 56, -132) + `<path d="M${-a},-10 L${-a},0 A${a},${ry} 0 0 0 ${a},0 L${a},-10" fill="rgba(255,255,255,.78)" ${sk(3)}/><ellipse cx="0" cy="-10" rx="${a}" ry="${ry}" fill="rgba(255,255,255,.88)" ${sk(3)}/>`; },
    dome(w, h, c, r, k, V) { const a = V.hw1 + 6; return straw(14, -24, 50, -142) + `<path d="M${-a},0 C${-a},${f(-a * .95)} ${a},${f(-a * .95)} ${a},0 Z" fill="rgba(255,255,255,.42)" ${sk(3)}/><path d="M${f(-a * .62)},${f(-a * .36)} Q${f(-a * .34)},${f(-a * .66)} 0,${f(-a * .7)}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/><rect x="${-a - 4}" y="-6" width="${2 * a + 8}" height="10" rx="5" fill="rgba(255,255,255,.85)" ${sk(2.6)}/>`; },
    lidjar(w, h, c, r, k, V) { const a = V.hw1 + 8; let s = `<rect x="${-a}" y="-26" width="${2 * a}" height="26" rx="7" fill="${BRICK}" ${sk(3)}/>`; for (let x = -a + 10; x < a - 6; x += 9) s += `<path d="M${x},-22 v18" stroke="rgba(247,244,229,.3)" stroke-width="2"/>`; return s + `<text class="kc-lidt" x="0" y="-8">KLAY</text>`; },
    cap() { let s = `<rect x="-19" y="-28" width="38" height="28" rx="5" fill="${BRICK}" ${sk(3)}/>`; for (let x = -12; x <= 12; x += 6) s += `<path d="M${x},-24 v20" stroke="rgba(247,244,229,.35)" stroke-width="2"/>`; return s; }
  };
  const H = { breadB: 30, breadT: 44, smear: 9, spread: 15, meat: 24, creamy: 20, melt: 18, rounds: 15, cherry: 20, leaves: 16, lettuce: 18, herbs: 12, crumble: 13, onion: 11, drizzle: 8, crispy: 32, cubes: 24, balls: 28, strips: 20, peppers: 15, dust: 7, pasta: 10, msauce: 14, bech: 11, cheese: 14, chips: 64, dip: 34, nuts: 18, q: 28, qdome: 40, lid: 14, dome: 70, lidjar: 26, cap: 28 };
  const OV = { drizzle: .5, dust: .6, leaves: .8, lettuce: .8, herbs: .7, crumble: .75, creamy: .85, melt: .85, cherry: .85, rounds: .9, onion: .8, meat: .9, cubes: .85, balls: .85, strips: .85, peppers: .75, chips: .9, nuts: .7 };
  const EXT = { leaves: 30, lettuce: 32, herbs: 22, meat: 10, creamy: 6, melt: 6, smear: 8, spread: 6, drizzle: 4, crispy: 4, peppers: 4, foam: 4 };
  const TOP = { lid: 1, dome: 1, lidjar: 1, cap: 1 };
  D.lettuce = (w, h, c, r) => D.leaves(w, h, c, r, "lett");

  /* ---------- recipes: bottom → top. Labels are the item's own listed ingredients ---------- */
  const SW = (...mid) => ({ k: "sand", L: [["breadB", "foc", "Focaccia"], ...mid, ["breadT", "foc", ""]] });
  const hot = (...L) => ({ k: "hot", L }), ice = (...L) => ({ k: "iced", L });
  const shake = (...L) => ({ k: "iced", L: [...L, ["!shake"], ["froth", "", .8]] });
  const blend = (c, ...L) => ({ k: "blend", L: [...L, ["!blend", c]] });
  const ESP = ["esp", "Concentrated coffee", 1.6], EVAP = ["evap", "Evaporated milk", 3.2], FOAM = ["foam", "Light foam", 1];
  const MILK = ["milk", "Cold milk", 2.4], ICE = ["ice", "Ice", 2], ESPI = ["esp", "Concentrated coffee", 1.5];
  const BLD = (syr, lab) => [["" + syr, lab, .8], ["sweet", "Sweetener", .4], ["milk", "Milk", 2.2], ICE, ["esp", "Concentrated coffee", 1.4]];
  const BALADI = ["cubes", ["tom", "cuc", "tom", "onionW", "cuc"], "Baladi salad"];
  const R = {
    21761: { k: "bowl", v: "paper", L: [["leaves", "aru", "Arugula"], ["rounds", "mozz", "Mozzarella"], ["cherry", "tom", "Cherry tomatoes"], ["drizzle", "pesto", "Pesto"], ["drizzle", "bals", "Balsamic vinegar"]] },
    21762: { k: "bowl", v: "paper", L: [["lettuce", "lett", "Fresh greens"], ["cubes", "beet", "Roasted beetroot"], ["crumble", "goat", "Goat cheese"], ["drizzle", "vin", "Light vinaigrette"]] },
    21765: SW(["smear", "tpesto", "Tomato pesto"], ["leaves", "aru", "Arugula"], ["meat", "bres", "Bresaola"], ["creamy", "strac", "Stracciatella"], ["drizzle", "bals", "Balsamic glaze"]),
    21766: SW(["smear", "tzat", "Tzatziki"], ["meat", "rbeef", "Grilled beef"], ["crumble", "feta", "Feta cheese"], ["onion", "onion", "Caramelized onions"]),
    21767: SW(["smear", "pist", "Crispy pistachio cream"], ["meat", "rbeef", "Roast beef"], ["creamy", "strac", "Stracciatella"], ["leaves", "aru", "Arugula"]),
    21768: SW(["smear", "fig", "Sweet fig cream"], ["meat", "sbeef", "Smoked beef"], ["rounds", "mozz", "Buffalo mozzarella"], ["leaves", "aru", "Arugula"]),
    21769: SW(["rounds", "tom", "Ripe tomatoes"], ["rounds", "mozz", "Mozzarella"], ["herbs", "basil", "Basil"], ["drizzle", "olive", "Olive oil"]),
    21770: SW(["smear", "tsauce", "Tomato sauce"], ["crispy", "chick", "Crispy fried chicken"], ["melt", "melt", "Melted mozzarella"], ["leaves", "aru", "Arugula"], ["smear", "mayo", "Mayonnaise"]),
    21771: SW(["smear", "labneh", "Za'atar labneh"], ["lettuce", "lett", "Lettuce"], ["meat", "turkey", "Smoked turkey"], ["rounds", "tom", "Tomato"]),
    21777: { k: "bowl", v: "brick", L: [["cubes", "potato", "Roasted potatoes"], ["balls", "meatball", "Meatballs"], ["smear", "tsauce", "Tomato sauce"], BALADI, ["drizzle", "tahini", "Tahini"]] },
    21780: { k: "bowl", v: "brick", L: [["cubes", "potato", "Grilled potatoes"], ["peppers", "", "Grilled bell peppers"], ["strips", "beefc", "Beef"], ["smear", "brown", "Brown sauce"], ["onion", "onion", "Caramelized onions"], ["drizzle", "tahini", "Tahini"]] },
    21778: { k: "bowl", v: "brick", L: [["spread", "hummus", "Creamy hummus"], ["peppers", "", "Grilled vegetables"], ["strips", "gchick", "Grilled chicken breast"], ["drizzle", "buff", "Buffalo sauce"]] },
    21779: { k: "bowl", v: "brick", L: [["cubes", "potato", "Grilled potatoes"], ["cubes", "tawook", "Shish tawook"], BALADI, ["drizzle", "tahini", "Tahini"]] },
    21776: { k: "dish", L: [["pasta", "pasta", "Pasta layers"], ["msauce", "msauce", "Rich meat sauce"], ["bech", "bech", "Creamy béchamel"], ["pasta", "pasta", ""], ["msauce", "msauce", ""], ["bech", "bech", ""], ["cheese", "cheese", "Melted cheese"]] },
    21763: { k: "sand", byo: 1, L: [["q", "", "Your bread"], ["q", "", "Your protein"], ["q", "", "Your cheese"], ["q", "", "Fresh toppings"], ["qdome", "", ""]] },
    21764: { k: "bowl", v: "brick", byo: 1, L: [["q", "", "Your base"], ["q", "", "Your protein"], ["q", "", "Your toppings"], ["q", "", "Your sauce"]] },
    21759: { k: "tray", L: [["chips", "chipB", "Crispy beetroot chips", { dx: -34, w: 166 }], ["dip", "dipB", "Special beetroot dip", { dx: 84, free: 1, w: 74 }]] },
    21760: { k: "tray", L: [["chips", "chipP", "Crispy potato chips", { w: 206 }], ["dust", ["#FFFFFF", "#C98A3A", "#E8D3A0"], "Light seasoning", { w: 170 }]] },
    21823: { k: "jar", L: [["spr", "Chocolate hazelnut spread", 1], ["nuts", "nut", "Toasted hazelnuts"]] },
    21824: SW(["spread", "hazel", "Chocolate hazelnut spread"]),
    21786: hot(["choc", "Chocolate syrup", .8], ESP, EVAP, FOAM),
    21781: hot(["hwater", "Hot water", 3.4], ["esp", "Concentrated coffee", 1.8]),
    21782: hot(["esp", "Concentrated coffee", 2.2], ["evap", "Evaporated milk", 2.2]),
    21783: hot(ESP, ["evap", "Evaporated milk", 2.2], ["foam", "Thick frothy milk", 2]),
    21784: hot(ESP, ["evap", "Velvety evaporated milk", 3.2]),
    21785: hot(ESP, ["evap", "Evaporated milk", 3.4], ["foam", "Light foam", .9]),
    21787: hot(["wchoc", "White chocolate syrup", .8], ESP, EVAP, FOAM),
    21788: hot(["cond", "Sweetened condensed milk", 1], ESP, EVAP),
    21789: hot(["car", "Salted caramel syrup", .8], ESP, EVAP, FOAM),
    21790: hot(["honey", "Honey", .7], ["cin", "Cinnamon syrup", .6], ESP, ["evap", "Evaporated milk", 3]),
    21791: ice(["water", "Cold water", 3], ICE, ["esp", "Concentrated coffee", 1.6]),
    21792: ice(["milk", "Cold milk", 3], ICE, ESPI),
    21793: ice(["choc", "Chocolate syrup", .8], MILK, ICE, ESPI),
    21794: ice(["cond", "Local condensed milk", .9], MILK, ICE, ESPI),
    21795: ice(["honey", "Honey", .6], ["cin", "Cinnamon syrup", .6], MILK, ICE, ESPI),
    21796: ice(["car", "Salted caramel syrup", .8], MILK, ICE, ESPI),
    21797: ice(["wchoc", "White chocolate syrup", .8], MILK, ICE, ESPI),
    21798: ice(["bsc", "Butterscotch syrup", .8], MILK, ICE, ESPI),
    22309: shake(["wchoc", "Rich white chocolate", .9], ICE, ["shaken", "Iced coffee", 2.6]),
    22310: shake(["car", "Salted caramel syrup", .9], ICE, ["shaken", "Iced coffee", 2.6]),
    22311: shake(["van", "Smooth vanilla", .7], ["salt", "Sea salt", .3], ICE, ["shaken", "Iced coffee", 2.6]),
    21799: blend("#CDA987", ["sweet", "Sweetener", .4], ["milk", "Milk", 2.4], ICE, ["esp", "Concentrated coffee", 1.4]),
    21800: blend("#D3B48F", ...BLD("cond", "Condensed milk")),
    21801: blend("#8E6248", ...BLD("choc", "Chocolate syrup")),
    21802: blend("#C99460", ...BLD("car", "Salted caramel syrup")),
    21803: blend("#DCC3A0", ...BLD("wchoc", "White chocolate syrup")),
    22319: blend("#C9A07A", ["honey", "Golden honey", .6], ["cin", "Warm cinnamon spice", .5], ["milk", "Creamy milk", 2.4], ["esp", "Espresso", 1.6]),
    21809: hot(["matcha", "Finely ground matcha", 1.2], ["hwater", "Water", 1], ["evap", "Evaporated milk", 3]),
    21810: hot(["van", "Vanilla syrup", .6], ["salt", "Sea salt", .25], ["matcha", "Green tea powder", 1.2], ["hwater", "Water", .9], ["evap", "Evaporated milk", 2.8]),
    21811: hot(["wchoc", "White chocolate syrup", .7], ["matcha", "Matcha powder", 1.2], ["hwater", "Water", .9], ["evap", "Evaporated milk", 2.8]),
    21812: ice(MILK, ICE, ["water", "Cold water", .8], ["matcha", "Green tea powder", 1.3]),
    21813: ice(["van", "Vanilla syrup", .6], ["salt", "Sea salt", .25], ["milk", "Cold milk", 2.2], ICE, ["matcha", "Green tea powder", 1.3]),
    21814: ice(["mango", "Sweet mango purée", 1.4], ["ice", "Ice", 2.2], ["matcha", "Whipped creamy matcha", 1.8]),
    21815: ice(["straw", "Fresh strawberry purée", 1.2], ["milk", "Soft milk", 2], ICE, ["matcha", "Matcha", 1.4]),
    21816: ice(["berry", "Vibrant berries", 1.3], ["ice", "Ice", 2.2], ["matcha", "Creamy matcha", 1.8]),
    21817: ice(["honey", "Honey", .7], ["cin", "Cinnamon spice", .5], ["ice", "Ice", 2.2], ["matcha", "Matcha", 2]),
    21818: ice(["wchoc", "White chocolate syrup", .7], ["milk", "Cold milk", 2.2], ICE, ["matcha", "Green tea powder", 1.3]),
    21819: blend("#A8C47A", ["sweet", "Sweeteners", .4], ["milk", "Milk", 2.4], ICE, ["matcha", "Green tea powder", 1.4]),
    21820: blend("#BFD08F", ["wchoc", "White chocolate syrup", .7], ["sweet", "Sweetener", .4], ["milk", "Milk", 2.2], ICE, ["matcha", "Green tea powder", 1.3]),
    21821: blend("#C9B98E", ["straw", "Strawberry syrup", .7], ["sweet", "Sweetener", .4], ["milk", "Milk", 2.2], ICE, ["matcha", "Green tea powder", 1.3]),
    21822: blend("#B9CC8A", ["van", "Vanilla", .7], ["salt", "Sea salt", .3], ["matcha", "Soft matcha", 3]),
    22316: blend("#B5C47E", ["honey", "Sweet honey", .7], ["cin", "Warm cinnamon spice", .5], ["matcha", "Matcha green tea", 3]),
    22828: shake(["van", "Creamy vanilla", .7], ["salt", "Sea salt", .3], ICE, ["smatcha", "Iced matcha", 2.4]),
    22829: shake(["wchoc", "Creamy white chocolate", .9], ICE, ["smatcha", "Iced matcha", 2.4]),
    22830: shake(["honey", "Smooth honey", .7], ["cin", "Warm cinnamon spice", .5], ICE, ["smatcha", "Iced matcha", 2.4]),
    21806: hot(["spice", "Cinnamon · cardamom · cloves · ginger", .8], ["tea", "Black tea", 2], ["evap", "Evaporated milk", 2.6]),
    21807: ice(["peach", "Sweet peach flavor", .9], ["tea", "Black tea", 2.2], ["water", "Water", 1], ICE),
    21808: ice(["spice", "Cinnamon · cardamom · cloves · ginger", .8], ["tea", "Black tea", 1.8], ["milk", "Cold milk", 1.8], ICE),
    21804: { k: "bottle", L: [["water", "Fresh, pure water", 1]] },
    21805: { k: "bottle", L: [["spark", "Sparkling water", 1]] }
  };

  /* ---------- vessels (x relative to the stack centre, y absolute) ---------- */
  const shadow = (rx, y = BASE + 1) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="10" fill="rgba(58,22,14,.16)"/>`;
  const cupV = (bottom, top, hw0, hw1, fill, x) => Object.assign({ cup: 1, bottom, top, fill, start: bottom, hw0, hw1, hw: y => hw0 + (bottom - y) / (bottom - top) * (hw1 - hw0) }, x);
  function glass(V, k) {
    const { bottom: b, top: t, hw0: a0, hw1: a1 } = V, r0 = f(a0 * .17), r1 = f(a1 * .17), body = `M${-a1},${t} L${-a0},${b} A${a0},${r0} 0 0 0 ${a0},${b} L${a1},${t}`;
    let back = shadow(a0 + 40);
    if (k === "hot") back += `<ellipse cx="0" cy="${BASE - 5}" rx="124" ry="15" fill="${PAPER}" ${sk(3)}/><ellipse cx="0" cy="${BASE - 8}" rx="88" ry="9" fill="${SAND}"/>`;
    back += `<path d="${body}Z" fill="rgba(255,255,255,.34)"/><ellipse cx="0" cy="${t}" rx="${a1}" ry="${r1}" fill="rgba(255,255,255,.3)" ${sk(2.5)}/>`;
    let front = `<path d="${body}" fill="none" ${sk(3.5)}/><path d="M${-a1},${t} A${a1},${r1} 0 0 0 ${a1},${t}" fill="none" ${sk(3.5)}/><path d="M${f(-a1 + 16)},${t + 34} L${f(-a0 + 14)},${b - 40}" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".5"/><path d="M${f(-a1 + 31)},${t + 44} L${f(-a1 + 30)},${t + 74}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`;
    if (k === "hot") { const hd = `M${a1 - 3},${t + 44} C${a1 + 58},${t + 40} ${a1 + 60},${t + 150} ${a0 + 2},${t + 152}`; front = `<path d="${hd}" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/><path d="${hd}" fill="none" stroke="#F3EEE2" stroke-width="10" stroke-linecap="round"/>` + front; }
    return { back, front };
  }
  const VES = {
    sand: () => ({ start: BASE - 14, w: () => 232, back: shadow(170) + `<rect x="-150" y="${BASE - 14}" width="300" height="14" rx="7" fill="#C38B55" ${sk(3)}/><rect x="-142" y="${BASE - 13}" width="284" height="3.5" fill="#DDA971"/><rect x="146" y="${BASE - 12}" width="42" height="10" rx="5" fill="#C38B55" ${sk(3)}/><circle cx="176" cy="${BASE - 7}" r="2.6" fill="${INK}"/>`, front: "" }),
    bowl: v => {
      const Rr = BASE - 82, a = 154, rr = 20, warm = v !== "paper", body = warm ? BRICK : PAPER, stripe = warm ? PAPER : BRICK, inner = warm ? "#5E2618" : "#E6D6B8";
      return { start: Rr + 30, ov: .62, w: i => Math.max(132, 236 - i * 24), back: shadow(160) + `<ellipse cx="0" cy="${Rr}" rx="${a}" ry="${rr}" fill="${inner}" ${sk(3)}/>`,
        front: `<path d="M${-a},${Rr} C${-a + 4},${BASE - 22} ${f(-a * .6)},${BASE} 0,${BASE} C${f(a * .6)},${BASE} ${a - 4},${BASE - 22} ${a},${Rr} A${a},${rr} 0 0 1 ${-a},${Rr} Z" fill="${body}" ${sk(3.5)}/><path d="M${-a + 12},${Rr + 26} Q0,${Rr + 44} ${a - 12},${Rr + 26}" fill="none" stroke="${stripe}" stroke-width="6" stroke-linecap="round"/>` + (warm ? `<text class="kc-bowlt" x="0" y="${Rr + 64}">KLAY</text>` : "") + `<path d="M${-a + 22},${Rr + 30} Q${-a + 34},${Rr + 54} ${-a + 64},${Rr + 66}" stroke="#fff" opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>` };
    },
    dish: () => {
      const Rr = BASE - 44, a = 150, rr = 14;
      return { start: Rr + 8, w: () => 270, back: shadow(170) + `<ellipse cx="0" cy="${Rr}" rx="${a}" ry="${rr}" fill="#5E2618" ${sk(3)}/>`,
        front: `<rect x="${-a - 28}" y="${Rr + 6}" width="40" height="15" rx="7.5" fill="${BRICK}" ${sk(3)}/><rect x="${a - 12}" y="${Rr + 6}" width="40" height="15" rx="7.5" fill="${BRICK}" ${sk(3)}/><path d="M${-a},${Rr} L${-a + 8},${BASE - 6} Q${-a + 10},${BASE} ${-a + 20},${BASE} L${a - 20},${BASE} Q${a - 10},${BASE} ${a - 8},${BASE - 6} L${a},${Rr} A${a},${rr} 0 0 1 ${-a},${Rr} Z" fill="${BRICK}" ${sk(3.5)}/><text class="kc-bowlt" x="0" y="${Rr + 36}">KLAY</text>` };
    },
    tray: () => {
      const Rr = BASE - 38, a = 132, rr = 12;
      return { start: Rr + 10, dipY: Rr + 18, w: () => 200, back: shadow(150) + `<ellipse cx="0" cy="${Rr}" rx="${a}" ry="${rr}" fill="#CDB48C" ${sk(3)}/>`,
        front: `<path d="M${-a},${Rr} L${-a + 20},${BASE} L${a - 20},${BASE} L${a},${Rr} A${a},${rr} 0 0 1 ${-a},${Rr} Z" fill="${PAPER}" ${sk(3.2)}/><path d="M-110,${Rr + 22} H110 M-104,${Rr + 31} H104" stroke="${BRICK}" stroke-width="5"/>` };
    },
    hot: () => { const V = cupV(BASE - 12, BASE - 226, 72, 80, 186, { mug: 1 }); return Object.assign(V, glass(V, "hot")); },
    iced: () => { const V = cupV(BASE - 6, BASE - 262, 62, 90, 226, { tail: [["lid"]] }); return Object.assign(V, glass(V, "iced")); },
    blend: () => { const V = cupV(BASE - 6, BASE - 262, 62, 90, 226, { tail: [["dome"]] }); return Object.assign(V, glass(V, "blend")); },
    jar: () => {
      const V = cupV(BASE - 12, BASE - 182, 64, 64, 128, { tail: [["lidjar"]] }), t = V.top;
      V.back = shadow(110) + `<rect x="-72" y="${t - 2}" width="144" height="${BASE - t}" rx="24" fill="rgba(255,255,255,.34)"/>`;
      V.front = `<rect x="-72" y="${t - 2}" width="144" height="${BASE - t}" rx="24" fill="none" ${sk(3.5)}/><path d="M-56,${t + 22} V${BASE - 96}" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".5"/><rect x="-72" y="${BASE - 74}" width="144" height="44" fill="${PAPER}" ${sk(3)}/><text class="kc-jart" x="0" y="${BASE - 50}">KLAY</text><text class="kc-jars" x="0" y="${BASE - 37}">500 G</text>`;
      return V;
    },
    bottle: () => {
      const V = cupV(BASE - 16, BASE - 236, 44, 44, 186, { tail: [["cap"]], capY: BASE - 270 }), b = BASE - 4, sh = BASE - 236, nt = BASE - 280;
      const d = `M-15,${nt} L-15,${sh - 18} C-15,${sh - 4} -44,${sh} -44,${sh + 22} L-44,${b - 12} Q-44,${b} -30,${b} L30,${b} Q44,${b} 44,${b - 12} L44,${sh + 22} C44,${sh} 15,${sh - 4} 15,${sh - 18} L15,${nt}`;
      V.back = shadow(80) + `<path d="${d}Z" fill="rgba(222,240,246,.4)"/>`;
      V.front = `<path d="${d}" fill="none" ${sk(3.5)}/><path d="M-30,${sh + 30} V${b - 30}" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".6"/>`;
      return V;
    }
  };

  /* ---------- liquid slab inside a glass: bottom at local 0, follows the glass taper ---------- */
  function slab(V, y0, h, q, r) {
    const a0 = V.hw(y0), a1 = V.hw(y0 - h), r0 = f(a0 * .17), r1 = f(a1 * .17);
    const body = `M${f(-a0)},0 A${f(a0)},${r0} 0 0 0 ${f(a0)},0 L${f(a1)},${f(-h)} L${f(-a1)},${f(-h)} Z`;
    let s = "";
    if (q.ice) {
      s += `<path d="${body}" fill="rgba(208,231,239,.55)" stroke="#7FA9B8" stroke-width="2"/>`;
      const rows = Math.max(1, Math.round(h / 30)), per = Math.max(3, Math.round(a0 * 2 / 36));
      for (let k = 0; k < rows; k++) for (let m = 0; m < per; m++) {
        const z = 23 + r() * 7, y = -h * (k + .5) / rows, hw = V.hw(y0 + y) - z * .65, x = -hw + 2 * hw * (m + .5) / per + (r() - .5) * 8;
        s += `<rect x="${f(x - z / 2)}" y="${f(y - z / 2)}" width="${f(z)}" height="${f(z)}" rx="6" fill="rgba(255,255,255,.68)" stroke="#6E97A8" stroke-width="2" transform="rotate(${f((r() - .5) * 40)} ${f(x)} ${f(y)})"/><path d="M${f(x - z * .25)},${f(y - z * .2)} l${f(z * .3)},0" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
      }
      return s + `<ellipse cx="0" cy="${f(-h)}" rx="${f(a1)}" ry="${r1}" fill="rgba(230,244,248,.5)" stroke="#7FA9B8" stroke-width="1.6"/>`;
    }
    s += `<path d="${body}" fill="${q.c}" ${sk(2.2)}/>`;
    if (q.specks) for (let k = 0; k < 26; k++) { const y = -h * r(), hw = V.hw(y0 + y) - 8; s += `<circle cx="${f((r() * 2 - 1) * hw)}" cy="${f(y)}" r="${f(1.4 + r() * 1.6)}" fill="${["#6B3A1E", "#8C5A2B", "#3E2A1A", "#B07A3A"][k % 4]}"/>`; }
    if (q.bub) for (let k = 0; k < 18; k++) { const y = -h * r(), hw = V.hw(y0 + y) - 10; s += `<circle cx="${f((r() * 2 - 1) * hw)}" cy="${f(y)}" r="${f(2 + r() * 3)}" fill="none" stroke="#fff" stroke-width="1.8"/>`; }
    s += `<ellipse cx="0" cy="${f(-h)}" rx="${f(a1)}" ry="${r1}" fill="${q.top}" ${sk(1.8)}/>`;
    if (q.gloss) s += `<ellipse cx="${f(-a1 * .3)}" cy="${f(-h - r1 * .2)}" rx="${f(a1 * .32)}" ry="${f(r1 * .3)}" fill="#fff" opacity=".45"/>`;
    if (q.crema) s += `<path d="M${f(-a1 * .5)},${f(-h)} q${f(a1 * .25)},-5 ${f(a1 * .5)},0 t${f(a1 * .5)},0" fill="none" stroke="#E2B07A" stroke-width="2.5" stroke-linecap="round"/>`;
    if (q.foam) {
      for (let k = 0; k < 9; k++) s += `<circle cx="${f(-a1 * .82 + a1 * 1.64 * k / 8)}" cy="${f(-h - r() * 4)}" r="${f(6 + r() * 6)}" fill="${q.top}" ${sk(1.8)}/>`;
      s += `<ellipse cx="0" cy="${f(-h - 4)}" rx="${f(a1 * .84)}" ry="${f(r1 * .75)}" fill="${q.top}"/>`;
      for (let k = 0; k < 7; k++) s += `<circle cx="${f((r() * 2 - 1) * a1 * .7)}" cy="${f(-h * r() * .8)}" r="${f(1.5 + r() * 2)}" fill="none" stroke="${darken(q.c[0] === "#" ? q.c : "#FFFFFF", .14)}" stroke-width="1.2"/>`;
    }
    if (q.flakes) for (let k = 0; k < 14; k++) { const x = (r() * 2 - 1) * a1 * .8, y = -h + (r() - .5) * r1 * 1.4; s += `<rect x="${f(x)}" y="${f(y)}" width="5" height="4" fill="#fff" stroke="#BFB6A4" stroke-width="1" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})"/>`; }
    return s;
  }

  /* ---------- plan: geometry for one item ---------- */
  const cache = {};
  const wrap = (t, m) => { const out = []; let cur = ""; t.split(" ").forEach(x => { if (cur && (cur + " " + x).length > m) { out.push(cur); cur = x; } else cur = cur ? cur + " " + x : x; }); out.push(cur); return out; };
  function plan(id) {
    if (cache[id]) return cache[id];
    const Rc = R[id]; if (!Rc) return null;
    const V = VES[Rc.k](Rc.v), r = mul(id * 7919), items = [];
    const all = Rc.L.concat(V.tail || []);
    let sum = 0; all.forEach(L => { if (LQ[L[0]]) sum += L[2] || 1; });
    const unit = V.cup && sum ? V.fill / sum : 0;
    let y = V.start, i = 0;
    all.forEach(L => {
      const t = L[0];
      if (t[0] === "!") { items.push({ fx: t.slice(1), c: L[1] }); return; }
      const q = LQ[t], o = (!q && L[3]) || {}, it = { t, i, dx: o.dx || 0, label: q ? L[1] : L[2], rr: r() };
      if (q) { it.h = (L[2] || 1) * unit; it.y0 = y; it.w = 2 * V.hw(y); it.svg = slab(V, y, it.h, q, r); y -= it.h; }
      else {
        it.h = H[t];
        if (TOP[t]) it.y0 = t === "cap" ? V.capY : V.top;
        else if (o.free) it.y0 = V.dipY;
        else it.y0 = y;
        it.w = o.w || (V.cup ? 2 * V.hw(it.y0) - 22 : V.w(i));
        if (t === "breadB" || t === "breadT" || t === "qdome") it.w = 240;
        it.svg = D[t](it.w, it.h, col(L[1]), r, L[1], V);
        if (!TOP[t] && !o.free) y -= it.h * (OV[t] || 1) * (V.ov || 1);
      }
      items.push(it); i++;
    });
    const L = items.filter(it => !it.fx), n = L.length;
    const topY = Math.min(...L.map(it => it.y0 - it.h));
    const gap = Math.max(12, Math.min(52, (topY - 86) / n));
    L.forEach((it, k) => { it.off = -(k + 1) * gap; });
    const P = { id, k: Rc.k, byo: !!Rc.byo, V, items, n };
    P.labels = labelize(P);
    const cnt = P.labels.length;
    P.title = Rc.byo ? `YOUR BUILD · ${cnt} PICKS` : `ANATOMY · ${cnt} INGREDIENT${cnt > 1 ? "S" : ""}`;
    const fxB = items.find(x => x.fx === "blend");
    if (fxB) { const rb = mul(id); let s = slab(V, V.bottom, V.fill, { c: fxB.c, top: lighten(fxB.c, .3) }, rb); for (let k = 0; k < 30; k++) { const yy = -V.fill * rb(), hw = V.hw(V.bottom + yy) - 10; s += `<rect x="${f((rb() * 2 - 1) * hw)}" y="${f(yy)}" width="4" height="4" rx="1" fill="#fff" opacity=".8"/>`; } P.blend = `<g transform="translate(0,${V.bottom})">${s}<path d="M${-V.hw1 * .6},${-V.fill - 2} q20,-8 40,0 t40,0" stroke="${darken(fxB.c, .2)}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`; }
    if (V.mug) P.steam = `<g class="kc-steam" transform="translate(0,${V.top - 10})">${[-26, 0, 26].map((x, k) => `<path style="animation-delay:${k * .5}s" d="M${x},0 c-10,-14 10,-22 0,-38 c-10,-14 8,-22 0,-36"/>`).join("")}</g>`;
    P.hello = Rc.byo ? "You call the shots!" : V.cup ? "Coming right up!" : "Let me build it!";
    P.bye = Rc.byo ? "Your rules →" : "Perfetto!";
    return (cache[id] = P);
  }
  function labelize(P) {
    const out = []; let j = 0;
    P.items.forEach(it => {
      if (it.fx || !it.label) return;
      const side = it.dx ? Math.sign(it.dx) : (j++ % 2 ? -1 : 1);
      const yc = it.y0 - it.h / 2 + it.off, half = P.V.cup ? P.V.hw(it.y0 - it.h / 2) : it.w / 2;
      const edge = Math.abs(it.dx) + half * .9, tx = side * (Math.abs(it.dx) + half + (EXT[it.t] || 0) + 28);
      const avail = side > 0 ? 632 - (CXA + tx) : (CXA + tx) - 8;
      out.push({ i: it.i, side, px: side * edge, py: yc, ty0: yc, tx, lines: wrap(it.label, Math.max(7, Math.floor(avail / 10.2))) });
    });
    [1, -1].forEach(sd => {
      const g = out.filter(l => l.side === sd).sort((a, b) => a.ty0 - b.ty0);
      for (let k = 1; k < g.length; k++) { const need = (g[k - 1].lines.length + g[k].lines.length) * 10.5 + 12; if (g[k].ty0 - g[k - 1].ty0 < need) g[k].ty0 = g[k - 1].ty0 + need; }
      const last = g[g.length - 1]; if (last) { const lim = BASE - 16 - (last.lines.length - 1) * 10.5, d = last.ty0 - lim; if (d > 0) g.forEach(l => l.ty0 -= d); }
      const first = g[0]; if (first) { const top = 84 + (first.lines.length - 1) * 10.5; if (first.ty0 < top) { const d = top - first.ty0; g.forEach(l => l.ty0 += d); } }
    });
    out.forEach(l => { const kx = l.side * (Math.abs(l.px) + 18), ex = l.tx - l.side * 7; l.d = `M${f(l.px)},${f(l.py)} L${f(kx)},${f(l.ty0)} L${f(ex)},${f(l.ty0)}`; l.ty = l.ty0 - (l.lines.length - 1) * 10.5 + 6.5; });
    return out;
  }

  /* ---------- the chef (original character): shoulders at R(194,448) / L(66,448) ---------- */
  function chef() {
    const s3 = sk(3.5), arm = d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${PAPER}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<g class="kc-chef" transform="translate(-330,0)"><g class="kc-breath">
<g class="kc-armL">${arm("M66,448 L42,494 L60,528")}<circle cx="62" cy="532" r="14" fill="${SKIN}" ${s3}/></g>
<path d="M44,620 C44,488 70,436 130,432 C190,436 216,488 216,620 Z" fill="${PAPER}" ${s3}/>
<circle cx="88" cy="468" r="3.6" fill="${BRICK}"/><circle cx="172" cy="468" r="3.6" fill="${BRICK}"/><circle cx="84" cy="494" r="3.6" fill="${BRICK}"/><circle cx="176" cy="494" r="3.6" fill="${BRICK}"/>
<path d="M100,453 L86,436 M160,453 L174,436" stroke="${BRICK}" stroke-width="6" stroke-linecap="round"/>
<path d="M100,452 L160,452 L162,480 L186,486 L194,620 L66,620 L74,486 L98,480 Z" fill="${BRICK}" ${s3}/>
<path d="M76,484 Q130,476 184,484" stroke="${INK}" stroke-width="2.5" fill="none" opacity=".35"/>
<text class="kc-apron" x="130" y="511">KLAY</text>
<path d="M116,402 L116,436 L144,436 L144,402 Z" fill="${SKIN}" ${sk(3)}/>
<path d="M106,428 Q130,448 154,428 L148,454 Q130,446 112,454 Z" fill="${SAND}" ${sk(3)}/><circle cx="130" cy="447" r="7.5" fill="${SAND}" ${sk(3)}/>
<circle cx="76" cy="366" r="12" fill="${SKIN}" ${s3}/><circle cx="184" cy="366" r="12" fill="${SKIN}" ${s3}/>
<ellipse cx="130" cy="362" rx="56" ry="54" fill="${SKIN}" ${s3}/>
<path d="M76,352 Q78,318 104,310 L156,310 Q182,318 184,352 Q174,334 158,330 L102,330 Q86,334 76,352 Z" fill="${HAIR}" ${sk(3)}/>
<path d="M86,300 C52,296 50,240 90,238 C90,200 132,184 150,214 C182,196 216,236 190,266 C200,280 192,300 176,300 Z" fill="${PAPER}" ${s3}/>
<path d="M112,242 Q118,264 114,288 M150,234 Q157,260 150,288" fill="none" stroke="${SAND}" stroke-width="3.5" stroke-linecap="round"/>
<rect x="84" y="286" width="92" height="30" rx="8" fill="${PAPER}" ${s3}/><rect x="86" y="298" width="88" height="7" fill="${BRICK}"/><circle cx="130" cy="301" r="10.5" fill="${BRICK}" ${sk(2.5)}/><text class="kc-hatk" x="130" y="305.6">K</text>
<path d="M99,338 Q110,330 121,337 M139,337 Q150,330 161,338" fill="none" stroke="${HAIR}" stroke-width="4.5" stroke-linecap="round"/>
<g class="kc-eye"><ellipse cx="110" cy="357" rx="7" ry="9" fill="${INK}"/><circle cx="112.6" cy="353.4" r="2.6" fill="#fff"/></g>
<g class="kc-eyeR"><g class="kc-eye"><ellipse cx="150" cy="357" rx="7" ry="9" fill="${INK}"/><circle cx="152.6" cy="353.4" r="2.6" fill="#fff"/></g></g>
<path class="kc-wink" d="M141,359 Q150,350 159,359" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" opacity="0"/>
<circle cx="95" cy="381" r="10" fill="#E8866A" opacity=".5"/><circle cx="165" cy="381" r="10" fill="#E8866A" opacity=".5"/>
<path d="M114,393 Q130,416 146,393 Q130,399 114,393 Z" fill="#7A2A1C" ${sk(3)}/><path d="M122,404 Q130,410 138,404 Q130,400 122,404Z" fill="#E7735E"/>
<path d="M130,384 C120,376 100,378 94,390 C104,387 112,394 122,391 C126,390 129,388 130,386 C131,388 134,390 138,391 C148,394 156,387 166,390 C160,378 140,376 130,384 Z" fill="${HAIR}" ${sk(2.5)}/>
<ellipse cx="130" cy="372" rx="10" ry="8" fill="#E39C72" ${sk(3)}/>
<g class="kc-armR">${arm("M194,448 L224,490 L254,474")}<circle cx="258" cy="472" r="14" fill="${SKIN}" ${s3}/><ellipse cx="263" cy="459" rx="5" ry="7.5" fill="${SKIN}" ${sk(3)}/></g>
</g></g>`;
  }
  const star = "M0,-10 L2.6,-2.6 L10,0 L2.6,2.6 L0,10 L-2.6,2.6 L-10,0 L-2.6,-2.6Z";

  let seq = 0;
  function markup(P, name, full) {
    const u = "kc" + (++seq);
    let s = `<svg class="kc-svg" viewBox="0 0 640 600" role="img" aria-label="${esc(`${name} — ${P.labels.map(l => l.lines.join(" ")).join(", ")}`)}"><defs><radialGradient id="${u}h"><stop offset="0" stop-color="#FCF9EF"/><stop offset=".6" stop-color="#F7F4E5" stop-opacity=".55"/><stop offset="1" stop-color="#F7F4E5" stop-opacity="0"/></radialGradient><path id="${u}a" d="M-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>`;
    s += `<circle cx="340" cy="320" r="300" fill="url(#${u}h)"/>`;
    [[64, 92, 0], [586, 246, .9], [126, 214, 1.7], [522, 66, 2.3], [606, 430, 1.2], [36, 400, .4]].forEach(([x, y, d]) => { s += `<path class="kc-twk" style="animation-delay:${d}s" transform="translate(${x},${y}) scale(.8)" d="${star}" fill="${BRICK}" opacity=".22"/>`; });
    s += `<text class="kc-tt" x="320" y="50" opacity="0">${esc(P.title)}</text>`;
    if (full) s += chef();
    s += `<rect x="-20" y="${BASE}" width="680" height="100" fill="${BRICK}"/><path d="M80,${BASE + 8} V600 M240,${BASE + 8} V600 M400,${BASE + 8} V600 M560,${BASE + 8} V600" stroke="rgba(247,244,229,.08)" stroke-width="2"/><rect x="-20" y="${BASE}" width="680" height="7" fill="#6E2F21"/><path d="M-20,${BASE} H660" stroke="${INK}" stroke-width="3"/>`;
    s += `<g class="kc-stack" transform="translate(${CXA},0)"><g class="kc-shk"><g class="kc-vb" opacity="0">${P.V.back}</g>`;
    P.items.forEach(it => { if (!it.fx) s += `<g class="kc-ly" data-i="${it.i}" transform="translate(${it.dx},${f(it.y0)})"><g class="kc-mv"><g class="kc-bob kc-bobon" style="animation-delay:${(-it.i * .37).toFixed(2)}s">${it.svg}</g></g></g>`; });
    if (P.blend) s += `<g class="kc-blend" opacity="0">${P.blend}</g>`;
    s += `<g class="kc-vf" opacity="0">${P.V.front}</g>${P.steam || ""}<g class="kc-fx"></g></g></g>`;
    s += `<g class="kc-lbs" transform="translate(${CXA},0)">` + P.labels.map(l => `<g class="kc-lb" data-i="${l.i}"><path class="kc-ld" d="${l.d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><circle class="kc-dot" cx="${f(l.px)}" cy="${f(l.py)}" r="4.5" opacity="0"/><text class="kc-lt" text-anchor="${l.side > 0 ? "start" : "end"}" y="${f(l.ty)}" opacity="0">${l.lines.map((t, k) => `<tspan x="${f(l.tx)}" dy="${k ? 21 : 0}">${esc(t)}</tspan>`).join("")}</text></g>`).join("") + `</g>`;
    if (full) {
      s += `<g class="kc-bub" opacity="0"><path d="M14,92 H206 Q220,92 220,106 V140 Q220,154 206,154 H134 L114,178 L116,154 H28 Q14,154 14,140 V106 Q14,92 28,92 Z" fill="${PAPER}" ${sk(3)}/><text class="kc-bubt" x="117" y="130">${esc(P.hello)}</text></g>`;
      s += `<g class="kc-stars">${[0, 1, 2, 3, 4, 5].map(() => `<path d="${star}" fill="#F2C14E" ${sk(1.6)} opacity="0"/>`).join("")}</g>`;
      s += `<g class="kc-stamp" opacity="0" transform="translate(580,236) scale(.01)"><circle r="52" fill="${BRICK}" ${sk(3)}/><circle r="45" fill="none" stroke="${PAPER}" stroke-width="1.6" stroke-dasharray="3 4"/><text class="kc-stt"><textPath href="#${u}a">KLAY · BUILT FRESH · CAIRO ·</textPath></text><text class="kc-stc" y="11">K</text></g>`;
    }
    return s + `</svg>`;
  }

  /* ---------- tiny timeline ---------- */
  const E = { lin: p => p, out: p => 1 - (1 - p) ** 3, in: p => p * p * p, io: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2, back: p => { const c = 1.9; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; } };
  function TL() {
    const tr = []; let raf = 0, end = 0;
    const run = t => { for (const k of tr) { if (t < k.at || k.done) continue; const p = Math.min(1, (t - k.at) / k.dur); k.fn(k.e(p)); if (p >= 1) k.done = 1; } };
    return {
      add(at, dur, fn, e = E.out) { tr.push({ at, dur: Math.max(1, dur), fn, e }); end = Math.max(end, at + dur); },
      init() { tr.sort((a, b) => a.at - b.at); for (let k = tr.length - 1; k >= 0; k--) tr[k].fn(tr[k].e(0)); },
      play(done) { const t0 = performance.now(); const step = now => { const t = now - t0; run(t); if (t < end) raf = requestAnimationFrame(step); else { raf = 0; done && done(); } }; raf = requestAnimationFrame(step); },
      finish() { cancelAnimationFrame(raf); raf = 0; run(1e9); },
      stop() { cancelAnimationFrame(raf); raf = 0; },
      get end() { return end; }
    };
  }

  function timeline(svg, P, full) {
    const T = TL(), $ = s => svg.querySelector(s);
    const op = (el, v) => el && el.setAttribute("opacity", f3(Math.max(0, Math.min(1, v))));
    const tt = $(".kc-tt"), lbs = $(".kc-lbs");
    const L = P.items.filter(it => !it.fx), els = [...svg.querySelectorAll(".kc-ly")];
    const S = L.map((it, k) => { const mv = els[k].firstElementChild; return { it, mv, bob: mv.firstElementChild, y: it.off, r: 0, s: 1, sx: 1, sy: 1, o: 1 }; });
    const ap = q => { q.mv.setAttribute("transform", `translate(0,${f(q.y)}) rotate(${f(q.r)},0,${f(-q.it.h / 2)}) scale(${f3(q.s * q.sx)},${f3(q.s * q.sy)})`); q.mv.setAttribute("opacity", f3(Math.max(0, Math.min(1, q.o)))); };
    /* 1 — anatomy: ingredients burst into an exploded, labelled stack */
    T.add(0, 420, p => op(tt, p));
    S.forEach((q, k) => { const r0 = (q.it.rr - .5) * 44; T.add(140 + k * 85, 640, p => { q.y = q.it.off + 46 * (1 - p); q.r = r0 * (1 - p); q.s = .5 + .5 * p; q.o = p * 2.4; ap(q); }, E.back); });
    [...svg.querySelectorAll(".kc-lb")].forEach((g, j) => {
      const ld = g.querySelector(".kc-ld"), dot = g.querySelector(".kc-dot"), tx = g.querySelector("text"), side = P.labels[j].side;
      T.add(440 + j * 85, 440, p => { ld.setAttribute("stroke-dashoffset", f3(1 - p)); op(dot, p * 3); op(tx, p); tx.setAttribute("transform", `translate(${f(side * 10 * (1 - p))},0)`); });
    });
    if (!full) return T;
    /* 2 — the chef walks in and builds it */
    const chefG = $(".kc-chef"), armR = $(".kc-armR"), armL = $(".kc-armL"), bub = $(".kc-bub"), bubT = $(".kc-bubt"), wink = $(".kc-wink"), eyeR = $(".kc-eyeR");
    const stack = $(".kc-stack"), shk = $(".kc-shk"), vb = $(".kc-vb"), vf = $(".kc-vf"), fx = $(".kc-fx"), blendG = $(".kc-blend"), stamp = $(".kc-stamp"), steam = $(".kc-steam"), stars = [...svg.querySelectorAll(".kc-stars path")];
    const setR = a => armR.setAttribute("transform", `rotate(${f(a)},194,448)`), setL = a => armL.setAttribute("transform", `rotate(${f(a)},66,448)`);
    const bubAt = (p, txt) => { if (txt && p > 0) bubT.textContent = txt; op(bub, p * 1.5); bub.setAttribute("transform", `translate(114,178) scale(${f3(Math.max(.01, .6 + .4 * p))}) translate(-114,-178)`); };
    const H1 = 440 + Math.max(S.length, P.labels.length) * 85 + 440 + 1500;
    T.add(H1, 280, p => { op(lbs, 1 - p); op(tt, 1 - p); });
    T.add(H1 + 60, 760, p => stack.setAttribute("transform", `translate(${f(CXA + (CXB - CXA) * p)},0)`), E.io);
    T.add(H1 + 60, 860, p => chefG.setAttribute("transform", `translate(${f(-330 * (1 - p))},0)`), E.back);
    T.add(H1 + 660, 300, p => bubAt(p), E.back);
    T.add(H1 + 2150, 220, p => op(bub, 1 - p));
    T.add(H1 + 700, 460, p => { const t = `translate(0,${f(36 * (1 - p))})`; op(vb, p); op(vf, p); vb.setAttribute("transform", t); vf.setAttribute("transform", t); }, E.back);
    const rnd = mul(P.id);
    const puff = (it, at) => {
      const pts = [], cy = it.y0 - it.h * .3;
      for (let k = 0; k < 8; k++) { const side = k % 2 ? 1 : -1, c = document.createElementNS(NS, "circle"); c.setAttribute("r", f(3 + rnd() * 2.5)); c.setAttribute("fill", k % 3 ? PAPER : SAND); c.setAttribute("stroke", INK); c.setAttribute("stroke-width", "1.5"); fx.append(c); pts.push({ c, x0: it.dx + side * (it.w / 2) * (.55 + .4 * rnd()), dx: side * (14 + 22 * rnd()), dy: -(8 + 20 * rnd()) }); }
      T.add(at, 480, p => pts.forEach(q => { q.c.setAttribute("cx", f(q.x0 + q.dx * p)); q.c.setAttribute("cy", f(cy + q.dy * p + 30 * p * p)); op(q.c, p ? 1 - p : 0); }));
    };
    let t = H1 + 1200;
    const step = S.length > 6 ? 300 : 350;
    P.items.forEach(it => {
      if (it.fx === "shake") {
        T.add(t, 980, p => { const w = Math.sin(p * Math.PI * 9), a = Math.min(1, p * 6); shk.setAttribute("transform", `rotate(${f(7 * w * (1 - p))},0,${BASE})`); setR(a * (-28 + 22 * w)); setL(a * (36 - 22 * w)); }, E.lin);
        T.add(t + 990, 220, p => { if (p) { setR(-6 * (1 - p)); setL(14 * (1 - p)); } });
        t += 1240; return;
      }
      if (it.fx === "blend") {
        T.add(t, 1150, p => { const a = Math.min(1, p * 5) * (1 - Math.max(0, p - .85) / .15); shk.setAttribute("transform", `rotate(${f(2.4 * Math.sin(p * Math.PI * 22) * (1 - p))},0,${BASE})`); setR(a * (-20 + 6 * Math.sin(p * 60))); setL(a * 30); }, E.lin);
        T.add(t + 160, 820, p => op(blendG, p), E.io);
        t += 1350; return;
      }
      const q = S.find(z => z.it === it), at = t;
      T.add(at - 130, 130, p => { if (p) setR(-58 * p); });
      T.add(at + 10, 250, p => { if (p) setR(-58 + 64 * p); }, E.io);
      T.add(at, 250, p => { if (p > 0 && q.bob.classList.contains("kc-bobon")) q.bob.classList.remove("kc-bobon"); q.y = q.it.off * (1 - p); ap(q); }, E.in);
      T.add(at + 250, 320, p => { if (!p) return; const d = Math.cos(p * Math.PI * 2) * (1 - p); q.sy = 1 - .2 * d; q.sx = 1 + .1 * d; ap(q); }, E.lin);
      puff(it, at + 250);
      const sw = q.bob.querySelector(".kc-straw");
      if (sw) T.add(at + 300, 420, p => { op(sw, p * 2); sw.setAttribute("transform", `translate(${f(-14 * (1 - p))},${f(-46 * (1 - p))})`); }, E.back);
      t += step;
    });
    /* 3 — finale */
    const Tf = t + 140;
    T.add(Tf, 400, p => { if (p) { setR(-70 * p); setL(140 * p); } }, E.back);
    T.add(Tf + 140, 1, p => { op(wink, p ? 1 : 0); op(eyeR, p ? 0 : 1); });
    T.add(Tf + 1300, 1, p => { if (p) { op(wink, 0); op(eyeR, 1); } });
    T.add(Tf + 80, 320, p => { if (p) bubAt(p, P.bye); }, E.back);
    T.add(Tf + 140, 820, p => stars.forEach((s, k) => { const a = -150 + k * 26, d = 18 + 46 * p; s.setAttribute("transform", `translate(${f(239 + Math.cos(a * Math.PI / 180) * d)},${f(397 + Math.sin(a * Math.PI / 180) * d)}) rotate(${f(p * 180)}) scale(${f3(.5 + .6 * Math.sin(p * Math.PI))})`); op(s, p < .2 ? p * 5 : 1 - (p - .2) / .8); }), E.out);
    if (stamp) T.add(Tf + 320, 560, p => { op(stamp, p * 3); stamp.setAttribute("transform", `translate(580,236) rotate(${f(-40 + 32 * p)}) scale(${f3(Math.max(.01, p))})`); }, E.back);
    if (steam) T.add(Tf, 1, p => steam.classList.toggle("on", p > 0));
    return T;
  }

  /* ---------- controller ---------- */
  function hover(svg) {
    const on = i => { svg.classList.toggle("foc", i != null); svg.querySelectorAll("[data-i]").forEach(el => el.classList.toggle("on", el.getAttribute("data-i") === i)); };
    svg.addEventListener("pointerover", e => { const g = e.target.closest && e.target.closest("[data-i]"); on(g ? g.getAttribute("data-i") : null); });
    svg.addEventListener("pointerleave", () => on(null));
  }
  function mount(host, item) {
    const P = plan(item.id); if (!P) return null;
    let tl = null, mode = "", timer = 0;
    const seg = host.querySelector(".kc-seg");
    const render = full => { const old = host.querySelector(".kc-svg"); if (old) old.remove(); host.insertAdjacentHTML("afterbegin", markup(P, item.name, full)); return host.querySelector(".kc-svg"); };
    const setMode = m => { mode = m; host.classList.remove("m-build", "m-anat", "m-photo"); host.classList.add("m-" + m); if (seg) seg.querySelectorAll("[data-kc]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.kc === m))); };
    const stop = () => { if (tl) tl.stop(); clearTimeout(timer); };
    function build() { stop(); setMode("build"); const svg = render(true); tl = timeline(svg, P, true); tl.init(); if (reduce) { tl.finish(); return; } tl.play(() => { timer = setTimeout(() => { if (mode === "build") photo(); }, 1600); }); }
    function anatomy() { stop(); setMode("anat"); const svg = render(false); tl = timeline(svg, P, false); tl.init(); if (reduce) tl.finish(); else tl.play(); hover(svg); }
    function photo() { stop(); if (tl) tl.finish(); setMode("photo"); }
    if (seg) seg.addEventListener("click", e => { const b = e.target.closest("[data-kc]"); if (!b) return; e.stopPropagation(); ({ build, anat: anatomy, photo })[b.dataset.kc](); });
    if (reduce) anatomy(); else build();
    return (window.KlayChef.last = { stop, build, anatomy, photo, get mode() { return mode; }, get end() { return tl ? tl.end : 0; }, finish() { if (tl) tl.finish(); } });
  }

  window.KlayChef = { mount, has: id => !!R[id], plan, ids: () => Object.keys(R).map(Number) };
})();
