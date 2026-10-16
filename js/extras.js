/* Venora Jewels — wishlist ♡, compare ⇄ and anonymous visitor analytics (every page).
   Wishlist: saved in the browser for guests; synced to wishlists/{uid} once logged in.
   Compare: up to 3 designs / stock pieces for this visit (compare.html).
   Analytics: daily counters in analytics/{YYYY-MM-DD}; no personal data; admins are not counted. */
import { db, doc, getDoc, setDoc, serverTimestamp, increment, ready } from "./auth.js?v=202610162146";

const V = window.Venora;
const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const SS = { get(k, d) { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const clean = s => String(s || "").replace(/[^\w\-]/g, "_").slice(0, 60);

/* ---------- what a card represents ---------- */
function itemFromCard(card) {
  if (card.dataset.id && window.VenoraStock) {
    const s = window.VenoraStock.get(card.dataset.id); if (!s) return null;
    const m = (s.media || []).find(x => x.type === "image") || (s.media || [])[0];
    return { key: "s:" + s.id, kind: "stock", id: s.id, name: s.title, code: s.code, category: s.category,
             img: m ? m.url : "", video: m && m.type === "video", goldKt: s.goldKt, goldColour: s.goldColour,
             grossWt: s.grossWt, netWt: s.netWt, diamondWt: s.diamondWt, diamondPcs: s.diamondPcs, size: s.size };
  }
  if (card.dataset.code) {
    const p = V.getProduct(card.dataset.code); if (!p) return null;
    const c = (V.colourCodes(p).includes(p.colour) ? p.colour : V.colourCodes(p)[0]);
    return { key: "d:" + p.code, kind: "design", code: p.code, name: p.name, category: p.category, folder: p.folder || null,
             colour: c || null, img: V.cardPhoto(p, c), details: p.details || null, options: p.options || null };
  }
  return null;
}
const itemUrl = it => it.kind === "stock" ? "stock.html#" + encodeURIComponent(it.id) : "product.html?code=" + encodeURIComponent(it.code) + (it.colour ? "&colour=" + it.colour : "");

/* ================= WISHLIST ================= */
let wish = LS.get("venora-wishlist", []), user = null;
const inWish = key => wish.some(w => w.key === key);
async function saveWish() {
  LS.set("venora-wishlist", wish);
  if (user) await setDoc(doc(db, "wishlists", user.uid), { items: wish.slice(0, 200), updatedAt: serverTimestamp() }).catch(() => {});
  paintWish(); announce();
}
// tell pages (e.g. the wishlist page) that the list changed — only on real changes
const announce = () => document.dispatchEvent(new CustomEvent("venora-wishlist", { detail: wish }));
function toggleWish(item) {
  if (inWish(item.key)) wish = wish.filter(w => w.key !== item.key);
  else { wish.unshift({ ...item, addedAt: Date.now() }); track("events", "wishlist_add"); toast(user ? "Saved to your wishlist ♡" : "Saved ♡ — log in to keep it on all your devices"); }
  saveWish();
}
function paintWish() {
  document.querySelectorAll("[data-wish]").forEach(b => {
    const on = inWish(b.dataset.wish);
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
    b.title = on ? "Remove from wishlist" : "Save to wishlist";
  });
  const n = document.querySelector(".nav-wish b");
  if (n) { n.textContent = wish.length || ""; n.hidden = !wish.length; }
}
document.addEventListener("venora-auth", async e => {
  const st = e.detail;
  user = st.user && !st.isAdmin ? st.user : null;
  if (!user) { paintWish(); return; }
  // merge what was saved as a guest into the account
  const snap = await getDoc(doc(db, "wishlists", user.uid)).catch(() => null);
  const remote = snap && snap.exists() ? snap.data().items || [] : [];
  const merged = [...remote];
  wish.forEach(w => { if (!merged.some(m => m.key === w.key)) merged.unshift(w); });
  const changed = merged.length !== remote.length;
  wish = merged;
  if (changed) await saveWish(); else { LS.set("venora-wishlist", wish); paintWish(); announce(); }
});
window.VenoraWish = { list: () => wish, toggle: toggleWish, remove: key => { wish = wish.filter(w => w.key !== key); saveWish(); }, url: itemUrl };

/* ================= COMPARE ================= */
let cmp = SS.get("venora-compare", []);
const inCmp = key => cmp.some(c => c.key === key);
function toggleCmp(item) {
  if (inCmp(item.key)) cmp = cmp.filter(c => c.key !== item.key);
  else {
    if (cmp.length >= 3) { toast("You can compare up to 3 pieces — remove one first"); return; }
    cmp.push(item); track("events", "compare_add");
  }
  SS.set("venora-compare", cmp); paintCmp();
}
function paintCmp() {
  document.querySelectorAll("[data-cmp]").forEach(b => {
    const on = inCmp(b.dataset.cmp);
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
    b.title = on ? "Remove from compare" : "Add to compare";
  });
  let tray = document.getElementById("cmpTray");
  if (!cmp.length || document.body.dataset.page === "compare") { if (tray) tray.remove(); return; }
  if (!tray) { tray = document.createElement("div"); tray.id = "cmpTray"; tray.className = "cmp-tray"; document.body.appendChild(tray); }
  tray.innerHTML = `<div class="cmp-items">${cmp.map(c => `<div class="cmp-chip"><img src="${V.esc(c.img)}" alt=""><span>${V.esc(c.name)}</span><button data-cmp-rm="${V.esc(c.key)}" aria-label="Remove">×</button></div>`).join("")}
      ${Array.from({ length: 3 - cmp.length }, () => `<div class="cmp-chip empty">+ add</div>`).join("")}</div>
    <div class="cmp-actions"><button class="cmp-clear" data-cmp-clear>Clear</button><a class="btn btn-dark btn-sm" href="compare.html"${cmp.length < 2 ? ' aria-disabled="true"' : ""}>Compare ${cmp.length}</a></div>`;
}
window.VenoraCompare = { list: () => cmp, remove: key => { cmp = cmp.filter(c => c.key !== key); SS.set("venora-compare", cmp); paintCmp(); }, clear: () => { cmp = []; SS.set("venora-compare", cmp); paintCmp(); }, url: itemUrl };

/* ---------- buttons on every product / stock card ---------- */
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.6 1.1 5.1 2.9 1.5-1.8 3.1-2.9 5.1-2.9 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>';
const CMP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3"/></svg>';
function decorate(root) {
  let added = 0;
  (root.querySelectorAll ? root : document).querySelectorAll(".card[data-code], .card[data-id]").forEach(card => {
    if (card.querySelector(".card-tools")) return;
    added++;
    const key = card.dataset.id ? "s:" + card.dataset.id : "d:" + card.dataset.code;
    const tools = document.createElement("div");
    tools.className = "card-tools";
    tools.innerHTML = `<button type="button" class="ct-btn ct-heart" data-wish="${V.esc(key)}" aria-label="Save to wishlist">${HEART}</button>
      <button type="button" class="ct-btn ct-cmp" data-cmp="${V.esc(key)}" aria-label="Add to compare">${CMP}</button>`;
    card.appendChild(tools);
  });
  if (added) { paintWish(); paintCmp(); }
}
document.addEventListener("click", e => {
  const w = e.target.closest("[data-wish]"), c = e.target.closest("[data-cmp]");
  if (w || c) {
    e.preventDefault(); e.stopPropagation();
    const card = (w || c).closest(".card");
    const item = card ? itemFromCard(card) : null;
    if (!item) return;
    if (w) { w.classList.add("pop"); setTimeout(() => w.classList.remove("pop"), 400); toggleWish(item); }
    else toggleCmp(item);
    return;
  }
  const rm = e.target.closest("[data-cmp-rm]"); if (rm) { window.VenoraCompare.remove(rm.dataset.cmpRm); return; }
  if (e.target.closest("[data-cmp-clear]")) { window.VenoraCompare.clear(); return; }
  const wa = e.target.closest('a[href*="wa.me"]'); if (wa) track("wa", document.body.dataset.page || "page");
  if (e.target.closest('a[href^="tryon.html"]')) track("events", "tryon_click");
}, true);

/* header: wishlist heart with a count */
function headerHeart() {
  const nav = document.querySelector("#site-header .nav");
  if (!nav || nav.querySelector(".nav-wish")) return;
  const a = document.createElement("a");
  a.className = "nav-wish"; a.href = "wishlist.html"; a.setAttribute("aria-label", "Wishlist");
  a.innerHTML = `${HEART}<b hidden></b>`;
  const insta = nav.querySelector(".nav-insta");
  nav.insertBefore(a, insta || nav.querySelector(".nav-account"));
}

/* ---------- small toast ---------- */
let toastTimer = 0;
function toast(msg) {
  let t = document.getElementById("vToast");
  if (!t) { t = document.createElement("div"); t.id = "vToast"; t.className = "v-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ================= ANALYTICS ================= */
const pending = {};
let flushTimer = 0, isAdmin = null;
function track(group, key) {
  key = clean(key);
  pending[group] = pending[group] || {};
  if (group === "visitors") pending.visitors = (pending.visitors || 0) + 1;
  else pending[group][key] = (pending[group][key] || 0) + 1;
  clearTimeout(flushTimer); flushTimer = setTimeout(flush, 1500);
}
async function flush() {
  if (isAdmin === null) isAdmin = !!(await ready()).isAdmin;
  if (isAdmin) { Object.keys(pending).forEach(k => delete pending[k]); return; }
  const data = {};
  for (const [g, v] of Object.entries(pending)) {
    if (g === "visitors") data.visitors = increment(v);
    else if (Object.keys(v).length) data[g] = Object.fromEntries(Object.entries(v).map(([k, n]) => [k, increment(n)]));
    delete pending[g];
  }
  if (Object.keys(data).length) await setDoc(doc(db, "analytics", today()), data, { merge: true }).catch(() => {});
}
window.addEventListener("pagehide", () => { if (Object.keys(pending).length) flush(); });
window.VenoraTrack = track;

/* ---------- start ---------- */
headerHeart();
decorate(document);
paintWish(); paintCmp();
new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.closest(".card-tools, #cmpTray")) decorate(n.parentElement || n); })))
  .observe(document.querySelector("main") || document.body, { childList: true, subtree: true });

if (document.body.dataset.page !== "admin") {
  if (LS.get("venora-seen", "") !== today()) { LS.set("venora-seen", today()); track("visitors"); }
  track("views", document.body.dataset.page || "page");
  const code = new URLSearchParams(location.search).get("code");
  if (location.pathname.endsWith("product.html") && code) track("designs", code);
  document.addEventListener("venora-stock-open", e => track("stock", e.detail));
}
