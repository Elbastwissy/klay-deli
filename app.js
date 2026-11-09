(() => {
  const B = window.KlayBrain, ALL = B.ALL, M = window.KLAY_MENU;
  const ORDER = "https://www.orderklaydeli.com", UTM = "utm_source=klay-website&utm_medium=referral&utm_campaign=site";
  const orderUrl = id => id ? `${ORDER}/product/${id}?${UTM}` : `${ORDER}/?${UTM}`;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DRINK = new Set(["hot", "iced", "blended", "matcha", "tea", "water"]);
  const PW = { 21773: [480, 960], 21823: [480, 960, 1600, 2400] };
  const photoSet = id => (PW[id] || [480, 960, 1600, 2400, 4000]).map(w => `img/${id}-${w}.webp ${w}w`).join(", ");
  const cut = (id, w = 600) => `cut/${id}-${w}.webp`;
  const dim = id => (window.CUT_DIM || {})[id] || [600, 400];
  const cutImg = (id, alt, sz = "200px") => `<img src="${cut(id)}" srcset="${cut(id, 600)} 600w, ${cut(id, 1200)} 1200w" sizes="${sz}" width="${dim(id)[0]}" height="${dim(id)[1]}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // order links
  $$("[data-order]").forEach(a => { a.href = orderUrl(); a.target = "_blank"; a.rel = "noopener"; });
  $$("[data-order-id]").forEach(a => { a.href = orderUrl(a.dataset.orderId); a.target = "_blank"; a.rel = "noopener"; });

  /* ---------- HERO: the cut ---------- */
  const cutSec = $("#cut"), hl = $("#hl"), hr = $("#hr"), mark = $("#mark"), lis = $$("#inside li"), pop = $("#pop"), hint = $("#hint"), hdr = $("#hdr"), mbar = $("#mbar");
  const mobile = () => innerWidth <= 760;
  let ticking = false;
  function scene() {
    ticking = false;
    const r = cutSec.getBoundingClientRect(), total = cutSec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const open = Math.min(1, e * 1.35);
    if (mobile()) {
      hl.style.transform = `translate(${-open * 19}vw, ${-open * 12}vh) rotate(${-open * 5}deg)`;
      hr.style.transform = `translate(${open * 19}vw, ${open * 11}vh) rotate(${open * 5}deg)`;
    } else {
      hl.style.transform = `translateX(${-open * 15}vw) rotate(${-open * 6}deg)`;
      hr.style.transform = `translateX(${open * 15}vw) rotate(${open * 6}deg)`;
    }
    mark.style.transform = `translate(-50%,-50%) scale(${1 + p * .18})`;
    mark.style.opacity = String((mobile() ? .6 : .95) - p * (mobile() ? .45 : .75));
    lis.forEach((li, i) => li.classList.toggle("on", open > .45 + i * .08));
    pop.classList.toggle("on", open > .9);
    hint.style.opacity = p > .03 ? "0" : "1";
    hdr.classList.toggle("light", r.bottom < 72);
    mbar.classList.toggle("on", r.bottom < innerHeight * .5);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(scene); } };
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); scene();

  /* ---------- MOST LOVED rail ---------- */
  const loved = Object.values(ALL).filter(i => i.loved).sort((a, b) => a.loved.n - b.loved.n);
  $("#rail").innerHTML = loved.map(i => `
    <button class="tagc" data-open="${i.id}">
      <span class="rank" aria-hidden="true">${String(i.loved.n).padStart(2, "0")}</span>
      <span class="pt">${i.price}<small>EGP</small></span>
      <span class="pic">${cutImg(i.id, i.name, "340px")}</span>
      <h3>${esc(i.name)}</h3>
      <q>${esc(i.loved.q)}</q>
      <span class="src">${i.loved.note ? esc(i.loved.note) : "Google review"}</span>
    </button>`).join("");
  const rail = $("#rail");
  $$("[data-rail]").forEach(b => b.onclick = () => rail.scrollBy({ left: +b.dataset.rail * rail.clientWidth * .8, behavior: "smooth" }));
  let dx = null, sl = 0, moved = false;
  rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; dx = e.clientX; sl = rail.scrollLeft; moved = false; });
  addEventListener("pointermove", e => { if (dx === null) return; const d = e.clientX - dx; if (Math.abs(d) > 5) { moved = true; rail.classList.add("drag"); rail.scrollLeft = sl - d; } });
  addEventListener("pointerup", () => { dx = null; setTimeout(() => rail.classList.remove("drag"), 0); });
  rail.addEventListener("click", e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  /* ---------- CONCIERGE ---------- */
  const msgs = $("#msgs"), ticket = $("#ticket"), tkEmpty = $("#tkEmpty");
  const st = { spin: 0 };
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scrollChat = () => { msgs.scrollTop = msgs.scrollHeight; };
  async function bot(text) {
    const t = document.createElement("div"); t.className = "m bot typing"; t.innerHTML = "<i></i><i></i><i></i>";
    msgs.append(t); scrollChat(); await wait(650); t.className = "m bot"; t.textContent = text; scrollChat();
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
    w.innerHTML = items.map(i => `<button class="pick" data-open="${i.id}"><img src="${cut(i.id)}" width="${dim(i.id)[0]}" height="${dim(i.id)[1]}" alt=""><span><b>${esc(i.name)}</b><span>${i.price} EGP</span></span></button>`).join("");
    msgs.append(w); scrollChat();
  }
  const Q = {
    hunger: ["How hungry are you?", [["A light bite", "light"], ["A proper meal", "meal"], ["Very hungry", "big"]]],
    crave: ["What are you craving?", [["Rich & meaty", "meaty"], ["Fresh & light", "fresh"], ["Something crispy", "crispy"], ["A sweet finish", "sweet"]]],
    drink: ["And to drink?", [["Coffee", "coffee"], ["Matcha", "matcha"], ["Tea or chai", "tea"], ["Water", "water"], ["No drink", "none"]]],
    temp: ["Iced or hot?", [["Iced", "iced"], ["Hot", "hot"]]]
  };
  async function askStep(k) { await bot(Q[k][0]); chips(Q[k][1], v => { st[k] = v; next(); }); }
  function next() {
    if (!st.hunger) return askStep("hunger");
    if (!st.crave) return askStep("crave");
    if (!st.drink) return askStep("drink");
    if (["coffee", "matcha", "tea"].includes(st.drink) && !st.temp) return askStep("temp");
    finish();
  }
  async function finish() {
    const rec = B.recommend(st);
    await bot("Here's your match — printing your ticket now.");
    printTicket(rec);
    chips([["Show me another", "spin"], ["Start over", "reset"]], v => {
      if (v === "spin") { st.spin++; finish(); } else { Object.keys(st).forEach(k => delete st[k]); st.spin = 0; start(); }
    });
  }
  let tkNo = 40 + Math.floor(Math.random() * 50);
  function printTicket(rec) {
    tkNo++;
    const now = new Date(), t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    ticket.classList.remove("out"); void ticket.offsetWidth;
    ticket.innerHTML = `
      <img class="tk-logo" src="logo-terra.svg" alt="Klay">
      <div class="c">EVERYDAY DELI · ${t}</div>
      <div class="c" style="margin-top:12px">NOW SERVING</div><div class="c num">${tkNo}</div>
      <hr>
      ${rec.lines.map(l => `<div class="ln"><span>${esc(l.name)}</span><b>${l.price}</b><a href="${orderUrl(l.size ? ALL[l.id].sizes[l.size].id : l.id)}" target="_blank" rel="noopener">Order this</a></div>`).join("")}
      <hr>
      <div class="ln tot"><span>TOTAL</span><span>${rec.total} EGP</span><em>Prices include VAT &amp; service</em></div>
      <hr>
      <div class="c" style="font-size:12.5px">First order online? 20% off when you sign up.</div>
      <div class="tk-acts"><a class="btn b-red" href="${orderUrl(rec.lines[0].size ? ALL[rec.lines[0].id].sizes[rec.lines[0].size].id : rec.lines[0].id)}" target="_blank" rel="noopener">Start this order</a></div>`;
    tkEmpty.style.display = "none";
    requestAnimationFrame(() => ticket.classList.add("out"));
    if (mobile()) setTimeout(() => ticket.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }), 700);
  }
  async function start() { await bot("Hi! I know every item on Klay's menu. Three quick questions and I'll match you an order."); next(); }
  let started = false;
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !started) { started = true; o.disconnect(); start(); } }, { threshold: .3 }).observe($("#concierge"));
  $("#ask").addEventListener("submit", async e => {
    e.preventDefault(); const v = $("#askIn").value.trim(); if (!v) return;
    $("#askIn").value = ""; me(v); $$("#msgs .chips").forEach(c => c.remove());
    const r = B.reply(v); await bot(r.text); if (r.items.length) picks(r.items);
    if (!started) started = true;
  });

  /* ---------- MENU ---------- */
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
          <button class="dr" data-open="${i.id}"><span class="pic">${cutImg(i.id, i.name, "64px")}</span><span class="tx"><b>${esc(i.name)}</b><span>${esc(i.desc)}</span></span><span class="p">${i.price}</span></button>` : `
          <button class="it" data-open="${i.id}">${i.loved ? `<span class="fav">Guest favourite</span>` : ""}<span class="pic">${cutImg(i.img, i.name, "(max-width:760px) 45vw, 260px")}</span>
            <h4>${esc(i.name)}</h4><p>${esc(i.desc)}</p>
            <span class="pr"><span>${i.price ? i.price + " <small>EGP</small>" : "<small>Priced by your build</small>"}${i.sizes ? " <small>· M / L</small>" : ""}</span><i aria-hidden="true">+</i></span></button>`).join("")}</div></div>`;
    }).join("");
    $("#none").style.display = shown ? "none" : "block";
    $$(".cat").forEach(b => b.style.display = document.getElementById("m-" + b.dataset.cat) ? "" : "none");
    spyAll();
  }
  $("#filters").addEventListener("click", e => { const b = e.target.closest(".flt"); if (!b) return; F = b.dataset.f;
    $$(".flt").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); renderMenu(); });
  $("#q").addEventListener("input", e => { QS = e.target.value.trim().toLowerCase(); renderMenu(); });
  $("#cats").addEventListener("click", e => { const b = e.target.closest(".cat"); if (!b) return; document.getElementById("m-" + b.dataset.cat).scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  const spy = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const k = e.target.id.slice(2);
    $$(".cat").forEach(c => c.classList.toggle("on", c.dataset.cat === k));
    const on = $(`.cat[data-cat="${k}"]`); if (on) on.parentNode.scrollTo({ left: on.offsetLeft - 16, behavior: "smooth" }); }), { rootMargin: "-40% 0px -55% 0px" });
  function spyAll() { spy.disconnect(); $$(".mcat").forEach(m => spy.observe(m)); }
  renderMenu();

  /* ---------- REVIEWS wall (real Google reviews, quoted short) ---------- */
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

  /* ---------- ITEM SHEET ---------- */
  const sheet = $("#sheet"), shIn = $("#shIn");
  const PAIR = { food: [21759, 22310, 21824], drink: [21765, 21824, 21759] };
  function openItem(id, size) {
    const i = ALL[id]; if (!i) return;
    const d = DRINK.has(i.cat), s = i.sizes ? (size || "M") : null;
    const cur = s ? i.sizes[s] : { id: i.id, price: i.price };
    const pairs = (d ? PAIR.drink : PAIR.food).filter(p => p !== i.id).slice(0, 2).map(p => ALL[p]);
    shIn.innerHTML = `
      <button class="x" aria-label="Close" data-close>✕</button>
      <div class="sh-ph ${d ? "dk" : ""}"><img src="img/${i.img}-1600.webp" srcset="${photoSet(i.img)}" sizes="(max-width:760px) 100vw, 60vw" alt="${esc(i.name)}"></div>
      <div class="sh-b">
        <span class="k">${byKey[i.cat].title}</span>
        <h3>${esc(i.name)}</h3>
        <p class="d">${esc(i.desc)}</p>
        ${i.loved ? `<blockquote>“${esc(i.loved.q)}”<span>Google review</span></blockquote>` : ""}
        ${i.sizes ? `<div class="sizes">${["M", "L"].map(k => `<button class="${k === s ? "on" : ""}" data-size="${k}" aria-pressed="${k === s}">${k === "M" ? "Medium" : "Large"}<small>${i.sizes[k].price} EGP</small></button>`).join("")}</div>` : ""}
        <div class="pp">${cur.price ? cur.price + "<small>EGP · incl. VAT &amp; service</small>" : "<small style='margin:0'>Priced by your build</small>"}</div>
        <a class="btn b-red" href="${orderUrl(cur.id)}" target="_blank" rel="noopener">${i.cat === "byo" ? "Start building" : "Order this"}</a>
        <p class="fine">Opens Klay's ordering site · 20% off your first order when you sign up</p>
        <div class="pair"><b>Goes well with</b><div class="row">${pairs.map(p => `<button data-open="${p.id}"><img src="${cut(p.id)}" width="${dim(p.id)[0]}" height="${dim(p.id)[1]}" alt=""><span><b>${esc(p.name)}</b><span>${p.price} EGP</span></span></button>`).join("")}</div></div>
      </div>`;
    shIn.querySelectorAll("[data-size]").forEach(b => b.onclick = () => openItem(id, b.dataset.size));
    if (!sheet.open) sheet.showModal();
    shIn.scrollTop = 0; const sb = shIn.querySelector(".sh-b"); if (sb) sb.scrollTop = 0;
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) { sheet.close(); return; }
    const t = e.target.closest("[data-open]"); if (t) { e.preventDefault(); openItem(+t.dataset.open); }
  });
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });
})();
