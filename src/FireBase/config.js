import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAch4GiG6bKokBQK-1h4x3N44So0AYfyRw",
  authDomain: "database-reportes-web.firebaseapp.com",
  projectId: "database-reportes-web",
  storageBucket: "database-reportes-web.firebasestorage.app",
  messagingSenderId: "821886308724",
  appId: "1:821886308724:web:a1b3196199d811917b1c21"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);