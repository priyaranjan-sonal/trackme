export type MediaType = "movie" | "tv"
export type TrackStatus = "watchlist" | "watching" | "watched"

export interface MovieImages {
  fanart?: { full?: string; medium?: string; thumb?: string }
  poster?: { full?: string; medium?: string; thumb?: string }
}

export interface Video {
  key?: string
  name?: string
  type?: string
  site?: string
}

export interface CastMember {
  person?: { name?: string; profile?: string }
  character?: string
}

export interface CrewMember {
  person?: { name?: string; profile?: string }
  job?: string
}

export interface SeasonSummary {
  id?: number
  seasonNumber?: number
  episodeCount?: number
  name?: string
  airDate?: string
  poster?: string
  overview?: string
}

export interface Episode {
  id?: number
  episodeNumber?: number
  seasonNumber?: number
  name?: string
  overview?: string
  airDate?: string
  runtime?: number
  rating?: number
  votes?: number
  still?: string
}

export interface SeasonDetail {
  id?: number
  seasonNumber?: number
  name?: string
  overview?: string
  airDate?: string
  poster?: string
  episodes?: Episode[]
}

/* ─── Media items (unified) ─────────────────────────────────────────── */

export interface MediaBase {
  mediaType?: MediaType
  title?: string
  year?: number
  tagline?: string
  overview?: string
  runtime?: number
  language?: string
  country?: string
  status?: string
  released?: string
  certification?: string
  rating?: number
  votes?: number
  popularity?: number
  genres?: string[]
  ids?: { imdb?: string; tmdb?: number }
  images?: MovieImages
  trailers?: Video[]
  cast?: CastMember[]
  crew?: Record<string, CrewMember[]>
  similar?: MediaItem[]
}

export interface Movie extends MediaBase {
  mediaType?: "movie"
  budget?: number
  revenue?: number
}

export interface TvShow extends MediaBase {
  mediaType?: "tv"
  numberOfSeasons?: number
  numberOfEpisodes?: number
  inProduction?: boolean
  lastAirDate?: string
  seasons?: SeasonSummary[]
}

export type MediaItem = Movie | TvShow

/* ─── Tracking ──────────────────────────────────────────────────────── */

export interface EpisodeProgressEntry {
  seasonNumber: number
  episodeNumber: number
  watchedAt: string
}

export interface SeasonMeta {
  seasonNumber: number
  episodeCount: number
  name?: string
}

export interface TrackedItem {
  id: string
  tmdbId: number
  mediaType: MediaType
  status: TrackStatus
  rating?: number
  episodeProgress: EpisodeProgressEntry[]
  seasonsMeta: SeasonMeta[]
  title: string
  year?: number
  poster?: string
  backdrop?: string
  genres?: string[]
  notes?: string
  addedAt: string
  updatedAt: string
}

/* Snapshot payload used when adding media to tracking from cards/search */
export interface MediaSnapshot {
  tmdbId: number
  mediaType: MediaType
  title: string
  year?: number
  poster?: string
  backdrop?: string
  genres?: string[]
  seasonsMeta?: SeasonMeta[]
}
