import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// --- KONFIGURASI FIREBASE (AMAN DI EXPOSE KARENA DILINDUNGI RULES) ---
const firebaseConfig = {
    apiKey: "AIzaSyCuhmevYBaj2VvZXEjGFeYe_DY2QmdopHc",
    authDomain: "goresanaksara-1a234.firebaseapp.com",
    projectId: "goresanaksara-1a234",
    storageBucket: "goresanaksara-1a234.firebasestorage.app",
    messagingSenderId: "975817245608",
    appId: "1:975817245608:web:9882ec9b72a47df662d39d",
    measurementId: "G-N15WLSV8Z5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
