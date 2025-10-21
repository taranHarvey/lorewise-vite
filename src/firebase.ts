import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCiX67aiXKvlJ_l0gx9Km1IY_emCzqDce4",
  authDomain: "lorewise-89533.firebaseapp.com",
  projectId: "lorewise-89533",
  storageBucket: "lorewise-89533.firebasestorage.app",
  messagingSenderId: "1087787782337",
  appId: "1:1087787782337:web:f3ea35d6b64ca03f31c440",
  measurementId: "G-905QQC1NM5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

