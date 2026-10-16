/* Venora Jewels — Ready Stock page.
   Items (stock/{id}) are public; prices (stockPrices/{id}) load only for logged-in customers
   with a completed profile — the database refuses them to everyone else. */
import { db, collection, getDocs, doc, getDoc } from "./auth.js?v=202610162146";

import { loadPricing, computePrice } from "./pricing.js?v=202610162146";

const { esc, waLink, ICON } = window.Venora;
let pricing = { rates: {}, offer: { makingOff: 20, diamondOff: 10, gst: 3 } };
const $ = id => document.getElementById(id);
const inr = n => "₹" + Math.round(Number(n)).toLocaleString("en-IN");
const wt = (n, unit) => (n || n === 0) && n !== "" ? `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 3 })} ${unit}` : "";
const CATS = ["All", "Rings", "Tops", "Bracelets"];

let items = [], prices = {}, cat = new URLSearchParams(location.search).get("cat") || "All", authState = null;

function priceHtml(it) {
  if (it.status === "sold") return `<span class="stock-sold">Sold</span>`;
  const c = computePrice(it, prices[it.id], pricing);
  if (c) {
    return `<span class="stock-price">${inr(c.final)}</span>${c.was ? ` <s class="stock-mrp">${inr(c.was)}</s>` : ""}${c.mode === "live" ? ` <span class="live-tag" title="Updates daily with the gold rate">● live</span>` : ""}`;
  }
  if (authState && authState.user && authState.profile) return `<span class="muted">Price on request</span>`;
  return `<a class="stock-login" href="account.html">🔒 Login to see price</a>`;
}

// members: how the live price is made up (or today's gold value for fixed-price pieces)
function breakdown(it) {
  if (it.status === "sold") return "";
  const c = computePrice(it, prices[it.id], pricing);
  if (!c) return "";
  const rateNote = c.gold ? `${esc(it.goldKt)} gold @ ${inr(c.gold.rate10)}/10 g` : "";
  if (c.mode !== "live") return c.gold ? `<p class="gold-value">Gold value today: <b>${inr(c.gold.value)}</b> <span class="muted">(${c.gold.weight.toFixed(2)} g · ${rateNote})</span></p>` : "";
  const L = c.lines, row = (k, v, cls = "") => `<tr class="${cls}"><th>${k}</th><td>${v}</td></tr>`;
  return `<details class="price-break" open><summary>Live price breakdown <span class="muted">· updates daily with the gold rate</span></summary>
    <table class="spec">
      ${row(`Gold · ${c.gold.weight.toFixed(2)} g`, inr(L.gold) + `<small>${rateNote}</small>`)}
      ${L.making ? row("Making charges", inr(L.making)) : ""}
      ${L.makingOff ? row(`Ready stock offer · ${c.offer.makingOff}% off making`, "− " + inr(L.makingOff), "off") : ""}
      ${L.diamonds ? row(`Diamonds · ${esc(it.diamondWt)} ct`, inr(L.diamonds)) : ""}
      ${L.diamondOff ? row(`Ready stock offer · ${c.offer.diamondOff}% off diamonds`, "− " + inr(L.diamondOff), "off") : ""}
      ${L.other ? row("Other charges", inr(L.other)) : ""}
      ${L.gst ? row(`GST ${L.gstPct}%`, inr(L.gst)) : ""}
      ${row("Total today", inr(c.final), "total")}
    </table></details>`;
}

function specs(it) {
  return [["Gold", it.goldKt ? `${esc(it.goldKt)}${it.goldColour ? " · " + esc(it.goldColour) : ""}` : ""],
          ["Gross weight", wt(it.grossWt, "g")], ["Gold weight", wt(it.netWt, "g")],
          ["Diamond", [wt(it.diamondWt, "ct"), it.diamondPcs ? it.diamondPcs + " pcs" : ""].filter(Boolean).join(" · ")],
          ["Size", esc(it.size || "")]].filter(r => r[1]);
}

function card(it) {
  const first = (it.media || [])[0];
  const hasVideo = (it.media || []).some(m => m.type === "video");
  const media = !first ? `<div class="stock-noimg">Photo coming soon</div>`
    : first.type === "video" ? `<video src="${esc(first.url)}#t=0.5" muted playsinline preload="metadata"></video>`
    : `<img src="${esc(first.url)}" alt="${esc(it.title)}" loading="lazy">`;
  return `<article class="card stock-card${it.status === "sold" ? " is-sold" : ""}" data-id="${esc(it.id)}">
    <button class="card-img stock-img" data-open="${esc(it.id)}" aria-label="View ${esc(it.title)}">${media}
      ${hasVideo ? `<span class="stock-badge">▶ Video</span>` : ""}
      ${it.status === "reserved" ? `<span class="stock-badge right">Reserved</span>` : ""}
      ${it.status === "sold" ? `<span class="stock-badge right">Sold</span>` : ""}
    </button>
    <div class="card-body">
      <span class="card-cat">${esc(it.category)} · ${esc(it.code || "")}</span>
      <h3><a href="#" data-open="${esc(it.id)}">${esc(it.title)}</a></h3>
      <dl class="stock-specs">${specs(it).slice(0, 3).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <p class="card-meta stock-price-row">${priceHtml(it)}</p>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" data-open="${esc(it.id)}">View</button>
        <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waLink(`Hello Venora Jewels, I'm interested in ready stock item "${it.title}" (Code: ${it.code || it.id}). Is it available?`)}">${ICON.whatsapp} Enquire</a>
      </div>
    </div>
  </article>`;
}

function render() {
  if (!CATS.includes(cat)) cat = "All";
  const list = items.filter(i => cat === "All" || i.category === cat);
  $("stockFilters").innerHTML = CATS.map(c => {
    const n = c === "All" ? items.length : items.filter(i => i.category === c).length;
    return `<button data-cat="${c}" class="${c === cat ? "active" : ""}">${c} <small>${n}</small></button>`;
  }).join("");
  $("stockCount").textContent = `${list.filter(i => i.status !== "sold").length} available`;
  $("stockGrid").innerHTML = list.length ? list.map(card).join("")
    : `<p class="muted">New ready stock is being added — please check back soon, or <a href="${waLink("Hello Venora Jewels, please share your ready stock.")}" target="_blank" rel="noopener">ask us on WhatsApp</a>.</p>`;
}

function banner() {
  const b = $("priceBanner");
  b.hidden = false;
  if (!authState || !authState.user) {
    b.innerHTML = `<div><b>Prices are visible to members</b><span>Log in with Google to see the price of every ready stock piece.</span></div><a class="btn btn-dark btn-sm" href="account.html">Login / Sign up</a>`;
  } else if (!authState.profile && !authState.isAdmin) {
    b.innerHTML = `<div><b>Almost there</b><span>Complete your profile to see ready stock prices.</span></div><a class="btn btn-dark btn-sm" href="account.html">Complete profile</a>`;
  } else b.hidden = true;
}

function openItem(id) {
  const it = items.find(i => i.id === id); if (!it) return;
  document.dispatchEvent(new CustomEvent("venora-stock-open", { detail: id }));
  const media = it.media || [];
  const slide = m => m.type === "video"
    ? `<video src="${esc(m.url)}" controls playsinline preload="metadata"></video>`
    : `<img src="${esc(m.url)}" alt="${esc(it.title)}">`;
  $("stockDetail").innerHTML = `
    <div class="stock-gallery">
      <div class="stock-main" id="stockMain">${media[0] ? slide(media[0]) : `<div class="stock-noimg">Photo coming soon</div>`}</div>
      ${media.length > 1 ? `<div class="stock-thumbs">${media.map((m, i) => `<button class="${i ? "" : "active"}" data-i="${i}">${m.type === "video" ? `<video src="${esc(m.url)}#t=0.5" muted preload="metadata"></video><span>▶</span>` : `<img src="${esc(m.url)}" alt="" loading="lazy">`}</button>`).join("")}</div>` : ""}
    </div>
    <div class="stock-info">
      <span class="eyebrow">Ready stock · ${esc(it.category)}</span>
      <h2>${esc(it.title)}</h2>
      <p class="muted">Code: ${esc(it.code || it.id)}${it.status === "reserved" ? " · Reserved" : it.status === "sold" ? " · Sold" : " · Available"}</p>
      <p class="stock-price-row big">${priceHtml(it)}</p>
      ${breakdown(it)}
      <table class="spec">${specs(it).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</table>
      ${it.notes ? `<p class="stock-notes">${esc(it.notes)}</p>` : ""}
      ${it.category === "Rings" ? `<p><a class="size-link" href="ring-size.html">📏 Find your ring size</a></p>` : ""}
      <p class="stock-offer-note">✦ Ready stock offer: <b>${pricing.offer.makingOff}% off making charges</b> and <b>${pricing.offer.diamondOff}% off diamond prices</b>.</p>
      <div class="product-actions">
        <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(`Hello Venora Jewels, I'm interested in ready stock item "${it.title}" (Code: ${it.code || it.id}). Is it available?`)}">${ICON.whatsapp} Enquire on WhatsApp</a>
      </div>
    </div>`;
  const thumbs = $("stockDetail").querySelector(".stock-thumbs");
  if (thumbs) thumbs.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    thumbs.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    $("stockMain").innerHTML = slide(media[+b.dataset.i]);
  };
  $("stockDlg").showModal();
}

$("stockClose").onclick = () => $("stockDlg").close();
$("stockDlg").addEventListener("close", () => { $("stockDetail").querySelectorAll("video").forEach(v => v.pause()); });
$("stockDlg").addEventListener("click", e => { if (e.target.id === "stockDlg") $("stockDlg").close(); });
$("stockFilters").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  cat = b.dataset.cat; history.replaceState(null, "", cat === "All" ? "stock.html" : "?cat=" + cat); render();
});
$("stockGrid").addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if (!o) return;
  e.preventDefault(); openItem(o.dataset.open);
});

async function loadPrices() {
  prices = {};
  if (!authState || !authState.user || (!authState.profile && !authState.isAdmin)) return;
  const snap = await getDocs(collection(db, "stockPrices")).catch(() => null);
  if (snap) snap.docs.forEach(d => { prices[d.id] = d.data(); });
}

(async function () {
  pricing = await loadPricing();
  const snap = await getDocs(collection(db, "stock")).catch(() => null);
  items = snap ? snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.visible !== false)
    .sort((a, b) => (a.status === "sold") - (b.status === "sold") || (b.order || 0) - (a.order || 0)) : [];
  window.VenoraStock = { get: id => items.find(i => i.id === id), items: () => items };
  render();
  if (location.hash.length > 1) openItem(decodeURIComponent(location.hash.slice(1)));
  document.addEventListener("venora-auth", async e => { authState = e.detail; banner(); await loadPrices(); render(); });
  if (window.VenoraAuth) { authState = await window.VenoraAuth.ready(); banner(); await loadPrices(); render(); }
})();
