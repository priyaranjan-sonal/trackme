"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Search, X, Film, Tv, Star } from "lucide-react"
import type { MediaItem } from "@/types/media"

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (!trimmed) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/tmdb?endpoint=search/multi&query=${encodeURIComponent(
            trimmed
          )}&limit=8`
        )
        const json = await res.json()
        if (json.success) {
          setResults((json.data as MediaItem[]).filter(Boolean).slice(0, 8))
        }
      } catch {
        /* ignore */
      }
      setLoading(false)
    }, 380)
  }, [query])

  const showDropdown =
    focused && (loading || results.length > 0 || query.trim().length > 1)

  const selectItem = (item: MediaItem) => {
    setQuery("")
    setResults([])
    if (!item.mediaType || !item.ids?.tmdb) return
    router.push(`/media/${item.mediaType}/${item.ids.tmdb}`)
  }

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-200 ${focused
            ? "border-prsPrimary/50 bg-white/6 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            : "border-white/8 bg-white/3"
          }`}
      >
        <Search className="size-4 shrink-0 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search movies & TV shows..."
          className="w-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
        {loading && (
          <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-prsPrimary/30 border-t-prsPrimary" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              inputRef.current?.focus()
            }}
            className="shrink-0 text-white/40 transition-colors hover:text-white"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-prsPrimary/25 bg-prsSurface shadow-[0_16px_48px_rgba(0,0,0,0.8)] animate-scale-in">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-5">
              <div className="size-5 animate-spin rounded-full border-2 border-prsPrimary/30 border-t-prsPrimary" />
            </div>
          )}
          {!loading && query.trim().length > 1 && results.length === 0 && (
            <p className="py-5 text-center text-xs text-white/40">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {results.map((item, i) => {
            const thumb = item.images?.poster?.thumb || item.images?.poster?.medium
            const isTv = item.mediaType === "tv"
            return (
              <button
                key={String(item.ids?.tmdb ?? i)}
                onMouseDown={() => selectItem(item)}
                className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-prsPrimary/6"
              >
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md bg-white/4">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/30">
                      {isTv ? <Tv className="size-4" /> : <Film className="size-4" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${isTv
                          ? "bg-prsAccent/15 text-prsAccent"
                          : "bg-prsPrimary/15 text-prsPrimary"
                        }`}
                    >
                      {isTv ? "TV" : "Movie"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
                    {item.year && <span>{item.year}</span>}
                    {item.rating != null && item.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-prsPrimary">
                        <Star className="size-3 fill-prsPrimary" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                    {item.genres?.[0] && (
                      <span className="capitalize">{item.genres[0]}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
