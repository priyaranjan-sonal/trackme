"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Film,
  Tv,
  Bookmark,
  PlayCircle,
  CheckCircle2,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
  TrendingUp,
  Award,
  Mail,
  FilmIcon,
  Pen,
  Loader2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getTrackingAll } from "@/lib/trackingClient"
import type { TrackedItem } from "@/types/media"

/* ─── Small building blocks ──────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/2 p-4 transition-all hover:border-prsPrimary/30 hover:bg-white/4">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-extrabold tracking-tight text-white">
          {value}
        </p>
        <p className="truncate text-xs text-white/40">{label}</p>
      </div>
    </div>
  )
}

function MediaRow({ item }: { item: TrackedItem }) {
  const isTv = item.mediaType === "tv"
  return (
    <Link
      href={`/media/${item.mediaType}/${item.tmdbId}`}
      className="group flex items-center gap-3 rounded-2xl border border-white/6 bg-white/2 p-3 transition-all hover:border-prsPrimary/30 hover:bg-white/4"
    >
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/8 bg-white/3">
        {item.poster ? (
          <Image
            src={item.poster}
            alt={item.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-white/20">
            {isTv ? <Tv className="size-4" /> : <Film className="size-4" />}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-prsPrimary">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/40">
          {isTv ? "TV Series" : "Movie"}
          {item.year ? ` · ${item.year}` : ""}
        </p>
      </div>
      {item.rating != null && (
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-prsPrimary/30 bg-prsPrimary/10 px-2 py-0.5 text-xs font-bold text-prsPrimary">
          <Star className="size-3 fill-prsPrimary" />
          {item.rating.toFixed(1)}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-prsPrimary" />
    </Link>
  )
}

function EmptyList({
  icon: Icon,
  title,
  subtitle,
  href,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  href?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/1 px-6 py-10 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-xl border border-prsPrimary/25 bg-prsPrimary/10">
        <Icon className="size-5 text-prsPrimary" />
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-55 text-xs text-white/40">{subtitle}</p>
      {href && (
        <Link
          href={href}
          className="mt-4 rounded-xl bg-prsPrimaryDark px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-90 active:scale-95"
        >
          Start exploring
        </Link>
      )}
    </div>
  )
}

/* ─── Loading state ──────────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-300 px-4 pt-28 pb-24 sm:px-6">
      <div className="animate-pulse rounded-3xl border border-white/6 bg-white/2 p-6 sm:p-10">
        <div className="flex items-center gap-6">
          <div className="size-20 rounded-2xl bg-white/6 sm:size-24" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-32 rounded-lg bg-white/6" />
            <div className="h-8 w-48 rounded-xl bg-white/8" />
            <div className="h-4 w-64 max-w-full rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-21 animate-pulse rounded-2xl bg-white/3" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[1, 2].map(i => (
          <div key={i} className="h-70 animate-pulse rounded-3xl bg-white/2" />
        ))}
      </div>
    </div>
  )
}

/* ─── Edit Profile Dialog ─────────────────────────────────────────── */

function EditProfileDialog({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  user: { name: string; email: string }
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      // The AuthContext will update from the response
      onClose()
    } catch (err) {
      console.error("Failed to save profile:", err)
      alert("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/8 bg-prsSurface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.7)] animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-white/50 hover:bg-white/6 hover:text-white transition-colors"
            aria-label="Close"
          >
            <Pen className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1.5 text-sm font-medium text-white/70">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-prsBg px-4 py-2.5 text-white placeholder-white/30 focus:border-prsPrimary/50 focus:outline-none focus:ring-2 focus:ring-prsPrimary/20"
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-white/70">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-prsBg px-4 py-2.5 text-white placeholder-white/30 focus:border-prsPrimary/50 focus:outline-none focus:ring-2 focus:ring-prsPrimary/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/70 transition-all hover:border-prsPrimary/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-prsPrimaryDark px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<TrackedItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    getTrackingAll()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false))
  }, [user])

  const stats = useMemo(() => {
    const rated = items.filter(i => i.rating != null)
    return {
      all: items.length,
      watchlist: items.filter(i => i.status === "watchlist").length,
      watching: items.filter(i => i.status === "watching").length,
      watched: items.filter(i => i.status === "watched").length,
      movies: items.filter(i => i.mediaType === "movie").length,
      shows: items.filter(i => i.mediaType === "tv").length,
      episodes: items.reduce((sum, i) => sum + i.episodeProgress.length, 0),
      avg: rated.length
        ? rated.reduce((sum, i) => sum + (i.rating as number), 0) / rated.length
        : 0,
      ratedCount: rated.length,
    }
  }, [items])

  const genres = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      for (const g of item.genres ?? []) map.set(g, (map.get(g) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [items])

  const recentlyAdded = useMemo(
    () =>
      [...items]
        .sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        )
        .slice(0, 5),
    [items]
  )

  const topRated = useMemo(
    () =>
      items
        .filter(i => i.rating != null)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 5),
    [items]
  )

  if (loading || (user && loadingItems)) return <ProfileSkeleton />

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prsBg px-4 pt-16">
        <div className="text-center">
          <p className="mb-6 text-sm text-white/50">
            Please log in to view your profile.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-prsPrimaryDark px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const maxGenre = genres.length > 0 ? genres[0][1] : 0
  const firstName = user.name.split(" ")[0]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-prsBg">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-120 w-180 -translate-x-1/2 rounded-full bg-prsPrimary/7 blur-[140px]" />
        <div className="absolute top-[30%] right-[4%] h-80 w-110 rounded-full bg-prsAccent/5 blur-[120px]" />
        <div className="absolute bottom-[8%] left-[2%] h-75 w-105 rounded-full bg-prsPrimary/4 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-300 px-4 pt-28 pb-24 sm:px-6">
        {/* ── Profile hero ─────────────────────────────────────────── */}
        <section className="relative animate-fade-in-up overflow-hidden rounded-3xl border border-prsPrimary/25 bg-linear-to-br from-prsElevated via-prsSurface to-prsBg shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-prsPrimary/15 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-prsAccent/10 blur-[110px]" />

          <div className="relative flex flex-col gap-8 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex size-24 items-center justify-center rounded-3xl border-2 border-prsPrimary/40 bg-linear-to-br from-prsPrimary/25 to-prsAccent/25 text-4xl font-black text-prsPrimary shadow-[0_0_44px_rgba(99,102,241,0.35)]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border border-prsPrimary/40 bg-prsPrimaryDark text-white">
                  <Star className="size-3.5 fill-white" />
                </span>
              </div>

              {/* Identity */}
              <div className="min-w-0">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-prsPrimary/30 bg-prsPrimary/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-prsPrimary">
                  <Sparkles className="size-3" /> Member
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-1.5 flex items-center gap-2 text-sm text-white/50">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-prsPrimaryDark px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-90 active:scale-[0.97]"
              >
                <Pen className="size-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={Layers}
            label="Total tracked"
            value={stats.all}
            accent="border-prsPrimary/30 bg-prsPrimary/10 text-prsPrimary"
          />
          <StatCard
            icon={Bookmark}
            label="Watchlist"
            value={stats.watchlist}
            accent="border-sky-400/30 bg-sky-400/10 text-sky-300"
          />
          <StatCard
            icon={PlayCircle}
            label="Watching"
            value={stats.watching}
            accent="border-amber-400/30 bg-amber-400/10 text-amber-300"
          />
          <StatCard
            icon={CheckCircle2}
            label="Watched"
            value={stats.watched}
            accent="border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          />
          <StatCard
            icon={Film}
            label="Movies"
            value={stats.movies}
            accent="border-violet-400/30 bg-violet-400/10 text-violet-300"
          />
          <StatCard
            icon={Tv}
            label="TV shows"
            value={stats.shows}
            accent="border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300"
          />
          <StatCard
            icon={Clock}
            label="Episodes watched"
            value={stats.episodes}
            accent="border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
          />
          <StatCard
            icon={Star}
            label={`Avg rating${stats.ratedCount ? ` (${stats.ratedCount})` : ""}`}
            value={stats.avg > 0 ? stats.avg.toFixed(1) : "—"}
            accent="border-prsAccent/30 bg-prsAccent/10 text-prsAccent"
          />
        </section>

        {/* ── Lists ────────────────────────────────────────────────── */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recently added */}
          <div className="rounded-3xl border border-white/6 bg-white/2 p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl border border-prsPrimary/30 bg-prsPrimary/10">
                <TrendingUp className="size-4 text-prsPrimary" />
              </span>
              <h2 className="text-base font-bold text-white">Recently Added</h2>
              <span className="ml-auto text-xs text-white/40">
                {recentlyAdded.length}/{items.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {recentlyAdded.length > 0 ? (
                recentlyAdded.map(item => <MediaRow key={item.id} item={item} />)
              ) : (
                <EmptyList
                  icon={Bookmark}
                  title="Nothing tracked yet"
                  subtitle="Discover movies and shows on the dashboard to get started."
                  href="/dashboard"
                />
              )}
            </div>
          </div>

          {/* Top rated */}
          <div className="rounded-3xl border border-white/6 bg-white/2 p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl border border-prsAccent/30 bg-prsAccent/10">
                <Award className="size-4 text-prsAccent" />
              </span>
              <h2 className="text-base font-bold text-white">Top Rated</h2>
              <span className="ml-auto text-xs text-white/40">
                {topRated.length}/{stats.ratedCount}
              </span>
            </div>
            <div className="space-y-2.5">
              {topRated.length > 0 ? (
                topRated.map(item => <MediaRow key={item.id} item={item} />)
              ) : (
                <EmptyList
                  icon={Star}
                  title="No ratings yet"
                  subtitle="Rate the titles in your workspace to build your top picks."
                  href="/workspace"
                />
              )}
            </div>
          </div>
        </section>

        {/* ── Genre insights ───────────────────────────────────────── */}
        {genres.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/6 bg-white/2 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl border border-prsPrimary/30 bg-prsPrimary/10">
                <FilmIcon className="size-4 text-prsPrimary" />
              </span>
              <h2 className="text-base font-bold text-white">Genre Preferences</h2>
              <span className="ml-auto text-xs text-white/40">
                Based on your tracked titles
              </span>
            </div>
            <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {genres.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium capitalize text-white/70">{name}</span>
                    <span className="text-white/40">
                      {count} {count === 1 ? "title" : "titles"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-prsPrimary to-prsAccent transition-all"
                      style={{
                        width: `${maxGenre > 0 ? (count / maxGenre) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer note ──────────────────────────────────────────── */}
        <p className="mt-10 text-center text-xs text-white/30">
          {firstName}, this is your personal TrackMe profile — everything you track
          lives here.
        </p>

        {/* Edit Profile Dialog */}
        <EditProfileDialog
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          user={{ name: user.name, email: user.email }}
        />
      </div>
    </div>
  )
}
