import { NextRequest, NextResponse } from "next/server"
import { connect } from "@/dbConfig/dbConfig"
import TrackedItem, { ITrackedItem } from "@/models/trackedItemModel"
import { verifyToken } from "@/helpers/authHelpers"
import type { MediaSnapshot, TrackStatus } from "@/types/media"

export interface SerializedTrackedItem {
  id: string
  tmdbId: number
  mediaType: "movie" | "tv"
  status: TrackStatus
  rating?: number
  episodeProgress: { seasonNumber: number; episodeNumber: number; watchedAt: string }[]
  seasonsMeta: { seasonNumber: number; episodeCount: number; name?: string }[]
  title: string
  year?: number
  poster?: string
  backdrop?: string
  genres?: string[]
  notes?: string
  addedAt: string
  updatedAt: string
}

export function serializeTrackedItem(item: ITrackedItem): SerializedTrackedItem {
  return {
    id: item._id.toString(),
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    status: item.status,
    rating: item.rating,
    episodeProgress: item.episodeProgress.map(p => ({
      seasonNumber: p.seasonNumber,
      episodeNumber: p.episodeNumber,
      watchedAt: new Date(p.watchedAt).toISOString(),
    })),
    seasonsMeta: item.seasonsMeta.map(s => ({
      seasonNumber: s.seasonNumber,
      episodeCount: s.episodeCount,
      name: s.name,
    })),
    title: item.title,
    year: item.year,
    poster: item.poster,
    backdrop: item.backdrop,
    genres: item.genres,
    notes: item.notes,
    addedAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
  }
}

const VALID_STATUSES: TrackStatus[] = ["watchlist", "watching", "watched"]

export async function GET(request: NextRequest) {
  const payload = verifyToken(request)
  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tmdbId = searchParams.get("tmdbId")
  const mediaType = searchParams.get("mediaType")

  try {
    await connect()

    if (tmdbId && mediaType && (mediaType === "movie" || mediaType === "tv")) {
      const item = await TrackedItem.findOne({
        userId: payload.id,
        tmdbId: Number(tmdbId),
        mediaType,
      })
      return NextResponse.json({
        success: true,
        data: item ? serializeTrackedItem(item) : null,
      })
    }

    const items = await TrackedItem.find({ userId: payload.id }).sort({ updatedAt: -1 })
    return NextResponse.json({
      success: true,
      data: items.map(serializeTrackedItem),
    })
  } catch (error) {
    console.error("GET /api/tracking error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = verifyToken(request)
  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await connect()

    const body = (await request.json()) as Partial<MediaSnapshot> & {
      status?: TrackStatus
    }
    const { tmdbId, mediaType, title, year, poster, backdrop, genres, seasonsMeta, status } =
      body

    if (!tmdbId || !mediaType || !title) {
      return NextResponse.json(
        { error: "tmdbId, mediaType and title are required" },
        { status: 400 }
      )
    }
    if (mediaType !== "movie" && mediaType !== "tv") {
      return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 })
    }
    const nextStatus: TrackStatus =
      status && VALID_STATUSES.includes(status) ? status : "watchlist"

    const existing = await TrackedItem.findOne({
      userId: payload.id,
      tmdbId: Number(tmdbId),
      mediaType,
    })

    if (existing) {
      existing.status = nextStatus
      if (typeof year === "number") existing.year = year
      if (typeof poster === "string") existing.poster = poster
      if (typeof backdrop === "string") existing.backdrop = backdrop
      if (Array.isArray(genres)) existing.genres = genres
      if (Array.isArray(seasonsMeta)) existing.seasonsMeta = seasonsMeta
      if (typeof body.rating === "number") existing.rating = body.rating
      await existing.save()
      return NextResponse.json({
        success: true,
        data: serializeTrackedItem(existing),
      })
    }

    const item = await TrackedItem.create({
      userId: payload.id,
      tmdbId: Number(tmdbId),
      mediaType,
      status: nextStatus,
      title,
      year: typeof year === "number" ? year : undefined,
      poster: typeof poster === "string" ? poster : undefined,
      backdrop: typeof backdrop === "string" ? backdrop : undefined,
      genres: Array.isArray(genres) ? genres : undefined,
      seasonsMeta: Array.isArray(seasonsMeta) ? seasonsMeta : undefined,
    })

    return NextResponse.json(
      { success: true, data: serializeTrackedItem(item) },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/tracking error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
