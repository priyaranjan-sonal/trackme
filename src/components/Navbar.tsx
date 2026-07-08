"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function Navbar() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

  if (pathname === "/login" || pathname === "/signup") return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-prsGreen/20 bg-prsBlack/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-prsGreen transition-opacity hover:opacity-80"
        >
          <span className="flex size-8 items-center justify-center rounded-xl border border-prsGreen/50 bg-prsGreen/10 text-sm">
            M
          </span>
          MovieTrack
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-5 w-20 animate-pulse rounded bg-white/10" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/70 transition-colors hover:text-prsGreen"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-sm text-white/70 transition-colors hover:text-prsGreen"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="cursor-pointer rounded-xl border border-red-500/30 px-4 py-1.5 text-sm text-red-400 transition-all hover:bg-red-500/10 hover:border-red-500/50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-white/70 transition-colors hover:text-prsGreen"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-prsGreen px-4 py-1.5 text-sm font-semibold text-prsBlack transition-all hover:bg-[#1cb053] active:scale-95"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
