import { NextRequest, NextResponse } from "next/server"
import { connect } from "@/dbConfig/dbConfig"
import TrackedItem, { ITrackedItem, ISeasonMeta } from "@/models/trackedItemModel"
import { verifyToken } from "@/helpers/authHelpers"
import { serializeTrackedItem } from "../route"
import type { TrackStatus } from "@/types/media"

const VALID_STATUSES: TrackStatus[] = ["watchlist", "watching", "watched"]

function hasEpisode(item: ITrackedItem, seasonNumber: number, episodeNumber: number) {
  return item.episodeProgress.some(
    p => p.seasonNumber === seasonNumber && p.episodeNumber === episodeNumber
  )
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const payload = verifyToken(request)
  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    await connect()

    const item = await TrackedItem.findOne({ _id: id, userId: payload.id })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const action = typeof body.action === "string" ? body.action : ""

    switch (action) {
      case "status": {
        const status = body.status as TrackStatus
        if (!VALID_STATUSES.includes(status)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }
        item.status = status
        break
      }

      case "rating": {
        const rating = body.rating
        if (rating === null || rating === undefined) {
          item.rating = undefined
        } else if (typeof rating === "number" && rating >= 0.5 && rating <= 10) {
          item.rating = Math.round(rating * 10) / 10
        } else {
          return NextResponse.json({ error: "Rating must be between 0.5 and 10" }, { status: 400 })
        }
        break
      }

      case "toggleEpisode": {
        const seasonNumber = Number(body.seasonNumber)
        const episodeNumber = Number(body.episodeNumber)
        if (!Number.isFinite(seasonNumber) || !Number.isFinite(episodeNumber)) {
          return NextResponse.json({ error: "Invalid episode" }, { status: 400 })
        }
        if (hasEpisode(item, seasonNumber, episodeNumber)) {
          item.episodeProgress = item.episodeProgress.filter(
            p => !(p.seasonNumber === seasonNumber && p.episodeNumber === episodeNumber)
          )
        } else {
          item.episodeProgress.push({ seasonNumber, episodeNumber, watchedAt: new Date() })
        }
        break
      }

      case "markSeason": {
        const seasonNumber = Number(body.seasonNumber)
        const watched = body.watched === true
        const meta = item.seasonsMeta.find(s => s.seasonNumber === seasonNumber)
        if (!meta) {
          return NextResponse.json({ error: "Season not found in this item" }, { status: 400 })
        }
        item.episodeProgress = item.episodeProgress.filter(
          p => p.seasonNumber !== seasonNumber
        )
        if (watched) {
          for (let ep = 1; ep <= meta.episodeCount; ep++) {
            item.episodeProgress.push({ seasonNumber, episodeNumber: ep, watchedAt: new Date() })
          }
        }
        break
      }

      case "meta": {
        const seasonsMeta = body.seasonsMeta
        if (!Array.isArray(seasonsMeta)) {
          return NextResponse.json({ error: "Invalid seasonsMeta" }, { status: 400 })
        }
        item.seasonsMeta = seasonsMeta as ISeasonMeta[]
        break
      }

      case "notes": {
        item.notes = typeof body.notes === "string" ? body.notes : undefined
        break
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    await item.save()
    return NextResponse.json({ success: true, data: serializeTrackedItem(item) })
  } catch (error) {
    console.error("PATCH /api/tracking/[id] error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const payload = verifyToken(request)
  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    await connect()

    const item = await TrackedItem.findOneAndDelete({ _id: id, userId: payload.id })
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/tracking/[id] error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
