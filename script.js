// Firebase setup
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, set, get, update, push, remove } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWGtP9r-jEbUzdUzOMUcKURiAp8BHHNR4",
  authDomain: "study-dashboard-d6ee1.firebaseapp.com",
  projectId: "study-dashboard-d6ee1",
  storageBucket: "study-dashboard-d6ee1.firebasestorage.app",
  messagingSenderId: "869698439345",
  appId: "1:869698439345:web:8e474c1b27221944b6ba90",
  databaseURL: "https://study-dashboard-d6ee1-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");
const announcementList = document.getElementById("announcementList");
const manageStudentsSection = document.getElementById("manageStudentsSection");

// Login
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        localStorage.setItem("userEmail", user.email);
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}

// Check role after login
onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = user.email;
    document.getElementById("welcomeName").innerText = `Welcome, ${email}`;
    const isAdmin = email === "lasomed@gmail.com";
    const isTeacher = email.endsWith("@teach.com");

    if (isAdmin || isTeacher) {
      document.getElementById("manageStudentsBtn").style.display = "block";
      document.getElementById("announcementBtn").style.display = "block";
    } else {
      document.getElementById("manageStudentsBtn").style.display = "none";
      document.getElementById("announcementBtn").style.display = "none";
    }

    loadAnnouncements();
  }
});

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  });
}

// Announcements
function postAnnouncement(message) {
  const announcementRef = ref(db, "announcements");
  const newAnnouncement = push(announcementRef);
  set(newAnnouncement, {
    message,
    time: new Date().toLocaleString(),
  });
}

function loadAnnouncements() {
  const announcementRef = ref(db, "announcements");
  get(announcementRef).then((snapshot) => {
    if (snapshot.exists()) {
      const announcements = snapshot.val();
      announcementList.innerHTML = "";
      Object.values(announcements).forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("announcement");
        div.innerHTML = `<p>${item.message}</p><span>${item.time}</span>`;
        announcementList.appendChild(div);
      });
    }
  });
}

// Manage Students
function loadStudents() {
  const studentsRef = ref(db, "students");
  get(studentsRef).then((snapshot) => {
    manageStudentsSection.innerHTML = "";
    if (snapshot.exists()) {
      const students = snapshot.val();
      Object.entries(students).forEach(([id, data]) => {
        const div = document.createElement("div");
        div.classList.add("studentCard");
        div.innerHTML = `
          <p><b>${data.nickname}</b> (${data.email})</p>
          <button onclick="editNickname('${id}', '${data.nickname}')">Edit</button>
        `;
        manageStudentsSection.appendChild(div);
      });
    }
  });
}

window.editNickname = function (id, oldNickname) {
  const newNick = prompt("Enter new nickname:", oldNickname);
  if (newNick) {
    const nickRef = ref(db, `students/${id}/nickname`);
    update(ref(db, `students/${id}`), { nickname: newNick });
    alert("Nickname updated!");
    loadStudents();
  }
};
