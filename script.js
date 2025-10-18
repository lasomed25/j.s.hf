// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDX-vhE4mvPoDN3SMTUI2dQ6OgbSnC5zA8",
  authDomain: "study-dashboard-app.firebaseapp.com",
  projectId: "study-dashboard-app",
  storageBucket: "study-dashboard-app.appspot.com",
  messagingSenderId: "1029384756",
  appId: "1:1029384756:web:example123"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// LOGIN + SIGNUP
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = "dashboard.html")
      .catch(err => document.getElementById("errorMsg").innerText = err.message);
  });
}

if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = "dashboard.html")
      .catch(err => document.getElementById("errorMsg").innerText = err.message);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "index.html");
  });
}

// KEEP LOGIN STATE
onAuthStateChanged(auth, (user) => {
  if (window.location.pathname.endsWith("dashboard.html") && !user) {
    window.location.href = "index.html";
  }
});

// DROPDOWN MENU
const menuBtn = document.getElementById("menuBtn");
const dropdown = document.querySelector(".dropdown");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });
  window.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = "none";
  });
}

// THEME TOGGLE
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });
}

// SECTIONS SWITCH
const assignmentsBtn = document.getElementById("assignmentsBtn");
const progressBtn = document.getElementById("progressBtn");
const notesBtn = document.getElementById("notesBtn");

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

if (assignmentsBtn) assignmentsBtn.addEventListener("click", () => showSection("assignmentsSection"));
if (progressBtn) progressBtn.addEventListener("click", () => showSection("progressSection"));
if (notesBtn) notesBtn.addEventListener("click", () => showSection("notesSection"));
