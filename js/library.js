/* Venora Jewels — the full design library on Cloudflare R2 (catalog.json).
   Admin-only: used by the admin panel and by admins viewing product pages.
   Items keep the CAD sheet path in `cad`; never copy that field into anything a client sees. */
(function () {
  const MEDIA = (window.VENORA.media || "").replace(/\/$/, "");
  // R2 category -> website category name
  const SITE_CATEGORY = { "Ladies Rings": "Rings" };
  let cache = null;

  function normalise(cat) {
    const items = [];
    cat.categories.forEach(c => {
      c.products.forEach(p => {
        const colours = p.variants.filter(v => v.images && v.images.length).map(v => v.id)
          .sort((a, b) => "YRW".indexOf(a) - "YRW".indexOf(b));
        const views = colours.length
          ? Math.min(...p.variants.filter(v => colours.includes(v.id)).map(v => v.images.length)) : 0;
        if (!colours.length && !p.photo) return;              // nothing to show
        const item = {
          code: p.id, name: p.name || p.id, category: SITE_CATEGORY[c.name] || c.name, folder: c.slug,
          lot: p.lot || "", views, cad: p.designSheet || null
        };
        if (colours.length) {
          item.colour = colours[0];
          if (colours.length < 3) item.colours = colours;
        } else {
          item.photo = p.photo; item.thumb = p.thumbnail || p.photo;
        }
        items.push(item);
      });
    });
    return items;
  }

  /** Load (once) and return every design in the R2 library. */
  window.loadLibrary = function () {
    if (!cache) {
      cache = fetch(MEDIA + "/catalog.json")
        .then(r => { if (!r.ok) throw new Error("catalog.json " + r.status); return r.json(); })
        .then(normalise)
        .catch(e => { cache = null; throw e; });
    }
    return cache;
  };

  /** A copy of an item that is safe to show to clients (no CAD sheet, no internal fields). */
  window.clientItem = function (d) {
    const out = {};
    ["code", "name", "category", "folder", "colour", "colours", "views", "photo", "thumb",
     "short", "description", "options", "details", "price"].forEach(k => {
      if (d[k] !== undefined && d[k] !== null && d[k] !== "") out[k] = d[k];
    });
    return out;
  };

  window.cadUrl = d => (d.cad ? MEDIA + "/" + d.cad : null);
})();
