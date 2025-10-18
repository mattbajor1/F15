import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
const firebaseConfig = { apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID }
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const storage = getStorage(app)
if (import.meta.env.VITE_FUNCTIONS_EMULATOR === 'true' && location.hostname==='localhost'){ try{ connectAuthEmulator(auth,'http://127.0.0.1:9099'); connectStorageEmulator(storage,'127.0.0.1',9199) }catch{} }
export const provider = new GoogleAuthProvider(); provider.setCustomParameters({ hd:'frame15.com', prompt:'select_account' });
export async function signInWithGoogle(){ return signInWithPopup(auth, provider) }