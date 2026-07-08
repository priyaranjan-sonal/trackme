"use client"

import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

export default function ProfilePage() {
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
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md rounded-3xl border border-prsGreen/20 bg-prsGreen/5 p-8 text-center">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-2 border-prsGreen/30 bg-prsGreen/10 text-3xl font-bold text-prsGreen">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="mb-1 text-2xl font-semibold text-white">{user.name}</h1>
        <p className="mb-6 text-sm text-white/40">{user.email}</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/50">
            Welcome to MovieTrack! Start building your watchlist.
          </p>
        </div>
        <Link
          href={`/profile/${user.id}`}
          className="mt-6 inline-block rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 transition-all hover:bg-white/5"
        >
          View Profile ID
        </Link>
      </div>
    </div>
  )
}
