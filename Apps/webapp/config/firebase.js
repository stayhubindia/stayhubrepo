import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { FIREBASE_CONFIG } from "@/config/env";

// All values are validated at startup via env.ts (Zod schema).
// Never hardcode Firebase credentials here — update .env.local instead.
export const firebaseApp = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
