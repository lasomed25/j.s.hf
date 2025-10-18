import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ===== LOGIN =====
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Invalid credentials or account not found.");
    }
  });
}

// ===== DASHBOARD =====
const addAssignmentBtn = document.getElementById("addAssignmentBtn");
if (addAssignmentBtn) {
  const assignmentList = document.getElementById("assignmentList");
  const welcomeMessage = document.getElementById("welcomeMessage");

  async function loadAssignments() {
    assignmentList.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "assignments"));
    querySnapshot.forEach((docSnap) => {
      const li = document.createElement("li");
      li.textContent = docSnap.data().text;
      assignmentList.appendChild(li);
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const username = user.email.split("@")[0];
      welcomeMessage.textContent = `Welcome, ${username}!`;
      loadAssignments();
    } else {
      window.location.href = "index.html";
    }
  });

  addAssignmentBtn.addEventListener("click", async () => {
    const input = document.getElementById("assignmentInput");
    if (input.value.trim() !== "") {
      await addDoc(collection(db, "assignments"), { text: input.value });
      input.value = "";
      loadAssignments();
    }
  });
}

// ===== MENU + THEME + LOGOUT =====
const menuBtn = document.getElementById("menuBtn");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    document.querySelector(".menu").classList.toggle("open");
  });
}

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
