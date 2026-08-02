"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { MediaItem, TrackStatus } from "@/types/media"
import MediaCard from "@/components/MediaCard"

interface CategoryRowProps {
  title: string
  icon: LucideIcon
  items: MediaItem[]
  loading?: boolean
  onOpen: (item: MediaItem) => void
  trackedMap?: Record<string, TrackStatus>
  onQuickAdd?: (item: MediaItem) => void
}

export default function CategoryRow({
  title,
  icon: Icon,
  items,
  loading,
  onOpen,
  trackedMap,
  onQuickAdd,
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -520 : 520,
      behavior: "smooth",
    })
  }

  const syncScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  return (
    <section className="group/row">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl border border-prsPrimary/30 bg-prsPrimary/10 transition-colors group-hover/row:bg-prsPrimary/15">
            <Icon className="size-4 text-prsPrimary" />
          </span>
          <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
        </div>
        {!loading && items.length > 0 && (
          <span className="rounded-full border border-prsPrimary/20 bg-prsPrimary/[0.06] px-2.5 py-1 text-xs font-medium text-white/50">
            {items.length} titles
          </span>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          disabled={!canLeft}
          className="absolute top-1/2 left-0 z-20 flex size-10 -translate-y-1/2 -translate-x-5 items-center justify-center rounded-full border border-prsPrimary/30 bg-prsBg/70 text-white opacity-0 shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-prsPrimary/50 hover:bg-prsPrimary/10 hover:text-prsPrimary group-hover/row:opacity-100 disabled:!opacity-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div
          ref={scrollRef}
          onScroll={syncScroll}
          className="flex gap-3 overflow-x-auto pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[230px] w-[154px] shrink-0 animate-pulse rounded-2xl bg-white/[0.05]"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))
            : items.map((item, i) => (
                <MediaCard
                  key={String(item.ids?.tmdb ?? `${title}-${i}`)}
                  item={item}
                  index={i}
                  onOpen={onOpen}
                  tracked={
                    trackedMap?.[`${item.mediaType}:${item.ids?.tmdb}`] ?? null
                  }
                  onQuickAdd={onQuickAdd}
                />
              ))}
        </div>

        <button
          onClick={() => scroll("right")}
          disabled={!canRight}
          className="absolute top-1/2 right-0 z-20 flex size-10 translate-x-5 -translate-y-1/2 items-center justify-center rounded-full border border-prsPrimary/30 bg-prsBg/70 text-white opacity-0 shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-prsPrimary/50 hover:bg-prsPrimary/10 hover:text-prsPrimary group-hover/row:opacity-100 disabled:!opacity-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>

        <div className="pointer-events-none absolute bottom-2 top-0 left-0 z-10 w-8 bg-gradient-to-r from-prsBg to-transparent" />
        <div className="pointer-events-none absolute bottom-2 top-0 right-0 z-10 w-8 bg-gradient-to-l from-prsBg to-transparent" />
      </div>
    </section>
  )
}
