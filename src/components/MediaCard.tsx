"use client"

import Image from "next/image"
import { useState } from "react"
import {
  Star,
  Clock,
  Info,
  Film,
  Tv,
  Check,
  Plus,
} from "lucide-react"
import type { MediaItem } from "@/types/media"
import type { TrackStatus } from "@/types/media"

const CARD_GRADIENTS: [string, string][] = [
  ["#312e81", "#0b0b14"],
  ["#4338ca", "#0b0b14"],
  ["#1e3a8a", "#0b0b14"],
  ["#4c1d95", "#0b0b14"],
  ["#5b21b6", "#0b0b14"],
  ["#1e40af", "#0b0b14"],
]

function fmtRuntime(min?: number): string {
  if (min == null) return ""
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface MediaCardProps {
  item: MediaItem
  index: number
  onOpen: (item: MediaItem) => void
  tracked?: TrackStatus | null
  onQuickAdd?: (item: MediaItem) => void
}

export default function MediaCard({
  item,
  index,
  onOpen,
  tracked,
  onQuickAdd,
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const isTv = item.mediaType === "tv"
  const posterUrl = !imgError
    ? (item.images?.poster?.medium || item.images?.poster?.full)
    : undefined
  const [g1, g2] = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const isTracked = tracked != null

  return (
    <div className="group relative shrink-0">
      <button
        onClick={() => onOpen(item)}
        className="relative block h-57.5 w-38.5 overflow-hidden rounded-2xl border border-white/15 bg-white/3 text-left transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:scale-[1.04] hover:border-prsPrimary/40 hover:shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_24px_rgba(99,102,241,0.15)] focus:outline-none focus:ring-2 focus:ring-prsPrimary/60 animate-fade-in-up"
        style={{ animationDelay: `${index * 45}ms` }}
      >
        {/* Poster or gradient fallback */}
        {posterUrl ? (
          <>
            {!imgLoaded && (
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
              />
            )}
            <Image
              src={posterUrl}
              alt={item.title ?? "Media poster"}
              fill
              sizes="154px"
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center p-4"
            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
          >
            {isTv ? (
              <Tv className="mb-3 size-12 text-white opacity-20" />
            ) : (
              <Film className="mb-3 size-12 text-white opacity-20" />
            )}
            <p className="line-clamp-3 text-center text-xs font-medium leading-snug text-neutral-300">
              {item.title || "Unknown Title"}
            </p>
            {item.year && (
              <p className="mt-1.5 text-[10px] text-neutral-500">{item.year}</p>
            )}
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-white/15 bg-prsBg/70 px-1.5 py-0.5 backdrop-blur-sm">
          {isTv ? (
            <Tv className="size-2.5 text-prsAccent" />
          ) : (
            <Film className="size-2.5 text-prsPrimary" />
          )}
        </div>

        {/* Rating badge */}
        {item.rating != null && item.rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-prsPrimary/30 bg-prsBg/70 px-1.5 py-0.5 shadow-[0_0_10px_rgba(99,102,241,0.2)] backdrop-blur-sm">
            <Star className="size-2.5 fill-prsPrimary text-prsPrimary" />
            <span className="text-[10px] font-bold leading-none text-prsPrimary">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/75 to-black/20 p-3 opacity-0 transition-opacity duration-250 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">
            {item.title}
          </p>
          {item.year && (
            <p className="mt-0.5 text-[10px] text-white/50">{item.year}</p>
          )}
          {isTv && item.numberOfSeasons != null ? (
            <p className="mt-0.5 text-[10px] text-white/60">
              {item.numberOfSeasons} season{item.numberOfSeasons !== 1 ? "s" : ""}
            </p>
          ) : item.runtime != null ? (
            <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-white/60">
              <Clock className="size-2.5" />
              {fmtRuntime(item.runtime)}
            </p>
          ) : null}
          {item.genres && item.genres.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.genres.slice(0, 2).map(g => (
                <span
                  key={g}
                  className="rounded-full border border-prsPrimary/25 bg-prsPrimary/20 px-1.5 py-0.5 text-[9px] capitalize text-prsPrimary"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-1 text-[10px] text-prsPrimary/80">
            <Info className="size-3" />
            <span>View details</span>
          </div>
        </div>
      </button>

      {/* Quick add / tracked indicator */}
      {onQuickAdd && (
        <button
          onClick={() => onQuickAdd(item)}
          title={
            isTracked
              ? `In workspace (${tracked})`
              : "Add to workspace"
          }
          className={`absolute -bottom-2 left-1/2 z-20 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-110 ${isTracked
            ? "border-prsPrimary/60 bg-prsPrimaryDark text-white"
            : "border-white/15 bg-prsElevated text-white/70 hover:border-prsPrimary/50 hover:text-prsPrimary"
            }`}
        >
          {isTracked ? (
            <Check className="size-3.5" />
          ) : (
            <Plus className="size-3.5" />
          )}
        </button>
      )}
    </div>
  )
}
