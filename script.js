// script.js — Dashboard logic (uses your Firebase project)
// admin email: lasomed@gmail.com
// teacher email: las@teach.com

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

/* ----------------- your firebase config ----------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCWGtP9r-jEbUzdUzOMUcKURiAp8BHHNR4",
  authDomain: "study-dashboard-d6ee1.firebaseapp.com",
  projectId: "study-dashboard-d6ee1",
  storageBucket: "study-dashboard-d6ee1.firebasestorage.app",
  messagingSenderId: "869698439345",
  appId: "1:869698439345:web:8e474c1b27221944b6ba90"
};
/* ------------------------------------------------------- */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "lasomed@gmail.com";
const TEACHER_EMAIL = "las@teach.com";

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const welcomeEl = document.getElementById("welcome");
const manageBtn = document.getElementById("manageStudentsBtn");
const toggleThemeBtn = document.getElementById("toggleTheme");
const logoutBtn = document.getElementById("logoutBtn");

// views
const dashboardView = document.getElementById("dashboardView");
const announcementsView = document.getElementById("announcementsView");
const profileView = document.getElementById("profileView");
const manageView = document.getElementById("manageView");

// UI elements
const assignControls = document.getElementById("assignControls") || document.getElementById("assignControls");
const assignmentsList = document.getElementById("assignmentsList");
const addAssignmentBtn = document.getElementById("addAssignment");
const assignmentTitle = document.getElementById("assignmentTitle");
const assignmentDesc = document.getElementById("assignmentDesc");

const announceControls = document.getElementById("announceControls");
const announcementsList = document.getElementById("announcementsList");
const postAnnouncementBtn = document.getElementById("postAnnouncement");
const announceTitle = document.getElementById("announceTitle");
const announceBody = document.getElementById("announceBody");

const profileNicknameEl = document.getElementById("profileNickname");
const profileEmailEl = document.getElementById("profileEmail");
const profileGradesEl = document.getElementById("profileGrades");

const studentsListEl = document.getElementById("studentsList");

let currentUser = null;
let currentRole = "student"; // admin / teacher / student

// simple view switch
function showView(viewEl){
  [dashboardView, announcementsView, profileView, manageView].forEach(v => v.classList.add("hidden"));
  viewEl.classList.remove("hidden");
  menu.classList.add("hidden");
}
menuBtn?.addEventListener("click", ()=> menu.classList.toggle("hidden"));
document.addEventListener("click", (e)=>{ if(!menu.contains(e.target) && e.target !== menuBtn) menu.classList.add("hidden"); });

// menu actions (buttons inside menu have data-action attr)
menu.querySelectorAll("button[data-action], a[data-action]").forEach(btn=>{
  btn.addEventListener("click",(ev)=>{
    const a = ev.currentTarget.getAttribute("data-action");
    if(a === "dashboard") showView(dashboardView);
    if(a === "announcements") { loadAnnouncements(); showView(announcementsView); }
    if(a === "profile") { loadProfile(); showView(profileView); }
    if(a === "manage") { loadStudents(); showView(manageView); }
    if(a === "theme") { document.body.classList.toggle("dark"); menu.classList.toggle("dark"); }
    if(a === "logout") { signOut(auth); }
  });
});

// identify role from email
function roleFromEmail(email){
  if(!email) return "student";
  if(email.toLowerCase() === ADMIN_EMAIL) return "admin";
  if(email.toLowerCase() === TEACHER_EMAIL) return "teacher";
  return "student";
}

/* -------------------- AUTH STATE -------------------- */
onAuthStateChanged(auth, async (user)=>{
  currentUser = user;
  if(!user){
    // not logged in: redirect to index.html (login)
    if(!location.pathname.endsWith("index.html")) location.href = "index.html";
    return;
  }

  // set or update users doc with role and nickname (if missing)
  const userRef = doc(db, "users", user.uid);
  const role = roleFromEmail(user.email);
  currentRole = role;
  await setDoc(userRef, {
    email: user.email,
    role,
    nickname: (await getNicknameSafe(user.uid)) || user.email.split("@")[0],
    lastSeen: new Date().toISOString()
  }, { merge:true });

  welcomeEl.textContent = `Welcome, ${ (await getNicknameSafe(user.uid)) || user.email.split("@")[0] }`;

  // show/hide manage button
  if(role === "admin" || role === "teacher"){
    manageBtn.classList.remove("hidden");
  } else {
    manageBtn.classList.add("hidden");
  }

  // ensure dashboard visible
  showView(dashboardView);

  // load assignments and announcements and progress for current user
  subscribeAssignments();
  subscribeAnnouncements();
  updateMyProgress();
});

/* -------------------- ASSIGNMENTS -------------------- */
function subscribeAssignments(){
  // show controls for teacher/admin
  if(currentRole === "admin" || currentRole === "teacher"){
    document.getElementById("assignControls")?.classList.remove("hidden");
  } else {
    document.getElementById("assignControls")?.classList.add("hidden");
  }

  const colRef = collection(db, "assignments");
  // realtime snapshot
  onSnapshot(colRef, snap=>{
    assignmentsList.innerHTML = "";
    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const id = docSnap.id;
      const item = document.createElement("div");
      item.className = "assignment-item";
      const left = document.createElement("div");
      left.innerHTML = `<div><strong>${data.title}</strong></div><small>${data.desc||""}</small>`;
      item.appendChild(left);

      const right = document.createElement("div");
      // student mark done button
      const markBtn = document.createElement("button");
      markBtn.textContent = "Mark done";
      markBtn.onclick = async ()=>{
        const subRef = collection(db, "submissions");
        await addDoc(subRef, { assignmentId:id, userUid: currentUser.uid, createdAt: new Date().toISOString() });
        updateMyProgress();
      };
      right.appendChild(markBtn);

      // delete allowed for teacher/admin
      if(currentRole === "admin" || currentRole === "teacher"){
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.style.marginLeft = "8px";
        del.onclick = async ()=>{
          await deleteDoc(doc(db, "assignments", id));
        };
        right.appendChild(del);
      }

      item.appendChild(right);
      assignmentsList.appendChild(item);
    });
  });
}

// add assignment
document.getElementById("addAssignment")?.addEventListener("click", async ()=>{
  if(!(currentRole === "admin" || currentRole === "teacher")) return alert("Not allowed");
  const title = document.getElementById("assignmentTitle").value.trim();
  const desc = document.getElementById("assignmentDesc").value.trim();
  if(!title) return alert("Enter title");
  await addDoc(collection(db, "assignments"), { title, desc, createdAt:new Date().toISOString(), createdBy: currentUser.email });
  document.getElementById("assignmentTitle").value = "";
  document.getElementById("assignmentDesc").value = "";
});

/* -------------------- ANNOUNCEMENTS -------------------- */
function subscribeAnnouncements(){
  // already subscribed by onSnapshot in loadAnnouncements
}
async function loadAnnouncements(){
  announcementsList.innerHTML = "Loading announcements...";
  const q = collection(db, "announcements");
  onSnapshot(q, snap=>{
    announcementsList.innerHTML = "";
    snap.forEach(docSnap=>{
      const d = docSnap.data();
      const id = docSnap.id;
      const el = document.createElement("div");
      el.className = "announcement-item";
      el.innerHTML = `<div><strong>${d.title}</strong><div>${d.body}</div><small>by ${d.by || '—'}</small></div>`;
      if(currentRole === "admin" || currentRole === "teacher"){
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = async ()=> { await deleteDoc(doc(db, "announcements", id)); };
        el.appendChild(del);
      }
      announcementsList.appendChild(el);
    });
  });
}
document.getElementById("postAnnouncement")?.addEventListener("click", async ()=>{
  if(!(currentRole === "admin" || currentRole === "teacher")) return alert("Not allowed");
  const t = document.getElementById("announceTitle").value.trim();
  const b = document.getElementById("announceBody").value.trim();
  if(!t || !b) return alert("Fill both fields");
  await addDoc(collection(db, "announcements"), { title:t, body:b, by: currentUser.email, createdAt: new Date().toISOString() });
  document.getElementById("announceTitle").value = "";
  document.getElementById("announceBody").value = "";
});

/* -------------------- PROFILE -------------------- */
async function getNicknameSafe(uid){
  try{
    const u = await getDocs(query(collection(db,"users"), where("__name__","==", uid)));
    // fallback: try doc reference
    const docRef = doc(db, "users", uid);
    const snapshot = await getDocs(collection(db, "users")); // not used ideally but ensure safe
  }catch(e){/* ignore */}
  // simpler: read doc
  try{
    const userDoc = await (await getDocs(collection(db,"users"))).docs.find(d=>d.id===uid);
    if(userDoc) return userDoc.data().nickname;
  }catch(e){}
  // final attempt getDoc
  try{
    const ud = await getDoc(doc(db,"users",uid));
    if(ud.exists()) return ud.data().nickname;
  }catch(e){}
  return null;
}

async function loadProfile(){
  if(!currentUser) return;
  const udoc = await getDoc(doc(db,"users", currentUser.uid));
  const nick = udoc.exists() ? udoc.data().nickname : (currentUser.email.split("@")[0]);
  profileNicknameEl.textContent = nick;
  profileEmailEl.textContent = currentUser.email;

  // load grades (student only their own; teacher/admin see all)
  profileGradesEl.innerHTML = "Loading grades...";
  const gradesCol = collection(db, "grades");
  let grads = [];
  if(currentRole === "admin" || currentRole === "teacher"){
    const snap = await getDocs(gradesCol);
    snap.forEach(s=>grads.push(s.data()));
  } else {
    const q = query(gradesCol, where("studentUid","==", currentUser.uid));
    const snap = await getDocs(q);
    grads = [];
    snap.forEach(s=>grads.push(s.data()));
  }
  if(grads.length===0) profileGradesEl.innerHTML = "<p>No grades yet.</p>";
  else {
    const wrapper = document.createElement("div");
    grads.forEach(g=>{
      const row = document.createElement("div");
      row.innerHTML = `<strong>${g.subject}</strong>: ${g.grade}% ${ g.teacher ? `<small>by ${g.teacher.split("@")[0]}</small>` : "" }`;
      wrapper.appendChild(row);
    });
    profileGradesEl.innerHTML = "";
    profileGradesEl.appendChild(wrapper);
  }
}

/* -------------------- MANAGE STUDENTS -------------------- */
async function loadStudents(){
  // only teacher/admin
  if(!(currentRole === "admin" || currentRole === "teacher")) {
    studentsListEl.innerHTML = "Not allowed.";
    return;
  }
  studentsListEl.innerHTML = "Loading...";
  const snaps = await getDocs(collection(db,"users"));
  studentsListEl.innerHTML = "";
  snaps.forEach(snap=>{
    const d = snap.data();
    const uid = snap.id;
    const el = document.createElement("div");
    el.className = "student-item";
    el.innerHTML = `<div><strong>${d.nickname || d.email}</strong><div style="font-size:12px;color:#555">${d.email}</div></div>`;
    const right = document.createElement("div");
    // edit nickname input
    const inp = document.createElement("input");
    inp.value = d.nickname || "";
    inp.style.marginRight = "8px";
    inp.placeholder = "nickname";
    const save = document.createElement("button");
    save.textContent = "Save";
    save.onclick = async ()=>{
      await updateDoc(doc(db,"users",uid), { nickname: inp.value });
      alert("Saved");
      // refresh welcome if editing current user
      if(uid === currentUser.uid) welcomeEl.textContent = `Welcome, ${inp.value}`;
    };
    right.appendChild(inp);
    right.appendChild(save);
    el.appendChild(right);
    studentsListEl.appendChild(el);
  });
}

/* -------------------- PROGRESS -------------------- */
async function updateMyProgress(){
  // total assignments
  const totalSnap = await getDocs(collection(db,"assignments"));
  const total = totalSnap.size;
  // submissions by current user
  const subQ = query(collection(db,"submissions"), where("userUid","==", currentUser.uid));
  const subSnap = await getDocs(subQ);
  const completed = subSnap.size;
  const percent = total === 0 ? 0 : Math.round((completed/total)*100);
  document.getElementById("myProgress").textContent = `${completed} / ${total} assignments done — ${percent}%`;
}

/* -------------------- subscriptions for announcements & assignments are in place above -------------------- */

/* -------------------- helper: secure getDoc usage -------------------- */
async function getDocSafe(refDoc){
  try { return await getDoc(refDoc); } catch(e){ return null; }
}

/* -------------------- LOGOUT button (in menu) -------------------- */
document.getElementById("logoutBtn")?.addEventListener("click", async ()=>{
  await signOut(auth);
  location.href = "index.html";
});

/* -------------------- show announcements controls only to teacher/admin -------------------- */
function updateControlsVisibility(){
  if(currentRole === "admin" || currentRole === "teacher"){
    document.getElementById("announceControls")?.classList.remove("hidden");
    document.getElementById("assignControls")?.classList.remove("hidden");
    document.getElementById("manageStudentsBtn")?.classList.remove("hidden");
  } else {
    document.getElementById("announceControls")?.classList.add("hidden");
    document.getElementById("assignControls")?.classList.add("hidden");
    document.getElementById("manageStudentsBtn")?.classList.add("hidden");
  }
}

// when announcements UI loaded, ensure visibility and wire post button
document.addEventListener("click", (e)=>{
  if(e.target && e.target.id === "postAnnouncement"){
    postAnnouncementBtn?.click();
  }
});

postAnnouncementBtn?.addEventListener("click", async ()=>{
  if(!(currentRole === "admin" || currentRole === "teacher")) return alert("Not allowed");
  const t = (announceTitle?.value||"").trim();
  const b = (announceBody?.value||"").trim();
  if(!t || !b) return alert("Fill fields");
  await addDoc(collection(db,"announcements"), { title:t, body:b, by: currentUser.email, createdAt:new Date().toISOString() });
  announceTitle.value = ""; announceBody.value = "";
});

// load announcements subscription (if not already) -> handled in loadAnnouncements via onSnapshot

// small init: show dashboard view
showView(dashboardView);

// ensure controls visibility when role known
onAuthStateChanged(auth, async (u)=>{
  if(u){
    currentRole = roleFromEmail(u.email);
    updateControlsVisibility();
  }
});
