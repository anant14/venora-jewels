/* Venora Jewels — today's gold rate bar (every page) and live offers (Home page).
   Both are managed in the admin panel ("Gold rate & offers"). An offer shows only while it is
   switched on and between its optional start and end dates. */
import { db, doc, getDoc, collection, getDocs } from "./auth.js?v=202610051430";

const { esc, waLink } = window.Venora;
const toDate = t => (t && typeof t.toDate === "function" ? t.toDate() : null);
const inr = n => "₹" + Math.round(Number(n)).toLocaleString("en-IN");

// only allow safe links: site pages, https links, or "whatsapp"
function offerHref(o) {
  const link = (o.link || "").trim();
  if (!link || /^whats\s*app$/i.test(link) || /^wa$/i.test(link)) {
    return { href: waLink(`Hello Venora Jewels, I'm interested in your offer: "${o.title}". Please share details.`), external: true };
  }
  if (/^https:\/\//i.test(link)) return { href: link, external: !/venorajewels\.com/i.test(link) };
  if (/^[\w\-./?=&#%]+$/.test(link) && !/^javascript:/i.test(link)) return { href: link, external: false };
  return { href: waLink(`Hello Venora Jewels, I'm interested in your offer: "${o.title}".`), external: true };
}

function renderBar(r, offer) {
  const rates = r && r.show !== false && r.rates ? [24, 22, 18, 14, 9].filter(k => r.rates["k" + k]).map(k => [k, r.rates["k" + k]]) : [];
  if (!rates.length && !offer) return;
  const updated = toDate(r && r.updatedAt);
  const items = rates.map(([k, v]) => `<span class="rate-item">${k}KT <b>${inr(v)}</b></span>`).join("");
  const track = rates.length
    ? `<span class="rate-label">Today's gold rate <small>per gram</small></span>${items}${updated ? `<span class="rate-date">Updated ${updated.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>` : ""}`
    : "";
  const bar = document.createElement("div");
  bar.className = "rate-bar";
  bar.innerHTML = `<div class="wrap rate-inner">
      ${track ? `<div class="rate-viewport"><div class="rate-track">${track}</div></div>` : ""}
      ${offer ? `<a class="rate-offer" href="index.html#offers"><span class="spark">✦</span> ${esc(offer.title)} <span aria-hidden="true">→</span></a>` : ""}
    </div>`;
  const header = document.getElementById("site-header");
  header.parentNode.insertBefore(bar, header);
  // on narrow screens, scroll the rates like a ticker if they don't fit
  const vp = bar.querySelector(".rate-viewport"), tr = bar.querySelector(".rate-track");
  if (vp && tr && tr.scrollWidth > vp.clientWidth + 4) {
    tr.innerHTML += `<span class="rate-gap"></span>` + tr.innerHTML;
    tr.classList.add("ticker");
  }
}

function renderOffers(list) {
  const section = document.getElementById("offers");
  if (!section || !list.length) return;
  document.getElementById("offerGrid").innerHTML = list.map(o => {
    const { href, external } = offerHref(o);
    const until = toDate(o.end);
    return `<article class="offer-card${o.image ? "" : " text-only"}">
      ${o.image ? `<div class="offer-img"><img src="${esc(o.image)}" alt="${esc(o.title)}" loading="lazy"></div>` : ""}
      <div class="offer-body">
        <span class="eyebrow">${until ? "Offer ends " + until.toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "Limited offer"}</span>
        <h3>${esc(o.title)}</h3>
        ${o.text ? `<p>${esc(o.text)}</p>` : ""}
        <a class="btn ${external && href.includes("wa.me") ? "btn-wa" : "btn-dark"}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(o.cta || (href.includes("wa.me") ? "Enquire on WhatsApp" : "View offer"))}</a>
      </div>
    </article>`;
  }).join("");
  section.hidden = false;
  if (location.hash === "#offers") section.scrollIntoView({ behavior: "smooth" });
}

(async function () {
  if (document.body.dataset.page === "admin") return;
  const [rateSnap, offerSnap] = await Promise.all([
    getDoc(doc(db, "public", "goldRates")).catch(() => null),
    getDocs(collection(db, "offers")).catch(() => null)
  ]);
  const now = new Date();
  const live = offerSnap ? offerSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(o => o.active && (!toDate(o.start) || toDate(o.start) <= now) && (!toDate(o.end) || toDate(o.end) > now))
    .sort((a, b) => (toDate(b.updatedAt) || 0) - (toDate(a.updatedAt) || 0)) : [];
  renderBar(rateSnap && rateSnap.exists() ? rateSnap.data() : null, live[0]);
  renderOffers(live);
})();
