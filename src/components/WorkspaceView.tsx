"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Bookmark,
  PlayCircle,
  CheckCircle2,
  Trash2,
  Film,
  Tv,
  Star,
  X,
  Layers,
  Check,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import type { SeasonDetail, TrackedItem, TrackStatus } from "@/types/media"
import {
  getTrackingAll,
  patchTracking,
  removeFromTracking,
} from "@/lib/trackingClient"
import RatingStars from "@/components/RatingStars"
import { useAuth } from "@/context/AuthContext"

type Tab = "all" | TrackStatus

const TABS: { value: Tab; label: string; icon: typeof Bookmark }[] = [
  { value: "all", label: "All", icon: Layers },
  { value: "watchlist", label: "Watchlist", icon: Bookmark },
  { value: "watching", label: "Watching", icon: PlayCircle },
  { value: "watched", label: "Watched", icon: CheckCircle2 },
]

const STATUS_BADGES: Record<TrackStatus, { label: string; cls: string }> = {
  watchlist: { label: "Watchlist", cls: "border-prsPrimary/40 bg-prsPrimary/15 text-prsPrimary" },
  watching: { label: "Watching", cls: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  watched: { label: "Watched", cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function itemProgress(item: TrackedItem): { watched: number; total: number } {
  if (item.mediaType !== "tv") return { watched: 0, total: 0 }
  const total = item.seasonsMeta.reduce((sum, s) => sum + s.episodeCount, 0)
  return { watched: item.episodeProgress.length, total }
}

function watchedInSeason(item: TrackedItem, seasonNumber: number): number {
  return item.episodeProgress.filter(p => p.seasonNumber === seasonNumber).length
}

/* ─── Episode modal ───────────────────────────────────────────────── */

function EpisodeModal({
  item,
  onClose,
  onChange,
}: {
  item: TrackedItem
  onClose: () => void
  onChange: (item: TrackedItem) => void
}) {
  const seasonsMeta = item.seasonsMeta ?? []
  const [selected, setSelected] = useState<number>(
    seasonsMeta[0]?.seasonNumber ?? 1
  )
  const [season, setSeason] = useState<SeasonDetail | null>(null)
  const [loadedSeason, setLoadedSeason] = useState<number | null>(null)
  const loading = loadedSeason !== selected

  useEffect(() => {
    let cancelled = false
    fetch(`/api/tmdb?endpoint=tv/${item.tmdbId}/season/${selected}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.success) setSeason(json.data as SeasonDetail)
        setLoadedSeason(selected)
      })
      .catch(() => {
        if (!cancelled) setLoadedSeason(selected)
      })
    return () => {
      cancelled = true
    }
  }, [selected, item.tmdbId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const watchedSet = useMemo(() => {
    const set = new Set<string>()
    for (const p of item.episodeProgress) set.add(`${p.seasonNumber}:${p.episodeNumber}`)
    return set
  }, [item.episodeProgress])

  const episodeCount = season?.episodes?.length ?? 0
  const watchedCount = watchedInSeason(item, selected)

  const toggle = async (episodeNumber: number) => {
    try {
      const updated = await patchTracking(item.id, {
        action: "toggleEpisode",
        seasonNumber: selected,
        episodeNumber,
      })
      onChange(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  const markSeason = async (watched: boolean) => {
    try {
      const updated = await patchTracking(item.id, {
        action: "markSeason",
        seasonNumber: selected,
        watched,
      })
      onChange(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-prsBg/80 backdrop-blur-lg" />
      <div
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-prsPrimary/25 bg-prsSurface shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/6 px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-2xl border border-prsPrimary/30 bg-prsPrimary/10">
            <Layers className="size-4 text-prsPrimary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{item.title}</p>
            <p className="text-[10px] text-white/40">Track episode progress</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-prsPrimary/40 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Season selector */}
        <div className="flex flex-wrap gap-2 border-b border-white/6 px-5 py-3">
          {seasonsMeta.map(s => {
            const watched = watchedInSeason(item, s.seasonNumber)
            return (
              <button
                key={s.seasonNumber}
                onClick={() => setSelected(s.seasonNumber)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${selected === s.seasonNumber
                  ? "border-prsPrimary/60 bg-prsPrimary/15 text-prsPrimary"
                  : "border-white/8 bg-white/3 text-white/50 hover:border-prsPrimary/30 hover:text-white/80"
                  }`}
              >
                {s.name || `Season ${s.seasonNumber}`}
                {s.episodeCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${watched > 0
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-white/6 text-white/40"
                      }`}
                  >
                    {watched}/{s.episodeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Episodes */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-white/50">
              {watchedCount} / {episodeCount} episodes watched
            </p>
            {episodeCount > 0 && (
              <button
                onClick={() => markSeason(watchedCount >= episodeCount ? false : true)}
                className="rounded-lg border border-prsPrimary/30 bg-prsPrimary/10 px-3 py-1.5 text-xs font-semibold text-prsPrimary transition-colors hover:bg-prsPrimary/20"
              >
                {watchedCount >= episodeCount && episodeCount > 0
                  ? "Mark season unwatched"
                  : "Mark entire season watched"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="size-6 animate-spin rounded-full border-2 border-prsPrimary/30 border-t-prsPrimary" />
            </div>
          ) : season && season.episodes ? (
            <div className="space-y-2">
              {season.episodes.map(ep => {
                const isWatched = watchedSet.has(`${selected}:${ep.episodeNumber}`)
                return (
                  <div
                    key={ep.id ?? ep.episodeNumber}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${isWatched
                      ? "border-prsPrimary/20 bg-prsPrimary/5"
                      : "border-white/6 bg-white/2"
                      }`}
                  >
                    <button
                      onClick={() => toggle(ep.episodeNumber as number)}
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${isWatched
                        ? "border-prsPrimary bg-prsPrimaryDark text-white"
                        : "border-white/25 text-transparent hover:border-prsPrimary hover:text-prsPrimary"
                        }`}
                      aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
                    >
                      <Check className="size-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${isWatched ? "text-white/50 line-through" : "text-white"
                          }`}
                      >
                        {ep.episodeNumber}. {ep.name || `Episode ${ep.episodeNumber}`}
                      </p>
                      <p className="truncate text-[10px] text-white/40">
                        {ep.airDate || "No air date"}
                        {ep.runtime ? ` · ${ep.runtime}m` : ""}
                      </p>
                    </div>
                    {ep.rating != null && ep.rating > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-prsPrimary">
                        <Star className="size-3 fill-prsPrimary" />
                        {ep.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: episodeCount || 0 }).map((_, i) => {
                const ep = i + 1
                const isWatched = watchedSet.has(`${selected}:${ep}`)
                return (
                  <div
                    key={ep}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${isWatched
                      ? "border-prsPrimary/20 bg-prsPrimary/5"
                      : "border-white/6 bg-white/2"
                      }`}
                  >
                    <button
                      onClick={() => toggle(ep)}
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${isWatched
                        ? "border-prsPrimary bg-prsPrimaryDark text-white"
                        : "border-white/25 text-transparent hover:border-prsPrimary hover:text-prsPrimary"
                        }`}
                      aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
                    >
                      <Check className="size-3.5" />
                    </button>
                    <p
                      className={`text-sm font-medium ${isWatched ? "text-white/50 line-through" : "text-white"
                        }`}
                    >
                      Episode {ep}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Tracked card ────────────────────────────────────────────────── */

function TrackedCard({
  item,
  onChange,
  onRemove,
}: {
  item: TrackedItem
  onChange: (item: TrackedItem) => void
  onRemove: (id: string) => void
}) {
  const router = useRouter()
  const [episodesOpen, setEpisodesOpen] = useState(false)
  const isTv = item.mediaType === "tv"
  const badge = STATUS_BADGES[item.status]
  const progress = itemProgress(item)

  const setStatus = async (status: TrackStatus) => {
    try {
      const updated = await patchTracking(item.id, { action: "status", status })
      onChange(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  const rate = async (rating: number | null) => {
    try {
      const updated = await patchTracking(item.id, { action: "rating", rating })
      onChange(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rate")
    }
  }

  const pct = progress.total > 0 ? Math.round((progress.watched / progress.total) * 100) : 0

  return (
    <div className="flex gap-4 rounded-3xl border border-white/6 bg-white/2 p-4 transition-colors hover:border-prsPrimary/25">
      {/* Poster */}
      <button
        onClick={() => router.push(`/media/${item.mediaType}/${item.tmdbId}`)}
        className="relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/3 transition-transform hover:scale-[1.02]"
      >
        {item.poster ? (
          <Image src={item.poster} alt={item.title} fill sizes="112px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            {isTv ? <Tv className="size-8" /> : <Film className="size-8" />}
          </div>
        )}
      </button>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <button
            onClick={() => router.push(`/media/${item.mediaType}/${item.tmdbId}`)}
            className="min-w-0 flex-1 text-left"
          >
            <h3 className="line-clamp-1 text-base font-bold text-white hover:text-prsPrimary">
              {item.title}
            </h3>
          </button>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-white/40">
          {isTv ? "TV Series" : "Movie"}
          {item.year ? ` · ${item.year}` : ""}
        </p>

        {/* TV progress */}
        {isTv && progress.total > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-white/40">
              <span>
                {progress.watched} / {progress.total} episodes
              </span>
              <span className="text-prsPrimary">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-linear-to-r from-prsPrimary to-prsAccent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            {item.seasonsMeta?.some(s => s.episodeCount > 0) && (
              <p className="mt-1.5 text-[10px] text-white/40">
                {item.seasonsMeta
                  .map(s => `${s.name || `S${s.seasonNumber}`}: ${watchedInSeason(item, s.seasonNumber)}/${s.episodeCount}`)
                  .join("  ·  ")}
              </p>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Rate</span>
          <RatingStars value={item.rating} onChange={rate} />
          {item.rating != null && (
            <span className="text-xs font-semibold text-prsPrimary">{item.rating}/10</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {(["watchlist", "watching", "watched"] as TrackStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${item.status === s
                ? "bg-prsPrimaryDark text-white"
                : "border border-white/10 text-white/50 hover:border-prsPrimary/40 hover:text-white"
                }`}
            >
              {STATUS_BADGES[s].label}
            </button>
          ))}
          {isTv && (
            <button
              onClick={() => setEpisodesOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-prsPrimary/30 bg-prsPrimary/10 px-2.5 py-1.5 text-[11px] font-semibold text-prsPrimary transition-colors hover:bg-prsPrimary/20"
            >
              <Layers className="size-3" /> Episodes
            </button>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="ml-auto flex items-center gap-1 rounded-lg border border-red-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="size-3" /> Remove
          </button>
        </div>
      </div>

      {episodesOpen && (
        <EpisodeModal
          item={item}
          onClose={() => setEpisodesOpen(false)}
          onChange={onChange}
        />
      )}
    </div>
  )
}

/* ─── View ────────────────────────────────────────────────────────── */

export default function WorkspaceView() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<TrackedItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [tab, setTab] = useState<Tab>("all")

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, router, user])

  useEffect(() => {
    if (!user) return
    getTrackingAll()
      .then(setItems)
      .catch(() => toast.error("Failed to load workspace"))
      .finally(() => setLoadingItems(false))
  }, [user])

  if (loading || (user && loadingItems)) {
    return (
      <div className="mx-auto w-full max-w-300 px-4 sm:px-6">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-xl bg-white/8" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-white/4" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const counts = {
    all: items.length,
    watchlist: items.filter(i => i.status === "watchlist").length,
    watching: items.filter(i => i.status === "watching").length,
    watched: items.filter(i => i.status === "watched").length,
  }
  const filtered = tab === "all" ? items : items.filter(i => i.status === tab)
  const firstName = user.name.split(" ")[0]

  const handleChange = (updated: TrackedItem) => {
    setItems(prev => {
      const next = prev.filter(t => t.id !== updated.id)
      return [updated, ...next]
    })
  }

  const handleRemove = async (id: string) => {
    try {
      await removeFromTracking(id)
      setItems(prev => prev.filter(t => t.id !== id))
      toast.success("Removed from workspace")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove")
    }
  }

  return (
    <div className="mx-auto w-full max-w-300 px-4 pb-24 sm:px-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-prsPrimary/30 bg-prsPrimary/8 px-3.5 py-1.5 text-xs font-semibold text-prsPrimary">
          <Sparkles className="size-3.5" />
          Your personal tracking hub
        </span>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Workspace
        </h1>
        <p className="text-base text-white/50">
          Watchlist, currently watching, and everything you&rsquo;ve finished — all in one
          place, {firstName}.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${tab === value
              ? "border-prsPrimary/60 bg-prsPrimary/15 text-prsPrimary"
              : "border-white/8 bg-white/3 text-white/50 hover:border-prsPrimary/30 hover:text-white/80"
              }`}
          >
            <Icon className="size-4" />
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === value ? "bg-prsPrimaryDark text-white" : "bg-white/6 text-white/40"
                }`}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/6 bg-white/2 px-6 py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-3xl border border-prsPrimary/30 bg-prsPrimary/10">
            {tab === "all" ? (
              <Bookmark className="size-7 text-prsPrimary" />
            ) : (
              <PlayCircle className="size-7 text-prsPrimary" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">
            {tab === "all"
              ? "Your workspace is empty"
              : tab === "watchlist"
                ? "No watchlist items yet"
                : tab === "watching"
                  ? "Nothing in progress"
                  : "Nothing watched yet"}
          </h3>
          <p className="mb-6 max-w-sm text-sm text-white/40">
            Discover movies and TV shows on the dashboard and add them here to start
            tracking your progress.
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl bg-prsPrimaryDark px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98]"
          >
            Browse &amp; Discover <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(item => (
            <TrackedCard
              key={item.id}
              item={item}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
