// js/login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const loginMsg = document.getElementById('login-msg');

    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch(err => {
            loginMsg.textContent = err.message;
        });
});

onAuthStateChanged(auth, user => {
    if (user) {
        window.location.href = "journal.html";
    }
});