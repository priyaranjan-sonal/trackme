"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Star,
  Clock,
  Globe,
  Calendar,
  Play,
  X,
  Film,
  Tv,
  Bookmark,
  PlayCircle,
  CheckCircle2,
  Trash2,
  Check,
  Layers,
} from "lucide-react"
import type {
  CastMember,
  CrewMember,
  MediaItem,
  SeasonDetail,
  TrackedItem,
  TrackStatus,
  Video,
} from "@/types/media"
import {
  addToTracking,
  getTrackingItem,
  patchTracking,
  removeFromTracking,
  snapshotFromItem,
} from "@/lib/trackingClient"
import RatingStars from "@/components/RatingStars"

const STATUS_BADGES: Record<TrackStatus, { label: string; cls: string }> = {
  watchlist: { label: "Watchlist", cls: "border-prsPrimary/40 bg-prsPrimary/15 text-prsPrimary" },
  watching: { label: "Watching", cls: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  watched: { label: "Watched", cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
}

function fmtRuntime(min?: number): string {
  if (min == null) return ""
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function useFetch<T>(url: string | null): { data: T | null; loading: boolean; error: string } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)

  const loading = url !== null && url !== loadedUrl

  useEffect(() => {
    if (!url) return
    let cancelled = false
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.success) {
          setData(json.data as T)
          setError("")
        } else {
          setError(json.error || "Failed to load")
        }
        setLoadedUrl(url)
      })
      .catch(() => {
        if (!cancelled) setError("Network error")
        setLoadedUrl(url)
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}

/* ─── Trailer modal ───────────────────────────────────────────────── */

function TrailerModal({ video, onClose }: { video: Video | null; onClose: () => void }) {
  useEffect(() => {
    if (!video) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [video, onClose])

  if (!video) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-prsBg/85 backdrop-blur-lg" />
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-prsPrimary/25 bg-prsSurface shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
          <p className="text-sm font-semibold text-white">
            {video.name || "Trailer"}
          </p>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-prsPrimary/40 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          {video.key && (
            <iframe
              src={`https://www.youtube.com/embed/${video.key}?autoplay=1`}
              title={video.name || "Trailer"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Episode tracker (TV) ────────────────────────────────────────── */

function EpisodeTracker({
  show,
  tracked,
  onChange,
}: {
  show: MediaItem & { mediaType: "tv" }
  tracked: TrackedItem | null
  onChange: (tracked: TrackedItem) => void
}) {
  const seasons = show.seasons ?? []
  const [selected, setSelected] = useState<number | null>(
    seasons[0]?.seasonNumber ?? null
  )
  const { data: seasonDetail, loading, error } = useFetch<SeasonDetail>(
    selected != null
      ? `/api/tmdb?endpoint=tv/${show.ids?.tmdb}/season/${selected}`
      : null
  )

  const watchedKeys = useMemo(() => {
    const set = new Set<string>()
    for (const p of tracked?.episodeProgress ?? []) {
      set.add(`${p.seasonNumber}:${p.episodeNumber}`)
    }
    return set
  }, [tracked])

  const watchedInSeason = (seasonNumber: number) =>
    (tracked?.episodeProgress ?? []).filter(p => p.seasonNumber === seasonNumber).length

  const toggleEpisode = async (seasonNumber: number, episodeNumber: number) => {
    if (!tracked) return
    try {
      const updated = await patchTracking(tracked.id, {
        action: "toggleEpisode",
        seasonNumber,
        episodeNumber,
      })
      onChange(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  const markSeason = async (seasonNumber: number, watched: boolean) => {
    if (!tracked) return
    try {
      const updated = await patchTracking(tracked.id, {
        action: "markSeason",
        seasonNumber,
        watched,
      })
      onChange(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  if (seasons.length === 0) return null

  return (
    <section className="rounded-3xl border border-white/8 bg-white/2 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl border border-prsPrimary/30 bg-prsPrimary/10">
            <Layers className="size-4 text-prsPrimary" />
          </span>
          <h3 className="text-lg font-bold tracking-tight text-white">
            Seasons &amp; Episodes
          </h3>
        </div>
        {!tracked && (
          <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-white/40">
            Add to workspace to track episode progress
          </span>
        )}
      </div>

      {/* Season selector */}
      <div className="mb-5 flex flex-wrap gap-2">
        {seasons.map(s => {
          const total = s.episodeCount || 0
          const watched = watchedInSeason(s.seasonNumber ?? 0)
          return (
            <button
              key={s.seasonNumber}
              onClick={() => setSelected(s.seasonNumber ?? null)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${selected === s.seasonNumber
                ? "border-prsPrimary/60 bg-prsPrimary/15 text-prsPrimary"
                : "border-white/8 bg-white/3 text-white/50 hover:border-prsPrimary/30 hover:text-white/80"
                }`}
            >
              {s.name || `Season ${s.seasonNumber}`}
              {total > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${watched > 0
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-white/6 text-white/40"
                    }`}
                >
                  {watched}/{total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Episodes */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="size-6 animate-spin rounded-full border-2 border-prsPrimary/30 border-t-prsPrimary" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-white/40">{error}</p>
      ) : seasonDetail && selected != null ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-white/60">
              {watchedInSeason(selected)} / {seasonDetail.episodes?.length ?? 0} episodes watched
            </p>
            {tracked && seasonDetail.episodes && seasonDetail.episodes.length > 0 && (
              <button
                onClick={() =>
                  markSeason(
                    selected,
                    watchedInSeason(selected) < (seasonDetail.episodes?.length ?? 0)
                  )
                }
                className="rounded-lg border border-prsPrimary/30 bg-prsPrimary/10 px-3 py-1.5 text-xs font-semibold text-prsPrimary transition-colors hover:bg-prsPrimary/20"
              >
                {watchedInSeason(selected) >= seasonDetail.episodes.length
                  ? "Mark season unwatched"
                  : "Mark entire season watched"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {seasonDetail.episodes?.map(ep => {
              const isWatched =
                selected != null && watchedKeys.has(`${selected}:${ep.episodeNumber}`)
              return (
                <div
                  key={ep.id ?? ep.episodeNumber}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${isWatched
                    ? "border-prsPrimary/20 bg-prsPrimary/5"
                    : "border-white/6 bg-white/2"
                    }`}
                >
                  <button
                    disabled={!tracked}
                    onClick={() =>
                      toggleEpisode(selected as number, ep.episodeNumber as number)
                    }
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${isWatched
                      ? "border-prsPrimary bg-prsPrimaryDark text-white"
                      : tracked
                        ? "border-white/25 text-transparent hover:border-prsPrimary hover:text-prsPrimary"
                        : "border-white/10 text-transparent opacity-40"
                      }`}
                    aria-label={isWatched ? "Mark unwatched" : "Mark watched"}
                  >
                    <Check className="size-3.5" />
                  </button>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {ep.still ? (
                      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-white/4">
                        <Image
                          src={ep.still}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-white/4 text-white/20">
                        <Play className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-medium ${isWatched ? "text-white/50 line-through" : "text-white"
                          }`}
                      >
                        {ep.episodeNumber}. {ep.name || `Episode ${ep.episodeNumber}`}
                      </p>
                      <p className="truncate text-[10px] text-white/40">
                        {ep.airDate || "No air date"}
                        {ep.runtime ? ` · ${fmtRuntime(ep.runtime)}` : ""}
                      </p>
                    </div>
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
        </div>
      ) : null}
    </section>
  )
}

/* ─── People section ──────────────────────────────────────────────── */

function PeopleSection({
  cast,
  crew,
}: {
  cast?: CastMember[]
  crew?: Record<string, CrewMember[]>
}) {
  const crewGroups = Object.entries(crew ?? {}).filter(
    (entry): entry is [string, CrewMember[]] => Array.isArray(entry[1]) && entry[1].length > 0
  )
  const show = (cast && cast.length > 0) || crewGroups.length > 0

  if (!show) return null

  return (
    <section>
      <h3 className="mb-4 text-lg font-bold tracking-tight text-white">Cast &amp; Crew</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(cast ?? []).slice(0, 8).map((member, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 p-3"
          >
            <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-prsPrimary/15">
              {member.person?.profile ? (
                <Image src={member.person.profile} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-sm font-bold text-prsPrimary">
                  {member.person?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {member.person?.name ?? "Unknown"}
              </p>
              {member.character && (
                <p className="truncate text-[10px] text-white/40">
                  as {member.character}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {crewGroups.map(([group, members]) => (
        <div key={group} className="mt-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {group}
          </p>
          <div className="flex flex-wrap gap-2">
            {members.slice(0, 10).map((member, i) => (
              <span
                key={i}
                className="rounded-full border border-white/6 bg-white/4 px-3 py-1 text-[11px] text-white/70"
              >
                {member.person?.name ?? "Unknown"}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function MediaDetailPage({
  params,
}: {
  params: Promise<{ mediaType: string; id: string }>
}) {
  const router = useRouter()
  const { mediaType, id } = use(params)
  const isTv = mediaType === "tv"

  const { data: media, loading, error } = useFetch<MediaItem>(
    `/api/tmdb?endpoint=${mediaType}/${id}`
  )

  const [tracked, setTracked] = useState<TrackedItem | null>(null)
  const [trailer, setTrailer] = useState<Video | null>(null)
  const [saving, setSaving] = useState(false)

  const isValidType = mediaType === "movie" || mediaType === "tv"

  useEffect(() => {
    if (
      !media?.ids?.tmdb ||
      !isValidType ||
      (media.mediaType !== "movie" && media.mediaType !== "tv")
    )
      return
    let cancelled = false
    getTrackingItem(media.ids.tmdb, media.mediaType)
      .then(item => {
        if (!cancelled) setTracked(item)
      })
      .catch(() => { })
    return () => {
      cancelled = true
    }
  }, [media?.ids?.tmdb, media?.mediaType, isValidType])

  const applyTracked = (next: TrackedItem | null) => setTracked(next)

  const add = async (status: TrackStatus) => {
    if (!media) return
    setSaving(true)
    try {
      const snapshot = snapshotFromItem(media as never)
      const item = await addToTracking({ ...snapshot, status })
      setTracked(item)
      toast.success(
        status === "watchlist"
          ? "Added to watchlist"
          : status === "watching"
            ? "Marked as currently watching"
            : "Marked as watched"
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (status: TrackStatus) => {
    if (!tracked) return
    try {
      const updated = await patchTracking(tracked.id, { action: "status", status })
      applyTracked(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  const rate = async (rating: number | null) => {
    if (!tracked) return
    try {
      const updated = await patchTracking(tracked.id, { action: "rating", rating })
      applyTracked(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rate")
    }
  }

  const remove = async () => {
    if (!tracked) return
    try {
      await removeFromTracking(tracked.id)
      setTracked(null)
      toast.success("Removed from workspace")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove")
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-prsBg pt-16">
        <div className="mx-auto max-w-300 px-4 pt-10 sm:px-6">
          <div className="h-105 animate-pulse rounded-3xl border border-white/6 bg-white/3" />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="h-48 animate-pulse rounded-3xl bg-white/3" />
            <div className="h-48 animate-pulse rounded-3xl bg-white/3" />
          </div>
        </div>
      </div>
    )
  }

  /* ── Error / invalid type ── */
  if (!isValidType || error || !media) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-prsBg px-4 pt-16">
        <p className="mb-4 text-sm text-white/50">
          {error || "This media type is not supported."}
        </p>
        <Link
          href="/dashboard"
          className="rounded-2xl bg-prsPrimaryDark px-6 py-3 text-sm font-semibold text-white transition hover:brightness-90"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const backdropUrl = media.images?.fanart?.full || media.images?.fanart?.medium
  const posterUrl = media.images?.poster?.full || media.images?.poster?.medium
  const statusBadge = tracked ? STATUS_BADGES[tracked.status] : null
  const trailers = media.trailers ?? []
  const tvMedia = media.mediaType === "tv" ? media : null
  const movieMedia = media.mediaType === "movie" ? media : null

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-prsBg pb-20">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-120 w-180 -translate-x-1/2 rounded-full bg-prsPrimary/6 blur-[140px]" />
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="relative h-80 sm:h-105">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={media.title ?? ""}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-[#312e81] via-[#1e1b4b] to-black" />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/85 to-black/10" />
          <div className="absolute inset-0 bg-linear-to-t from-prsBg via-transparent to-black/25" />

          <button
            onClick={() => router.back()}
            className="absolute top-6 left-4 flex items-center gap-2 rounded-full border border-white/15 bg-prsBg/60 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:border-prsPrimary/40 hover:text-white sm:left-8"
          >
            <span aria-hidden="true">&larr;</span> Back
          </button>
        </div>

        {/* Content */}
        <div className="relative mx-auto w-full max-w-300 px-4 sm:px-6">
          <div className="-mt-24 flex flex-col gap-6 sm:-mt-28 sm:flex-row sm:items-end">
            {/* Poster */}
            <div className="relative h-64 w-44 shrink-0 overflow-hidden rounded-2xl border border-prsPrimary/25 bg-white/3 shadow-[0_24px_60px_rgba(0,0,0,0.7)]">
              {posterUrl ? (
                <Image src={posterUrl} alt={media.title ?? ""} fill sizes="176px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  {isTv ? <Tv className="size-12" /> : <Film className="size-12" />}
                </div>
              )}
            </div>

            {/* Title block */}
            <div className="min-w-0 flex-1 pb-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-prsPrimary/30 bg-prsPrimary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-prsPrimary">
                  {isTv ? "TV Series" : "Movie"}
                </span>
                {statusBadge && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                )}
                {trailers.length > 0 && (
                  <button
                    onClick={() => setTrailer(trailers[0])}
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-white/80 transition-colors hover:border-prsPrimary/40 hover:text-prsPrimary"
                  >
                    <Play className="size-3 fill-current" /> Trailer
                  </button>
                )}
              </div>

              <h1 className="mb-2 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                {media.title}
              </h1>

              {media.tagline && (
                <p className="mb-2 text-sm italic text-prsPrimary/80">
                  &ldquo;{media.tagline}&rdquo;
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/50">
                {media.year && <span className="font-semibold text-white">{media.year}</span>}
                {isTv ? (
                  <>
                    {tvMedia?.numberOfSeasons != null && (
                      <span>{tvMedia.numberOfSeasons} seasons</span>
                    )}
                    {tvMedia?.numberOfEpisodes != null && (
                      <span>{tvMedia.numberOfEpisodes} episodes</span>
                    )}
                    {tvMedia?.lastAirDate && (
                      <span>Ended {tvMedia.lastAirDate.split("-")[0]}</span>
                    )}
                  </>
                ) : (
                  media.runtime != null && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {fmtRuntime(media.runtime)}
                    </span>
                  )
                )}
                {media.rating != null && media.rating > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-prsPrimary">
                    <Star className="size-4 fill-prsPrimary" />
                    {media.rating.toFixed(1)}
                    <span className="text-xs font-normal text-white/50">
                      ({media.votes?.toLocaleString()} votes)
                    </span>
                  </span>
                )}
                {media.certification && (
                  <span className="rounded border border-white/25 px-1.5 py-0.5 font-mono text-xs text-white/60">
                    {media.certification}
                  </span>
                )}
                {media.language && (
                  <span className="flex items-center gap-1 text-xs uppercase">
                    <Globe className="size-3.5" /> {media.language}
                  </span>
                )}
                {media.status && (
                  <span className="capitalize text-white/40">{media.status}</span>
                )}
              </div>

              {/* Genres */}
              {media.genres && media.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {media.genres.map(g => (
                    <span
                      key={g}
                      className="rounded-full border border-prsPrimary/25 bg-prsPrimary/10 px-3 py-1 text-xs capitalize text-prsPrimary"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto mt-10 w-full max-w-300 space-y-10 px-4 sm:px-6">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/8 bg-white/2 p-4">
          {!tracked ? (
            <>
              <button
                onClick={() => add("watchlist")}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-prsPrimaryDark px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-90 active:scale-[0.98] disabled:opacity-50"
              >
                <Bookmark className="size-4" /> Watchlist
              </button>
              <button
                onClick={() => add("watching")}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-400/20 active:scale-[0.98] disabled:opacity-50"
              >
                <PlayCircle className="size-4" /> Start Watching
              </button>
              <button
                onClick={() => add("watched")}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-400/20 active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" /> Mark Watched
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/40">Status:</span>
                {(["watchlist", "watching", "watched"] as TrackStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${tracked.status === s
                      ? "bg-prsPrimaryDark text-white"
                      : "border border-white/10 text-white/50 hover:border-prsPrimary/40 hover:text-white"
                      }`}
                  >
                    {STATUS_BADGES[s].label}
                  </button>
                ))}
              </div>
              <div className="mx-2 hidden h-8 w-px bg-white/8 sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/40">Your rating:</span>
                <RatingStars value={tracked.rating} onChange={rate} />
                {tracked.rating != null && (
                  <span className="text-xs font-semibold text-prsPrimary">
                    {tracked.rating}/10
                  </span>
                )}
              </div>
              <button
                onClick={remove}
                className="ml-auto flex items-center gap-2 rounded-2xl border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </>
          )}
        </div>

        {/* Overview */}
        {media.overview && (
          <section className="max-w-3xl">
            <h3 className="mb-3 text-lg font-bold tracking-tight text-white">Overview</h3>
            <p className="text-sm leading-relaxed text-white/60">{media.overview}</p>
          </section>
        )}

        {/* TV seasons & episodes */}
        {isTv && <EpisodeTracker show={media as MediaItem & { mediaType: "tv" }} tracked={tracked} onChange={setTracked} />}

        {/* Cast & crew */}
        <PeopleSection cast={media.cast} crew={media.crew} />

        {/* Stats */}
        {(isTv
          ? tvMedia?.numberOfSeasons != null || tvMedia?.numberOfEpisodes != null
          : movieMedia?.budget != null) && (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {isTv ? (
                <>
                  <StatTile label="Seasons" value={String(tvMedia?.numberOfSeasons ?? "—")} />
                  <StatTile label="Episodes" value={String(tvMedia?.numberOfEpisodes ?? "—")} />
                  <StatTile label="Status" value={media.status ?? "—"} />
                  <StatTile
                    label="Last aired"
                    value={tvMedia?.lastAirDate?.split("-")[0] ?? "—"}
                  />
                </>
              ) : (
                <>
                  <StatTile
                    label="Runtime"
                    value={fmtRuntime(movieMedia?.runtime) || "—"}
                  />
                  <StatTile label="Budget" value={fmtMoney(movieMedia?.budget)} />
                  <StatTile label="Revenue" value={fmtMoney(movieMedia?.revenue)} />
                  <StatTile label="Status" value={media.status ?? "—"} />
                </>
              )}
            </section>
          )}

        {/* Similar */}
        {media.similar && media.similar.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-lg font-bold tracking-tight text-white">
                You may also like
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {media.similar.slice(0, 12).map((item, i) => (
                <button
                  key={String(item.ids?.tmdb ?? i)}
                  onClick={() =>
                    router.push(`/media/${item.mediaType}/${item.ids?.tmdb}`)
                  }
                  className="group relative aspect-2/3 overflow-hidden rounded-2xl border border-white/6 bg-white/3 transition-all hover:-translate-y-1 hover:border-prsPrimary/40"
                >
                  {item.images?.poster?.medium ? (
                    <Image
                      src={item.images.poster.medium}
                      alt={item.title ?? ""}
                      fill
                      sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center">
                      <p className="text-xs text-white/50">{item.title}</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-2 pt-8">
                    <p className="line-clamp-1 text-[11px] font-semibold text-white">
                      {item.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Season overview dates helper */}
        {media.released && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar className="size-3.5" />
            {isTv ? "First aired" : "Released"}:{" "}
            {new Date(media.released).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        )}
      </div>

      <TrailerModal video={trailer} onClose={() => setTrailer(null)} />
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-4">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function fmtMoney(value?: number): string {
  if (value == null || value <= 0) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}
