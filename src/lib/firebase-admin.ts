import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "fallback-dev-secret-change-in-prod"
);

const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

export async function verifyFirebaseToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  return payload;
}

export async function createSessionCookie(email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(SESSION_SECRET);
}

export async function verifySessionCookie(cookie: string) {
  const { payload } = await jwtVerify(cookie, SESSION_SECRET);
  return payload;
}
