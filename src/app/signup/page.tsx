"use client"

import Link from "next/link"
import React from "react"
import { AxiosError } from "axios"
import toast from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"

export default function SignupPage() {
  const { signup } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [user, setUser] = React.useState({
    name: "",
    email: "",
    password: "",
  })

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user.name || !user.email || !user.password) {
      toast.error("All fields are required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(user.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    if (user.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      setLoading(true)
      await signup(user.name, user.email, user.password)
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Something went wrong")
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-prsBlack px-4 py-12">
      <div className="w-full max-w-md rounded-4xl border border-prsGreen/50 bg-prsGreen/5 p-8 shadow-[0_0_32px_color-mix(in_srgb,var(--color-prsGreen)_25%,transparent)] sm:p-10">
        <header className="mb-6 flex justify-center">
          <Link href="/" className="inline-flex">
            <span className="flex size-9 items-center justify-center rounded-2xl border border-prsGreen/50 bg-prsGreen/5 p-6 text-lg font-bold text-prsGreen transition-all hover:border-prsCyan hover:bg-prsCyan/10 hover:text-prsCyan">
              M
            </span>
          </Link>
        </header>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white/85">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-slate-200/40">
            Start tracking movies and building your watchlist.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSignup}>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder=" "
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="peer w-full rounded-2xl border border-slate-400/30 bg-prsBlack px-4 py-3.5 text-sm text-white/80 outline-none transition-[border-color,box-shadow] duration-200 focus:border-prsGreen/40 focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-prsGreen)_25%,transparent)]"
            />
            <label
              htmlFor="name"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400/40 transition-all duration-200 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-prsBlack peer-focus:px-1 peer-focus:text-xs peer-focus:text-prsGreen peer-autofill:top-0 peer-autofill:-translate-y-1/2 peer-autofill:bg-prsBlack peer-autofill:px-1 peer-autofill:text-xs peer-autofill:text-prsGreen/80 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-prsBlack peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-prsGreen/80"
            >
              Name
            </label>
          </div>

          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder=" "
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="peer w-full rounded-2xl border border-slate-400/30 bg-prsBlack px-4 py-3.5 text-sm text-white/80 outline-none transition-[border-color,box-shadow] duration-200 focus:border-prsGreen/40 focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-prsGreen)_25%,transparent)]"
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400/40 transition-all duration-200 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-prsBlack peer-focus:px-1 peer-focus:text-xs peer-focus:text-prsGreen peer-autofill:top-0 peer-autofill:-translate-y-1/2 peer-autofill:bg-prsBlack peer-autofill:px-1 peer-autofill:text-xs peer-autofill:text-prsGreen/80 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-prsBlack peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-prsGreen/80"
            >
              Email
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder=" "
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="peer w-full rounded-2xl border border-slate-400/30 bg-prsBlack px-4 py-3.5 pr-11 text-sm text-white/80 outline-none transition-[border-color,box-shadow] duration-200 focus:border-prsGreen/40 focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-prsGreen)_25%,transparent)]"
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400/40 transition-all duration-200 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-prsBlack peer-focus:px-1 peer-focus:text-xs peer-focus:text-prsGreen peer-autofill:top-0 peer-autofill:-translate-y-1/2 peer-autofill:bg-prsBlack peer-autofill:px-1 peer-autofill:text-xs peer-autofill:text-prsGreen/80 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-prsBlack peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-prsGreen/80"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/30 transition-colors hover:text-white/60"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-prsGreen py-3.5 text-sm font-semibold text-prsBlack shadow-[0_4px_20px_color-mix(in_srgb,var(--color-prsGreen)_30%,transparent)] transition hover:bg-[#1cb053] active:scale-[0.99] hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-prsGreen transition-opacity hover:opacity-80"
          >
            Log in
          </Link>
        </p>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-white/40 transition-colors hover:text-prsGreen"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Home
        </Link>
      </div>
    </main>
  )
}
