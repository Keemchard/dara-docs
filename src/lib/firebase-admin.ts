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
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  }

  _adminAuth = getAuth(app);
  return _adminAuth;
}
