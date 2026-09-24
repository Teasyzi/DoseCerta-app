import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB_RykjVXefWsiyqI91fao1tthzUE9j8HE",
  authDomain: "dosecerta-app.firebaseapp.com",
  projectId: "dosecerta-app",
  storageBucket: "dosecerta-app.firebasestorage.app",
  messagingSenderId: "268594565485",
  appId: "1:268594565485:web:46e91b8faab0e6be7c8a64",
  measurementId: "G-0CVYNJGK3P"
};

const app = initializeApp(firebaseConfig);

export const firebaseDb = getFirestore(app);
export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
