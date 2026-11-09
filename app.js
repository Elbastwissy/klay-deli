(() => {
  "use strict";
  const B = window.KlayBrain, ALL = B.ALL, M = window.KLAY_MENU;
  const ORDER = "https://www.orderklaydeli.com", UTM = "utm_source=klay-website&utm_medium=referral&utm_campaign=site";
  const BRANCHES = {
    318: { name: "New Cairo", full: "New Cairo · El Narges", hours: "9 AM – 1 AM", phone: "+201006000348", wa: "" },
    330: { name: "6th of October", full: "6th of October · Golf Central", hours: "9 AM – 11 PM", phone: "+201070055624", wa: "" }
  };
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => innerWidth <= 760;
  const DRINK = new Set(["hot", "iced", "blended", "matcha", "tea", "water"]);
  const PW = { 21773: [480, 960], 21823: [480, 960, 1600, 2400] };
  const photoSet = id => (PW[id] || [480, 960, 1600, 2400, 4000]).map(w => `img/${id}-${w}.webp ${w}w`).join(", ");
  const cut = (id, w = 600) => `cut/${id}-${w}.webp`;
  const dim = id => (window.CUT_DIM || {})[id] || [600, 400];
  const cutImg = (id, alt, sz = "200px", eager) => `<img src="${cut(id)}" srcset="${cut(id, 600)} 600w, ${cut(id, 1200)} 1200w" sizes="${sz}" width="${dim(id)[0]}" height="${dim(id)[1]}" alt="${esc(alt)}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;
  let branch = store.get("klay.branch", 318);
  // Online ordering hours from Klay's ordering system (Cairo time). [openMinute, closeMinute] — close past midnight allowed.
  const HOURS = { 318: [540, 1500], 330: [540, 1380] };
  function cairoMinutes() { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()); const g = t => +p.find(x => x.type === t).value; return g("hour") * 60 + g("minute"); }
  function isOpen(id) { const [o, c] = HOURS[id], m = cairoMinutes(); return (m >= o && m < Math.min(c, 1440)) || (c > 1440 && m < c - 1440); }
  const productUrl = (pid, br) => `${ORDER}/product/${pid}/?branch_id=${br || branch}&${UTM}`;
  const storeUrl = br => `${ORDER}/?branch_id=${br || branch}&${UTM}`;

  // smooth image reveal (handles cached images too)
  const markLoaded = img => img.classList.add("ld");
  document.addEventListener("load", e => { if (e.target.tagName === "IMG") markLoaded(e.target); }, true);
  const settleImgs = root => (root || document).querySelectorAll("img").forEach(i => { if (i.complete && i.naturalWidth) markLoaded(i); });

  $$("[data-order]").forEach(a => { a.href = storeUrl(); a.target = "_blank"; a.rel = "noopener"; });

  /* =================== BAG =================== */
  // line: {key, pid, id, size, qty}
  let bag = store.get("klay.bag", []).filter(l => ALL[l.id]);
  const lineName = l => ALL[l.id].name + (l.size ? (l.size === "L" ? " · Large" : " · Medium") : "");
  const linePrice = l => (l.size ? ALL[l.id].sizes[l.size].price : ALL[l.id].price);
  const count = () => bag.reduce((a, l) => a + l.qty, 0);
  const total = () => bag.reduce((a, l) => a + l.qty * linePrice(l), 0);
  const qtyOf = (id, size) => { const l = bag.find(x => x.id === id && (x.size || null) === (size || null)); return l ? l.qty : 0; };
  function save() { store.set("klay.bag", bag); paintBag(); }
  function add(id, size, n = 1, fromEl) {
    const i = ALL[id]; if (!i || !i.price && !i.sizes) return openItem(id);
    if (i.sizes && !size) size = "M";
    const pid = size ? i.sizes[size].id : i.id;
    const l = bag.find(x => x.id === id && (x.size || null) === (size || null));
    if (l) l.qty = Math.min(20, l.qty + n); else bag.push({ id, pid, size: size || null, qty: n });
    save(); fly(fromEl, id); toast(`${ALL[id].name}${size ? (size === "L" ? " · Large" : " · Medium") : ""} added`);
  }
  function setQty(id, size, q) {
    const l = bag.find(x => x.id === id && (x.size || null) === (size || null)); if (!l) return;
    l.qty = Math.max(0, Math.min(20, q)); if (!l.qty) bag = bag.filter(x => x !== l); save();
  }
  function paintBag() {
    const n = count(), t = total();
    $$(".bag-n").forEach(e => { e.textContent = n; e.hidden = !n; });
    $("#bagBtn").setAttribute("aria-label", n ? `Open your bag, ${n} items, ${t} EGP` : "Open your bag");
    const mb = $("#mbar");
    mb.querySelector(".mb-t").innerHTML = n ? `View bag<small>${n} item${n > 1 ? "s" : ""} · ${t} EGP</small>` : `Order now<small>20% off your first order</small>`;
    mb.querySelector(".mb-i").textContent = n ? `${t} EGP` : "Order";
    mb.classList.toggle("has", !!n);
    $$("[data-step]").forEach(paintStepper);
    if ($("#bag").open) renderBag();
  }
  // quick-add buttons become steppers
  const stepper = (id, size) => `<span class="qa" data-step="${id}" data-size="${size || ""}"></span>`;
  function paintStepper(el) {
    const id = +el.dataset.step, size = el.dataset.size || null, q = qtyOf(id, size || (ALL[id].sizes ? "M" : null));
    const label = esc(ALL[id].name);
    el.innerHTML = q ? `<button class="s-" data-dec aria-label="Remove one ${label}">−</button><b aria-live="polite">${q}</b><button class="s+" data-inc aria-label="Add one more ${label}">+</button>`
      : `<button class="s0" data-inc aria-label="Add ${label} to bag">+</button>`;
    el.classList.toggle("on", !!q);
  }
  document.addEventListener("click", e => {
    const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    if (!inc && !dec) return;
    e.preventDefault(); e.stopPropagation();
    const st = e.target.closest("[data-step]"); const id = +st.dataset.step; const size = st.dataset.size || (ALL[id].sizes ? "M" : null);
    if (inc) add(id, size, 1, st.closest("[data-open]") || st); else setQty(id, size, qtyOf(id, size) - 1);
  }, true);

  // fly-to-bag
  function fly(from, id) {
    if (reduce || !from) return bump();
    const src = from.querySelector ? from.querySelector("img") : null; const target = mobile() ? $("#mbar") : $("#bagBtn");
    if (!src || !target) return bump();
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width) return bump();
    const g = document.createElement("img"); g.src = cut(id); g.className = "ghost"; g.alt = "";
    Object.assign(g.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
    document.body.append(g);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    g.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${dx * .55}px,${dy * .35 - 80}px) scale(.55)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: .3 }], { duration: 750, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => { g.remove(); bump(); };
  }
  function bump() { $$(".bump-me").forEach(el => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }); }
  let tt; function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2200); }

  // bag drawer
  const bagD = $("#bag"), bagIn = $("#bagIn");
  let checklist = false;
  function suggestions() {
    const has = c => bag.some(l => c(ALL[l.id]));
    const out = [];
    if (!has(i => DRINK.has(i.cat))) out.push(22310, 21794);
    if (!has(i => i.cat === "sides")) out.push(21759);
    if (!has(i => i.cat === "sweets")) out.push(21824);
    if (!has(i => ["sandwiches", "bowls", "salads"].includes(i.cat))) out.unshift(21765);
    return out.filter(id => !qtyOf(id)).slice(0, 3);
  }
  function renderBag() {
    const n = count(), t = total(), br = BRANCHES[branch];
    if (!n) {
      bagIn.innerHTML = `<div class="bg-h"><h3 tabindex="-1" autofocus>Your bag</h3><button class="x2" data-close-bag aria-label="Close bag">✕</button></div>
        <div class="bg-empty"><img src="${cut(21765)}" alt="" width="600" height="195"><p>Your bag is empty.</p><span>Add anything from the menu, or let the concierge build an order for you.</span>
        <div class="bg-acts"><a class="btn b-red" href="#menu" data-close-bag>Browse the menu</a><a class="btn b-line" href="#concierge" data-close-bag>Ask the concierge</a></div></div>`;
      return;
    }
    const sug = suggestions();
    bagIn.innerHTML = `
      <div class="bg-h"><h3 tabindex="-1" autofocus>Your bag <small>${n} item${n > 1 ? "s" : ""}</small></h3><button class="x2" data-close-bag aria-label="Close bag">✕</button></div>
      <div class="bg-scroll">
        ${checklist ? `<div class="guide"><b>Finish on Klay's checkout</b><span>Klay's ordering site opened in a new tab. Pick delivery or pickup (${esc(br.full)}) once, press “Add to Cart”, then come back here for the next item.</span></div>` : ""}
        <ul class="lines">${bag.map(l => `
          <li class="ln2 ${l.done ? "done" : ""}">
            <span class="th">${cutImg(l.id, "", "80px", true)}</span>
            <span class="nm"><b>${esc(lineName(l))}</b><span>${linePrice(l)} EGP${l.qty > 1 ? ` × ${l.qty} = ${linePrice(l) * l.qty} EGP` : ""}</span></span>
            ${checklist ? `<span class="ck"><a class="btn b-red sm" href="${productUrl(l.pid)}" target="klayorder" data-mark="${l.id}|${l.size || ""}">${l.done ? "Added ✓" : `Add ×${l.qty}`}</a></span>`
              : `<span class="qa on" data-step="${l.id}" data-size="${l.size || ""}"></span>`}
          </li>`).join("")}</ul>
        ${!checklist && sug.length ? `<div class="upsell"><b>Complete your order</b><div class="ups">${sug.map(id => `
          <button class="up" data-upadd="${id}"><img src="${cut(id)}" alt="" width="${dim(id)[0]}" height="${dim(id)[1]}"><span><b>${esc(ALL[id].name)}</b><span>+ ${ALL[id].price} EGP</span></span></button>`).join("")}</div></div>` : ""}
      </div>
      <div class="bg-f">
        <div class="seg" role="radiogroup" aria-label="Choose your branch">${Object.entries(BRANCHES).map(([id, b]) => `<button role="radio" aria-checked="${+id === branch}" class="${+id === branch ? "on" : ""}" data-branch="${id}">${b.name}<small><i class="${isOpen(id) ? "" : "off"}"></i>${isOpen(id) ? "Open · " : "Closed · "}${b.hours}</small></button>`).join("")}</div>
        <div class="tot"><span>Total<small>incl. VAT &amp; service · delivery fee at checkout</small></span><b>${t} EGP</b></div>
        <p class="save">First order online? Sign up on Klay's site and save <b>20%</b> — about <b>${Math.round(t * .2)} EGP</b> on this bag.</p>
        ${br.wa ? `<a class="btn b-red big" target="_blank" rel="noopener" href="https://wa.me/${br.wa}?text=${encodeURIComponent(waText())}">Send order on WhatsApp</a>` : ""}
        ${checklist ? `<button class="btn b-line big" data-checklist="0">Back to my bag</button><button class="clr" data-clear>Order placed? Clear my bag</button>`
          : `<button class="btn ${br.wa ? "b-line" : "b-red"} big" data-checklist="1">Checkout on Klay online</button>`}
      </div>`;
    $$("#bagIn [data-step]").forEach(paintStepper); settleImgs(bagIn);
  }
  function waText() { return `Hi Klay! New order for ${BRANCHES[branch].full}:\n` + bag.map(l => `• ${l.qty} × ${lineName(l)} — ${linePrice(l) * l.qty} EGP`).join("\n") + `\nTotal: ${total()} EGP`; }
  function openBag() { checklist = false; renderBag(); if (!bagD.open) { bagD.showModal(); lock(true); } }
  bagD.addEventListener("close", () => lock(false));
  bagD.addEventListener("click", e => {
    if (e.target === bagD || e.target.closest("[data-close-bag]")) { bagD.close(); return; }
    const up = e.target.closest("[data-upadd]"); if (up) { add(+up.dataset.upadd, null, 1, null); return; }
    const br = e.target.closest("[data-branch]"); if (br) { branch = +br.dataset.branch; store.set("klay.branch", branch); renderBag(); return; }
    const ck = e.target.closest("[data-checklist]"); if (ck) {
      checklist = ck.dataset.checklist === "1"; renderBag();
      if (checklist) { const first = bag.find(l => !l.done) || bag[0]; window.open(productUrl(first.pid), "klayorder"); first.done = true; store.set("klay.bag", bag); renderBag(); }
      return;
    }
    if (e.target.closest("[data-clear]")) { bag = []; checklist = false; save(); renderBag(); toast("Bag cleared"); return; }
    const mk = e.target.closest("[data-mark]"); if (mk) { const [id, s] = mk.dataset.mark.split("|"); const l = bag.find(x => x.id === +id && (x.size || "") === s); if (l) { l.done = true; store.set("klay.bag", bag); setTimeout(renderBag, 60); } }
  });
  $("#bagBtn").addEventListener("click", openBag);
  $("#mbar").addEventListener("click", e => { if (count()) { e.preventDefault(); openBag(); } });

  /* live ordering status */
  (function live() {
    const el = $("#live"); if (!el) return;
    const nc = isOpen(318), oc = isOpen(330);
    el.className = "live" + (nc || oc ? "" : " closed");
    el.innerHTML = nc || oc ? `<i></i>Taking orders now<span class="lv-d">${nc ? " · New Cairo till 1 AM" : ""}${oc ? " · October till 11 PM" : ""}</span>` : `<i></i>Online orders open daily at 9 AM`;
    setTimeout(live, 60000);
  })();

  /* =================== HERO =================== */
  const cutSec = $("#cut"), hl = $("#hl"), hr = $("#hr"), mark = $("#mark"), lis = $$("#inside li"), pop = $("#pop"), hint = $("#hint"), hdr = $("#hdr"), mbar = $("#mbar");
  let ticking = false, lastP = -1;
  function scene() {
    ticking = false;
    const r = cutSec.getBoundingClientRect(), totalH = cutSec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, totalH)));
    hdr.classList.toggle("light", r.bottom < 72);
    mbar.classList.toggle("on", r.bottom < innerHeight * .6 || count() > 0);
    if (Math.abs(p - lastP) < .0005) return; lastP = p;
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, open = Math.min(1, e * 1.35);
    if (mobile()) {
      hl.style.transform = `translate3d(${-open * 19}vw, ${-open * 12}vh, 0) rotate(${-open * 5}deg)`;
      hr.style.transform = `translate3d(${open * 19}vw, ${open * 11}vh, 0) rotate(${open * 5}deg)`;
    } else {
      hl.style.transform = `translate3d(${-open * 15}vw, 0, 0) rotate(${-open * 6}deg)`;
      hr.style.transform = `translate3d(${open * 15}vw, 0, 0) rotate(${open * 6}deg)`;
    }
    mark.style.transform = `translate3d(-50%,-50%,0) scale(${1 + p * .18})`;
    mark.style.opacity = String((mobile() ? .6 : .95) - p * (mobile() ? .45 : .75));
    lis.forEach((li, i) => li.classList.toggle("on", open > .45 + i * .08));
    pop.classList.toggle("on", open > .9);
    hint.style.opacity = p > .03 ? "0" : "1";
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(scene); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { lastP = -1; onScroll(); });
  scene();

  /* =================== MOST LOVED =================== */
  const loved = Object.values(ALL).filter(i => i.loved).sort((a, b) => a.loved.n - b.loved.n);
  $("#rail").innerHTML = loved.map(i => `
    <article class="tagc" data-open="${i.id}" tabindex="0" role="button" aria-label="${esc(i.name)}">
      <span class="rank" aria-hidden="true">${String(i.loved.n).padStart(2, "0")}</span>
      <span class="pt">${i.price}<small>EGP</small></span>
      <span class="pic">${cutImg(i.id, i.name, "340px")}</span>
      <h3>${esc(i.name)}</h3>
      <q>${esc(i.loved.q)}</q>
      <span class="src">${i.loved.note ? esc(i.loved.note) : "Google review"}</span>
      <span class="tag-add">${stepper(i.id)}</span>
    </article>`).join("");
  const rail = $("#rail");
  $$("[data-rail]").forEach(b => b.onclick = () => rail.scrollBy({ left: +b.dataset.rail * rail.clientWidth * .8, behavior: reduce ? "auto" : "smooth" }));
  let dx = null, sl = 0, moved = false;
  rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.target.closest("button")) return; dx = e.clientX; sl = rail.scrollLeft; moved = false; });
  addEventListener("pointermove", e => { if (dx === null) return; const d = e.clientX - dx; if (Math.abs(d) > 6) { moved = true; rail.classList.add("drag"); rail.scrollLeft = sl - d; } });
  addEventListener("pointerup", () => { if (dx === null) return; dx = null; requestAnimationFrame(() => rail.classList.remove("drag")); });
  rail.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  /* =================== CONCIERGE =================== */
  const msgs = $("#msgs"), ticket = $("#ticket"), tkEmpty = $("#tkEmpty");
  const st = { spin: 0 };
  let lastRec = null;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scrollChat = () => msgs.scrollTo({ top: msgs.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  async function bot(text) {
    const t = document.createElement("div"); t.className = "m bot typing"; t.innerHTML = "<i></i><i></i><i></i>";
    msgs.append(t); scrollChat(); await wait(600); t.className = "m bot"; t.textContent = text; scrollChat();
  }
  function me(text) { const d = document.createElement("div"); d.className = "m me"; d.textContent = text; msgs.append(d); scrollChat(); }
  function chips(opts, cb) {
    const w = document.createElement("div"); w.className = "chips";
    opts.forEach(([label, val]) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = label;
      b.onclick = () => { w.remove(); me(label); cb(val); }; w.append(b); });
    msgs.append(w); scrollChat();
  }
  function picks(items) {
    const w = document.createElement("div"); w.className = "picks";
    w.innerHTML = items.map(i => `<div class="pick" data-open="${i.id}" role="button" tabindex="0"><img src="${cut(i.id)}" width="${dim(i.id)[0]}" height="${dim(i.id)[1]}" alt=""><span><b>${esc(i.name)}</b><span>${i.price} EGP</span></span>${stepper(i.id)}</div>`).join("");
    msgs.append(w); w.querySelectorAll("[data-step]").forEach(paintStepper); scrollChat();
  }
  const Q = {
    hunger: ["How hungry are you?", [["A light bite", "light"], ["A proper meal", "meal"], ["Very hungry", "big"]]],
    crave: ["What are you craving?", [["Rich & meaty", "meaty"], ["Fresh & light", "fresh"], ["Something crispy", "crispy"], ["A sweet finish", "sweet"]]],
    drink: ["And to drink?", [["Coffee", "coffee"], ["Matcha", "matcha"], ["Tea or chai", "tea"], ["Water", "water"], ["No drink", "none"]]],
    temp: ["Iced or hot?", [["Iced", "iced"], ["Hot", "hot"]]]
  };
  let busy = false;
  async function askStep(k) { await bot(Q[k][0]); chips(Q[k][1], v => { st[k] = v; next(); }); }
  function next() {
    if (!st.hunger) return askStep("hunger");
    if (!st.crave) return askStep("crave");
    if (!st.drink) return askStep("drink");
    if (["coffee", "matcha", "tea"].includes(st.drink) && !st.temp) return askStep("temp");
    finish();
  }
  async function finish() {
    lastRec = B.recommend(st);
    await bot(innerWidth <= 1060 ? "Here's your match:" : "Here's your match — printing your ticket now.");
    printTicket(lastRec);
    chips([["Add all to bag", "add"], ["Show me another", "spin"], ["Start over", "reset"]], v => {
      if (v === "add") { addRec(); bot(`Added to your bag — ${lastRec.total} EGP. Open the bag when you're ready.`).then(() => chips([["Open my bag", "open"], ["Start over", "reset"]], w => w === "open" ? openBag() : resetChat())); }
      else if (v === "spin") { st.spin++; finish(); } else resetChat();
    });
  }
  function resetChat() { Object.keys(st).forEach(k => delete st[k]); st.spin = 0; next(); }
  function addRec() { lastRec.lines.forEach(l => add(l.id, l.size, 1, null)); toast(`${lastRec.lines.length} items added · ${lastRec.total} EGP`); }
  let tkNo = 40 + Math.floor(Math.random() * 50);
  function ticketHTML(rec) {
    tkNo++;
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `<img class="tk-logo" src="logo-terra.svg" alt="Klay" width="1260" height="1000">
      <div class="c">EVERYDAY DELI · ${t}</div><div class="c" style="margin-top:12px">NOW SERVING</div><div class="c num">${tkNo}</div><hr>
      ${rec.lines.map(l => `<div class="ln"><span>${esc(l.name)}</span><b>${l.price}</b></div>`).join("")}<hr>
      <div class="ln tot"><span>TOTAL</span><span>${rec.total} EGP</span><em>Prices include VAT &amp; service</em></div>
      <div class="tk-acts"><button class="btn b-red" data-addrec>Add all to bag</button></div>`;
  }
  function printTicket(rec) {
    if (innerWidth <= 1060) {
      const w = document.createElement("div"); w.className = "ticket inline"; w.innerHTML = ticketHTML(rec); msgs.append(w); scrollChat(); return;
    }
    ticket.classList.remove("out"); void ticket.offsetWidth;
    ticket.innerHTML = ticketHTML(rec); tkEmpty.style.display = "none";
    requestAnimationFrame(() => requestAnimationFrame(() => ticket.classList.add("out")));
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-addrec]") && lastRec) { e.preventDefault(); addRec(); } });
  let started = false;
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !started) { started = true; o.disconnect(); bot("Hi! I know every item on Klay's menu. Three quick questions and I'll match you a full order.").then(next); } }, { threshold: .35 }).observe($("#concierge"));
  $("#ask").addEventListener("submit", async e => {
    e.preventDefault(); const inp = $("#askIn"), v = inp.value.trim(); if (!v || busy) return;
    busy = true; inp.value = ""; started = true; me(v); $$("#msgs .chips").forEach(c => c.remove());
    const r = B.reply(v); await bot(r.text); if (r.items.length) picks(r.items);
    chips([["Build me a full order", "full"]], () => resetChat());
    busy = false;
  });

  /* =================== MENU =================== */
  const ORDER_CATS = ["sandwiches", "bowls", "salads", "byo", "sides", "sweets", "iced", "hot", "matcha", "blended", "tea", "water"];
  const byKey = Object.fromEntries(M.map(c => [c.key, c]));
  $("#cats").innerHTML = ORDER_CATS.map(k => `<button class="cat" data-cat="${k}">${byKey[k].title}</button>`).join("");
  const FL = [["all", "Everything"], ["loved", "Guest favourites"], ["beef", "Beef"], ["chicken", "Chicken"], ["turkey", "Turkey"], ["nomeat", "No meat"], ["u250", "Under 250 EGP"]];
  $("#filters").innerHTML = FL.map(([k, l], i) => `<button class="flt ${i ? "" : "on"}" data-f="${k}" aria-pressed="${!i}">${l}</button>`).join("");
  let F = "all", QS = "";
  const pass = i => {
    if (QS && !(`${i.name} ${i.desc}`.toLowerCase().includes(QS))) return false;
    if (F === "all") return true;
    if (F === "loved") return !!i.loved;
    if (F === "u250") return i.price > 0 && i.price <= 250;
    return (i.tags || []).includes(F);
  };
  function renderMenu() {
    let shown = 0;
    $("#mcats").innerHTML = ORDER_CATS.map(k => {
      const c = byKey[k], items = c.items.filter(pass); shown += items.length;
      if (!items.length) return "";
      const d = DRINK.has(k);
      return `<div class="mcat" id="m-${k}"><h3>${c.title}<small>${items.length} ${items.length === 1 ? "item" : "items"}</small></h3>
        <div class="${d ? "dgrid" : "fgrid"}">${items.map(i => d ? `
          <article class="dr" data-open="${i.id}" tabindex="0" role="button" aria-label="${esc(i.name)}, ${i.price} EGP"><span class="pic">${cutImg(i.id, i.name, "64px")}</span><span class="tx"><b>${esc(i.name)}</b><span>${i.price} EGP</span></span>${stepper(i.id)}</article>` : `
          <article class="it" data-open="${i.id}" tabindex="0" role="button" aria-label="${esc(i.name)}">${i.loved ? `<span class="fav">Guest favourite</span>` : ""}<span class="pic">${cutImg(i.img, i.name, "(max-width:760px) 45vw, 260px")}</span>
            <h4>${esc(i.name)}</h4><p>${esc(i.desc)}</p>
            <span class="pr"><span>${i.price ? i.price + " <small>EGP</small>" : "<small>Priced by your build</small>"}${i.sizes ? " <small>· M / L</small>" : ""}</span>${i.price ? stepper(i.id) : `<span class="qa"><span class="s0 ghostbtn" aria-hidden="true">›</span></span>`}</span></article>`).join("")}</div></div>`;
    }).join("");
    $("#none").style.display = shown ? "none" : "block";
    $$(".cat").forEach(b => b.style.display = document.getElementById("m-" + b.dataset.cat) ? "" : "none");
    $$("#mcats [data-step]").forEach(paintStepper); settleImgs($("#mcats")); spyAll();
  }
  $("#filters").addEventListener("click", e => { const b = e.target.closest(".flt"); if (!b) return; F = b.dataset.f;
    $$(".flt").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); renderMenu(); });
  let qT; $("#q").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { QS = e.target.value.trim().toLowerCase(); renderMenu(); }, 120); });
  const catsEl = $("#cats"); let catsTouched = 0;
  ["pointerdown", "wheel", "touchstart"].forEach(ev => catsEl.addEventListener(ev, () => catsTouched = Date.now(), { passive: true }));
  catsEl.addEventListener("click", e => { const b = e.target.closest(".cat"); if (!b) return; const t = document.getElementById("m-" + b.dataset.cat); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  const spy = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const k = e.target.id.slice(2);
    $$(".cat").forEach(c => c.classList.toggle("on", c.dataset.cat === k));
    const on = $(`.cat[data-cat="${k}"]`); if (on && Date.now() - catsTouched > 1500) catsEl.scrollTo({ left: on.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" }); }), { rootMargin: "-40% 0px -55% 0px" });
  function spyAll() { spy.disconnect(); $$(".mcat").forEach(m => spy.observe(m)); }
  renderMenu();

  /* =================== REVIEWS =================== */
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
  $("#wall").innerHTML = R.map(([q, b]) => `<figure class="rq"><div class="stars" aria-hidden="true">★★★★★</div><p>“${esc(q)}”</p><span>Google review · ${b}</span></figure>`).join("");

  /* =================== ITEM SHEET =================== */
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
      <div class="sh-ph ${d ? "dk" : ""}"><span class="grab" aria-hidden="true"></span><img src="img/${i.img}-1600.webp" srcset="${photoSet(i.img)}" sizes="(max-width:760px) 100vw, 60vw" alt="${esc(i.name)}"></div>
      <div class="sh-b">
        <span class="k">${byKey[i.cat].title}</span>
        <h3>${esc(i.name)}</h3>
        <p class="d">${esc(i.desc)}</p>
        ${i.loved ? `<blockquote>“${esc(i.loved.q)}”<span>Google review</span></blockquote>` : ""}
        ${i.sizes ? `<div class="sizes" role="radiogroup" aria-label="Size">${["M", "L"].map(k => `<button role="radio" class="${k === sh.size ? "on" : ""}" data-size="${k}" aria-checked="${k === sh.size}">${k === "M" ? "Medium" : "Large"}<small>${i.sizes[k].price} EGP</small></button>`).join("")}</div>` : ""}
        ${unit ? `<div class="buy"><div class="qty"><button data-q="-1" aria-label="Less">−</button><b id="shQ">${sh.qty}</b><button data-q="1" aria-label="More">+</button></div>
          <button class="btn b-red addbtn" data-shadd>Add to bag · <span id="shT">${unit * sh.qty}</span> EGP</button></div>
          <a class="alt" href="${productUrl(pid)}" target="_blank" rel="noopener">Or order this alone on Klay online ↗</a>`
        : `<a class="btn b-red" style="width:100%;height:58px" href="${productUrl(pid)}" target="_blank" rel="noopener">Start building on Klay online</a>
           <p class="fine">Build-your-own is priced by what you choose, so it's built on Klay's ordering site.</p>`}
        <div class="pair"><b>Goes well with</b><div class="row">${pairs.map(p => `<button data-open="${p.id}"><img src="${cut(p.id)}" width="${dim(p.id)[0]}" height="${dim(p.id)[1]}" alt=""><span><b>${esc(p.name)}</b><span>${p.price} EGP</span></span></button>`).join("")}</div></div>
      </div>`;
    if (!sheet.open) { sheet.showModal(); lock(true); }
    const sb = shIn.querySelector(".sh-b"); if (sb) sb.scrollTop = 0; shIn.scrollTop = 0;
  }
  sheet.addEventListener("close", () => { if (!bagD.open) lock(false); });
  sheet.addEventListener("click", e => {
    if (e.target === sheet || e.target.closest("[data-close]")) { sheet.close(); return; }
    const sz = e.target.closest("[data-size]"); if (sz && !sz.closest("[data-step]")) { openItem(sh.id, sz.dataset.size, true); return; }
    const q = e.target.closest("[data-q]"); if (q) { sh.qty = Math.max(1, Math.min(20, sh.qty + +q.dataset.q)); const i = ALL[sh.id]; const unit = sh.size ? i.sizes[sh.size].price : i.price; $("#shQ").textContent = sh.qty; $("#shT").textContent = unit * sh.qty; return; }
    if (e.target.closest("[data-shadd]")) { const img = shIn.querySelector(".sh-ph"); add(sh.id, sh.size, sh.qty, img); sheet.close(); return; }
  });
  // swipe down to close on phones
  let sy = null;
  sheet.addEventListener("touchstart", e => { if (e.target.closest(".sh-ph")) sy = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener("touchmove", e => { if (sy === null) return; const d = e.touches[0].clientY - sy; if (d > 0) sheet.style.transform = `translateY(${d}px)`; }, { passive: true });
  sheet.addEventListener("touchend", e => { if (sy === null) return; const d = e.changedTouches[0].clientY - sy; sy = null; sheet.style.transform = ""; if (d > 110) sheet.close(); });

  document.addEventListener("click", e => {
    if (e.target.closest("[data-step]")) return;
    const t = e.target.closest("[data-open]"); if (t && !e.defaultPrevented) { e.preventDefault(); openItem(+t.dataset.open); }
  });
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-open][role=button]")) { e.preventDefault(); openItem(+e.target.dataset.open); }
  });
  $$("[data-add-id]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); add(+b.dataset.addId, null, 1, $("#halves")); }));

  function lock(on) { document.documentElement.classList.toggle("locked", on); }
  paintBag(); settleImgs();
})();
