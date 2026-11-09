/* Klay Brain — menu knowledge + recommendation engine.
   Rule-based today. The chat UI only calls KlayBrain.reply(text, state) and
   KlayBrain.recommend(prefs), so an AI model can replace these two functions later
   without touching the interface. */
(() => {
  const M = window.KLAY_MENU, ALL = {};
  M.forEach(c => c.items.forEach(i => { i.cat = c.key; ALL[i.id] = i; }));

  // Taste tags per item, read from each item's ingredients.
  const T = {
    21765: "beef rich fresh signature", 21766: "beef rich", 21767: "beef rich nutty", 21768: "beef sweet rich",
    21769: "nomeat fresh light", 21770: "chicken crispy rich", 21771: "turkey light fresh",
    21761: "nomeat fresh light salad", 21762: "nomeat fresh light salad",
    21777: "beef hearty bowl", 21780: "beef hearty bowl", 21778: "chicken bowl fresh", 21779: "chicken hearty bowl", 21776: "beef hearty bowl comfort",
    21759: "nomeat crispy side", 21760: "nomeat crispy side", 21824: "nomeat sweet", 21823: "nomeat sweet jar",
    21763: "build", 21764: "build"
  };
  Object.entries(T).forEach(([id, t]) => ALL[id] && (ALL[id].tags = t.split(" ")));

  // What guests say — real Google Maps reviews (New Cairo & 6th of October), quoted short.
  const LOVED = {
    21765: { n: 1, q: "Bresaola Sandwich 10/10", note: "Mentioned in 20+ Google reviews — more than any other item" },
    21767: { n: 3, q: "Pistachio roast beef Sandwich 10/10 (amazingly delicious)" },
    21766: { n: 4, q: "The roast beef focaccia was honestly the best I’ve ever had!" },
    21778: { n: 2, q: "I’m addicted to their chicken bowl. Great portions, consistent quality and unique taste." },
    21768: { n: 8, q: "The combo of smoked beef, sweet fig & buffalo mozzarella is rich, creamy, and light on the tummy." },
    21759: { n: 5, q: "The beetroot chips were absolutely amazing." },
    22828: { n: 6, q: "Never tasted a matcha this good." },
    21798: { n: 7, q: "You must try the iced butterscotch." }
  };
  Object.entries(LOVED).forEach(([id, v]) => ALL[id] && (ALL[id].loved = v));

  const DRINKS = {
    coffee: { iced: [22310, 21794, 21798, 22311], hot: [21783, 21785, 21788, 21784] },
    matcha: { iced: [22828, 21812, 21815, 22829], hot: [21809, 21810, 21811] },
    tea: { iced: [21807, 21808], hot: [21806] },
    water: { iced: [21804, 21805], hot: [21804] }
  };
  const MAINS = {
    light: { meaty: [21771, 21768], fresh: [21769, 21762, 21761], crispy: [21770], sweet: [21824] },
    meal: { meaty: [21765, 21767, 21766, 21768], fresh: [21778, 21769, 21771], crispy: [21770], sweet: [21768, 21767] },
    big: { meaty: [21780, 21777, 21765, 21767], fresh: [21778, 21762], crispy: [21770, 21779], sweet: [21768, 21767] }
  };

  function price(id, size) { const i = ALL[id]; return i.sizes ? i.sizes[size || "M"].price : i.price; }

  // prefs: {hunger: light|meal|big, crave: meaty|fresh|crispy|sweet, drink: coffee|matcha|tea|water|none, temp: iced|hot, spin: n}
  function recommend(p) {
    const spin = p.spin || 0, lines = [];
    const mains = MAINS[p.hunger][p.crave];
    const mainId = mains[spin % mains.length];
    const size = ALL[mainId].sizes ? (p.hunger === "big" ? "L" : "M") : null;
    lines.push({ id: mainId, size, role: "main" });
    if (p.hunger === "big" && !ALL[mainId].tags.includes("side")) lines.push({ id: spin % 2 ? 21760 : 21759, role: "side" });
    if (p.crave === "sweet" && mainId !== 21824) lines.push({ id: 21824, role: "sweet" });
    if (p.drink && p.drink !== "none") {
      const list = DRINKS[p.drink][p.temp || "iced"];
      lines.push({ id: list[spin % list.length], role: "drink" });
    }
    lines.forEach(l => { l.price = price(l.id, l.size); l.name = ALL[l.id].name + (l.size ? (l.size === "L" ? " · Large" : " · Medium") : ""); });
    return { lines, total: lines.reduce((a, l) => a + l.price, 0) };
  }

  // Free-text search: keywords, protein, budget ("under 250"), category words.
  const SYN = { beef: ["beef", "meat", "bresaola", "roast"], chicken: ["chicken", "tawook", "poultry", "fried"], turkey: ["turkey"],
    nomeat: ["no meat", "without meat", "veggie", "vegetarian", "meatless"], light: ["light", "healthy", "diet", "fresh"],
    crispy: ["crispy", "crunchy", "fried"], sweet: ["sweet", "dessert", "chocolate", "hazelnut", "nutella"],
    bowl: ["bowl", "rice"], salad: ["salad"], coffee: ["coffee", "latte", "espresso", "cappuccino", "americano", "cortado", "flat white", "mocha"],
    matcha: ["matcha"], tea: ["tea", "chai"], iced: ["iced", "cold", "ice"], hot: ["hot", "warm"] };
  function search(text) {
    const s = " " + text.toLowerCase() + " ";
    let want = Object.keys(SYN).filter(k => SYN[k].some(w => s.includes(w)));
    if (want.includes("nomeat")) want = want.filter(w => !["beef", "chicken", "turkey"].includes(w));
    const m = s.match(/(under|below|less than|max|<)\s*(\d{2,3})/) || s.match(/(\d{2,3})\s*(egp|le|pounds|جنيه)/);
    const budget = m ? +m[2] || +m[1] : null;
    let pool = Object.values(ALL).filter(i => i.price > 0 && (i.cat !== "water" || /water/.test(s)));
    const drinkWords = want.filter(w => ["coffee", "matcha", "tea"].includes(w));
    if (drinkWords.length) pool = pool.filter(i => drinkWords.some(w => (w === "coffee" ? ["hot", "iced", "blended"] : w === "tea" ? ["tea"] : ["matcha"]).includes(i.cat)));
    if (want.includes("iced")) pool = pool.filter(i => !/^Hot /.test(i.name));
    if (want.includes("hot")) pool = pool.filter(i => /^Hot |Cappuccino|Cortado|Americano|Flat White/.test(i.name));
    ["beef", "chicken", "turkey", "nomeat", "light", "crispy", "sweet", "bowl", "salad"].forEach(k => {
      if (want.includes(k)) pool = pool.filter(i => (i.tags || []).includes(k) || (k === "bowl" && i.cat === "bowls") || (k === "salad" && i.cat === "salads"));
    });
    if (budget) pool = pool.filter(i => i.price <= budget);
    const RANK = { sandwiches: 0, bowls: 0, salads: 1, byo: 2, sides: 3, sweets: 3 };
    const rk = i => RANK[i.cat] ?? 1;
    pool.sort((a, b) => rk(a) - rk(b) || ((b.loved ? 10 - b.loved.n : 0) - (a.loved ? 10 - a.loved.n : 0)) || a.price - b.price);
    return { want, budget, items: pool.slice(0, 4), understood: want.length > 0 || !!budget };
  }

  function reply(text) {
    const r = search(text);
    if (!r.understood) return { text: "I can match by taste, protein or budget. Try “something with chicken”, “no meat”, “iced matcha” or “under 250”.", items: [] };
    if (!r.items.length) return { text: "Nothing on today's menu matches all of that. Try loosening one detail — a higher budget or another protein.", items: [] };
    const what = r.budget ? ` under ${r.budget} EGP` : "";
    return { text: `Here's what fits${what}. Tap one to see it up close and order.`, items: r.items };
  }

  window.KlayBrain = { ALL, recommend, search, reply, price };
})();
