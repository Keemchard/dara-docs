"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "./firebase";

const ALLOWED_DOMAINS = ["globe.com.ph", "gsupport.com.ph"];

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signingOut = useRef(false);

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch {
      setLoading(false);
      setError("Firebase configuration error. Please check environment variables.");
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const domain = firebaseUser.email?.split("@")[1];
        if (domain && ALLOWED_DOMAINS.includes(domain)) {
          const idToken = await firebaseUser.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          setUser(firebaseUser);
        } else {
          await firebaseSignOut(auth);
          setUser(null);
          setError(
            "Access denied. Only @globe.com.ph and @gsupport.com.ph accounts are allowed."
          );
        }
      } else {
        setUser(null);
        if (signingOut.current) {
          signingOut.current = false;
          await fetch("/api/auth/session", { method: "DELETE" });
          window.location.href = "/login";
        }
      }
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
    } catch {
      setError("Failed to sign in. Please try again.");
    }
  };

  const signOut = async () => {
    signingOut.current = true;
    await firebaseSignOut(getFirebaseAuth());
  };

  return (
    <AuthContext value={{ user, loading, signInWithGoogle, signOut, error }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
