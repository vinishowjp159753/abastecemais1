import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARBAMrg8ofrDFYZDz_X-bJ0-Czx3Ol8Qk",
  authDomain: "abastecemais-24f90.firebaseapp.com",
  projectId: "abastecemais-24f90",
  storageBucket: "abastecemais-24f90.firebasestorage.app",
  messagingSenderId: "348355992925",
  appId: "1:348355992925:web:139ea0ea5c8eef7e5d9cb4",
  measurementId: "G-RZSK47D02R"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
