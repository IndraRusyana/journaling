// js/firebase-config.js
// Menggunakan URL CDN lengkap untuk mengimpor modul Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDXLFwAPJyWieOgcNO5Zuy8BiGDfIwqwg8",
    authDomain: "my-project-28b35.firebaseapp.com",
    projectId: "my-project-28b35",
    storageBucket: "my-project-28b35.firebasestorage.app",
    messagingSenderId: "308282325131",
    appId: "1:308282325131:web:703fc52a785aa6374e3c8e",
    measurementId: "G-YBFKLF82BG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };