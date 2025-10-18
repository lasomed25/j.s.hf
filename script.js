// script.js - role-enabled version
// Admin: lasomed@gmail.com
// Teacher: las@teach.com
// NOTE: create those users in Firebase Console -> Authentication (passwords you set)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, setDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---------- CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyCWGtP9r-jEbUzdUzOMUcKURiAp8BHHNR4",
  authDomain: "study-dashboard-d6ee1.firebaseapp.com",
  projectId: "study-dashboard-d6ee1",
  storageBucket: "study-dashboard-d6ee1.firebasestorage.app",
  messagingSenderId: "869698439345",
  appId: "1:869698439345:web:8e474c1b27221944b6ba90"
};

const ADMIN_EMAIL = "lasomed@gmail.com";
const TEACHER_EMAIL = "las@teach.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- LOGIN ----------
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    const errEl = document.getElementById("errorMsg");
    errEl && (errEl.textContent = "");
    const email = emailEl?.value?.trim() || "";
    const password = passEl?.value?.trim() || "";
    if (!email || !password) {
      if (errEl) errEl.textContent = "Fill email & password";
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (e) {
      if (errEl) errEl.textContent = "Login failed: " + (e.message || e);
      else alert("Login failed");
    }
  });
}

// ---------- AUTH STATE & ROLE HANDLING ----------
onAuthStateChanged(auth, async (user) => {
  // redirect to login if not authenticated and on dashboard
  if (window.location.pathname.endsWith("dashboard.html") && !user) {
    window.location.href = "index.html";
    return;
  }

  if (!user) return;

  // determine role
  let role = "student";
  if (user.email === ADMIN_EMAIL) role = "admin";
  else if (user.email === TEACHER_EMAIL) role = "teacher";

  // write/update user doc for teacher/admin listing
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role,
      lastSeen: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Failed to write user doc:", err);
  }

  // if on dashboard, init UI with role
  if (window.location.pathname.endsWith("dashboard.html")) {
    initDashboard(user, role);
  }
});

// ---------- DASHBOARD INIT ----------
function initDashboard(user, role) {
  const welcome = document.getElementById("welcomeMessage");
  if (welcome) {
    const name = user.email ? user.email.split("@")[0] : "User";
    welcome.textContent = `Welcome, ${name}! (${role})`;
  }

  // init assignments with role permissions
  initAssignments(role);

  // if teacher or admin — load students list UI
  if (role === "teacher" || role === "admin") {
    showStudentsPanel();
  } else {
    hideStudentsPanel();
  }
}

// ---------- ASSIGNMENTS (real-time) ----------
function initAssignments(role) {
  const addBtn = document.getElementById("addAssignmentBtn");
  const input = document.getElementById("assignmentInput");
  const list = document.getElementById("assignmentList");
  if (!list) return;

  // real-time listener for assignments collection
  onSnapshot(collection(db, "assignments"), (snapshot) => {
    list.innerHTML = "";
    snapshot.forEach(snap => {
      const data = snap.data() || {};
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.gap = "12px";

      const textSpan = document.createElement("span");
      textSpan.textContent = data.text || "—";
      li.appendChild(textSpan);

      // show who created it (if present)
      if (data.createdBy) {
        const bySpan = document.createElement("small");
        bySpan.style.opacity = "0.7";
        bySpan.textContent = `by ${data.createdBy.split("@")[0]}`;
        bySpan.style.marginLeft = "10px";
        li.appendChild(bySpan);
      }

      // delete allowed for admin and teacher
      if (role === "admin" || role === "teacher") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.style.marginLeft = "12px";
        deleteBtn.onclick = async () => {
          try {
            await deleteDoc(doc(db, "assignments", snap.id));
          } catch (err) {
            console.error("Delete failed", err);
            alert("Delete failed");
          }
        };
        li.appendChild(deleteBtn);
      }

      list.appendChild(li);
    });
  });

  // add assignment (everyone)
  if (addBtn && input) {
    addBtn.onclick = async () => {
      const text = input.value?.trim();
      if (!text) return;
      try {
        await addDoc(collection(db, "assignments"), {
          text,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser?.email || null
        });
        input.value = "";
      } catch (err) {
        console.error("Add assignment failed", err);
        alert("Failed to add");
      }
    };
  }
}

// ---------- STUDENTS PANEL (for teacher/admin) ----------
let studentsPanelEl = null;
async function showStudentsPanel() {
  // ensure panel exists
  if (studentsPanelEl) { studentsPanelEl.style.display = "block"; return; }

  const main = document.querySelector("main");
  if (!main) return;

  studentsPanelEl = document.createElement("div");
  studentsPanelEl.id = "studentsPanel";
  studentsPanelEl.style.marginTop = "18px";
  studentsPanelEl.style.padding = "12px";
  studentsPanelEl.style.borderTop = "1px solid rgba(0,0,0,0.06)";

  const title = document.createElement("h4");
  title.textContent = "Students (all users)";
  studentsPanelEl.appendChild(title);

  const list = document.createElement("ul");
  list.style.listStyle = "none";
  list.style.padding = "0";
  studentsPanelEl.appendChild(list);

  main.appendChild(studentsPanelEl);

  // load initial list and listen for changes (simple polling here)
  const loadUsers = async () => {
    list.innerHTML = "";
    try {
      const snaps = await getDocs(collection(db, "users"));
      snaps.forEach(snap => {
        const d = snap.data();
        const item = document.createElement("li");
        item.style.padding = "6px 0";
        item.textContent = `${d.email} — ${d.role || "student"}`;
        list.appendChild(item);
      });
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  // initial
  loadUsers();

  // poll every 6 seconds so teacher sees updates (simple approach without adding a Firestore listener)
  studentsPanelEl._poll = setInterval(loadUsers, 6000);
}

function hideStudentsPanel() {
  if (!studentsPanelEl) return;
  studentsPanelEl.style.display = "none";
  if (studentsPanelEl._poll) clearInterval(studentsPanelEl._poll);
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
