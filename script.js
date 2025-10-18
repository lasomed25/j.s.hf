// ====== Firebase Setup ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ====== Your Firebase Config ======
const firebaseConfig = {
  apiKey: "AIzaSyCWGtP9r-jEbUzdUzOMUcKURiAp8BHHNR4",
  authDomain: "study-dashboard-d6ee1.firebaseapp.com",
  projectId: "study-dashboard-d6ee1",
  storageBucket: "study-dashboard-d6ee1.firebasestorage.app",
  messagingSenderId: "869698439345",
  appId: "1:869698439345:web:8e474c1b27221944b6ba90"
};

// ====== Initialize Firebase ======
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ====== Login Page ======
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) return alert("Please fill all fields.");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Invalid email or password");
      console.error(err);
    }
  });
}

// ====== Auth State ======
onAuthStateChanged(auth, (user) => {
  if (user) {
    const emailDisplay = document.getElementById("user-email");
    if (emailDisplay) emailDisplay.textContent = user.email;
  }
});

// ====== Logout ======
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// ====== Menu Logic ======
const menuIcon = document.getElementById("menu-icon");
const menuItems = document.getElementById("menu-items");

if (menuIcon && menuItems) {
  menuIcon.addEventListener("click", () => {
    menuItems.classList.toggle("active");
  });
}

// ====== Dark/Light Mode ======
const themeBtn = document.getElementById("theme-btn");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const mode = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", mode);
  });

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark");
}

// ====== Dashboard / Assignments ======
const addBtn = document.getElementById("add-assignment-btn");
const listDiv = document.getElementById("assignment-list");

if (addBtn && listDiv) {
  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ addDoc, collection, onSnapshot, deleteDoc, doc }) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "index.html";
      } else {
        const userEmail = user.email;

        // Load assignments
        onSnapshot(collection(db, "assignments"), (snapshot) => {
          listDiv.innerHTML = "";
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement("div");
            div.className = "assignment-card";
            div.innerHTML = `
              <h3>${data.title}</h3>
              <p>${data.desc}</p>
              <small>By: ${data.user}</small>
              ${userEmail === "dr.lasomed@gmail.com" ? `<button data-id="${docSnap.id}" class="delete-btn">🗑️ Delete</button>` : ""}
            `;
            listDiv.appendChild(div);
          });

          // Delete
          if (userEmail === "dr.lasomed@gmail.com") {
            document.querySelectorAll(".delete-btn").forEach((btn) => {
              btn.addEventListener("click", async (e) => {
                await deleteDoc(doc(db, "assignments", e.target.dataset.id));
              });
            });
          }
        });

        // Add assignment
        addBtn.addEventListener("click", async () => {
          const title = document.getElementById("assignment-title").value.trim();
          const desc = document.getElementById("assignment-desc").value.trim();
          if (!title || !desc) return alert("Please fill both fields.");

          await addDoc(collection(db, "assignments"), {
            title,
            desc,
            user: userEmail,
            time: new Date().toISOString()
          });

          document.getElementById("assignment-title").value = "";
          document.getElementById("assignment-desc").value = "";
        });
      }
    });
  });
}
