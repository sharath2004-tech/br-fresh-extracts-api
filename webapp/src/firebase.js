// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPNnsODPqw08ez9eS_jAKpP9C1SC-NV78",
  authDomain: "br-fresh-extratcs.firebaseapp.com",
  projectId: "br-fresh-extratcs",
  storageBucket: "br-fresh-extratcs.firebasestorage.app",
  messagingSenderId: "600825833228",
  appId: "1:600825833228:web:18d4407e51d49b6933cb29",
  measurementId: "G-539WBHJRJC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);