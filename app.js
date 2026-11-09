(() => {
  const ORDER = "https://www.orderklaydeli.com";
  const UTM = "utm_source=klay-website&utm_medium=referral&utm_campaign=site";
  const orderUrl = id => id ? `${ORDER}/product/${id}?${UTM}` : `${ORDER}/?${UTM}`;
  const W = { 21773: [480, 960], 21823: [480, 960, 1600, 2400] };
  const widths = id => W[id] || [480, 960, 1600, 2400, 4000];
  const srcset = id => widths(id).map(w => `img/${id}-${w}.webp ${w}w`).join(", ");
  const src = (id, i = 1) => { const a = widths(id); return `img/${id}-${a[Math.min(i, a.length - 1)]}.webp`; };
  const img = (id, alt, sizes, cls = "") =>
    `<img class="${cls}" src="${src(id)}" srcset="${srcset(id)}" sizes="${sizes}" width="4000" height="2667" loading="lazy" decoding="async" alt="${alt.replace(/"/g, "")}">`;
  const $ = s => document.querySelector(s);
  const M = window.KLAY_MENU;
  const ALL = {}; M.forEach(c => c.items.forEach(i => { i.cat = c.key; ALL[i.id] = i; }));
  const DRINK = new Set(["hot", "iced", "blended", "matcha", "tea", "water"]);
  const price = i => i.price ? `${i.price}<small>EGP</small>` : `<small style="margin:0">Priced by build</small>`;

  // order links
  document.querySelectorAll("[data-order]").forEach(a => { a.href = orderUrl(); a.target = "_blank"; a.rel = "noopener"; });

  // marquee
  const words = ["Focaccia", "Everyday Deli", "Warm Bowls", "Iced Shaken", "New Cairo", "Matcha", "6th of October", "Build Your Own", "Pickup & Delivery"];
  const run = words.map(w => `<span>${w}</span><span>✦</span>`).join("");
  $("#mq").innerHTML = run + run;

  // signatures
  const SIG = [[21765, "House favourite"], [21767, "Crispy pistachio"], [21768, "Sweet & smoky"], [21770, "The crunch"]];
  $("#sigs").innerHTML = SIG.map(([id, tag]) => { const i = ALL[id]; return `
    <article class="sig rv" data-open="${id}" tabindex="0" role="button" aria-label="${i.name}">
      <span class="tag">${tag}</span>
      <div class="ph">${img(id, i.name, "(min-width:760px) 50vw, 86vw")}</div>
      <div class="meta"><div><h3>${i.name.replace(" Sandwich", "")}</h3><p>${i.desc}</p></div><div class="price">${price(i)}</div></div>
    </article>`; }).join("");

  // shaken
  $("#shaken").innerHTML = [22310, 22829, 22311].map(id => { const i = ALL[id]; return `
    <article class="sh rv" data-open="${id}" tabindex="0" role="button">
      <div class="ph">${img(id, i.name, "(min-width:760px) 33vw, 70vw")}</div>
      <div class="meta"><h3>${i.name.replace("Iced Shaken ", "Shaken ")}</h3><span class="price">${i.price}</span></div>
    </article>`; }).join("");

  // menu
  const FOOD = ["sandwiches", "salads", "bowls", "byo", "sides", "sweets"], DR = ["iced", "hot", "matcha", "blended", "tea", "water"];
  const byKey = Object.fromEntries(M.map(c => [c.key, c]));
  const tab = k => `<button class="tab" data-tab="${k}">${byKey[k].title}</button>`;
  $("#tabs").innerHTML = `<span class="tab sep">Eat</span>${FOOD.map(tab).join("")}<span class="tab sep">Drink</span>${DR.map(tab).join("")}`;
  const card = (i, drink) => `
    <article class="card rv" data-open="${i.id}" tabindex="0" role="button">
      <div class="ph">${img(i.img, i.name, drink ? "(min-width:980px) 25vw, (min-width:760px) 33vw, 50vw" : "(min-width:980px) 33vw, 50vw")}</div>
      <div class="body"><div class="row"><h4>${i.name}</h4><span class="price">${i.price ? i.price : "Build"}</span></div>
        ${drink ? "" : `<p>${i.desc}</p>`}
        <div class="add"><span>${i.sizes ? "Medium · Large" : "View & order"}</span><i>+</i></div></div>
    </article>`;
  const drow = i => `
    <article class="drow rv" data-open="${i.id}" tabindex="0" role="button">
      <div class="th"><img src="img/${i.img}-480.webp" srcset="img/${i.img}-480.webp 480w, img/${i.img}-960.webp 960w" sizes="160px" width="480" height="320" loading="lazy" decoding="async" alt="${i.name}"></div>
      <div class="tx"><h4>${i.name}</h4><p>${i.desc}</p></div>
      <span class="price">${i.price}<small>EGP</small></span>
    </article>`;
  $("#cats").innerHTML = [...FOOD, ...DR].map(k => { const c = byKey[k], d = DRINK.has(k); return `
    <div class="mcat" id="m-${k}"><h3>${c.title}<small>${c.items.length} items</small></h3>
      ${d ? `<div class="dlist">${c.items.map(drow).join("")}</div>` : `<div class="grid">${c.items.map(i => card(i, false)).join("")}</div>`}</div>`; }).join("");
  document.querySelectorAll(".tab[data-tab]").forEach(b => b.onclick = () => $("#m-" + b.dataset.tab).scrollIntoView({ behavior: "smooth" }));
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const k = e.target.id.slice(2);
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.tab === k));
    const on = document.querySelector(`.tab[data-tab="${k}"]`);
    if (on) on.parentNode.scrollTo({ left: on.offsetLeft - 20, behavior: "smooth" });
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll(".mcat").forEach(m => spy.observe(m));

  // quick view
  const qv = $("#qv"), qin = $("#qvIn");
  const PAIR_FOOD = [21759, 22310], PAIR_DRINK = [21765, 21824];
  function open(id, size) {
    const i = ALL[id]; if (!i) return;
    const d = DRINK.has(i.cat);
    const s = i.sizes ? (size || "M") : null;
    const cur = s ? i.sizes[s] : { id: i.id, price: i.price };
    const pairs = (d ? PAIR_DRINK : PAIR_FOOD).filter(p => p !== i.id).map(p => ALL[p]);
    qin.innerHTML = `
      <button class="qv-x" aria-label="Close" onclick="document.getElementById('qv').close()">✕</button>
      <div class="qv-ph ${d ? "drink" : ""}">${img(i.img, i.name, "(min-width:760px) 60vw, 100vw").replace('loading="lazy"', "")}</div>
      <div class="qv-body">
        <span class="eyebrow">${byKey[i.cat].title}</span>
        <h3>${i.name}</h3>
        <p class="desc">${i.desc}</p>
        ${i.sizes ? `<div class="sizes">${Object.entries(i.sizes).sort().reverse().map(([k, v]) =>
          `<button class="${k === s ? "on" : ""}" data-size="${k}">${k === "M" ? "Medium" : "Large"}<small>${v.price} EGP</small></button>`).join("")}</div>` : ""}
        <div class="price">${cur.price ? cur.price + "<small>EGP · incl. VAT &amp; service</small>" : "<small style='margin:0'>Priced by your build</small>"}</div>
        <a class="btn btn-primary" target="_blank" rel="noopener" href="${orderUrl(cur.id)}">${i.cat === "byo" ? "Start building" : "Order this"} →</a>
        <p class="legal">First order on orderklaydeli.com? Sign up for 20% off.</p>
        ${pairs.length ? `<div class="pair"><div class="k">Goes well with</div><div class="list">${pairs.map(p =>
          `<button data-open="${p.id}"><img src="${src(p.img, 0)}" alt=""><div><b>${p.name}</b><span>${p.price} EGP</span></div></button>`).join("")}</div></div>` : ""}
      </div>`;
    qin.querySelectorAll("[data-size]").forEach(b => b.onclick = () => open(id, b.dataset.size));
    if (!qv.open) qv.showModal();
    qin.scrollTop = 0;
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-open]");
    if (t) { e.preventDefault(); open(+t.dataset.open); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches && e.target.matches("[data-open]")) open(+e.target.dataset.open);
  });
  qv.addEventListener("click", e => { if (e.target === qv) qv.close(); });

  // header + mobile bar
  const hdr = $("#hdr"), mbar = $("#mbar");
  const onScroll = () => { hdr.classList.toggle("scrolled", scrollY > 40); mbar.classList.toggle("show", scrollY > innerHeight * .7); };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // reveal
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".rv").forEach(el => rv.observe(el));
})();
