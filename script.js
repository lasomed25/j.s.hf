// Note: ADMIN account to use on site: lasomed@gmail.com  (password: 123456)
// You must create this user in Firebase Console -> Authentication -> Add user
// (The code below will treat that email as admin)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// --- Firebase config (your existing project)
const firebaseConfig = {
  apiKey: "AIzaSyCWGtP9r-jEbUzdUzOMUcKURiAp8BHHNR4",
  authDomain: "study-dashboard-d6ee1.firebaseapp.com",
  projectId: "study-dashboard-d6ee1",
  storageBucket: "study-dashboard-d6ee1.firebasestorage.app",
  messagingSenderId: "869698439345",
  appId: "1:869698439345:web:8e474c1b27221944b6ba90"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "lasomed@gmail.com"; // admin account email

// ---------- LOGIN ----------
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errEl = document.getElementById("errorMsg");
    errEl.textContent = "";
    if (!email || !password) { errEl.textContent = "Fill email & password"; return; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (e) {
      errEl.textContent = "Login failed: " + (e.message || e);
    }
  });
}

// ---------- AUTH STATE ----------
onAuthStateChanged(auth, (user) => {
  // if on dashboard page and not logged in -> redirect to login
  if (window.location.pathname.endsWith("dashboard.html") && !user) {
    window.location.href = "index.html";
    return;
  }

  // If on dashboard, update welcome and initialize features
  if (user && window.location.pathname.endsWith("dashboard.html")) {
    const welcome = document.getElementById("welcomeMessage");
    if (welcome) {
      const name = user.email ? user.email.split("@")[0] : "User";
      welcome.textContent = `Welcome, ${name}!`;
    }
    initAssignments(user);
  }
});

// ---------- ASSIGNMENTS (shared) ----------
function initAssignments(user) {
  const addBtn = document.getElementById("addAssignmentBtn");
  const input = document.getElementById("assignmentInput");
  const list = document.getElementById("assignmentList");

  if (!addBtn || !input || !list) return;

  // real-time listener
  onSnapshot(collection(db, "assignments"), (snapshot) => {
    list.innerHTML = "";
    snapshot.forEach(snap => {
      const data = snap.data();
      const li = document.createElement("li");
      li.textContent = data.text || "—";
      // delete button visible only to admin
      if (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL) {
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.style.marginLeft = "12px";
        del.onclick = async () => {
          await deleteDoc(doc(db, "assignments", snap.id));
        };
        li.appendChild(del);
      }
      list.appendChild(li);
    });
  });

  addBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;
    await addDoc(collection(db, "assignments"), { text, createdAt: new Date().toISOString() });
    input.value = "";
  };
}

// ---------- MENU TOGGLE ----------
const menuBtn = document.getElementById("menuBtn");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    const el = document.querySelector(".menu");
    if (el) el.classList.toggle("open");
  });
  window.addEventListener("click", (e) => {
    const menu = document.querySelector(".menu");
    const dropdown = document.querySelector(".dropdown");
    if (!menu) return;
    if (!menu.contains(e.target)) menu.classList.remove("open");
  });
}

// ---------- SECTION SWITCH ----------
const assignmentsBtn = document.getElementById("assignmentsBtn");
const progressBtn = document.getElementById("progressBtn");
const notesBtn = document.getElementById("notesBtn");
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}
if (assignmentsBtn) assignmentsBtn.addEventListener("click", () => showSection("assignmentsSection"));
if (progressBtn) progressBtn.addEventListener("click", () => showSection("progressSection"));
if (notesBtn) notesBtn.addEventListener("click", () => showSection("notesSection"));

// ---------- THEME ----------
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
}

// ---------- LOGOUT ----------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
