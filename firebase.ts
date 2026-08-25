import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AiZaSyC35jUgxgVlfsOQQUSGbu91eOGWSvpPHs",
  authDomain: "placepartnercrm.firebaseapp.com",
  projectId: "placepartnercrm",
  storageBucket: "placepartnercrm.firebasestorage.app",
  messagingSenderId: "534197078607",
  appId: "1:534197078607:web:1573ccb937d43a1aaf783a",
  measurementId: "G-D9F9QWP9L7"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();