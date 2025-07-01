import { cert, initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminApp: App = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

export const firebaseAdmin = getAuth(adminApp);
