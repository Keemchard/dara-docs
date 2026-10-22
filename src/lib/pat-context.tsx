"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface PatContextValue {
  customPat: string | null;
  useCustomPat: boolean;
  setCustomPat: (pat: string) => void;
  toggleUseCustomPat: () => void;
  clearCustomPat: () => void;
  effectivePat: string | undefined;
}

const PatContext = createContext<PatContextValue | null>(null);

export function PatProvider({ children }: { children: ReactNode }) {
  const [customPat, setCustomPatState] = useState<string | null>(null);
  const [useCustomPat, setUseCustomPat] = useState(false);

  useEffect(() => {
    setCustomPatState(localStorage.getItem("dara-docs-custom-pat"));
    setUseCustomPat(
      localStorage.getItem("dara-docs-use-custom-pat") === "true"
    );
  }, []);

  const setCustomPat = useCallback((pat: string) => {
    setCustomPatState(pat);
    localStorage.setItem("dara-docs-custom-pat", pat);
  }, []);

  const toggleUseCustomPat = useCallback(() => {
    setUseCustomPat((prev) => {
      const next = !prev;
      localStorage.setItem("dara-docs-use-custom-pat", String(next));
      return next;
    });
  }, []);

  const clearCustomPat = useCallback(() => {
    setCustomPatState(null);
    setUseCustomPat(false);
    localStorage.removeItem("dara-docs-custom-pat");
    localStorage.removeItem("dara-docs-use-custom-pat");
  }, []);

  const effectivePat =
    useCustomPat && customPat ? customPat : undefined;

  return (
    <PatContext value={{ customPat, useCustomPat, setCustomPat, toggleUseCustomPat, clearCustomPat, effectivePat }}>
      {children}
    </PatContext>
  );
}

export function usePat() {
  const ctx = useContext(PatContext);
  if (!ctx) throw new Error("usePat must be used within PatProvider");
  return ctx;
}
