/* Venora Jewels — login, customer profiles and catalogue access (Firebase).
   Loaded on every page as a module. Other scripts listen for the "venora-auth"
   event, or call window.VenoraAuth.ready() to get the current state. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy,
  serverTimestamp, Timestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// The two admin logins. Must match the list in firestore.rules.
export const ADMINS = ["jewelsvenora@gmail.com", "anantbansal2696@gmail.com"];

const app = initializeApp(window.FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, serverTimestamp, Timestamp, writeBatch };

const isAdminUser = u => !!u && u.emailVerified && ADMINS.includes((u.email || "").toLowerCase());
const toDate = t => (t && typeof t.toDate === "function" ? t.toDate() : t ? new Date(t) : null);

/** Is a {enabled, until} switch / an access grant currently active? */
export function isActive(rec) {
  if (!rec) return false;
  if (rec.enabled === false) return false;
  const until = toDate(rec.until);
  return !until || until > new Date();
}

export async function login() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      throw e;
    }
  }
}
export const logout = () => signOut(auth);

/** Load everything the current visitor is allowed to see. */
async function loadState(user) {
  const state = { user, isAdmin: isAdminUser(user), profile: null, catalogue: null, access: null, sets: [] };
  if (!user) return state;
  const safe = p => p.catch(() => null);
  const [profileSnap, catSnap, accessSnap] = await Promise.all([
    safe(getDoc(doc(db, "customers", user.uid))),
    safe(getDoc(doc(db, "settings", "catalogue"))),
    safe(getDoc(doc(db, "access", user.uid)))
  ]);
  state.profile = profileSnap && profileSnap.exists() ? profileSnap.data() : null;
  state.catalogue = catSnap && catSnap.exists() ? catSnap.data() : { enabled: false };
  state.access = accessSnap && accessSnap.exists() ? accessSnap.data() : null;
  state.catalogueOpen = state.isAdmin || isActive(state.catalogue);
  if (state.access && isActive(state.access)) {
    const snaps = await Promise.all((state.access.sets || []).map(id => safe(getDoc(doc(db, "sets", id)))));
    state.sets = snaps.filter(s => s && s.exists()).map(s => ({ id: s.id, ...s.data() }));
  }
  return state;
}

/** Member catalogue items (only readable while the catalogue is open, or by admins). */
export async function loadCatalogue() {
  try {
    const snap = await getDocs(collection(db, "catalogue"));
    return snap.docs.map(d => d.data()).sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    return [];
  }
}

let current = null;
let resolveReady;
const readyPromise = new Promise(r => { resolveReady = r; });

async function publish(user) {
  current = await loadState(user);
  if (user) {
    // record last visit (ignored if the profile doesn't exist yet)
    if (current.profile) updateDoc(doc(db, "customers", user.uid), { lastLoginAt: serverTimestamp() }).catch(() => {});
  }
  updateHeader(current);
  resolveReady(current);
  document.dispatchEvent(new CustomEvent("venora-auth", { detail: current }));
}

export async function refresh() { await publish(auth.currentUser); return current; }
export const ready = () => readyPromise;

onAuthStateChanged(auth, publish);

/* Header: "Login" link, or the customer's name, on every page */
function updateHeader(state) {
  const header = document.getElementById("site-header");
  if (!header) return;
  let link = header.querySelector(".nav-account");
  if (!link) {
    link = document.createElement("a");
    link.className = "nav-account";
    const insta = header.querySelector(".nav-insta") || header.querySelector(".nav-cta");
    insta.parentNode.insertBefore(link, insta);
  }
  const icon = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
  if (!state.user) {
    link.href = "account.html";
    link.innerHTML = `${icon}<span>Login</span>`;
  } else {
    const first = ((state.profile && state.profile.name) || state.user.displayName || "Account").split(" ")[0];
    link.href = state.isAdmin ? "admin.html" : "account.html";
    link.innerHTML = `${icon}<span>${state.isAdmin ? "Admin" : first.replace(/[<>&"]/g, "")}</span>`;
  }
}

window.VenoraAuth = { ready, login, logout, refresh, isActive, loadCatalogue, ADMINS };
