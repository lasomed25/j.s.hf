// Placeholder for your Firebase config
// Paste your own config here:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Example front-end-only role handling (not secure):
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (email.endsWith('@teach.com')) {
    alert('Logged in as Teacher');
    window.location.href = 'dashboard.html';
  } else if (email === 'lasomed@gmail.com') {
    alert('Logged in as Admin');
    window.location.href = 'dashboard.html';
  } else {
    alert('Logged in as Student');
    window.location.href = 'dashboard.html';
  }
});
