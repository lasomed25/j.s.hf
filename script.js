// === Firebase setup ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// === Role setup ===
const ADMIN_EMAIL = "dr.lasomed@gmail.com";
const TEACHER_EMAIL = "las@teach.com";

let currentUserRole = "student";

// === Login Handling ===
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        if (email === ADMIN_EMAIL) {
          currentUserRole = "admin";
        } else if (email === TEACHER_EMAIL) {
          currentUserRole = "teacher";
        } else {
          currentUserRole = "student";
        }

        localStorage.setItem("role", currentUserRole);
        window.location.href = "dashboard.html";
      })
      .catch((error) => alert(error.message));
  });
}

// === Dashboard ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserRole = localStorage.getItem("role");

    // Hide admin-only content for students
    if (currentUserRole === "student") {
      document.getElementById("addAssignmentSection").style.display = "none";
    }

    loadAssignments();
    if (currentUserRole === "teacher" || currentUserRole === "admin") {
      loadStudentProgress();
    }
  }
});

// === Assignment Handling ===
const addBtn = document.getElementById("addAssignment");
if (addBtn) {
  addBtn.addEventListener("click", () => {
    const title = document.getElementById("assignmentTitle").value.trim();
    if (!title) return alert("Enter assignment title");

    const assignmentsRef = ref(db, "assignments");
    push(assignmentsRef, { title });
    document.getElementById("assignmentTitle").value = "";
  });
}

function loadAssignments() {
  const list = document.getElementById("assignmentList");
  if (!list) return;

  onValue(ref(db, "assignments"), (snapshot) => {
    list.innerHTML = "";
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const key = childSnapshot.key;

      const div = document.createElement("div");
      div.classList.add("assignment-item");
      div.textContent = data.title;

      if (currentUserRole === "teacher" || currentUserRole === "admin") {
        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.classList.add("delete-btn");
        del.onclick = () => remove(ref(db, "assignments/" + key));
        div.appendChild(del);
      }

      list.appendChild(div);
    });
  });
}

// === Student Progress (for teachers/admins) ===
function loadStudentProgress() {
  const progressTable = document.getElementById("progressTable");
  if (!progressTable) return;

  onValue(ref(db, "progress"), (snapshot) => {
    progressTable.innerHTML = `
      <tr>
        <th>Student Name</th>
        <th>Completed</th>
        <th>Total</th>
        <th>Percentage</th>
      </tr>
    `;
    snapshot.forEach((child) => {
      const data = child.val();
      const row = document.createElement("tr");
      const percent = ((data.completed / data.total) * 100).toFixed(0);
      row.innerHTML = `
        <td>${data.name}</td>
        <td>${data.completed}</td>
        <td>${data.total}</td>
        <td>${percent}%</td>
      `;
      progressTable.appendChild(row);
    });
  });
}

// === Dark/Light Mode ===
const toggleThemeBtn = document.getElementById("toggleTheme");
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
}

// === Logout ===
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  });
}
