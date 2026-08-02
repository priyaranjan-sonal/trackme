import type { MediaSnapshot, TrackedItem, TrackStatus } from "@/types/media"

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    data?: T
    error?: string
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Request failed")
  }
  return json.data as T
}

export function getTrackingAll(): Promise<TrackedItem[]> {
  return request<TrackedItem[]>("/api/tracking")
}

export function getTrackingItem(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<TrackedItem | null> {
  return request<TrackedItem | null>(
    `/api/tracking?tmdbId=${tmdbId}&mediaType=${mediaType}`
  )
}

export function addToTracking(
  snapshot: MediaSnapshot & { status?: TrackStatus }
): Promise<TrackedItem> {
  return request<TrackedItem>("/api/tracking", {
    method: "POST",
    body: JSON.stringify(snapshot),
  })
}

export function patchTracking(
  id: string,
  body: Record<string, unknown>
): Promise<TrackedItem> {
  return request<TrackedItem>(`/api/tracking/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function removeFromTracking(id: string): Promise<void> {
  return request<void>(`/api/tracking/${id}`, { method: "DELETE" })
}

export function snapshotFromItem(
  item: {
    ids?: { tmdb?: number }
    mediaType: "movie" | "tv"
    title?: string
    year?: number
    images?: { poster?: { medium?: string; full?: string }; fanart?: { medium?: string; full?: string } }
    genres?: string[]
    seasons?: { seasonNumber?: number; episodeCount?: number; name?: string }[]
  }
): MediaSnapshot {
  return {
    tmdbId: item.ids?.tmdb ?? 0,
    mediaType: item.mediaType,
    title: item.title ?? "Unknown",
    year: item.year,
    poster: item.images?.poster?.medium ?? item.images?.poster?.full,
    backdrop: item.images?.fanart?.medium ?? item.images?.fanart?.full,
    genres: item.genres,
    seasonsMeta: item.seasons
      ?.filter(s => s.seasonNumber != null)
      .map(s => ({
        seasonNumber: s.seasonNumber as number,
        episodeCount: s.episodeCount ?? 0,
        name: s.name,
      })),
  }
}
