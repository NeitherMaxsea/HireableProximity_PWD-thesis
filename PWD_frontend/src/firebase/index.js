import { initializeApp, getApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
 apiKey: "AIzaSyBUwU_l5DEFYJdGEdXfyAoY1hEoyarJ42w",
  authDomain: "hireableproximity.firebaseapp.com",
  databaseURL: "https://hireableproximity-default-rtdb.firebaseio.com",
  projectId: "hireableproximity",
  storageBucket: "hireableproximity.firebasestorage.app",
  messagingSenderId: "762239696926",
  appId: "1:762239696926:web:c851c292a7efd928752e0f",
  measurementId: "G-D8VC29PPMQ"
}

const existingApp = globalThis.__FIREBASE_APP__
const app = existingApp || (getApps().length ? getApp() : initializeApp(firebaseConfig))
if (!globalThis.__FIREBASE_APP__) {
  globalThis.__FIREBASE_APP__ = app
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const rtdb = getDatabase(app)
export default app
