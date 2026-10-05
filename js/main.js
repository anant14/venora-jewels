/* Shared header, footer and helpers for every page. */
(function () {
  const V = window.VENORA;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waLink = text => "https://wa.me/" + V.whatsapp + "?text=" + encodeURIComponent(text);

  const ICON = {
    whatsapp: '<svg class="ico" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8c1.9 1 4 1.5 6.2 1.5 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4C5.8 20 5.3 18 5.3 16 5.3 10.1 10.1 5.3 16 5.3S26.7 10.1 26.7 16 21.9 26.6 16 26.6zm5.9-8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.7-.4z"/></svg>',
    mail: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></svg>',
    phone: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/></svg>',
    calendar: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    insta: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>'
  };

  // Line illustrations used until real product photos are added
  const ART = {
    Rings: '<circle cx="50" cy="60" r="24"/><circle cx="50" cy="60" r="20"/><path d="M40 32l10-12 10 12-10 6z"/><path d="M40 32h20M50 20v18"/>',
    Earrings: '<circle cx="35" cy="30" r="6"/><circle cx="65" cy="30" r="6"/><path d="M35 36v8M65 36v8"/><path d="M35 44l-8 12 8 18 8-18z"/><path d="M65 44l-8 12 8 18 8-18z"/>',
    Necklaces: '<path d="M18 18c4 30 16 46 32 50 16-4 28-20 32-50"/><path d="M50 68v4"/><path d="M42 80l8-8 8 8-8 12z"/><path d="M42 80h16"/>',
    Bracelets: '<ellipse cx="50" cy="55" rx="32" ry="18"/><ellipse cx="50" cy="55" rx="27" ry="14"/><g fill="currentColor" stroke="none"><circle cx="50" cy="71" r="2.4"/><circle cx="38" cy="69.5" r="2.2"/><circle cx="62" cy="69.5" r="2.2"/><circle cx="27" cy="64.5" r="2"/><circle cx="73" cy="64.5" r="2"/></g>',
    default: '<path d="M26 30h48l14 18-38 36-38-36z"/><path d="M12 48h76M38 30l-8 18 20 36 20-36-8-18"/>'
  };
  const artSvg = cat => `<svg class="art" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${ART[cat] || ART.default}</svg>`;

  const COLOURS = window.GOLD_COLOURS || { Y: "Yellow Gold", R: "Rose Gold", W: "White Gold" };
  // gold colours a design is photographed in (most have all three; some library items fewer, chains none)
  const colourCodes = p => (p.views ? (p.colours || Object.keys(COLOURS)) : []);
  // Photos live in Cloudflare R2: <media>/<category-folder>/<code>/<code>_<gold>_view-<n>[_thumb].webp
  const MEDIA = (V.media || "").replace(/\/$/, "");
  const CAT_FOLDER = { Earrings: "earrings", Rings: "ladies-rings", Pendants: "pendants", Necklaces: "necklaces", Bracelets: "bracelets" };
  const GOLD_FOLDER = { Y: "yellow-gold", R: "rose-gold", W: "white-gold" };
  const folder = p => p.folder || CAT_FOLDER[p.category] || p.category.toLowerCase().replace(/[^a-z]+/g, "-");
  const mediaUrl = (p, c, n, thumb) => {
    const code = encodeURIComponent(p.code);
    return `${MEDIA}/${folder(p)}/${code}/${code}_${GOLD_FOLDER[c]}_view-${n}${thumb ? "_thumb" : ""}.webp`;
  };
  // designs with a single photo (e.g. chains) carry its path in p.photo / p.thumb
  const photo = (p, c, n) => (c ? mediaUrl(p, c, n, false) : `${MEDIA}/${p.photo}`);
  const thumbPhoto = (p, c, n) => (c ? mediaUrl(p, c, n, true) : `${MEDIA}/${p.thumb || p.photo}`);
  const cardPhoto = (p, c) => (c ? mediaUrl(p, c, 1, true) : `${MEDIA}/${p.thumb || p.photo}`);
  const zoomClass = p => ["pendants", "necklaces"].includes(folder(p)) ? " zoom-" + folder(p) : "";
  const productUrl = (p, c) => "product.html?code=" + encodeURIComponent(p.code) + (c ? "&colour=" + c : "");
  const priceText = p => p.price || "Price on request";
  // defaults for library designs that have no written description yet
  const DEFAULT_SHORT = "Lab grown diamonds, made to order in your gold.";
  const DEFAULT_DESC = "Crafted with IGI certified lab grown diamonds and available in hallmarked 9KT, 14KT and 18KT gold — in yellow, rose or white. Message us on WhatsApp for price, sizes and customisation.";
  const enquiryText = (p, choices) => {
    let t = `Hello Venora Jewels, I'm interested in "${p.name}" (Code: ${p.code}).`;
    if (choices && Object.keys(choices).length) {
      t += "\n" + Object.entries(choices).map(([k, v]) => `${k}: ${v}`).join("\n");
    }
    return t + "\nPlease share price and details.";
  };

  function swatches(p, active) {
    return colourCodes(p).map(c =>
      `<button type="button" class="dot dot-${c.toLowerCase()}${c === active ? " active" : ""}" data-colour="${c}" title="${COLOURS[c]}" aria-label="Show in ${COLOURS[c]}" aria-pressed="${c === active}"></button>`
    ).join("");
  }

  // every product rendered as a card (public or members' catalogue), by code
  const REGISTRY = new Map();

  function productCard(p) {
    REGISTRY.set(p.code, p);
    const c = colourCodes(p).includes(p.colour) ? p.colour : colourCodes(p)[0];
    const media = c || p.photo
      ? `<img src="${cardPhoto(p, c)}" alt="${esc(p.name)}${c ? " in " + esc(COLOURS[c]) : ""}" loading="lazy">`
      : artSvg(p.category);
    return `
      <article class="card" data-code="${esc(p.code)}">
        <a href="${productUrl(p, c)}" class="card-img${zoomClass(p)}">${media}</a>
        <div class="card-body">
          <span class="card-cat">${esc(p.category)}</span>
          <h3><a href="${productUrl(p, c)}">${esc(p.name)}</a></h3>
          <p class="card-short">${esc(p.short || DEFAULT_SHORT)}</p>
          ${c ? `<div class="card-colours"><span>Shown in <b>${esc(COLOURS[c])}</b></span><div class="dots">${swatches(p, c)}</div></div>` : ""}
          <p class="card-meta">${esc(priceText(p))}</p>
          <div class="card-actions">
            <a class="btn btn-ghost btn-sm" href="${productUrl(p, c)}">View details</a>
            <a class="btn btn-wa btn-sm" href="${waLink(enquiryText(p, c ? { "Gold colour": COLOURS[c] } : null))}" target="_blank" rel="noopener">${ICON.whatsapp} Enquire</a>
          </div>
        </div>
      </article>`;
  }

  // Colour swatches on product cards: switch photo, label and links in place
  document.addEventListener("click", e => {
    const dot = e.target.closest(".card .dot");
    if (!dot) return;
    const card = dot.closest(".card");
    const p = REGISTRY.get(card.dataset.code);
    const c = dot.dataset.colour;
    card.querySelector(".card-img img").src = cardPhoto(p, c);
    card.querySelector(".card-img img").alt = `${p.name} in ${COLOURS[c]}`;
    card.querySelector(".card-colours b").textContent = COLOURS[c];
    card.querySelectorAll(".dot").forEach(d => { d.classList.toggle("active", d === dot); d.setAttribute("aria-pressed", d === dot); });
    card.querySelectorAll('a[href^="product.html"]').forEach(a => { a.href = productUrl(p, c); });
    card.querySelector(".btn-wa").href = waLink(enquiryText(p, { "Gold colour": COLOURS[c] }));
  });

  const NAV = [
    ["index.html", "Home", "home"],
    ["collections.html", "Collections", "collections"],
    ["about.html", "About Us", "about"],
    ["why-lab-grown.html", "Why Lab-Grown", "why"],
    ["contact.html", "Contact", "contact"]
  ];

  function renderChrome() {
    const page = document.body.dataset.page;
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `
        <div class="wrap nav">
          <a href="index.html" class="logo">VENORA<span>.</span><small>JEWELS</small></a>
          <button class="menu-btn" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
          <nav><ul>
            ${NAV.map(([href, label, key]) => `<li><a href="${href}"${key === page ? ' class="active" aria-current="page"' : ""}>${label}</a></li>`).join("")}
          </ul></nav>
          ${V.instagram ? `<a class="nav-insta" href="${esc(V.instagram)}" target="_blank" rel="noopener" aria-label="Venora Jewels on Instagram">${ICON.insta}</a>` : ""}
          <a class="btn btn-dark btn-sm nav-cta" href="contact.html#consultation">Book Consultation</a>
        </div>`;
      const btn = header.querySelector(".menu-btn");
      btn.addEventListener("click", () => {
        const open = header.classList.toggle("open");
        btn.setAttribute("aria-expanded", open);
      });
    }

    const footer = document.getElementById("site-footer");
    if (footer) {
      const cats = [...new Set(window.PRODUCTS.map(p => p.category))];
      footer.innerHTML = `
        <div class="wrap footer-grid">
          <div>
            <a href="index.html" class="logo">VENORA<span>.</span><small>JEWELS</small></a>
            <p class="footer-tag"><em>Redefining Luxury, Affordably.</em><br>100% IGI certified lab grown diamond jewellery — made in our Surat factory, born in Noida.</p>
          </div>
          <div>
            <h4>Explore</h4>
            ${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
          </div>
          <div>
            <h4>Collections</h4>
            ${cats.map(c => `<a href="collections.html?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}
          </div>
          <div>
            <h4>Get in touch</h4>
            <a href="${waLink("Hello Venora Jewels!")}" target="_blank" rel="noopener">${ICON.whatsapp} WhatsApp</a>
            <a href="mailto:${esc(V.email)}">${ICON.mail} ${esc(V.email)}</a>
            <a href="tel:+${esc(V.whatsapp)}">${ICON.phone} ${esc(V.phoneDisplay)}</a>
            ${V.instagram ? `<a href="${esc(V.instagram)}" target="_blank" rel="noopener">${ICON.insta} @jewels_venora</a>` : ""}
          </div>
        </div>
        <div class="wrap footer-bottom">© ${new Date().getFullYear()} Venora Jewels. All rights reserved. · <a href="privacy.html">Privacy Policy</a> · <a href="account.html">My Account</a></div>`;
    }

    const fab = document.createElement("a");
    fab.className = "float-wa";
    fab.href = waLink("Hello Venora Jewels, I'd like to know more about your lab grown diamond jewellery.");
    fab.target = "_blank";
    fab.rel = "noopener";
    fab.setAttribute("aria-label", "Chat with us on WhatsApp");
    fab.innerHTML = ICON.whatsapp;
    document.body.appendChild(fab);

    // Fill any element that asks for a contact value, e.g. <span data-venora="email"></span>
    document.querySelectorAll("[data-venora]").forEach(el => { el.textContent = V[el.dataset.venora] || ""; });
    document.querySelectorAll("[data-wa]").forEach(el => {
      el.href = waLink(el.dataset.wa);
      el.target = "_blank";
      el.rel = "noopener";
      if (!el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", ICON.whatsapp);
    });
  }


  /* ---------- Motion: reveal on scroll, product click transitions ---------- */
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const REVEAL = [
    ".section-head", ".split > *", ".feature", ".card", ".tile", ".step", ".cert", ".quote", ".c-card", ".gold-card",
    ".process-card", ".value", ".founder", ".method", ".stats > div", ".price-callout", "figure.guide", ".faq details",
    ".table-wrap", ".form", ".auth-card", ".account-card", ".set-block > h3", ".promise-list li", ".cta-band .wrap > *",
    ".legal > *", ".member-banner", ".toolbar", ".product-info > *", ".purity", ".swatches"
  ].join(",");

  function setupReveal() {
    if (REDUCE || !("IntersectionObserver" in window) || document.body.dataset.page === "admin") return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    const tag = root => {
      if (!root || !root.querySelectorAll) return;
      root.querySelectorAll(REVEAL).forEach(el => {
        if (el.classList.contains("reveal") || el.closest("#site-header, #site-footer, .hero, dialog")) return;
        // neighbours appear one after another
        const siblings = [...el.parentElement.children].filter(c => c.matches(REVEAL));
        el.style.setProperty("--d", Math.min(siblings.indexOf(el), 8) * 0.07 + "s");
        if (el.matches(".split > :first-child")) el.classList.add("reveal-left");
        else if (el.matches(".split > :last-child")) el.classList.add("reveal-right");
        else if (el.matches(".tile, .card, .cert, .value")) el.classList.add("reveal-zoom");
        el.classList.add("reveal");
        io.observe(el);
      });
    };
    tag(document);
    // safety net for fast scrolls / jumps: anything already above the bottom of the screen is shown
    let queued = false;
    const sweep = () => {
      queued = false;
      document.querySelectorAll(".reveal:not(.in)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add("in"); io.unobserve(el); }
      });
    };
    window.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(sweep); } }, { passive: true });
    window.addEventListener("load", sweep);
    // product grids are rendered later (filters, login, sets): animate new cards too
    new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1) tag(n.parentElement || n);
    }))).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
  }

  // Clicking a product: the card presses in and its photo glides into the product page
  const CROSS_DOC_TRANSITIONS = "CSSViewTransitionRule" in window;
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="product.html"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const card = a.closest(".card");
    if (card) {
      card.classList.add("pressed");
      const img = card.querySelector(".card-img img");
      if (img) img.style.viewTransitionName = "product-photo";
    }
    if (!CROSS_DOC_TRANSITIONS && !REDUCE) {
      e.preventDefault();
      document.body.classList.add("leaving");
      setTimeout(() => { location.href = a.href; }, 220);
    }
  });
  // coming back with the browser's Back button: undo the click effects
  window.addEventListener("pageshow", () => {
    document.body.classList.remove("leaving");
    document.querySelectorAll(".card.pressed").forEach(c => c.classList.remove("pressed"));
    document.querySelectorAll(".card-img img").forEach(i => { i.style.viewTransitionName = ""; });
  });

  window.Venora = { DEFAULT_DESC, esc, waLink, ICON, artSvg, productCard, productUrl, priceText, enquiryText, COLOURS, colourCodes, photo, thumbPhoto, cardPhoto, zoomClass, swatches };
  renderChrome();
  setupReveal();
})();
