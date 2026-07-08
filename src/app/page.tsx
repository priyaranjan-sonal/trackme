"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-3xl border border-prsGreen/40 bg-prsGreen/10">
          <span className="text-3xl font-bold text-prsGreen">M</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Welcome to{" "}
          <span className="text-prsGreen">MovieTrack</span>
        </h1>
        <p className="mb-8 text-lg text-white/50">
          Track, rate, and manage your movie watchlist. Never lose track of what
          to watch next.
        </p>
        {loading ? (
          <div className="mx-auto h-12 w-48 animate-pulse rounded-2xl bg-white/10" />
        ) : user ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-prsGreen px-8 py-3.5 text-sm font-semibold text-prsBlack shadow-[0_4px_20px_color-mix(in_srgb,var(--color-prsGreen)_30%,transparent)] transition-all hover:bg-[#1cb053] active:scale-95"
          >
            Go to Dashboard
            <span aria-hidden="true">&rarr;</span>
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/5 active:scale-95"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-prsGreen px-8 py-3.5 text-sm font-semibold text-prsBlack shadow-[0_4px_20px_color-mix(in_srgb,var(--color-prsGreen)_30%,transparent)] transition-all hover:bg-[#1cb053] active:scale-95"
            >
              Get Started
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
