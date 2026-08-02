"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { X, Film, Tv, Bookmark, PlayCircle, CheckCircle2 } from "lucide-react"
import type { MediaSnapshot, TrackStatus, TrackedItem } from "@/types/media"
import { addToTracking } from "@/lib/trackingClient"
import RatingStars from "@/components/RatingStars"

interface TrackModalProps {
  item: MediaSnapshot | null
  existing?: TrackedItem | null
  onClose: () => void
  onSaved?: (item: TrackedItem) => void
}

const STATUS_OPTIONS: { value: TrackStatus; label: string; icon: typeof Bookmark }[] = [
  { value: "watchlist", label: "Watchlist", icon: Bookmark },
  { value: "watching", label: "Currently Watching", icon: PlayCircle },
  { value: "watched", label: "Watched", icon: CheckCircle2 },
]

export default function TrackModal({
  item,
  existing,
  onClose,
  onSaved,
}: TrackModalProps) {
  const [status, setStatus] = useState<TrackStatus>(
    existing?.status ?? "watchlist"
  )
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!item) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [item, onClose])

  if (!item) return null

  const posterUrl = item.poster

  const save = async () => {
    setSaving(true)
    try {
      const saved = await addToTracking({
        ...item,
        status,
        rating: rating ?? undefined,
      } as MediaSnapshot & { status?: TrackStatus; rating?: number })
      onSaved?.(saved)
      toast.success(
        status === "watchlist"
          ? "Added to watchlist"
          : status === "watching"
            ? "Marked as currently watching"
            : "Marked as watched"
      )
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-prsBg/80 backdrop-blur-lg" />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-prsPrimary/25 bg-prsSurface shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-linear-to-r from-transparent via-prsPrimary/50 to-transparent" />

        {/* Header */}
        <div className="flex items-start gap-4 p-5">
          <div className="relative h-28 w-19 shrink-0 overflow-hidden rounded-xl border border-prsPrimary/25 bg-prsBg/30">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={item.title}
                fill
                sizes="76px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/30">
                {item.mediaType === "tv" ? (
                  <Tv className="size-8" />
                ) : (
                  <Film className="size-8" />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-prsPrimary/25 bg-prsPrimary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-prsPrimary">
                {item.mediaType === "tv" ? "TV Series" : "Movie"}
              </span>
              <button
                onClick={onClose}
                className="ml-auto flex size-8 items-center justify-center rounded-full border border-white/15 text-white/50 transition-colors hover:border-prsPrimary/40 hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-tight text-white">
              {item.title}
            </h3>
            {item.year && <p className="mt-1 text-xs text-white/40">{item.year}</p>}
          </div>
        </div>

        {/* Status picker */}
        <div className="px-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Add to
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-semibold transition-all ${status === value
                  ? "border-prsPrimary/60 bg-prsPrimary/15 text-prsPrimary shadow-[0_0_16px_rgba(99,102,241,0.2)]"
                  : "border-white/15 bg-prsBg/20 text-white/70 hover:border-prsPrimary/30 hover:text-white"
                  }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mt-5 px-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Your rating {rating != null && <span className="text-prsPrimary">· {rating}/10</span>}
            </p>
            {rating != null && (
              <button
                onClick={() => setRating(null)}
                className="text-[10px] text-white/30 transition-colors hover:text-white/60"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-2">
            <RatingStars value={rating ?? undefined} onChange={setRating} size="md" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/15 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-prsBg/20"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-2xl bg-prsPrimaryDark py-2.5 text-sm font-semibold text-white transition-all hover:brightness-90 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving..." : existing ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
