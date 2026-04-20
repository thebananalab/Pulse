import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3r4JqzOe-HlOPnypSPYDnhp6VRoGwZNI",
  authDomain: "blink-2e4d3.firebaseapp.com",
  projectId: "blink-2e4d3",
  storageBucket: "blink-2e4d3.firebasestorage.app",
  messagingSenderId: "262494319884",
  appId: "1:262494319884:web:3cdcab97d737ef4b958529",
  measurementId: "G-VYGYHVN8JQ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function saveEmail(email, brandName) {
  await addDoc(collection(db, "leads"), {
    email,
    brand: brandName || "",
    createdAt: serverTimestamp(),
  });
}
