// js/login.js
const { signInWithEmailAndPassword, onAuthStateChanged } = firebase.auth;

document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const loginMsg = document.getElementById('login-msg');

    // Gunakan fungsi modular signInWithEmailAndPassword
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            window.location.href = "index.html"; // pindah ke halaman utama
        })
        .catch(err => {
            loginMsg.textContent = err.message;
        });
});

// Gunakan fungsi modular onAuthStateChanged
onAuthStateChanged(auth, user => {
    if (user) {
        window.location.href = "index.html";
    }
});