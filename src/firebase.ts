import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyDXq_zyZJGeIgn2SpZj6LraoEWdj5DOjuA",
  authDomain: "qrcodegenerator-c1fa4.firebaseapp.com",
  projectId: "qrcodegenerator-c1fa4",
  storageBucket: "qrcodegenerator-c1fa4.firebasestorage.app",
  messagingSenderId: "278650383470",
  appId: "1:278650383470:web:e053c7529603233b8b8a7f",
  measurementId: "G-NL1SLERS5E"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
