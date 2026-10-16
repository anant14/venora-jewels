/* Venora Jewels — today's gold rate bar (every page) and live offers (Home page).
   Both are managed in the admin panel ("Gold rate & offers"). An offer shows only while it is
   switched on and between its optional start and end dates. */
import { db, doc, getDoc, collection, getDocs } from "./auth.js?v=202610162115";

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
    ? `<span class="rate-label">Today's gold rate <small>per 10 g</small></span>${items}${updated ? `<span class="rate-date">Updated ${updated.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>` : ""}`
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
  const slides = list.map((o, i) => {
    const { href, external } = offerHref(o);
    const until = toDate(o.end);
    return `<article class="offer-slide${o.image ? " has-img" : ""}${i ? "" : " active"}" aria-hidden="${i ? "true" : "false"}">
      ${o.image ? `<div class="offer-img"><img src="${esc(o.image)}" alt="${esc(o.title)}"></div>` : ""}
      <div class="offer-body">
        <span class="eyebrow">${until ? "Offer ends " + until.toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "Limited offer"}</span>
        <h3>${esc(o.title)}</h3>
        ${o.text ? `<p>${esc(o.text)}</p>` : ""}
        <a class="btn ${href.includes("wa.me") ? "btn-wa" : "btn-dark"}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(o.cta || (href.includes("wa.me") ? "Enquire on WhatsApp" : "View offer"))}</a>
      </div>
    </article>`;
  }).join("");
  const many = list.length > 1;
  const box = document.getElementById("offerGrid");
  box.className = "offer-carousel";
  box.innerHTML = `<div class="offer-track">${slides}</div>
    ${many ? `<button class="oc-arrow prev" aria-label="Previous offer">‹</button><button class="oc-arrow next" aria-label="Next offer">›</button>
    <div class="oc-dots">${list.map((_, i) => `<button class="${i ? "" : "active"}" data-i="${i}" aria-label="Offer ${i + 1}"></button>`).join("")}</div>` : ""}`;
  section.hidden = false;
  if (location.hash === "#offers") section.scrollIntoView({ behavior: "smooth" });
  if (!many) return;
  const all = [...box.querySelectorAll(".offer-slide")], dots = [...box.querySelectorAll(".oc-dots button")];
  let at = 0, timer = 0;
  const go = i => {
    at = (i + all.length) % all.length;
    all.forEach((s, k) => { s.classList.toggle("active", k === at); s.setAttribute("aria-hidden", k !== at); });
    dots.forEach((d, k) => d.classList.toggle("active", k === at));
  };
  const play = () => { clearInterval(timer); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => go(at + 1), 5000); };
  box.querySelector(".prev").onclick = () => { go(at - 1); play(); };
  box.querySelector(".next").onclick = () => { go(at + 1); play(); };
  dots.forEach(d => d.onclick = () => { go(+d.dataset.i); play(); });
  box.addEventListener("mouseenter", () => clearInterval(timer));
  box.addEventListener("mouseleave", play);
  let x0 = null;
  box.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(at + (dx < 0 ? 1 : -1)); play(); } x0 = null; });
  play();
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
