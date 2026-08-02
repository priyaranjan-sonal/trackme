"use client"

import { Star } from "lucide-react"

interface RatingStarsProps {
  value?: number
  onChange?: (value: number | null) => void
  size?: "sm" | "md"
}

export default function RatingStars({
  value,
  onChange,
  size = "sm",
}: RatingStarsProps) {
  const scale = size === "sm" ? 16 : 24
  const filled = value != null ? Math.round(value / 2) : 0
  const interactive = typeof onChange === "function"

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const isFilled = star <= filled
        const target = star * 2
        const isCurrent = value != null && Math.round(value / 2) === star
        return interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${target} out of 10`}
            onClick={() => onChange?.(isCurrent ? null : target)}
            className="cursor-pointer p-0.5 transition-transform hover:scale-125"
          >
            <Star
              style={{ width: scale, height: scale }}
              className={
                isFilled
                  ? "fill-prsPrimary text-prsPrimary"
                  : "fill-transparent text-white/25 hover:text-prsPrimary/60"
              }
            />
          </button>
        ) : (
          <Star
            key={star}
            style={{ width: scale, height: scale }}
            className={
              isFilled
                ? "fill-prsPrimary text-prsPrimary"
                : "fill-transparent text-white/25"
            }
          />
        )
      })}
    </div>
  )
}
