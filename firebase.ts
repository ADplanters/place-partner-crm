import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC35JUgxgVlfsOQQUSGbu91eOGWSvpPHs", // <- 대문자 J로 정확히 수정됨
  authDomain: "placepartnercrm.firebaseapp.com",
  projectId: "placepartnercrm",
  storageBucket: "placepartnercrm.firebasestorage.app",
  messagingSenderId: "534197078607",
  appId: "1:534197078607:web:1573ccb937d43a1aaf783a",
  measurementId: "G-D9F9QWP9L7"
};

// Firebase 앱 초기화 (중복 생성 방지)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 다른 페이지에서 사용할 인증 및 DB 객체 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;