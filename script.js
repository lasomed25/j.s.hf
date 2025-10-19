// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase config
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

// Admin and Teacher setup
const adminEmail = "lasomed@gmail.com";
const teacherEmail = "las@teach.com";

// Login page
if (document.getElementById("loginBtn")) {
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });
}

// Dashboard page
onAuthStateChanged(auth, async (user) => {
  if (document.getElementById("logoutBtn")) {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const email = user.email;
    const welcomeText = document.getElementById("welcomeText");
    const roleText = document.getElementById("roleText");
    const assignmentSection = document.getElementById("assignments-section");
    const addAssignmentDiv = document.getElementById("add-assignment");
    const gradesSection = document.getElementById("grades-section");
    const gradesContainer = document.getElementById("grades-container");
    const progressText = document.getElementById("progressText");

    // Determine role
    let role = "Student";
    if (email === adminEmail) role = "Admin";
    else if (email === teacherEmail) role = "Teacher";

    welcomeText.textContent = `Welcome, ${email.split("@")[0]}!`;
    roleText.textContent = `Role: ${role}`;

    assignmentSection.classList.remove("hidden");
    gradesSection.classList.remove("hidden");
    progressText.textContent = "Your learning progress is at 75%! Keep going 💪";

    // Load assignments
    const assignmentsList = document.getElementById("assignments-list");
    assignmentsList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "assignments"));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.classList.add("assignment-item");
      div.innerHTML = `<h4>${data.title}</h4><p>${data.desc}</p>`;
      if (role === "Admin" || role === "Teacher") {
        const delBtn = document.createElement("button");
        delBtn.textContent = "❌ Delete";
        delBtn.addEventListener("click", async () => {
          await setDoc(doc(db, "assignments", docSnap.id), {}, { merge: false });
          alert("Assignment deleted!");
          location.reload();
        });
        div.appendChild(delBtn);
      }
      assignmentsList.appendChild(div);
    });

    // Add assignments
    if (role === "Admin" || role === "Teacher") {
      addAssignmentDiv.classList.remove("hidden");
      document
        .getElementById("addAssignmentBtn")
        .addEventListener("click", async () => {
          const title = document.getElementById("assignmentTitle").value;
          const desc = document.getElementById("assignmentDesc").value;
          if (!title) return alert("Please enter a title.");
          await addDoc(collection(db, "assignments"), { title, desc });
          alert("Assignment added!");
          location.reload();
        });
    }

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });

    // Dark mode
    const toggle = document.getElementById("darkModeToggle");
    const menu = document.getElementById("menu");
    const menuBtn = document.getElementById("menu-btn");
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });
    menuBtn.addEventListener("click", () => {
      menu.classList.toggle("hidden");
    });
  }
});
