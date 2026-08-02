"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import SearchBar from "@/components/SearchBar"
import Image from "next/image"
import {
  LayoutDashboard,
  Layers,
  CircleUserRound,
  User,
  LogOut,
} from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  if (pathname === "/login" || pathname === "/signup") return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-prsPrimary/20 bg-prsBg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-360 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold text-prsPrimary transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.png"
            alt="TrackMe"
            width={163}
            height={48}
            loading="eager"
            className="h-7 w-auto sm:h-9"
          />
        </Link>

        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <div className="w-40 sm:w-56 md:w-72">
            <SearchBar />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {loading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-white/10" />
            ) : user ? (
              <>
                <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/2 p-1">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${pathname.startsWith("/dashboard")
                      ? "bg-prsPrimaryDark text-white"
                      : "text-white/50 hover:text-white"
                      }`}
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/workspace"
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${pathname.startsWith("/workspace")
                      ? "bg-prsPrimaryDark text-white"
                      : "text-white/50 hover:text-white"
                      }`}
                  >
                    <Layers className="size-4" />
                    Workspace
                  </Link>
                </div>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(o => !o)}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-prsPrimary/40 bg-prsPrimary/10 text-prsPrimary transition-all hover:bg-prsPrimary/20 active:scale-95"
                    aria-label="User menu"
                    aria-expanded={menuOpen}
                  >
                    <CircleUserRound className="size-5" />
                  </button>
                  {menuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-prsSurface shadow-[0_24px_60px_rgba(0,0,0,0.7)] animate-scale-in">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/6 hover:text-white"
                      >
                        <User className="size-4" /> Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          logout()
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 border-t border-white/15 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut className="size-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-white/70 transition-colors hover:text-prsPrimary"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-prsPrimaryDark px-4 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-95"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
