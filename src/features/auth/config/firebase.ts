import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTtmmrznRPRYg7C2tfqRRFKnXVEEKlsOE",
  authDomain: "workflow-builder-a552b.firebaseapp.com",
  projectId: "workflow-builder-a552b",
  storageBucket: "workflow-builder-a552b.firebasestorage.app",
  messagingSenderId: "299336668354",
  appId: "1:299336668354:web:27afc3372c28ac6b81175b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
