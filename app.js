(() => {
  "use strict";
  const B = window.KlayBrain, ALL = B.ALL, M = window.KLAY_MENU;
  const ORDER = "https://www.orderklaydeli.com", UTM = "utm_source=klay-website&utm_medium=referral&utm_campaign=site";
  const BRANCHES = {
    318: { name: "New Cairo", full: "New Cairo · El Narges", hours: "9 AM – 1 AM", wa: "" },
    330: { name: "6th of October", full: "6th of October · Golf Central", hours: "9 AM – 11 PM", wa: "" }
  };
  const HOURS = { 318: [540, 1500], 330: [540, 1380] };
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const mobile = () => innerWidth <= 760;
  const DRINK = new Set(["hot", "iced", "blended", "matcha", "tea", "water"]);
  const cut = (id, w = 600) => `cut/${id}-${w}.webp`;
  const dim = id => (window.CUT_DIM || {})[id] || [600, 400];
  const cutImg = (id, alt, sz = "200px", eager) => `<img src="${cut(id)}" srcset="${cut(id, 600)} 600w, ${cut(id, 1200)} 1200w" sizes="${sz}" width="${dim(id)[0]}" height="${dim(id)[1]}" alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;
  let branch = store.get("klay.branch", 318);
  const productUrl = pid => `${ORDER}/product/${pid}/?${UTM}`;
  const storeUrl = () => `${ORDER}/?${UTM}`;
  function cairoMinutes() { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()); const g = t => +p.find(x => x.type === t).value; return g("hour") * 60 + g("minute"); }
  function isOpen(id) { const [o, c] = HOURS[id], m = cairoMinutes(); return (m >= o && m < Math.min(c, 1440)) || (c > 1440 && m < c - 1440); }
  document.addEventListener("load", e => { if (e.target.tagName === "IMG") e.target.classList.add("ld"); }, true);
  const settle = root => (root || document).querySelectorAll("img").forEach(i => { if (i.complete && i.naturalWidth) i.classList.add("ld"); });
  $$("[data-order]").forEach(a => { a.href = storeUrl(); a.target = "_blank"; a.rel = "noopener"; });
  let tt; function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2000); }
  function lock(on) { document.documentElement.classList.toggle("locked", on); }

  /* ================= BAG STATE ================= */
  let bag = store.get("klay.bag", []).filter(l => ALL[l.id]);
  const lineName = l => ALL[l.id].name + (l.size ? (l.size === "L" ? " · Large" : " · Medium") : "");
  const linePrice = l => (l.size ? ALL[l.id].sizes[l.size].price : ALL[l.id].price);
  const count = () => bag.reduce((a, l) => a + l.qty, 0);
  const total = () => bag.reduce((a, l) => a + l.qty * linePrice(l), 0);
  const qtyOf = (id, size) => { const l = bag.find(x => x.id === id && (x.size || null) === (size || null)); return l ? l.qty : 0; };
  function save() { store.set("klay.bag", bag); paint(); }
  function add(id, size, n = 1, fromEl, quiet) {
    const i = ALL[id]; if (!i) return; if (!i.price && !i.sizes) return openItem(id);
    if (i.sizes && !size) size = "M";
    const pid = size ? i.sizes[size].id : i.id;
    const l = bag.find(x => x.id === id && (x.size || null) === (size || null));
    if (l) l.qty = Math.min(20, l.qty + n); else bag.push({ id, pid, size: size || null, qty: n });
    save(); fly(fromEl, id);
    if (!quiet) toast(`Dropped in · ${ALL[id].name}${size ? (size === "L" ? " · Large" : " · Medium") : ""}`);
  }
  function setQty(id, size, q) { const l = bag.find(x => x.id === id && (x.size || null) === (size || null)); if (!l) return; l.qty = Math.max(0, Math.min(20, q)); if (!l.qty) bag = bag.filter(x => x !== l); save(); }
  const stepper = (id, size) => `<span class="qa" data-step="${id}" data-size="${size || ""}"></span>`;
  function paintStepper(el) {
    const id = +el.dataset.step, size = el.dataset.size || (ALL[id].sizes ? "M" : null), q = qtyOf(id, size), label = esc(ALL[id].name);
    el.innerHTML = q ? `<button data-dec aria-label="Remove one ${label}">−</button><b aria-live="polite">${q}</b><button data-inc aria-label="Add one more ${label}">+</button>`
      : `<button class="s0" data-inc aria-label="Add ${label} to bag">+</button>`;
    el.classList.toggle("on", !!q);
  }
  document.addEventListener("click", e => {
    const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"); if (!inc && !dec) return;
    e.preventDefault(); e.stopPropagation();
    const st = e.target.closest("[data-step]"), id = +st.dataset.step, size = st.dataset.size || (ALL[id].sizes ? "M" : null);
    if (inc) add(id, size, 1, st.closest("[data-open]") || st); else setQty(id, size, qtyOf(id, size) - 1);
  }, true);

  /* ================= ISLAND ================= */
  const island = $("#island"), isA = $("#islandA");
  function paint() {
    const n = count(), t = total();
    $$(".bag-n").forEach(e => { e.textContent = n; e.hidden = !n; });
    $("#bagBtn").setAttribute("aria-label", n ? `Open your bag, ${n} items, ${t} EGP` : "Open your bag");
    const last = [...bag].slice(-3).map(l => l.id);
    $("#isTh").innerHTML = n ? last.map(id => `<img src="${cut(id)}" alt="">`).join("") : `<span class="is-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg></span>`;
    $("#isT").innerHTML = n ? `${n} item${n > 1 ? "s" : ""}<small>${t} EGP · tap to review</small>` : `Order now<small>20% off your first order</small>`;
    $("#isGo").textContent = n ? "View bag" : "Order";
    isA.setAttribute("aria-label", n ? `View bag: ${n} items, ${t} EGP` : "Order now on Klay online");
    $$("[data-step]").forEach(paintStepper);
    if ($("#bag").open) renderBag();
    showIsland();
  }
  isA.addEventListener("click", e => { if (count()) { e.preventDefault(); openBag(); } });
  function jelly() { island.classList.remove("jelly", "pop"); void island.offsetWidth; island.classList.add("jelly", "pop"); }
  function fly(from, id) {
    showIsland(true);
    if (reduce || !from) return jelly();
    const src = from.querySelector ? from.querySelector("img") : null;
    if (!src) return jelly();
    const a = src.getBoundingClientRect(), b = isA.getBoundingClientRect();
    if (!a.width || !b.width) return jelly();
    const g = document.createElement("img"); g.src = cut(id); g.className = "ghost"; g.alt = "";
    const w = Math.min(a.width, 260), h = a.height * (w / a.width);
    Object.assign(g.style, { left: a.left + (a.width - w) / 2 + "px", top: a.top + (a.height - h) / 2 + "px", width: w + "px", height: h + "px" });
    document.body.append(g);
    const dx = b.left + 34 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    g.animate([{ transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 }, { transform: `translate(${dx * .4}px,${dy * .3 - 120}px) scale(.8) rotate(-12deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx}px,${dy}px) scale(.16) rotate(20deg)`, opacity: .6 }], { duration: 820, easing: "cubic-bezier(.5,0,.25,1)" }).onfinish = () => { g.remove(); jelly(); };
  }

  /* ================= BAG DRAWER ================= */
  const bagD = $("#bag"), bagIn = $("#bagIn");
  let checklist = false;
  function suggestions() {
    const has = c => bag.some(l => c(ALL[l.id])), out = [];
    if (!has(i => ["sandwiches", "bowls", "salads"].includes(i.cat))) out.push(21765);
    if (!has(i => DRINK.has(i.cat))) out.push(22310, 21794);
    if (!has(i => i.cat === "sides")) out.push(21759);
    if (!has(i => i.cat === "sweets")) out.push(21824);
    return out.filter(id => !qtyOf(id)).slice(0, 3);
  }
  function renderBag() {
    const n = count(), t = total(), br = BRANCHES[branch];
    if (!n) {
      bagIn.innerHTML = `<div class="bg-h"><h3 tabindex="-1" autofocus>Your bag</h3><button class="x2" data-close-bag aria-label="Close bag">✕</button></div>
        <div class="bg-empty"><img src="${cut(21765, 1200)}" alt="" width="1200" height="391"><p>Nothing dropped yet.</p><span>Tap + on anything, or let Klay build an order for you.</span>
        <div class="bg-acts"><a class="btn b-fire" href="#menu" data-close-bag>Browse the menu</a><a class="btn b-glass" href="#concierge" data-close-bag>Ask Klay ✦</a></div></div>`;
      return;
    }
    const sug = suggestions();
    bagIn.innerHTML = `
      <div class="bg-h"><h3 tabindex="-1" autofocus>Your bag <small>${n} item${n > 1 ? "s" : ""}</small></h3><button class="x2" data-close-bag aria-label="Close bag">✕</button></div>
      <div class="bg-scroll">
        ${checklist ? `<div class="guide"><b>Finish on Klay's checkout</b>Klay's ordering site opened in a new tab. Pick delivery or pickup (${esc(br.full)}) once, press “Add to Cart”, then come back for the next item.</div>` : ""}
        <ul class="lines">${bag.map(l => `
          <li class="ln2 ${l.done ? "done" : ""}"><span class="th"><img src="${cut(l.id)}" alt="" width="${dim(l.id)[0]}" height="${dim(l.id)[1]}"></span>
            <span class="nm"><b>${esc(lineName(l))}</b><span>${linePrice(l)} EGP${l.qty > 1 ? ` × ${l.qty} = ${linePrice(l) * l.qty} EGP` : ""}</span></span>
            ${checklist ? `<a class="btn b-fire sm" href="${productUrl(l.pid)}" target="klayorder" data-mark="${l.id}|${l.size || ""}">${l.done ? "Added ✓" : `Add ×${l.qty}`}</a>` : stepper(l.id, l.size)}
          </li>`).join("")}</ul>
        ${!checklist && sug.length ? `<div class="upsell"><b>Complete the drop</b><div class="ups">${sug.map(id => `
          <button class="up" data-upadd="${id}"><img src="${cut(id)}" alt="" width="${dim(id)[0]}" height="${dim(id)[1]}"><span><b>${esc(ALL[id].name)}</b><span>+ ${ALL[id].price} EGP</span></span></button>`).join("")}</div></div>` : ""}
      </div>
      <div class="bg-f">
        <div class="seg" role="radiogroup" aria-label="Choose your branch">${Object.entries(BRANCHES).map(([id, b]) => `<button role="radio" aria-checked="${+id === branch}" class="${+id === branch ? "on" : ""}" data-branch="${id}">${b.name}<small><i class="${isOpen(+id) ? "" : "off"}"></i>${isOpen(+id) ? "Open · " : "Closed · "}${b.hours}</small></button>`).join("")}</div>
        <div class="tot"><span>Total<small>incl. VAT &amp; service · delivery fee at checkout</small></span><b>${t} EGP</b></div>
        <p class="save">First order online? Sign up on Klay's site and save <b>20%</b> — about <b>${Math.round(t * .2)} EGP</b> on this bag.</p>
        ${br.wa ? `<a class="btn b-fire big" target="_blank" rel="noopener" href="https://wa.me/${br.wa}?text=${encodeURIComponent(waText())}">Send order on WhatsApp</a>` : ""}
        ${checklist ? `<button class="btn b-glass big" data-checklist="0">Back to my bag</button><button class="clr" data-clear>Order placed? Clear my bag</button>`
          : `<div class="f-row"><button class="btn b-glass" data-dropcard>Drop Card ✦</button><button class="btn ${br.wa ? "b-glass" : "b-fire"}" data-checklist="1">Checkout</button></div>`}
      </div>`;
    $$("#bagIn [data-step]").forEach(paintStepper); settle(bagIn);
  }
  function waText() { return `Hi Klay! New order for ${BRANCHES[branch].full}:\n` + bag.map(l => `• ${l.qty} × ${lineName(l)} — ${linePrice(l) * l.qty} EGP`).join("\n") + `\nTotal: ${total()} EGP`; }
  function openBag() { checklist = false; renderBag(); if (!bagD.open) { bagD.showModal(); lock(true); } }
  bagD.addEventListener("close", () => lock(false));
  bagD.addEventListener("click", e => {
    if (e.target === bagD || e.target.closest("[data-close-bag]")) { bagD.close(); return; }
    const up = e.target.closest("[data-upadd]"); if (up) { add(+up.dataset.upadd, null, 1, up); return; }
    const br = e.target.closest("[data-branch]"); if (br) { branch = +br.dataset.branch; store.set("klay.branch", branch); renderBag(); return; }
    if (e.target.closest("[data-dropcard]")) { bagD.close(); openCard(bag.map(l => ({ id: l.id, name: lineName(l), qty: l.qty, price: linePrice(l) * l.qty })), total()); return; }
    if (e.target.closest("[data-clear]")) { bag = []; checklist = false; save(); renderBag(); toast("Bag cleared"); return; }
    const ck = e.target.closest("[data-checklist]"); if (ck) {
      checklist = ck.dataset.checklist === "1";
      if (checklist) { const first = bag.find(l => !l.done) || bag[0]; window.open(productUrl(first.pid), "klayorder"); first.done = true; store.set("klay.bag", bag); }
      renderBag(); return;
    }
    const mk = e.target.closest("[data-mark]"); if (mk) { const [id, s] = mk.dataset.mark.split("|"); const l = bag.find(x => x.id === +id && (x.size || "") === s); if (l) { l.done = true; store.set("klay.bag", bag); setTimeout(renderBag, 60); } }
  });
  $("#bagBtn").addEventListener("click", openBag);

  /* ================= DROP CARD ================= */
  const qrUrl = `${ORDER}/?utm_source=klay-dropcard&utm_medium=qr&utm_campaign=site`;
  function qrSvg() {
    if (!window.qrcode) return "";
    const q = qrcode(0, "M"); q.addData(qrUrl); q.make();
    const n = q.getModuleCount(); let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c},${r}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-label="QR code to order on Klay"><path d="${d}" fill="#140c08"/></svg>`;
  }
  let cardNo = store.get("klay.cardno", 400 + Math.floor(Math.random() * 500));
  function cardHTML(lines, tot, compact) {
    cardNo++; store.set("klay.cardno", cardNo);
    const d = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const shown = lines.slice(0, 5), more = lines.length - shown.length;
    return `<div class="dcard" data-card>
      <div class="dc-top"><img src="logo-cream.svg" alt="Klay" width="1260" height="1000"><div class="dc-no">DROP<b>#KD-${cardNo}</b>${d}</div></div>
      <div class="dc-title">Your <span>drop.</span></div>
      <div class="dc-items">${shown.map(l => `<div class="dc-it"><img src="${cut(l.id)}" alt=""><b>${l.qty > 1 ? l.qty + " × " : ""}${esc(l.name)}</b><span>${l.price}</span></div>`).join("")}${more > 0 ? `<div class="dc-more">+ ${more} more</div>` : ""}</div>
      <div class="dc-foot"><div class="dc-tot"><small>Total · EGP</small><b>${tot}</b><small>Scan to order on Klay</small></div><div class="dc-qr">${qrSvg()}</div></div>
    </div>
    <div class="dc-acts"><button class="btn b-fire" data-share>Share to story</button>${compact ? `<button class="btn b-glass" data-addrec>Add all to bag</button>` : `<button class="btn b-glass" data-gocheck>Checkout</button>`}</div>`;
  }
  function tilt(card) {
    if (!card) return;
    const move = (x, y) => { const r = card.getBoundingClientRect(), px = (x - r.left) / r.width, py = (y - r.top) / r.height;
      card.style.setProperty("--rx", `${(px - .5) * 18}deg`); card.style.setProperty("--ry", `${(.5 - py) * 14}deg`);
      card.style.setProperty("--hx", `${px * 100}%`); card.style.setProperty("--hy", `${py * 100}%`); };
    card.addEventListener("pointermove", e => move(e.clientX, e.clientY));
    card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    if (!reduce) { let t0 = performance.now(); const idle = now => { if (!card.isConnected) return; if (!card.matches(":hover")) { const k = (now - t0) / 1000; card.style.setProperty("--hx", `${50 + Math.sin(k * .9) * 40}%`); card.style.setProperty("--hy", `${50 + Math.cos(k * .7) * 30}%`); } requestAnimationFrame(idle); }; requestAnimationFrame(idle); }
  }
  let cardData = null;
  const dcd = $("#dcd"), dcdIn = $("#dcdIn");
  function openCard(lines, tot) {
    cardData = { lines, tot };
    dcdIn.innerHTML = `<button class="dc-close" data-dcclose aria-label="Close">✕</button>` + cardHTML(lines, tot, false);
    if (!dcd.open) { dcd.showModal(); lock(true); }
    tilt(dcdIn.querySelector("[data-card]"));
  }
  dcd.addEventListener("close", () => lock(false));
  dcd.addEventListener("click", e => {
    if (e.target === dcd || e.target.closest("[data-dcclose]")) { dcd.close(); return; }
    if (e.target.closest("[data-gocheck]")) { dcd.close(); openBag(); }
  });
  document.addEventListener("click", e => { if (e.target.closest("[data-share]")) { e.preventDefault(); shareCard(); } });

  async function shareCard() {
    if (!cardData) return;
    toast("Minting your Drop Card…");
    try {
      await document.fonts.load('800 80px "Bricolage Grotesque"');
      const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
      const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
      let g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2a160d"); g.addColorStop(1, "#0c0705"); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const glow = (cx, cy, r, col) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, W, H); };
      glow(260, 380, 900, "rgba(255,138,76,.45)"); glow(900, 1600, 800, "rgba(200,50,63,.35)");
      const logo = await load("logo-cream.svg"); if (logo) x.drawImage(logo, 80, 90, 230, 183);
      x.fillStyle = "rgba(247,236,220,.6)"; x.font = '600 34px "Bricolage Grotesque"'; x.textAlign = "right"; x.fillText(`#KD-${cardNo}`, W - 80, 150);
      x.textAlign = "left"; x.fillStyle = "#f7ecdc"; x.font = '800 190px "Bricolage Grotesque"'; x.fillText("Your", 72, 470);
      const tg = x.createLinearGradient(72, 0, 900, 0); tg.addColorStop(0, "#f3bd6b"); tg.addColorStop(1, "#ff8a4c"); x.fillStyle = tg; x.fillText("drop.", 72, 640);
      const hero = await load(cut(cardData.lines[0].id, 1200));
      if (hero) { const w = 860, h = hero.height * (w / hero.width), hh = Math.min(h, 460), ww = hero.width * (hh / hero.height); x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = 60; x.shadowOffsetY = 40; x.drawImage(hero, (W - ww) / 2, 700 + (460 - hh) / 2, ww, hh); x.shadowColor = "transparent"; }
      let y = 1250; x.font = '600 40px "Bricolage Grotesque"';
      cardData.lines.slice(0, 5).forEach(l => { x.fillStyle = "#f7ecdc"; x.textAlign = "left"; x.fillText(`${l.qty > 1 ? l.qty + " × " : ""}${l.name}`.slice(0, 34), 80, y); x.fillStyle = "rgba(247,236,220,.6)"; x.textAlign = "right"; x.fillText(String(l.price), W - 80, y); y += 62; });
      x.strokeStyle = "rgba(255,214,170,.3)"; x.setLineDash([12, 10]); x.beginPath(); x.moveTo(80, 1530); x.lineTo(W - 80, 1530); x.stroke(); x.setLineDash([]);
      x.textAlign = "left"; x.fillStyle = "rgba(247,236,220,.6)"; x.font = '500 34px "Bricolage Grotesque"'; x.fillText("Total · EGP", 80, 1600);
      x.fillStyle = "#f3bd6b"; x.font = '800 110px "Bricolage Grotesque"'; x.fillText(String(cardData.tot), 80, 1700); x.fillStyle = "rgba(247,236,220,.6)"; x.font = '500 32px "Bricolage Grotesque"'; x.fillText("Scan to order on Klay", 80, 1752);
      if (window.qrcode) { const q = qrcode(0, "M"); q.addData(qrUrl); q.make(); const n = q.getModuleCount(), s = 190, m = s / n, ox = W - 80 - s, oy = 1534; x.fillStyle = "#f7ecdc"; x.fillRect(ox - 14, oy - 14 + 30, s + 28, s + 28); x.fillStyle = "#140c08"; for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(ox + cc * m, oy + 30 + r * m, Math.ceil(m), Math.ceil(m)); }
      const blob = await new Promise(r => c.toBlob(r, "image/png"));
      const file = new File([blob], `klay-drop-${cardNo}.png`, { type: "image/png" });
      if (!fine && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "My Klay drop", text: "My Klay order ✦ orderklaydeli.com" }); }
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("Drop Card saved — post it to your story ✦"); }
    } catch (err) { if (err && err.name !== "AbortError") toast("Couldn't create the image on this device"); }
  }

  /* ================= HERO: THE DROP ================= */
  const stage = $("#stage"), scene = $("#scene"), cutSec = $("#cut"), hl = $("#hl"), hr = $("#hr"), word = $("#word"), lis = $$("#inside li"), hint = $("#hint"), hdr = $("#hdr");
  // Title letters
  const title = $("#title");
  (function split() {
    let i = 0;
    const wrapText = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); [...n.textContent].forEach(ch => { const s = document.createElement("span"); if (ch === " ") { s.className = "sp"; } else { s.className = "ch"; s.textContent = ch; s.style.setProperty("--i", i++); } f.append(s); }); n.replaceWith(f); }
      else if (n.nodeType === 1) wrapText(n);
    });
    wrapText(title);
  })();
  // Ingredient field: [asset, x(vw from centre), y(vh), depth, size(vmin), rotation]
  const D = "drop/";
  const FIELD = [
    ["bresaola_1", -36, -20, .9, 22, -18], ["stracciatella_1", 33, -24, .65, 15, 12], ["arugtom_2", 35, 18, .8, 14, 22],
    ["arugtom_1", -37, 16, .55, 13, -32], ["focaccia_1", 20, 30, .35, 11, 14], ["arugtom_3", 8, -33, .3, 9, 40],
    ["bresaola_1", -16, 32, .22, 8, 70], ["arugtom_2", -22, -34, .25, 7, -10],
    ["stracciatella_1", 47, 4, 1.3, 22, -8], ["arugtom_3", -46, -38, 1.35, 23, 150]
  ];
  const FIELD_M = [
    ["bresaola_1", -30, -24, .9, 30, -18], ["stracciatella_1", 30, -20, .65, 22, 12], ["arugtom_2", 32, 10, .8, 20, 22],
    ["arugtom_1", -34, 8, .55, 18, -32], ["focaccia_1", 14, -34, .35, 14, 14], ["arugtom_3", -6, -36, .3, 12, 40],
    ["stracciatella_1", 44, -6, 1.3, 28, -8], ["arugtom_3", -44, -32, 1.35, 26, 150]
  ];
  let parts = [];
  function buildField() {
    const set = mobile() ? FIELD_M : FIELD;
    scene.innerHTML = set.map(([a, , , z, s], k) => {
      const blur = z > 1.1 ? 7 : z < .4 ? 3.2 : z < .6 ? 1.2 : 0;
      return `<div class="ing" style="width:${s}vmin;z-index:${z > 1 ? 6 : 1};filter:${blur ? `blur(${blur}px)` : "none"};opacity:${z < .4 ? .75 : 1}"><i style="--fd:${5 + (k % 4) * 1.3}s;--dl:-${k * .7}s"><img src="${D}${a}${s > 18 ? "" : "-s"}.webp" alt=""></i></div>`;
    }).join("");
    parts = [...scene.children].map((el, k) => ({ el, x: set[k][1], y: set[k][2], z: set[k][3], r: set[k][5], born: performance.now() + k * 70 }));
    lastP = -1;
  }
  let mx = 0, my = 0, tmx = 0, tmy = 0, lastP = -1;
  if (fine) addEventListener("pointermove", e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
  else stage.addEventListener("touchmove", e => { const t = e.touches[0]; tmx = t.clientX / innerWidth - .5; tmy = t.clientY / innerHeight - .5; }, { passive: true });
  const start = performance.now();
  function frame(now) {
    const r = cutSec.getBoundingClientRect();
    if (r.bottom > -50) {
      const total = cutSec.offsetHeight - innerHeight, p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      mx += (tmx - mx) * .06; my += (tmy - my) * .06;
      const auto = reduce ? 0 : Math.sin((now - start) / 2600) * .04;
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, open = Math.min(1, e * 1.4);
      for (const q of parts) {
        const intro = reduce ? 1 : Math.min(1, Math.max(0, (now - q.born - 250) / 1300)), ie = 1 - Math.pow(1 - intro, 4);
        const spread = 1 + open * 1.25, from = (1 - ie) * 2.2;
        const X = q.x * (spread + from) + (mx + auto) * q.z * 6, Y = q.y * (spread + from) * (innerHeight / innerWidth) + my * q.z * 4;
        q.el.style.transform = `translate(-50%,-50%) translate3d(${X}vw, ${Y}vw, 0) rotate(${q.r + open * 60 * Math.sign(q.x || 1)}deg) scale(${(0.6 + ie * .4) * (1 + open * .25 * q.z)})`;
        q.el.style.opacity = String((q.z < .4 ? .75 : 1) * ie * (1 - Math.max(0, open - .6) * (q.z < .5 ? 2 : 0)));
      }
      if (Math.abs(p - lastP) > .0003) {
        lastP = p;
        const sx = mobile() ? 20 : 15;
        hl.style.transform = `translate3d(${-open * sx}vw, ${mobile() ? -open * 9 : 0}vh, 0) rotate(${-open * 6}deg)`;
        hr.style.transform = `translate3d(${open * sx}vw, ${mobile() ? open * 9 : 0}vh, 0) rotate(${open * 6}deg)`;
        word.style.transform = `translate(-50%,-50%) scale(${1 + p * .25})`; word.style.opacity = String(1 - p * .8);
        lis.forEach((li, i) => li.classList.toggle("on", open > .45 + i * .08));
        hint.style.opacity = p > .02 ? "0" : "1";
      }
      $("#halves").style.transform = `translate(-50%,-50%) translate3d(${mx * -1.2}vw, ${my * -1}vh, 0)`;
    }
    hdr.classList.toggle("light", r.bottom < 80);
    requestAnimationFrame(frame);
  }
  function showIsland(force) { const r = cutSec.getBoundingClientRect(); island.classList.toggle("on", !!force || count() > 0 || r.bottom < innerHeight * .55); }
  addEventListener("scroll", () => showIsland(), { passive: true });
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(buildField, 200); });
  buildField(); requestAnimationFrame(frame);
  $$("[data-add-id]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); add(+b.dataset.addId, null, 1, $("#halves")); }));

  (function live() {
    const el = $("#live"); if (!el) return;
    const nc = isOpen(318), oc = isOpen(330);
    el.classList.toggle("closed", !(nc || oc));
    el.innerHTML = nc || oc ? `<i></i>Taking orders now` : `<i></i>Orders open at 9 AM`;
    setTimeout(live, 60000);
  })();

  /* ================= TICKER ================= */
  const R = [
    ["After many years in Italy this is the first and best authentic focaccia I found.", "New Cairo"],
    ["I’m addicted to their chicken bowl. Great portions, consistent quality and unique taste.", "New Cairo"],
    ["Never tasted a matcha this good.", "6th of October"],
    ["The combo of smoked beef, sweet fig & buffalo mozzarella is rich, creamy, and light on the tummy.", "New Cairo"],
    ["The café itself is spotless, with great lighting and a comfortable atmosphere.", "New Cairo"],
    ["The roast beef focaccia was honestly the best I’ve ever had!", "6th of October"],
    ["Matcha is great and not bitter at all.", "New Cairo"],
    ["They always package the food well including coffee which is rare.", "New Cairo"],
    ["The beetroot chips were absolutely amazing.", "New Cairo"],
    ["People were actually there working on their laptops, enjoying their meal/drinks and could focus.", "New Cairo"],
    ["The new drink “iced shaken” sea salt is wonderful! 😊", "New Cairo"],
    ["Pistachio roast beef Sandwich 10/10 (amazingly delicious).", "New Cairo"]
  ];
  const tick = R.map(([q]) => `<span><b>★★★★★</b>“${esc(q)}”</span>`).join("");
  $("#ticker").innerHTML = tick + tick;
  $("#wall").innerHTML = R.map(([q, b]) => `<figure class="rq"><div class="stars" aria-hidden="true">★★★★★</div><p>“${esc(q)}”</p><span>Google review · ${b}</span></figure>`).join("");

  /* ================= MOST LOVED ================= */
  const loved = Object.values(ALL).filter(i => i.loved).sort((a, b) => a.loved.n - b.loved.n);
  $("#rail").innerHTML = loved.map(i => `
    <div class="tagc" data-open="${i.id}" tabindex="0" role="button">
      <span class="rank" aria-hidden="true">${String(i.loved.n).padStart(2, "0")}</span>
      <span class="pt">${i.price}<small>EGP</small></span>
      <span class="pic">${cutImg(i.id, i.name, "340px")}</span>
      <h3>${esc(i.name)}</h3><q>${esc(i.loved.q)}</q>
      <span class="src">${i.loved.note ? esc(i.loved.note) : "Google review"}</span>
      <span class="tag-add">${stepper(i.id)}</span>
    </div>`).join("");
  const rail = $("#rail");
  rail.addEventListener("pointermove", e => { const c = e.target.closest(".tagc"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--gx", `${e.clientX - r.left}px`); c.style.setProperty("--gy", `${e.clientY - r.top}px`); });
  $$("[data-rail]").forEach(b => b.onclick = () => rail.scrollBy({ left: +b.dataset.rail * rail.clientWidth * .8, behavior: reduce ? "auto" : "smooth" }));
  let dx = null, sl = 0, moved = false;
  rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.target.closest("button")) return; dx = e.clientX; sl = rail.scrollLeft; moved = false; });
  addEventListener("pointermove", e => { if (dx === null) return; const d = e.clientX - dx; if (Math.abs(d) > 6) { moved = true; rail.classList.add("drag"); rail.scrollLeft = sl - d; } });
  addEventListener("pointerup", () => { if (dx === null) return; dx = null; requestAnimationFrame(() => rail.classList.remove("drag")); });
  rail.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  /* ================= CONCIERGE ================= */
  const msgs = $("#msgs"), slot = $("#dcSlot");
  const st = { spin: 0 }; let lastRec = null, busy = false;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scrollChat = () => msgs.scrollTo({ top: msgs.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  async function bot(text) { const t = document.createElement("div"); t.className = "m bot typing"; t.innerHTML = "<i></i><i></i><i></i>"; msgs.append(t); scrollChat(); await wait(600); t.className = "m bot"; t.textContent = text; scrollChat(); }
  function me(text) { const d = document.createElement("div"); d.className = "m me"; d.textContent = text; msgs.append(d); scrollChat(); }
  function chips(opts, cb) { const w = document.createElement("div"); w.className = "chips"; opts.forEach(([label, val]) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = label; b.onclick = () => { w.remove(); me(label); cb(val); }; w.append(b); }); msgs.append(w); scrollChat(); }
  function picks(items) { const w = document.createElement("div"); w.className = "picks"; w.innerHTML = items.map(i => `<div class="pick" data-open="${i.id}" role="button" tabindex="0"><img src="${cut(i.id)}" width="${dim(i.id)[0]}" height="${dim(i.id)[1]}" alt=""><span><b>${esc(i.name)}</b><span>${i.price} EGP</span></span>${stepper(i.id)}</div>`).join(""); msgs.append(w); w.querySelectorAll("[data-step]").forEach(paintStepper); settle(w); scrollChat(); }
  const Q = {
    hunger: ["How hungry are you?", [["A light bite", "light"], ["A proper meal", "meal"], ["Starving", "big"]]],
    crave: ["What are you craving?", [["Rich & meaty", "meaty"], ["Fresh & light", "fresh"], ["Something crispy", "crispy"], ["A sweet finish", "sweet"]]],
    drink: ["And to drink?", [["Coffee", "coffee"], ["Matcha", "matcha"], ["Tea or chai", "tea"], ["Water", "water"], ["No drink", "none"]]],
    temp: ["Iced or hot?", [["Iced", "iced"], ["Hot", "hot"]]]
  };
  async function askStep(k) { await bot(Q[k][0]); chips(Q[k][1], v => { st[k] = v; next(); }); }
  function next() {
    if (!st.hunger) return askStep("hunger"); if (!st.crave) return askStep("crave"); if (!st.drink) return askStep("drink");
    if (["coffee", "matcha", "tea"].includes(st.drink) && !st.temp) return askStep("temp"); finish();
  }
  const recLines = rec => rec.lines.map(l => ({ id: l.id, name: l.name, qty: 1, price: l.price }));
  async function finish() {
    lastRec = B.recommend(st);
    await bot(`Your drop: ${lastRec.lines.map(l => l.name).join(" + ")} — ${lastRec.total} EGP.`);
    cardData = { lines: recLines(lastRec), tot: lastRec.total };
    if (innerWidth > 1060) { slot.innerHTML = cardHTML(cardData.lines, cardData.tot, true); tilt(slot.querySelector("[data-card]")); }
    chips([["Add all to bag", "add"], ["See my Drop Card", "card"], ["Show me another", "spin"], ["Start over", "reset"]], v => {
      if (v === "add") { addRec(); bot(`Dropped in your bag — ${lastRec.total} EGP. Tap the bag at the bottom when you're ready.`).then(() => chips([["Open my bag", "open"], ["Start over", "reset"]], w => w === "open" ? openBag() : resetChat())); }
      else if (v === "card") { openCard(recLines(lastRec), lastRec.total); chips([["Add all to bag", "add2"], ["Start over", "reset"]], w => { if (w === "add2") { addRec(); } else resetChat(); }); }
      else if (v === "spin") { st.spin++; finish(); } else resetChat();
    });
  }
  function resetChat() { Object.keys(st).forEach(k => delete st[k]); st.spin = 0; next(); }
  function addRec() { lastRec.lines.forEach((l, k) => setTimeout(() => add(l.id, l.size, 1, k === 0 ? (slot.querySelector(".dc-it") || null) : null, true), k * 180)); toast(`${lastRec.lines.length} items dropped · ${lastRec.total} EGP`); }
  document.addEventListener("click", e => { if (e.target.closest("[data-addrec]") && lastRec) { e.preventDefault(); addRec(); if (dcd.open) dcd.close(); } });
  let started = false;
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !started) { started = true; o.disconnect(); bot("Hey! I know every item on Klay's menu. Three taps and I'll build your order.").then(next); } }, { threshold: .35 }).observe($("#concierge"));
  $("#ask").addEventListener("submit", async e => {
    e.preventDefault(); const inp = $("#askIn"), v = inp.value.trim(); if (!v || busy) return;
    busy = true; inp.value = ""; started = true; me(v); $$("#msgs .chips").forEach(c => c.remove());
    const r = B.reply(v); await bot(r.text); if (r.items.length) picks(r.items);
    chips([["Build me a full order", "full"]], () => resetChat()); busy = false;
  });

  /* ================= MENU ================= */
  const ORDER_CATS = ["sandwiches", "bowls", "salads", "byo", "sides", "sweets", "iced", "hot", "matcha", "blended", "tea", "water"];
  const byKey = Object.fromEntries(M.map(c => [c.key, c]));
  $("#cats").innerHTML = ORDER_CATS.map(k => `<button class="cat" data-cat="${k}">${byKey[k].title}</button>`).join("");
  const FL = [["all", "Everything"], ["loved", "Guest favourites"], ["beef", "Beef"], ["chicken", "Chicken"], ["turkey", "Turkey"], ["nomeat", "No meat"], ["u250", "Under 250 EGP"]];
  $("#filters").innerHTML = FL.map(([k, l], i) => `<button class="flt ${i ? "" : "on"}" data-f="${k}" aria-pressed="${!i}">${l}</button>`).join("");
  let F = "all", QS = "";
  const pass = i => { if (QS && !(`${i.name} ${i.desc}`.toLowerCase().includes(QS))) return false; if (F === "all") return true; if (F === "loved") return !!i.loved; if (F === "u250") return i.price > 0 && i.price <= 250; return (i.tags || []).includes(F); };
  function renderMenu() {
    let shown = 0;
    $("#mcats").innerHTML = ORDER_CATS.map(k => {
      const c = byKey[k], items = c.items.filter(pass); shown += items.length; if (!items.length) return "";
      const d = DRINK.has(k);
      return `<div class="mcat" id="m-${k}"><h3>${c.title}<small>${items.length} ${items.length === 1 ? "item" : "items"}</small></h3>
        <div class="${d ? "dgrid" : "fgrid"}">${items.map(i => d ? `
          <div class="dr" data-open="${i.id}" tabindex="0" role="button"><span class="pic">${cutImg(i.id, i.name, "64px")}</span><span class="tx"><b>${esc(i.name)}</b><span>${i.price} EGP</span></span>${stepper(i.id)}</div>` : `
          <div class="it" data-open="${i.id}" tabindex="0" role="button">${i.loved ? `<span class="fav">Guest favourite</span>` : ""}<span class="pic">${cutImg(i.img, i.name, "(max-width:760px) 45vw, 260px")}</span>
            <h4>${esc(i.name)}</h4><p>${esc(i.desc)}</p>
            <span class="pr"><span>${i.price ? i.price + " <small>EGP</small>" : "<small>Priced by your build</small>"}${i.sizes ? " <small>· M / L</small>" : ""}</span>${i.price ? stepper(i.id) : `<span class="qa"><span class="ghostbtn" aria-hidden="true">›</span></span>`}</span></div>`).join("")}</div></div>`;
    }).join("");
    $("#none").style.display = shown ? "none" : "block";
    $$(".cat").forEach(b => b.style.display = document.getElementById("m-" + b.dataset.cat) ? "" : "none");
    $$("#mcats [data-step]").forEach(paintStepper); settle($("#mcats")); spyAll();
  }
  $("#filters").addEventListener("click", e => { const b = e.target.closest(".flt"); if (!b) return; F = b.dataset.f; $$(".flt").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); renderMenu(); });
  let qT; $("#q").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { QS = e.target.value.trim().toLowerCase(); renderMenu(); }, 120); });
  const catsEl = $("#cats"); let catsTouched = 0;
  ["pointerdown", "wheel", "touchstart"].forEach(ev => catsEl.addEventListener(ev, () => catsTouched = Date.now(), { passive: true }));
  catsEl.addEventListener("click", e => { const b = e.target.closest(".cat"); if (!b) return; const t = document.getElementById("m-" + b.dataset.cat); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  const spy = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const k = e.target.id.slice(2); $$(".cat").forEach(c => c.classList.toggle("on", c.dataset.cat === k)); const on = $(`.cat[data-cat="${k}"]`); if (on && Date.now() - catsTouched > 1500) catsEl.scrollTo({ left: on.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" }); }), { rootMargin: "-40% 0px -55% 0px" });
  function spyAll() { spy.disconnect(); $$(".mcat").forEach(m => spy.observe(m)); }
  renderMenu();

  /* ================= ITEM SHEET ================= */
  const sheet = $("#sheet"), shIn = $("#shIn");
  const PAIR = { food: [21759, 22310, 21824], drink: [21765, 21824, 21759] };
  let sh = { id: null, size: null, qty: 1 };
  function openItem(id, size, keepQty) {
    const i = ALL[id]; if (!i) return;
    sh = { id, size: i.sizes ? (size || "M") : null, qty: keepQty ? sh.qty : 1 };
    const d = DRINK.has(i.cat), unit = sh.size ? i.sizes[sh.size].price : i.price, pid = sh.size ? i.sizes[sh.size].id : i.id;
    const pairs = (d ? PAIR.drink : PAIR.food).filter(p => p !== i.id).slice(0, 2).map(p => ALL[p]);
    shIn.innerHTML = `
      <button class="x" aria-label="Close" data-close>✕</button>
      <div class="sh-ph"><span class="grab" aria-hidden="true"></span><img src="${cut(i.img, 1200)}" srcset="${cut(i.img, 1200)} 1200w, ${cut(i.img, 2400)} 2400w" sizes="(max-width:760px) 90vw, 55vw" alt="${esc(i.name)}"><a class="ph4k chip2 glass" href="img/${i.img}-${i.img === 21773 ? 960 : i.img === 21823 ? 2400 : 4000}.webp" target="_blank" rel="noopener">View 4K photo ↗</a></div>
      <div class="sh-b">
        <span class="k">${byKey[i.cat].title}</span><h3>${esc(i.name)}</h3><p class="d">${esc(i.desc)}</p>
        ${i.loved ? `<blockquote>“${esc(i.loved.q)}”<span>Google review</span></blockquote>` : ""}
        ${i.sizes ? `<div class="sizes" role="radiogroup" aria-label="Size">${["M", "L"].map(k => `<button role="radio" class="${k === sh.size ? "on" : ""}" data-size="${k}" aria-checked="${k === sh.size}">${k === "M" ? "Medium" : "Large"}<small>${i.sizes[k].price} EGP</small></button>`).join("")}</div>` : ""}
        ${unit ? `<div class="buy"><div class="qty"><button data-q="-1" aria-label="Less">−</button><b id="shQ">${sh.qty}</b><button data-q="1" aria-label="More">+</button></div>
          <button class="btn b-fire addbtn" data-shadd>Drop in bag · <span id="shT">${unit * sh.qty}</span> EGP</button></div>
          <a class="alt" href="${productUrl(pid)}" target="_blank" rel="noopener">Or order this alone on Klay online ↗</a>`
        : `<a class="btn b-fire" style="width:100%;height:58px" href="${productUrl(pid)}" target="_blank" rel="noopener">Start building on Klay online</a><p class="fine">Build-your-own is priced by what you choose, so it's built on Klay's ordering site.</p>`}
        <div class="pair"><b>Goes well with</b><div class="row">${pairs.map(p => `<button data-open="${p.id}"><img src="${cut(p.id)}" width="${dim(p.id)[0]}" height="${dim(p.id)[1]}" alt=""><span><b>${esc(p.name)}</b><span>${p.price} EGP</span></span></button>`).join("")}</div></div>
      </div>`;
    if (!sheet.open) { sheet.showModal(); lock(true); }
    const sb = shIn.querySelector(".sh-b"); if (sb) sb.scrollTop = 0; shIn.scrollTop = 0;
  }
  sheet.addEventListener("close", () => { if (!bagD.open && !dcd.open) lock(false); });
  sheet.addEventListener("click", e => {
    if (e.target === sheet || e.target.closest("[data-close]")) { sheet.close(); return; }
    const sz = e.target.closest("[data-size]"); if (sz && !sz.closest("[data-step]")) { openItem(sh.id, sz.dataset.size, true); return; }
    const q = e.target.closest("[data-q]"); if (q) { sh.qty = Math.max(1, Math.min(20, sh.qty + +q.dataset.q)); const i = ALL[sh.id], unit = sh.size ? i.sizes[sh.size].price : i.price; $("#shQ").textContent = sh.qty; $("#shT").textContent = unit * sh.qty; return; }
    if (e.target.closest("[data-shadd]")) { const ph = shIn.querySelector(".sh-ph"); add(sh.id, sh.size, sh.qty, ph); sheet.close(); }
  });
  let sy = null;
  sheet.addEventListener("touchstart", e => { if (e.target.closest(".sh-ph")) sy = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener("touchmove", e => { if (sy === null) return; const d = e.touches[0].clientY - sy; if (d > 0) sheet.style.transform = `translateY(${d}px)`; }, { passive: true });
  sheet.addEventListener("touchend", e => { if (sy === null) return; const d = e.changedTouches[0].clientY - sy; sy = null; sheet.style.transform = ""; if (d > 110) sheet.close(); });
  document.addEventListener("click", e => {
    if (e.target.closest("[data-step]") || e.target.closest("a[href]")) return;
    const t = e.target.closest("[data-open]"); if (t && !e.defaultPrevented) { e.preventDefault(); openItem(+t.dataset.open); }
  });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-open][role=button]")) { e.preventDefault(); openItem(+e.target.dataset.open); } });

  paint(); settle();
})();
