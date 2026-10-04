/* Venora Jewels — virtual try-on.
   Live camera (face / hand tracking with Google MediaPipe) or a photo, with the
   jewellery photo from R2 drawn on top. Everything runs in the visitor's browser:
   no camera frames or photos are uploaded anywhere. */
import { FilesetResolver, FaceLandmarker, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODELS = {
  face: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  hand: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
};
// R2 category folder -> where the piece is worn
const BODY = {
  earrings: "ears", pendants: "neck", necklaces: "neck", "mangal-sutra": "neck", "cuban-chain": "neck",
  "ladies-rings": "finger", "mens-rings": "finger", bracelets: "wrist", "mens-bracelets": "wrist"
};
const HINT = {
  ears: "Face the camera with your ears visible. Turn your head slowly to see each side.",
  neck: "Face the camera and keep your neck and shoulders in view.",
  finger: "Hold your hand up, palm facing away from the camera, fingers spread.",
  wrist: "Hold your hand up with your wrist in view."
};

const { esc, waLink, ICON, COLOURS, colourCodes, photo, thumbPhoto } = window.Venora;
const $ = id => document.getElementById(id);

/* ---------- which product ---------- */
const params = new URLSearchParams(location.search);
const code = params.get("code");
let product = window.PRODUCTS.find(p => p.code === code);
try {
  const stashed = JSON.parse(sessionStorage.getItem("venora-tryon") || "null");
  if (!product && stashed && stashed.code === code) product = stashed;
} catch (e) { /* storage unavailable */ }

if (!product) {
  $("tryon").innerHTML = `<div class="empty"><h1>Design not found</h1><p>Open a design and tap "Try it on".</p><a class="btn btn-dark" href="collections.html">View Collections</a></div>`;
  throw new Error("no product");
}

const folder = product.folder || { Earrings: "earrings", Rings: "ladies-rings", Pendants: "pendants", Necklaces: "necklaces", Bracelets: "bracelets" }[product.category];
const body = BODY[folder] || "neck";
const colours = colourCodes(product);
let colour = colours.includes(params.get("colour")) ? params.get("colour") : (colours.includes(product.colour) ? product.colour : colours[0]);
// default photo angle: earrings and rings are usually shot front-on last; necklaces lie flat in view 1
let view = body === "ears" || body === "finger" ? product.views : (folder === "necklaces" ? Math.min(2, product.views) : 1);

/* ---------- state ---------- */
const state = { mode: "live", scale: 1, rotate: 0, dx: 0, dy: 0 };
let overlay = null;          // { whole, left, right } trimmed canvases of the jewellery
let face = null, hand = null, stream = null, photoImg = null, raf = 0;
let smooth = null;           // smoothed placement for live video
const canvas = $("stage"), ctx = canvas.getContext("2d");

/* ---------- UI ---------- */
document.title = `Try on ${product.name} | Venora Jewels`;
$("tName").textContent = product.name;
$("tCode").textContent = "Design code: " + product.code;
$("tHint").textContent = HINT[body];
$("backLink").href = "product.html?code=" + encodeURIComponent(product.code) + (colour ? "&colour=" + colour : "");

function renderPickers() {
  $("tColours").innerHTML = colours.map(c => `<button type="button" data-c="${c}" class="${c === colour ? "active" : ""}"><i class="dot dot-${c.toLowerCase()}"></i>${COLOURS[c]}</button>`).join("");
  const n = colour ? product.views : 1;
  $("tViews").innerHTML = Array.from({ length: n }, (_, i) =>
    `<button type="button" data-v="${i + 1}" class="${i + 1 === view ? "active" : ""}" title="Photo angle ${i + 1}"><img src="${thumbPhoto(product, colour, i + 1)}" alt="Angle ${i + 1}"></button>`).join("");
  $("tEnquire").href = waLink(`Hello Venora Jewels, I tried on "${product.name}" (Code: ${product.code})${colour ? " in " + COLOURS[colour] : ""} on your website. Please share price and details.`);
}
$("tColours").onclick = e => { const b = e.target.closest("button"); if (b) { colour = b.dataset.c; renderPickers(); loadOverlay(); } };
$("tViews").onclick = e => { const b = e.target.closest("button"); if (b) { view = +b.dataset.v; renderPickers(); loadOverlay(); } };
$("tSize").oninput = e => { state.scale = +e.target.value; draw(); };
$("tRotate").oninput = e => { state.rotate = +e.target.value; draw(); };
$("tReset").onclick = e => { e.preventDefault(); Object.assign(state, { scale: 1, rotate: 0, dx: 0, dy: 0 }); $("tSize").value = 1; $("tRotate").value = 0; draw(); };
document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
$("tFile").onchange = e => { const f = e.target.files[0]; if (f) usePhoto(f); };
$("tSave").onclick = savePhoto;
renderPickers();

let statusTimer = 0;
function status(msg, keep) {
  clearTimeout(statusTimer);
  $("tStatus").textContent = msg || ""; $("tStatus").hidden = !msg;
  if (msg && !keep && !/…$/.test(msg)) statusTimer = setTimeout(() => { $("tStatus").hidden = true; }, 5000);
}

/* ---------- jewellery image: trim transparent edges; split earring pairs ---------- */
function trim(img, sx = 0, sw = img.naturalWidth) {
  const c = document.createElement("canvas");
  c.width = sw; c.height = img.naturalHeight;
  const g = c.getContext("2d");
  g.drawImage(img, sx, 0, sw, img.naturalHeight, 0, 0, sw, img.naturalHeight);
  const pixels = g.getImageData(0, 0, c.width, c.height);
  const { data, width, height } = pixels;
  // some photos have a plain white background instead of transparency: key out the white
  if (data[3] === 255 && data[(width * height - 1) * 4 + 3] === 255) {
    for (let i = 0; i < data.length; i += 4) {
      const m = Math.min(data[i], data[i + 1], data[i + 2]);
      if (m > 238) data[i + 3] = 0;
      else if (m > 215) data[i + 3] = Math.round((238 - m) / 23 * 255);
    }
    g.putImageData(pixels, 0, 0);
  }
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    if (data[(y * width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
function loadOverlay() {
  status("Loading jewellery…");
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const half = Math.floor(img.naturalWidth / 2);
      overlay = { whole: trim(img), left: body === "ears" ? trim(img, 0, half) : null, right: body === "ears" ? trim(img, half, img.naturalWidth - half) : null };
      status(""); draw();
    } catch (e) { status("Could not prepare this photo for try-on."); }
  };
  img.onerror = () => status("Could not load the jewellery photo.");
  img.src = photo(product, colour, view);
}
loadOverlay();

/* ---------- trackers ---------- */
async function trackers(runningMode) {
  const vision = await FilesetResolver.forVisionTasks(MP);
  if (body === "ears" || body === "neck") {
    if (!face) face = await FaceLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODELS.face, delegate: "GPU" }, runningMode, numFaces: 1 });
    else await face.setOptions({ runningMode });
  } else {
    if (!hand) hand = await HandLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODELS.hand, delegate: "GPU" }, runningMode, numHands: 1 });
    else await hand.setOptions({ runningMode });
  }
}

/* ---------- where to draw, from landmarks (pixel units) ---------- */
const P = (lm, i, W, H) => ({ x: lm[i].x * W, y: lm[i].y * H });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function place(lm, W, H) {
  if (body === "ears" || body === "neck") {
    const top = P(lm, 10, W, H), chin = P(lm, 152, W, H), l = P(lm, 234, W, H), r = P(lm, 454, W, H), nose = P(lm, 1, W, H);
    const faceW = dist(l, r), faceH = dist(top, chin);
    const tilt = Math.atan2(r.y - l.y, r.x - l.x);
    if (body === "ears") {
      const lj = P(lm, 132, W, H), rj = P(lm, 361, W, H);
      const yaw = (nose.x - l.x) / (r.x - l.x);   // 0.5 = facing camera
      const out = faceW * 0.065;
      const ls = lerp(l, lj, 0.55), rs = lerp(r, rj, 0.55);
      return { kind: "ears", size: faceW * 0.15, tilt,
               left: { x: ls.x - out, y: ls.y, show: yaw > 0.3 }, right: { x: rs.x + out, y: rs.y, show: yaw < 0.7 } };
    }
    const neck = { x: chin.x, y: chin.y + faceH * 0.18 };
    return { kind: "neck", x: neck.x, y: neck.y, size: faceW * (folder === "pendants" ? 1.35 : 1.6), tilt };
  }
  const wrist = P(lm, 0, W, H), m9 = P(lm, 9, W, H), m13 = P(lm, 13, W, H), p14 = P(lm, 14, W, H), i5 = P(lm, 5, W, H), k17 = P(lm, 17, W, H);
  if (body === "finger") {
    const at = lerp(m13, p14, 0.42);
    return { kind: "finger", x: at.x, y: at.y, size: dist(m9, m13) * 0.95, tilt: Math.atan2(p14.y - m13.y, p14.x - m13.x) + Math.PI / 2 };
  }
  const at = lerp(wrist, m9, -0.08);
  return { kind: "wrist", x: at.x, y: at.y, size: dist(i5, k17) * 1.45, tilt: Math.atan2(m9.y - wrist.y, m9.x - wrist.x) + Math.PI / 2 };
}

function smoothPlace(p) {
  if (!smooth || smooth.kind !== p.kind) return (smooth = p);
  const k = 0.45, mix = (a, b) => a + (b - a) * k;
  const s = { ...p, size: mix(smooth.size, p.size), tilt: mix(smooth.tilt, p.tilt) };
  if (p.kind === "ears") {
    s.left = { ...p.left, x: mix(smooth.left.x, p.left.x), y: mix(smooth.left.y, p.left.y) };
    s.right = { ...p.right, x: mix(smooth.right.x, p.right.x), y: mix(smooth.right.y, p.right.y) };
  } else { s.x = mix(smooth.x, p.x); s.y = mix(smooth.y, p.y); }
  return (smooth = s);
}

/* ---------- drawing ---------- */
let lastPlace = null;
function drawPiece(img, x, y, w, angle, anchorTop) {
  if (!img) return;
  const h = w * img.height / img.width;
  ctx.save();
  ctx.translate(x + state.dx, y + state.dy);
  ctx.rotate(angle + state.rotate * Math.PI / 180);
  ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = w * 0.04; ctx.shadowOffsetY = w * 0.02;
  ctx.drawImage(img, -w / 2, anchorTop ? 0 : -h / 2, w, h);
  ctx.restore();
}
function draw() {
  const src = state.mode === "live" ? $("tVideo") : photoImg;
  if (!src) return;
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  const p = lastPlace;
  if (!p || !overlay) return;
  const s = state.scale;
  if (p.kind === "ears") {
    // image is mirrored on screen, so the viewer's left earring goes on the subject's right ear
    if (p.left.show) drawPiece(overlay.left || overlay.whole, p.left.x, p.left.y, p.size * s, p.tilt, true);
    if (p.right.show) drawPiece(overlay.right || overlay.whole, p.right.x, p.right.y, p.size * s, p.tilt, true);
  } else {
    drawPiece(overlay.whole, p.x, p.y, p.size * s, p.tilt, p.kind === "neck");
  }
}

/* ---------- live camera ---------- */
async function startLive() {
  stopLive();
  status("Starting camera… please allow camera access.");
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: body === "finger" || body === "wrist" ? "environment" : "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  } catch (e) {
    status("Camera not available. You can use a photo instead.");
    return setMode("photo");
  }
  const video = $("tVideo");
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.classList.toggle("mirror", body === "ears" || body === "neck");
  status("Loading tracking… (first time takes a few seconds)");
  await trackers("VIDEO");
  status("");
  smooth = null;
  const loop = () => {
    if (state.mode !== "live" || !stream) return;
    const now = performance.now();
    const res = body === "ears" || body === "neck" ? face.detectForVideo(video, now) : hand.detectForVideo(video, now);
    const lm = (res.faceLandmarks || res.landmarks || [])[0];
    lastPlace = lm ? smoothPlace(place(lm, canvas.width, canvas.height)) : null;
    $("tLost").hidden = !!lm;
    draw();
    raf = requestAnimationFrame(loop);
  };
  loop();
}
function stopLive() {
  cancelAnimationFrame(raf);
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
}

/* ---------- photo mode ---------- */
async function usePhoto(file) {
  const url = URL.createObjectURL(file);
  photoImg = new Image();
  photoImg.onload = async () => {
    const max = 1600, k = Math.min(1, max / Math.max(photoImg.naturalWidth, photoImg.naturalHeight));
    canvas.width = Math.round(photoImg.naturalWidth * k); canvas.height = Math.round(photoImg.naturalHeight * k);
    canvas.classList.remove("mirror");
    $("tPhotoEmpty").hidden = true;
    status("Finding the best spot…");
    try {
      await trackers("IMAGE");
      const res = body === "ears" || body === "neck" ? face.detect(photoImg) : hand.detect(photoImg);
      const lm = (res.faceLandmarks || res.landmarks || [])[0];
      lastPlace = lm ? place(lm, canvas.width, canvas.height) : null;
      status(lm ? "Drag to adjust. Use the sliders to resize or rotate." : "Couldn't find a " + (body === "ears" || body === "neck" ? "face" : "hand") + " — drag the jewellery into place.");
    } catch (e) { lastPlace = null; status("Drag the jewellery into place."); }
    if (!lastPlace) lastPlace = { kind: body === "ears" ? "neck" : body, x: canvas.width / 2, y: canvas.height / 3, size: canvas.width * 0.3, tilt: 0 };
    Object.assign(state, { dx: 0, dy: 0 });
    draw();
  };
  photoImg.src = url;
}

/* drag to move (both modes) */
let dragFrom = null;
canvas.addEventListener("pointerdown", e => { dragFrom = { x: e.clientX, y: e.clientY, dx: state.dx, dy: state.dy }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", e => {
  if (!dragFrom) return;
  const r = canvas.getBoundingClientRect(), k = canvas.width / r.width;
  const mirror = canvas.classList.contains("mirror") ? -1 : 1;
  state.dx = dragFrom.dx + (e.clientX - dragFrom.x) * k * mirror;
  state.dy = dragFrom.dy + (e.clientY - dragFrom.y) * k;
  if (state.mode === "photo") draw();
});
canvas.addEventListener("pointerup", () => { dragFrom = null; });

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  $("tPhotoBar").hidden = mode !== "photo";
  $("tLost").hidden = true;
  $("tStart").hidden = true;
  if (mode === "live") { photoImg = null; $("tPhotoEmpty").hidden = true; startLive(); }
  else {
    stopLive(); lastPlace = null; status("");
    if (!photoImg) { ctx.clearRect(0, 0, canvas.width, canvas.height); $("tPhotoEmpty").hidden = false; }
  }
}

/* ---------- save ---------- */
function savePhoto() {
  const out = document.createElement("canvas");
  out.width = canvas.width; out.height = canvas.height;
  const g = out.getContext("2d");
  if (canvas.classList.contains("mirror")) { g.translate(out.width, 0); g.scale(-1, 1); }
  g.drawImage(canvas, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "rgba(47,7,25,.75)"; g.fillRect(0, out.height - 44, out.width, 44);
  g.fillStyle = "#f6ecdf"; g.font = "500 20px Jost, sans-serif";
  g.fillText(`VENORA JEWELS · ${product.name} · ${product.code}`, 16, out.height - 16);
  out.toBlob(b => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = `venora-tryon-${product.code}.png`; a.click();
  }, "image/png");
}

window.addEventListener("pagehide", stopLive);
// wait for the visitor to choose: no camera prompt until they ask for it
state.mode = "idle";
$("tStart").hidden = false;
$("tStartCam").onclick = () => { $("tStart").hidden = true; setMode("live"); };
$("tStartPhoto").onclick = () => { $("tStart").hidden = true; setMode("photo"); $("tFile").click(); };
if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) $("tStartCam").hidden = true;
