// Dummy working version — no real Firebase connection needed
console.log("Script loaded");

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Please fill in both fields");
    return;
  }

  // Simple demo role detection
  if (email === 'lasomed@gmail.com') {
    alert('Logged in as Admin');
    window.location.href = 'dashboard.html';
  } else if (email.endsWith('@teach.com')) {
    alert('Logged in as Teacher');
    window.location.href = 'dashboard.html';
  } else {
    alert('Logged in as Student');
    window.location.href = 'dashboard.html';
  }
});
