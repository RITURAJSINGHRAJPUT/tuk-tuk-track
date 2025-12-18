// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, setPersistence, browserSessionPersistence, browserLocalPersistence, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, runTransaction, limit, arrayUnion, Timestamp, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChften8EKj_v3hr-3tMMgn1DID9xolWws",
  authDomain: "tuk-tuk-a504a.firebaseapp.com",
  projectId: "tuk-tuk-a504a",
  storageBucket: "tuk-tuk-a504a.firebasestorage.app",
  messagingSenderId: "551388375504",
  appId: "1:551388375504:web:14fde81a08c4186a3cb1d5",
  databaseURL: "https://tuk-tuk-a504a-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Initialize separate Admin App for isolated session
const adminApp = initializeApp(firebaseConfig, "AdminApp");
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp); // Optional, but keeps things consistent

export {
  app,
  auth,
  adminAuth,
  db,
  adminDb,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  limit,
  arrayUnion,
  Timestamp,
  getCountFromServer,
  sendPasswordResetEmail,
  rtdb,
  ref,
  onValue,
  get,
  child
};