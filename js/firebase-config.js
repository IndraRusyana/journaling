// js/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
