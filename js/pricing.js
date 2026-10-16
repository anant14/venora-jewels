/* Venora Jewels — ready stock price, worked out from today's gold rate.
   Live price = gold (gold wt × today's rate for the karat)
              + making (₹ per gram of gold) − ready-stock making discount
              + diamonds (ct × ₹ per ct)    − ready-stock diamond discount
              + other charges, then GST.
   Gold rates are entered per 10 grams in the admin panel (public/goldRates).
   Discounts and GST come from public/stockOffer (admin "Ready stock" tab). */
import { db, doc, getDoc } from "./auth.js?v=202610162146";

export const DEFAULT_OFFER = { makingOff: 20, diamondOff: 10, gst: 3 };
let cache = null;

/** Today's gold rates (per 10 g) and the ready-stock offer; loaded once per page. */
export function loadPricing() {
  if (!cache) cache = Promise.all([
    getDoc(doc(db, "public", "goldRates")).catch(() => null),
    getDoc(doc(db, "public", "stockOffer")).catch(() => null)
  ]).then(([r, o]) => ({
    rates: r && r.exists() ? r.data().rates || {} : {},
    ratesUpdated: r && r.exists() && r.data().updatedAt ? r.data().updatedAt.toDate() : null,
    offer: { ...DEFAULT_OFFER, ...(o && o.exists() ? o.data() : {}) }
  }));
  return cache;
}

const karatKey = kt => "k" + String(kt || "").replace(/\D/g, "");
/** Gold weight in grams: the entered gold weight, or gross minus diamonds (1 ct = 0.2 g). */
export const goldWeight = it => (it.netWt != null && it.netWt !== "" ? +it.netWt : Math.max(0, (+it.grossWt || 0) - (+it.diamondWt || 0) * 0.2));

/** Gold value today for a piece (null if no rate for its karat). */
export function goldValue(it, rates) {
  const r10 = rates && rates[karatKey(it.goldKt)];
  if (!r10) return null;
  return { value: Math.round(goldWeight(it) * r10 / 10), rate10: r10, weight: goldWeight(it) };
}

/** Full price for a stock item. p = its stockPrices record (members only). */
export function computePrice(it, p, pricing) {
  if (!p) return null;
  const gv = goldValue(it, pricing.rates);
  if (p.mode !== "live") {
    return p.price ? { mode: "fixed", final: Math.round(p.price), was: p.mrp && p.mrp > p.price ? Math.round(p.mrp) : null, gold: gv } : null;
  }
  if (!gv) return null;
  const o = pricing.offer, gw = gv.weight;
  const making = gw * (+p.making || 0);
  const diamonds = (+it.diamondWt || 0) * (+p.diamondRate || 0);
  const other = +p.other || 0;
  const makingOff = making * (+o.makingOff || 0) / 100, diamondOff = diamonds * (+o.diamondOff || 0) / 100;
  const before = gv.value + making + diamonds + other;
  const sub = before - makingOff - diamondOff;
  const gstPct = p.gst === false ? 0 : (+o.gst || 0);
  const r = n => Math.round(n);
  return {
    mode: "live", gold: gv,
    lines: { gold: r(gv.value), making: r(making), makingOff: r(makingOff), diamonds: r(diamonds), diamondOff: r(diamondOff), other: r(other), gst: r(sub * gstPct / 100), gstPct },
    final: r(sub * (1 + gstPct / 100)),
    was: makingOff + diamondOff > 0 ? r(before * (1 + gstPct / 100)) : null,
    offer: o
  };
}

export const inr = n => "₹" + Math.round(Number(n)).toLocaleString("en-IN");
