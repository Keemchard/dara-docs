"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SettingsModal } from "./settings-modal";

export function Navbar() {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut } = useAuth();

  if (pathname === "/login") return null;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              DARA Docs
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/analytics"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Analytics
            </Link>
            <a
              href="https://gitlab.com/globetelecom/platforms/ntg-nai/application/dara"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              GitLab
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Settings
            </button>

            {user && (
              <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {user.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
