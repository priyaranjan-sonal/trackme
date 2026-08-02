"use client"

import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Star,
  Clock,
  Flame,
  Eye,
  Package,
  Film,
  Tv,
  Sparkles,
  CalendarClock,
  Globe,
  Info,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { MediaItem, MediaSnapshot, TrackedItem } from "@/types/media"
import { getTrackingAll, snapshotFromItem } from "@/lib/trackingClient"
import CategoryRow from "@/components/CategoryRow"
import TrackModal from "@/components/TrackModal"

type MediaType = "movie" | "tv"

interface Section {
  id: string
  label: string
  icon: LucideIcon
  endpoint: string
  items: MediaItem[]
  loading: boolean
  error: string
}

const MOVIE_SECTIONS: Pick<Section, "id" | "label" | "icon" | "endpoint">[] = [
  { id: "trending", label: "Trending Now", icon: Flame, endpoint: "movies/trending" },
  { id: "popular", label: "Most Popular", icon: Star, endpoint: "movies/popular" },
  { id: "top_rated", label: "Top Rated", icon: Package, endpoint: "movies/top_rated" },
  { id: "upcoming", label: "Coming Soon", icon: CalendarClock, endpoint: "movies/upcoming" },
  { id: "now_playing", label: "Now Playing", icon: Eye, endpoint: "movies/now_playing" },
]

const TV_SECTIONS: Pick<Section, "id" | "label" | "icon" | "endpoint">[] = [
  { id: "trending", label: "Trending Series", icon: Flame, endpoint: "tv/trending" },
  { id: "popular", label: "Popular Shows", icon: Star, endpoint: "tv/popular" },
  { id: "top_rated", label: "Top Rated Shows", icon: Package, endpoint: "tv/top_rated" },
  { id: "on_the_air", label: "On The Air", icon: Eye, endpoint: "tv/on_the_air" },
  { id: "airing_today", label: "Airing Today", icon: CalendarClock, endpoint: "tv/airing_today" },
]

function makeSections(defs: typeof MOVIE_SECTIONS): Section[] {
  return defs.map(d => ({ ...d, items: [], loading: true, error: "" }))
}

function useGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function fmtRuntime(min?: number): string {
  if (min == null) return ""
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen overflow-hidden bg-prsBg">
      <div className="mx-auto w-full max-w-360 px-4 pt-28 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-5 h-7 w-40 animate-pulse rounded-full bg-white/6" />
            <div className="mb-3 h-10 w-72 animate-pulse rounded-xl bg-white/8" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-white/5" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-xl bg-white/5 lg:w-96" />
        </div>
        <div className="mt-14 h-105 animate-pulse rounded-3xl border border-white/6 bg-white/3" />
      </div>
      <div className="mx-auto mt-14 w-full max-w-360 space-y-10 px-4 pb-24 sm:px-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="mb-5 h-5 w-44 animate-pulse rounded-lg bg-white/6" />
            <div className="flex gap-3">
              {Array.from({ length: 8 }).map((_, j) => (
                <div
                  key={j}
                  className="h-57.5 w-38.5 shrink-0 animate-pulse rounded-2xl bg-white/5"
                  style={{ animationDelay: `${j * 70}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoverHero({
  mediaType,
  onOpen,
}: {
  mediaType: MediaType
  onOpen: (item: MediaItem) => void
}) {
  const isTv = mediaType === "tv"
  const [hero, setHero] = useState<MediaItem | null>(null)

  useEffect(() => {
    let cancelled = false
    const endpoint = `${isTv ? "tv" : "movies"}/trending`

    fetch(`/api/tmdb?endpoint=${endpoint}&limit=20`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.success) {
          const items = (json.data as MediaItem[]).filter(Boolean)
          if (items.length > 0) {
            setHero(items[Math.floor(Math.random() * Math.min(5, items.length))])
          }
        }
      })
      .catch(() => { })

    return () => {
      cancelled = true
    }
  }, [mediaType, isTv])

  const backdropUrl = hero?.images?.fanart?.full || hero?.images?.fanart?.medium
  const posterUrl = hero?.images?.poster?.full || hero?.images?.poster?.medium

  return (
    <section className="relative z-40 mx-auto w-full max-w-360 animate-fade-in-up px-4 sm:px-6">
      <div className="relative h-[70vh] min-h-130 max-h-180 w-full">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={hero?.title ?? "Featured"}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-[#312e81] via-[#1e1b4b] to-black" />
        )}
        {/* Text scrim (behind overlaid content) */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/75 via-black/30 to-transparent" />
        {/* Left / right / bottom fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-prsBg to-transparent sm:w-44" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-prsBg to-transparent sm:w-44" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-prsBg via-prsBg/60 to-transparent sm:h-72" />
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-prsPrimary/14 blur-[130px]" />

        <div className="relative flex h-full w-full flex-col justify-end px-5 pb-10 sm:px-10 sm:pb-12">
          {hero ? (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {hero.certification && (
                  <span className="rounded border border-white/30 px-2 py-0.5 font-mono text-xs tracking-wider text-white/55">
                    {hero.certification}
                  </span>
                )}
              </div>

              {posterUrl && (
                <div className="relative mb-4 h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-white/3 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                  <Image
                    src={posterUrl}
                    alt={hero?.title ?? "Poster"}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}

              <h2 className="mb-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white drop-shadow-2xl sm:text-4xl lg:text-5xl">
                {hero.title}
              </h2>

              <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/50">
                {hero.year && <span className="font-semibold text-white">{hero.year}</span>}
                {isTv ? (
                  (hero as MediaItem & { numberOfSeasons?: number }).numberOfSeasons != null && (
                    <span>
                      {(hero as MediaItem & { numberOfSeasons?: number }).numberOfSeasons} seasons
                    </span>
                  )
                ) : hero.runtime != null ? (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {fmtRuntime(hero.runtime)}
                  </span>
                ) : null}
                {hero.rating != null && hero.rating > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-prsPrimary">
                    <Star className="size-4 fill-prsPrimary" />
                    {hero.rating.toFixed(1)}
                    {hero.votes != null && (
                      <span className="text-xs font-normal text-white/50">
                        ({hero.votes.toLocaleString()} votes)
                      </span>
                    )}
                  </span>
                )}
                {hero.language && (
                  <span className="flex items-center gap-1.5 text-xs uppercase">
                    <Globe className="size-3.5" />
                    {hero.language}
                  </span>
                )}
              </div>

              {hero.genres && hero.genres.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {hero.genres.slice(0, 5).map(g => (
                    <span
                      key={g}
                      className="rounded-full border border-prsPrimary/30 bg-prsPrimary/10 px-3 py-1 text-xs capitalize text-prsPrimary backdrop-blur-sm"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => onOpen(hero)}
                className="flex w-fit items-center gap-2 rounded-2xl bg-prsPrimaryDark px-7 py-3 text-sm font-bold text-white transition-all duration-200 hover:brightness-90 active:scale-[0.97]"
              >
                <Info className="size-4" />
                View Details
              </button>
            </>
          ) : (
            <div className="max-w-xl">
              <div className="mb-3 h-6 w-24 animate-pulse rounded-lg bg-white/8" />
              <div className="mb-3 h-12 w-80 max-w-full animate-pulse rounded-xl bg-white/8" />
              <div className="mb-3 h-4 w-52 animate-pulse rounded-lg bg-white/5" />
              <div className="mb-5 h-14 w-full max-w-md animate-pulse rounded-xl bg-white/5" />
              <div className="h-11 w-32 animate-pulse rounded-2xl bg-white/8" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function BrowseSections({
  mediaType,
  onOpen,
  onQuickAdd,
  trackedMap,
}: {
  mediaType: MediaType
  onOpen: (item: MediaItem) => void
  onQuickAdd: (item: MediaItem) => void
  trackedMap: Record<string, TrackedItem["status"]>
}) {
  const [sections, setSections] = useState<Section[]>(() =>
    makeSections(mediaType === "movie" ? MOVIE_SECTIONS : TV_SECTIONS)
  )

  useEffect(() => {
    const defs = mediaType === "movie" ? MOVIE_SECTIONS : TV_SECTIONS

    defs.forEach(def => {
      fetch(`/api/tmdb?endpoint=${def.endpoint}&limit=20`)
        .then(r => r.json())
        .then(json => {
          if (json.success) {
            const items = (json.data as MediaItem[]).filter(Boolean)
            setSections(prev =>
              prev.map(s =>
                s.id === def.id ? { ...s, items, loading: false } : s
              )
            )
          } else {
            setSections(prev =>
              prev.map(s =>
                s.id === def.id
                  ? { ...s, loading: false, error: (json.error as string) || "Failed" }
                  : s
              )
            )
          }
        })
        .catch(() => {
          setSections(prev =>
            prev.map(s =>
              s.id === def.id ? { ...s, loading: false, error: "Network error" } : s
            )
          )
        })
    })
  }, [mediaType])

  return (
    <>
      {/* Category rows */}
      <div className="mx-auto mt-14 w-full max-w-360 space-y-12 px-4 pb-28 sm:px-6">
        {sections.map(s => (
          <CategoryRow
            key={s.id}
            title={s.label}
            icon={s.icon}
            items={s.items}
            loading={s.loading}
            onOpen={onOpen}
            trackedMap={trackedMap}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const greeting = useGreeting()

  const [mediaType, setMediaType] = useState<MediaType>("movie")
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([])
  const [trackModal, setTrackModal] = useState<{
    item: MediaSnapshot
    existing?: TrackedItem | null
  } | null>(null)

  useEffect(() => {
    if (!user) return
    getTrackingAll()
      .then(setTrackedItems)
      .catch(() => setTrackedItems([]))
  }, [user])

  const trackedMap = Object.fromEntries(
    trackedItems.map(t => [`${t.mediaType}:${t.tmdbId}`, t.status])
  )

  const openMedia = (item: MediaItem) => {
    if (!item.mediaType || !item.ids?.tmdb) return
    router.push(`/media/${item.mediaType}/${item.ids.tmdb}`)
  }

  const openQuickAdd = (item: MediaItem) => {
    if (item.mediaType !== "movie" && item.mediaType !== "tv") return
    if (!item.ids?.tmdb) return
    const key = `${item.mediaType}:${item.ids?.tmdb}`
    const existing = trackedItems.find(t => `${t.mediaType}:${t.tmdbId}` === key) ?? null
    setTrackModal({
      item: snapshotFromItem(item as MediaItem & { mediaType: "movie" | "tv" }),
      existing,
    })
  }

  if (loading) return <LoadingSkeleton />

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prsBg px-4 pt-16">
        <div className="text-center">
          <p className="mb-6 text-sm text-white/50">
            Please log in to access your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-prsPrimaryDark px-6 py-3 text-sm font-semibold text-white transition hover:brightness-90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const firstName = user.name.split(" ")[0]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-prsBg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-120 w-180 -translate-x-1/2 rounded-full bg-prsPrimary/6 blur-[140px]" />
        <div className="absolute top-[45%] right-[6%] h-90 w-130 rounded-full bg-prsAccent/4 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[2%] h-75 w-105 rounded-full bg-prsPrimary/4 blur-[120px]" />
      </div>

      <div className="relative">
        {/* Cover hero (full-bleed page cover) */}
        <CoverHero key={`cover-${mediaType}`} mediaType={mediaType} onOpen={openMedia} />

        {/* Header */}
        <div className="mx-auto mt-10 w-full max-w-360 px-4 sm:px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl animate-fade-in-up">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-prsPrimary/30 bg-prsPrimary/8 px-3.5 py-1.5 text-xs font-semibold text-prsPrimary">
                <Sparkles className="size-3.5" />
                Browse & Discover
              </span>
              <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {greeting},{" "}
                <span className="bg-linear-to-r from-prsPrimary via-violet-300 to-prsAccent bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
              <p className="text-base leading-relaxed text-white/50">
                Discover what&rsquo;s trending across movies and TV, then add it to your
                workspace.
              </p>
            </div>

            <div className="flex shrink-0 animate-fade-in-up items-center gap-1 rounded-2xl border border-white/8 bg-white/3 p-1">
              {(["movie", "tv"] as MediaType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setMediaType(t)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${mediaType === t
                    ? "bg-prsPrimaryDark text-white"
                    : "text-white/50 hover:text-white"
                    }`}
                >
                  {t === "movie" ? (
                    <Film className="size-4" />
                  ) : (
                    <Tv className="size-4" />
                  )}
                  {t === "movie" ? "Movies" : "TV Series"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sections (remounted per media type) */}
        <BrowseSections
          key={`sections-${mediaType}`}
          mediaType={mediaType}
          onOpen={openMedia}
          onQuickAdd={openQuickAdd}
          trackedMap={trackedMap}
        />
      </div>

      {/* Track modal */}
      <TrackModal
        key={trackModal?.item.tmdbId ?? "none"}
        item={trackModal?.item ?? null}
        existing={trackModal?.existing}
        onClose={() => setTrackModal(null)}
        onSaved={saved => {
          setTrackedItems(prev => {
            const next = prev.filter(t => t.id !== saved.id)
            return [saved, ...next]
          })
        }}
      />
    </div>
  )
}
