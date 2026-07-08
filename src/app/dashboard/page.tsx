"use client"

import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 animate-pulse rounded-full bg-white/10" />
          <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="text-center">
          <p className="mb-4 text-white/50">You need to be logged in.</p>
          <Link
            href="/login"
            className="rounded-2xl bg-prsGreen px-6 py-3 text-sm font-semibold text-prsBlack transition-all hover:bg-[#1cb053]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-16">
      <div className="mt-16 w-full max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Welcome, {user.name}!
        </h1>
        <p className="mb-10 text-white/40">
          Your movie dashboard — track, rate, and discover.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-prsGreen/20 bg-prsGreen/5 p-6">
            <h3 className="mb-2 text-lg font-semibold text-white">Watchlist</h3>
            <p className="text-sm text-white/40">
              Movies you plan to watch
            </p>
          </div>
          <div className="rounded-2xl border border-prsGreen/20 bg-prsGreen/5 p-6">
            <h3 className="mb-2 text-lg font-semibold text-white">Watched</h3>
            <p className="text-sm text-white/40">
              Movies you&apos;ve already seen
            </p>
          </div>
          <div className="rounded-2xl border border-prsGreen/20 bg-prsGreen/5 p-6">
            <h3 className="mb-2 text-lg font-semibold text-white">Favorites</h3>
            <p className="text-sm text-white/40">
              Your top-rated picks
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
