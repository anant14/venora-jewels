/* =========================================================
   VENORA JEWELS — PRODUCT CATALOGUE
   ---------------------------------------------------------
   Add, remove or edit products here. Each product gets its
   own page automatically (product.html?code=YOUR-CODE).

   code         design code (also the folder name in images/products/)
   name         product name
   category     Earrings | Rings | Pendants | Necklaces | Bracelets (a new name creates a new filter)
   featured     true = shown on the Home page
   price        e.g. "From ₹45,000" — leave "" to show "Price on request"
   colour       gold colour shown first: "Y" yellow, "R" rose, "W" white
   views        how many photos exist per colour
   short        one line shown on the product card
   description  paragraph shown on the product page
   options      extra choices for the customer (gold colour is added automatically)
   details      specification table on the product page

   PHOTOS live in images/products/<code>/ and are named by colour:
     Y-1.webp … Y-4.webp   yellow gold views  (Y-card.webp = small card image)
     R-1.webp … R-4.webp   rose gold views    (R-card.webp)
     W-1.webp … W-4.webp   white gold views   (W-card.webp)
   ========================================================= */
window.GOLD_COLOURS = { Y: "Yellow Gold", R: "Rose Gold", W: "White Gold" };

const GOLD_PURITY = { "Gold purity": ["14KT", "18KT", "9KT"] };

window.PRODUCTS = [
  /* ---------------- EARRINGS ---------------- */
  {
    code: "ER-0001", name: "Classic Solitaire Studs", category: "Earrings", featured: true, price: "",
    colour: "Y", views: 3,
    short: "Round brilliant solitaires in a four-prong setting.",
    description: "The earrings every jewellery box should begin with — a matched pair of round brilliant lab grown diamonds, held high in four-prong settings with secure screw backs.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Round brilliant", "Setting": "4-prong solitaire", "Back": "Screw back" }
  },
  {
    code: "ER-340", name: "Pavé Hoop Earrings", category: "Earrings", featured: false, price: "",
    colour: "R", views: 4,
    short: "Diamond-lined hoops with a secure hinged closure.",
    description: "Everyday hoops lined with lab grown diamonds along the front, finished with a secure hinged closure. Easy to wear from morning to evening.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Style": "Hoop", "Setting": "Prong-set pavé", "Closure": "Hinged" }
  },
  {
    code: "AER-44", name: "Blossom Cluster Studs", category: "Earrings", featured: false, price: "",
    colour: "W", views: 4,
    short: "A flower of pear-shaped diamonds around a round centre.",
    description: "Pear-shaped lab grown diamonds open like petals around a round centre stone — a cluster design that sparkles far bigger than its size.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shapes": "Pear petals, round centre", "Style": "Cluster stud" }
  },
  {
    code: "ER-484", name: "Toi et Moi Halo Studs", category: "Earrings", featured: false, price: "",
    colour: "Y", views: 4,
    short: "An emerald-cut and a pear diamond, each framed in a halo.",
    description: "Two shapes side by side — an emerald-cut and a pear-shaped lab grown diamond, each wrapped in a halo of smaller diamonds. Modern, graphic and full of light.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shapes": "Emerald cut + pear", "Setting": "Halo" }
  },

  /* ---------------- RINGS ---------------- */
  {
    code: "DDLR-710", name: "Round Solitaire Ring", category: "Rings", featured: true, price: "",
    colour: "W", views: 4,
    short: "A single round brilliant on a smooth, polished band.",
    description: "Our purest expression of brilliance — a round lab grown diamond raised in a four-prong setting on a smooth polished band. A ring for the moment that matters.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Round brilliant", "Setting": "4-prong solitaire", "Band": "Plain polished" }
  },
  {
    code: "DDLR-445", name: "Pear Halo Pavé Ring", category: "Rings", featured: false, price: "",
    colour: "R", views: 4,
    short: "A pear-shaped centre in a halo, on a diamond pavé band.",
    description: "A pear-shaped lab grown diamond framed by a delicate halo, set on a slim band lined with pavé diamonds for sparkle from every angle.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Centre": "Pear", "Setting": "Halo with pavé band" }
  },
  {
    code: "DDLR-621", name: "Oval Eternity Band", category: "Rings", featured: false, price: "",
    colour: "Y", views: 4,
    short: "Oval diamonds all the way around — a circle without end.",
    description: "Matched oval lab grown diamonds set shoulder to shoulder around the entire band. Wear it alone, or stack it with your engagement ring.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Oval", "Style": "Full eternity" }
  },
  {
    code: "DDLR-1063", name: "Oval & Baguette Three-Stone Ring", category: "Rings", featured: false, price: "",
    colour: "W", views: 4,
    short: "An oval centre flanked by stepped baguettes.",
    description: "A striking oval lab grown diamond flanked by stepped baguette diamonds on a bold band — an art-deco inspired ring with presence.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Centre": "Oval", "Side stones": "Baguettes", "Style": "Three-stone" }
  },

  /* ---------------- PENDANTS ---------------- */
  {
    code: "GNK-0004", name: "Pavé Heart Pendant", category: "Pendants", featured: false, price: "",
    colour: "R", views: 3,
    short: "An open heart framed in lab grown diamonds.",
    description: "An open heart outlined with a double row of lab grown diamonds on a fine chain — a timeless gift of love.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Motif": "Heart", "Chain": "Fine cable chain" }
  },
  {
    code: "GPD-0010", name: "Butterfly Pendant", category: "Pendants", featured: true, price: "",
    colour: "Y", views: 3,
    short: "A delicate diamond butterfly on a fine chain.",
    description: "Delicate wings set with lab grown diamonds, resting on a fine chain. Light, playful and made for everyday wear.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Motif": "Butterfly", "Chain": "Fine cable chain" }
  },
  {
    code: "GPD-0016", name: "Infinity Pendant", category: "Pendants", featured: false, price: "",
    colour: "W", views: 3,
    short: "An infinity symbol set with pavé and pear diamonds.",
    description: "An infinity symbol traced in pavé diamonds, with two pear-shaped lab grown diamonds at its heart — a symbol of forever.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Motif": "Infinity", "Accent": "Pear-shaped diamonds" }
  },
  {
    code: "GPD-0077", name: "Emerald-Cut Bezel Pendant", category: "Pendants", featured: false, price: "",
    colour: "R", views: 3,
    short: "A single emerald-cut diamond in a clean bezel.",
    description: "A single emerald-cut lab grown diamond, framed in a clean gold bezel. Minimal, modern and endlessly wearable.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Emerald cut", "Setting": "Bezel" }
  },

  /* ---------------- NECKLACES ---------------- */
  {
    code: "GNK-0021-L04", name: "Diamond Lariat Necklace", category: "Necklaces", featured: false, price: "",
    colour: "W", views: 3,
    short: "Mixed-shape diamonds ending in a graceful drop.",
    description: "Emerald-cut, oval and pear-shaped lab grown diamonds linked in a continuous line, finishing in an elegant drop at the centre. A statement for weddings and celebrations.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shapes": "Emerald, oval, pear", "Style": "Lariat drop" }
  },
  {
    code: "GNK-0029", name: "Fancy-Shape Station Necklace", category: "Necklaces", featured: false, price: "",
    colour: "Y", views: 3,
    short: "A necklace of alternating fancy-shape diamonds.",
    description: "Emerald-cut, square and oval lab grown diamonds alternate around the neck, linked by fine gold detailing — a modern take on the classic diamond necklace.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shapes": "Mixed fancy shapes", "Style": "Station necklace" }
  },
  {
    code: "GNK-0008", name: "Floral Cluster Necklace", category: "Necklaces", featured: false, price: "",
    colour: "R", views: 3,
    short: "Diamond flowers linked all the way around.",
    description: "A continuous chain of diamond flower clusters — each bloom formed from marquise and round lab grown diamonds. Feminine, festive and full of sparkle.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Motif": "Flower clusters", "Style": "Full necklace" }
  },
  {
    code: "GNK-0043-L04", name: "Classic Tennis Necklace", category: "Necklaces", featured: false, price: "",
    colour: "W", views: 3,
    short: "An unbroken line of brilliance.",
    description: "Round lab grown diamonds set one after another in an unbroken line of light. The iconic tennis necklace, made accessible.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Round brilliant", "Style": "Tennis necklace", "Clasp": "Box clasp" }
  },

  /* ---------------- BRACELETS ---------------- */
  {
    code: "SBWB-8", name: "Pavé Crossover Bangle", category: "Bracelets", featured: false, price: "",
    colour: "Y", views: 4,
    short: "A sleek bangle with a pavé crossover and centre diamond.",
    description: "A sleek hinged bangle that opens into a crossover of pavé diamonds around a centre stone. Polished, modern and easy to stack.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Style": "Hinged bangle", "Setting": "Pavé with centre stone" }
  },
  {
    code: "SBWB-24", name: "Halo Link Bracelet", category: "Bracelets", featured: true, price: "",
    colour: "R", views: 4,
    short: "Graduated halo diamonds linked on a fine chain.",
    description: "Pear, oval and round lab grown diamonds, each wrapped in a halo, graduate along a delicate bracelet. A piece that catches the light with every movement.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shapes": "Pear, oval, round", "Setting": "Halo links" }
  },
  {
    code: "GLBR-0022", name: "Wave Link Bracelet", category: "Bracelets", featured: false, price: "",
    colour: "W", views: 4,
    short: "Flowing gold waves cradling pear diamonds.",
    description: "Sculpted gold waves cradle pear-shaped lab grown diamonds in a flexible, flowing link bracelet — bold yet comfortable.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Pear", "Style": "Flexible link bracelet" }
  },
  {
    code: "SBWB-28", name: "Classic Tennis Bracelet", category: "Bracelets", featured: false, price: "",
    colour: "Y", views: 4,
    short: "The iconic tennis bracelet, reimagined responsibly.",
    description: "Flexible, secure and endlessly wearable — round lab grown diamonds set from clasp to clasp in the iconic tennis bracelet.",
    options: GOLD_PURITY,
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Round brilliant", "Style": "Tennis bracelet" }
  }
];
