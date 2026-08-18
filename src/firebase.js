import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYQf3yMEMfbI4c23BX3f1GBvsAY8QkFo4",
  authDomain: "profileauditai.firebaseapp.com",
  projectId: "profileauditai",
  storageBucket: "profileauditai.firebasestorage.app",
  messagingSenderId: "362917943008",
  appId: "1:362917943008:web:fc132f7374c25a5660a285",
  measurementId: "G-J1L7121VQZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
};