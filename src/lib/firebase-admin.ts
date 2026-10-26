import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let _adminAuth: Auth | undefined;

export function getAdminAuth(): Auth {
  if (_adminAuth) return _adminAuth;

  const apps = getApps();
  let app: App;

  if (apps.length > 0) {
    app = apps[0];
  } else {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  _adminAuth = getAuth(app);
  return _adminAuth;
}
