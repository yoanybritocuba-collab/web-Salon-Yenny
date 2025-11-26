<<<<<<< HEAD
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBCJn0JDvKPNRb-5TkSZyaWZtTpF1-3Wg",
  authDomain: "web-salon-yenny.firebaseapp.com",
  projectId: "web-salon-yenny",
  storageBucket: "web-salon-yenny.firebasestorage.app",
  messagingSenderId: "1060411840618",
  appId: "1:1060411840618:web:84c7f408ae6ce0a0e09213"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

=======
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBCJn0JDvKPNRb-5TkSZyaWZtTpF1-3Wg",
  authDomain: "web-salon-yenny.firebaseapp.com",
  projectId: "web-salon-yenny",
  storageBucket: "web-salon-yenny.firebasestorage.app",
  messagingSenderId: "1060411840618",
  appId: "1:1060411840618:web:84c7f408ae6ce0a0e09213"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

>>>>>>> 16bea41df7823b6febede32db9f73f258bb39282
export { db };