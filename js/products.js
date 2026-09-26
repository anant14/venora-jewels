/* =========================================================
   VENORA JEWELS — PRODUCT CATALOGUE
   ---------------------------------------------------------
   Add, remove or edit products here. Each product gets its
   own page automatically (product.html?code=YOUR-CODE).

   code        unique product code (no spaces)
   name        product name
   category    Rings | Earrings | Necklaces | Bracelets | (any new name creates a new filter)
   featured    true = shown on the Home page
   price       e.g. "From ₹45,000" — leave "" to show "Price on request"
   short       one line shown on the product card
   description paragraph shown on the product page
   images      photos in images/products/, e.g. ["images/products/vr101-1.jpg", "images/products/vr101-2.jpg"]
               leave [] to show an illustration instead
   options     the variations a customer can choose (any names you like).
               All Venora designs come in hallmarked 9KT, 14KT & 18KT gold, in yellow, rose and white.
   details     specification table on the product page
   ========================================================= */
window.PRODUCTS = [
  {
    code: "VR-101",
    name: "Aurelia Solitaire Ring",
    category: "Rings",
    featured: true,
    price: "",
    short: "A single round brilliant on a slim, timeless band.",
    description: "The Aurelia is our purest expression of brilliance — a single lab grown diamond raised in a four-prong setting so light enters from every angle. A ring for the moment that matters.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Carat": ["0.50 ct", "0.75 ct", "1.00 ct", "1.50 ct", "2.00 ct"],
      "Shape": ["Round", "Oval", "Cushion", "Emerald"]
    },
    details: { "Diamond": "Lab grown, IGI certified", "Colour": "D – F", "Clarity": "VVS1 – VS1", "Setting": "4-prong solitaire", "Band width": "1.8 mm" }
  },
  {
    code: "VR-102",
    name: "Celeste Halo Ring",
    category: "Rings",
    featured: true,
    price: "",
    short: "An oval centre stone framed by a halo of pavé diamonds.",
    description: "A delicate halo of pavé diamonds makes the centre stone appear larger and brighter. The Celeste is designed for those who love sparkle from every angle.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Centre stone": ["1.00 ct", "1.50 ct", "2.00 ct"],
      "Shape": ["Oval", "Round", "Pear"]
    },
    details: { "Diamond": "Lab grown, IGI certified", "Colour": "E – F", "Clarity": "VS1+", "Setting": "Halo with pavé band", "Side stones": "approx. 0.40 ct total" }
  },
  {
    code: "VR-103",
    name: "Infinity Eternity Band",
    category: "Rings",
    featured: false,
    price: "",
    short: "Diamonds all the way around — a circle without end.",
    description: "Perfectly matched lab grown diamonds set shoulder-to-shoulder around the entire band. Wear it alone or stack it with your engagement ring.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Total carat": ["1.00 ct", "2.00 ct", "3.00 ct"],
      "Style": ["Full eternity", "Half eternity"]
    },
    details: { "Diamond": "Lab grown, IGI certified, matched set", "Colour": "F – G", "Clarity": "VS1+", "Setting": "Shared prong" }
  },
  {
    code: "VR-104",
    name: "Orion Men's Band",
    category: "Rings",
    featured: false,
    price: "",
    short: "A bold, brushed band with a flush-set diamond.",
    description: "Understated and strong. A single flush-set lab grown diamond sits within a brushed-finish band, made to be worn every day.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Carat": ["0.25 ct", "0.50 ct"],
      "Finish": ["Brushed", "Polished"]
    },
    details: { "Diamond": "Lab grown, IGI certified", "Setting": "Flush / gypsy", "Band width": "6 mm" }
  },
  {
    code: "VE-201",
    name: "Lumière Diamond Studs",
    category: "Earrings",
    featured: true,
    price: "",
    short: "Classic four-prong studs — the everyday essential.",
    description: "A matched pair of round lab grown diamonds in secure four-prong baskets. The earrings every jewellery box should begin with.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Total carat": ["0.50 ct", "1.00 ct", "1.50 ct", "2.00 ct"],
      "Back": ["Push back", "Screw back"]
    },
    details: { "Diamond": "Lab grown, IGI certified, matched pair", "Colour": "E – F", "Clarity": "VS1+", "Setting": "4-prong basket" }
  },
  {
    code: "VE-202",
    name: "Seraphine Drop Earrings",
    category: "Earrings",
    featured: false,
    price: "",
    short: "Pear-shaped drops that catch the light as you move.",
    description: "Graceful pear-shaped lab grown diamonds suspended beneath a small round stud. Elegant for evenings, effortless for celebrations.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Total carat": ["1.00 ct", "1.50 ct", "2.00 ct"]
    },
    details: { "Diamond": "Lab grown, IGI certified", "Shape": "Pear + round", "Drop length": "approx. 18 mm" }
  },
  {
    code: "VN-301",
    name: "Stella Solitaire Pendant",
    category: "Necklaces",
    featured: true,
    price: "",
    short: "A single diamond floating on a fine chain.",
    description: "Minimal and luminous. The Stella pendant holds one lab grown diamond on a fine cable chain — perfect alone or layered.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Carat": ["0.50 ct", "0.75 ct", "1.00 ct"],
      "Chain length": ["16 inch", "18 inch", "20 inch"]
    },
    details: { "Diamond": "Lab grown, IGI certified", "Colour": "E – F", "Clarity": "VS1+", "Chain": "Included" }
  },
  {
    code: "VN-302",
    name: "Riviera Tennis Necklace",
    category: "Necklaces",
    featured: false,
    price: "",
    short: "A continuous line of brilliance around the neck.",
    description: "Individually set lab grown diamonds, graduated for a seamless line of light. A statement piece for weddings and milestones.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Total carat": ["5.00 ct", "8.00 ct", "12.00 ct"]
    },
    details: { "Diamond": "Lab grown, IGI certified", "Setting": "4-prong links", "Clasp": "Box clasp with safety" }
  },
  {
    code: "VB-401",
    name: "Eterna Tennis Bracelet",
    category: "Bracelets",
    featured: true,
    price: "",
    short: "The iconic tennis bracelet, reimagined responsibly.",
    description: "Flexible, secure and endlessly wearable. The Eterna bracelet is set with matched round lab grown diamonds from clasp to clasp.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Total carat": ["2.00 ct", "3.00 ct", "5.00 ct"],
      "Length": ["6.5 inch", "7 inch", "7.5 inch"]
    },
    details: { "Diamond": "Lab grown, IGI certified, matched", "Setting": "4-prong", "Clasp": "Box clasp with double safety" }
  },
  {
    code: "VB-402",
    name: "Nova Bangle",
    category: "Bracelets",
    featured: false,
    price: "",
    short: "A slim open bangle with diamond-set ends.",
    description: "A modern open bangle finished with a lab grown diamond at each end. Light enough for everyday, special enough for occasions.",
    images: [],
    options: {
      "Gold": ["14KT", "18KT", "9KT"],
      "Gold colour": ["Yellow Gold", "Rose Gold", "White Gold"],
      "Size": ["2.2", "2.4", "2.6", "2.8"]
    },
    details: { "Diamond": "Lab grown, IGI certified, 0.30 ct total", "Style": "Open cuff bangle" }
  }
];
