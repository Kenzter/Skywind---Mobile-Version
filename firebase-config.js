// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDs84WMvaBXNSpBR6q9sawhUupiJAydatQ",
  authDomain: "skywind-24814.firebaseapp.com",
  databaseURL: "https://skywind-24814-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skywind-24814",
  storageBucket: "skywind-24814.firebasestorage.app",
  messagingSenderId: "480721783076",
  appId: "1:480721783076:web:d0072b88309a9376118bb1",
  measurementId: "G-VWGT1FD4WK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);