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

  const productUrl = p => "product.html?code=" + encodeURIComponent(p.code);
  const priceText = p => p.price || "Price on request";
  const enquiryText = (p, choices) => {
    let t = `Hello Venora Jewels, I'm interested in "${p.name}" (Code: ${p.code}).`;
    if (choices && Object.keys(choices).length) {
      t += "\n" + Object.entries(choices).map(([k, v]) => `${k}: ${v}`).join("\n");
    }
    return t + "\nPlease share price and details.";
  };

  function productCard(p) {
    const media = p.images && p.images.length
      ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy">`
      : artSvg(p.category);
    const optCount = Object.values(p.options || {}).reduce((n, a) => n * a.length, 1);
    return `
      <article class="card">
        <a href="${productUrl(p)}" class="card-img">${media}</a>
        <div class="card-body">
          <span class="card-cat">${esc(p.category)}</span>
          <h3><a href="${productUrl(p)}">${esc(p.name)}</a></h3>
          <p class="card-short">${esc(p.short)}</p>
          <p class="card-meta">${optCount > 1 ? optCount + " variations · " : ""}${esc(priceText(p))}</p>
          <div class="card-actions">
            <a class="btn btn-ghost btn-sm" href="${productUrl(p)}">View details</a>
            <a class="btn btn-wa btn-sm" href="${waLink(enquiryText(p))}" target="_blank" rel="noopener">${ICON.whatsapp} Enquire</a>
          </div>
        </div>
      </article>`;
  }

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
            <p class="footer-tag"><em>Redefining Luxury, Affordably.</em><br>100% IGI certified lab grown diamond jewellery from a family with over 200 years of jewellery heritage in Agra.</p>
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
        <div class="wrap footer-bottom">© ${new Date().getFullYear()} Venora Jewels. All rights reserved.</div>`;
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

  window.Venora = { esc, waLink, ICON, artSvg, productCard, productUrl, priceText, enquiryText };
  renderChrome();
})();
