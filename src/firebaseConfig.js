import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBw_RAb6-4Z833uHX6A_GlP9FRkMNq8u78",
    authDomain: "todo-4312b.firebaseapp.com",
    projectId: "todo-4312b",
    storageBucket: "todo-4312b.appspot.com",
    messagingSenderId: "1041152797152",
    appId: "1:1041152797152:web:d780fa37ca000939db2385",
    measurementId: "G-EQEFH8983D"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };