import mongoose, { Document, Model, Schema } from "mongoose"
import type { MediaType, TrackStatus } from "@/types/media"

export interface IEpisodeProgress {
  seasonNumber: number
  episodeNumber: number
  watchedAt: Date
}

export interface ISeasonMeta {
  seasonNumber: number
  episodeCount: number
  name?: string
}

export interface ITrackedItem extends Document {
  userId: mongoose.Types.ObjectId
  tmdbId: number
  mediaType: MediaType
  status: TrackStatus
  rating?: number
  episodeProgress: IEpisodeProgress[]
  seasonsMeta: ISeasonMeta[]
  title: string
  year?: number
  poster?: string
  backdrop?: string
  genres?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const trackedItemSchema = new Schema<ITrackedItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    tmdbId: { type: Number, required: true },
    mediaType: { type: String, enum: ["movie", "tv"], required: true },
    status: {
      type: String,
      enum: ["watchlist", "watching", "watched"],
      required: true,
      default: "watchlist",
    },
    rating: { type: Number, min: 1, max: 10 },
    episodeProgress: [
      {
        seasonNumber: { type: Number, required: true },
        episodeNumber: { type: Number, required: true },
        watchedAt: { type: Date, default: Date.now },
      },
    ],
    seasonsMeta: [
      {
        seasonNumber: { type: Number, required: true },
        episodeCount: { type: Number, default: 0 },
        name: String,
      },
    ],
    title: { type: String, required: true },
    year: Number,
    poster: String,
    backdrop: String,
    genres: [String],
    notes: String,
  },
  { timestamps: true }
)

// One document per (user, media) — guarantees isolation + no duplicates
trackedItemSchema.index(
  { userId: 1, tmdbId: 1, mediaType: 1 },
  { unique: true }
)

const TrackedItem: Model<ITrackedItem> =
  mongoose.models.trackeditems ||
  mongoose.model<ITrackedItem>("trackeditems", trackedItemSchema)

export default TrackedItem
