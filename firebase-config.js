// Firebase configuration example
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project
// 3. Enable Firestore Database
// 4. Replace the config below with your project's config

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Save feedback to Firebase
export async function saveFeedbackToFirebase(feedbackData) {
  try {
    const docRef = await addDoc(collection(db, "feedback"), feedbackData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
}

// Load feedback from Firebase
export async function loadFeedbackFromFirebase() {
  try {
    const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const feedback = [];
    querySnapshot.forEach((doc) => {
      feedback.push({ id: doc.id, ...doc.data() });
    });
    return feedback;
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
}