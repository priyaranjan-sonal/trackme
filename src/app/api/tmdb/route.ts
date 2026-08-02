import { NextRequest, NextResponse } from "next/server"
import type {
  CastMember,
  CrewMember,
  Episode,
  MediaItem,
  SeasonDetail,
  Video,
} from "@/types/media"

const TMDB_BASE = "https://api.themoviedb.org/3"
const IMG_BASE = "https://image.tmdb.org/t/p"

const LIST_ENDPOINTS: Record<string, { path: string; mediaType: "movie" | "tv" }> = {
  "movies/trending":    { path: "trending/movie/day",    mediaType: "movie" },
  "movies/popular":     { path: "movie/popular",         mediaType: "movie" },
  "movies/top_rated":   { path: "movie/top_rated",       mediaType: "movie" },
  "movies/upcoming":    { path: "movie/upcoming",        mediaType: "movie" },
  "movies/now_playing": { path: "movie/now_playing",     mediaType: "movie" },
  "tv/trending":        { path: "trending/tv/day",       mediaType: "tv" },
  "tv/popular":         { path: "tv/popular",            mediaType: "tv" },
  "tv/top_rated":       { path: "tv/top_rated",          mediaType: "tv" },
  "tv/on_the_air":      { path: "tv/on_the_air",         mediaType: "tv" },
  "tv/airing_today":    { path: "tv/airing_today",       mediaType: "tv" },
}

const SEARCH_ENDPOINTS: Record<string, "movie" | "tv" | "multi"> = {
  "search/movie": "movie",
  "search/tv":    "tv",
  "search/multi": "multi",
}

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" } })
      if (res.ok) return res
      if (res.status < 500) return res
      lastError = new Error(`TMDB status ${res.status}`)
    } catch (error) {
      lastError = error
    }
    if (i < attempts - 1) {
      await new Promise(r => setTimeout(r, 300 * (i + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error("TMDB fetch failed")
}

function buildImage(path: unknown, size: string): string | undefined {
  return typeof path === "string" && path ? `${IMG_BASE}/${size}${path}` : undefined
}

/* ─── Genres (movie + tv, cached) ─────────────────────────────────── */

let genreCache: { map: Record<number, string>; at: number } | null = null
const GENRE_TTL = 1000 * 60 * 60 * 24

async function getGenreMap(apiKey: string): Promise<Record<number, string>> {
  if (genreCache && Date.now() - genreCache.at < GENRE_TTL) return genreCache.map

  const map: Record<number, string> = {}
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetchWithRetry(`${TMDB_BASE}/genre/movie/list?language=en-US&api_key=${apiKey}`),
      fetchWithRetry(`${TMDB_BASE}/genre/tv/list?language=en-US&api_key=${apiKey}`),
    ])
    for (const res of [movieRes, tvRes]) {
      if (!res.ok) continue
      const data = await res.json()
      for (const g of Array.isArray(data.genres) ? data.genres : []) {
        map[Number(g.id)] = g.name
      }
    }
    genreCache = { map, at: Date.now() }
  } catch {
    /* keep partial map */
  }
  return map
}

/* ─── Normalizers ─────────────────────────────────────────────────── */

function resolveGenres(
  raw: Record<string, unknown>,
  genreMap: Record<number, string>
): string[] {
  const named = Array.isArray(raw.genres)
    ? raw.genres
        .map((g: unknown) =>
          typeof g === "string" ? g : (g as { name?: unknown }).name
        )
        .filter((name: unknown): name is string => typeof name === "string")
    : []
  if (named.length > 0) return named
  const ids = Array.isArray(raw.genre_ids)
    ? raw.genre_ids.map((id: unknown) => Number(id))
    : []
  return ids.map(id => genreMap[id]).filter(Boolean)
}

function baseMedia(
  raw: Record<string, unknown>,
  mediaType: "movie" | "tv",
  genreMap: Record<number, string>
) {
  const isMovie = mediaType === "movie"
  const dateStr =
    typeof (isMovie ? raw.release_date : raw.first_air_date) === "string"
      ? (isMovie ? raw.release_date : raw.first_air_date) as string
      : undefined
  const year = dateStr ? Number(dateStr.slice(0, 4)) : undefined

  return {
    id: raw.id,
    title: (isMovie ? raw.title : raw.name) ?? undefined,
    year: year && Number.isFinite(year) ? year : undefined,
    tagline: raw.tagline ?? undefined,
    overview: raw.overview ?? undefined,
    runtime: raw.runtime ?? undefined,
    language: raw.original_language ?? undefined,
    country: Array.isArray(raw.origin_country)
      ? (raw.origin_country as string[])[0] ?? undefined
      : undefined,
    status: raw.status ?? undefined,
    released: dateStr,
    rating: raw.vote_average ?? undefined,
    votes: raw.vote_count ?? undefined,
    popularity: raw.popularity ?? undefined,
    genres: resolveGenres(raw, genreMap),
    ids: { imdb: raw.imdb_id ?? undefined, tmdb: raw.id },
    images: {
      poster: {
        full: buildImage(raw.poster_path, "w500"),
        medium: buildImage(raw.poster_path, "w342"),
        thumb: buildImage(raw.poster_path, "w185"),
      },
      fanart: {
        full: buildImage(raw.backdrop_path, "w1280"),
        medium: buildImage(raw.backdrop_path, "w780"),
      },
    },
  }
}

function toMovie(raw: Record<string, unknown>, genreMap: Record<number, string>) {
  const base = baseMedia(raw, "movie", genreMap) as Record<string, unknown>
  const data = {
    ...base,
    mediaType: "movie" as const,
    certification: getMovieCertification(raw),
    budget: raw.budget ?? undefined,
    revenue: raw.revenue ?? undefined,
    trailers: toTrailers(raw),
    cast: toCast(raw),
    crew: toCrew(raw),
    similar: toSimilar(raw, "movie", genreMap),
  }
  return data
}

function toTv(raw: Record<string, unknown>, genreMap: Record<number, string>) {
  const base = baseMedia(raw, "tv", genreMap) as Record<string, unknown>
  const seasons = Array.isArray(raw.seasons)
    ? raw.seasons
        .filter((s: Record<string, unknown>) => Number(s.season_number) > 0)
        .map((s: Record<string, unknown>) => ({
          id: s.id,
          seasonNumber: Number(s.season_number),
          episodeCount: Number(s.episode_count ?? 0),
          name: typeof s.name === "string" ? s.name : undefined,
          airDate: typeof s.air_date === "string" ? s.air_date : undefined,
          poster: buildImage(s.poster_path, "w342"),
          overview: typeof s.overview === "string" ? s.overview : undefined,
        }))
    : []

  const data = {
    ...base,
    mediaType: "tv" as const,
    numberOfSeasons: raw.number_of_seasons ?? undefined,
    numberOfEpisodes: raw.number_of_episodes ?? undefined,
    inProduction: raw.in_production ?? undefined,
    lastAirDate: raw.last_air_date ?? undefined,
    certification: getTvCertification(raw),
    seasons,
    trailers: toTrailers(raw),
    cast: toCast(raw),
    crew: toCrew(raw),
    similar: toSimilar(raw, "tv", genreMap),
  }
  return data
}

function toTrailers(raw: Record<string, unknown>): Video[] {
  const results = (raw.videos as { results?: Array<Record<string, unknown>> })?.results
  if (!Array.isArray(results)) return []
  return results
    .filter(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
    .map(v => ({
      key: typeof v.key === "string" ? v.key : undefined,
      name: typeof v.name === "string" ? v.name : undefined,
      type: typeof v.type === "string" ? v.type : undefined,
      site: typeof v.site === "string" ? v.site : undefined,
    }))
}

function toCast(raw: Record<string, unknown>): CastMember[] {
  const cast = (raw.credits as { cast?: Array<Record<string, unknown>> })?.cast
  if (!Array.isArray(cast)) return []
  return cast.slice(0, 24).map(c => ({
    person: {
      name: typeof c.name === "string" ? c.name : undefined,
      profile: buildImage(c.profile_path, "w185"),
    },
    character: typeof c.character === "string" ? c.character : undefined,
  }))
}

function toCrew(raw: Record<string, unknown>): Record<string, CrewMember[]> {
  const crew = (raw.credits as { crew?: Array<Record<string, unknown>> })?.crew
  if (!Array.isArray(crew)) return {}
  const grouped: Record<string, CrewMember[]> = {}
  for (const c of crew) {
    const dept = typeof c.department === "string" ? c.department : "Crew"
    grouped[dept] = grouped[dept] ?? []
    grouped[dept].push({
      person: {
        name: typeof c.name === "string" ? c.name : undefined,
        profile: buildImage(c.profile_path, "w185"),
      },
      job: typeof c.job === "string" ? c.job : undefined,
    })
  }
  return grouped
}

function toSimilar(
  raw: Record<string, unknown>,
  mediaType: "movie" | "tv",
  genreMap: Record<number, string>
): MediaItem[] {
  const results = (raw.similar as { results?: Array<Record<string, unknown>> })?.results
  if (!Array.isArray(results)) return []
  return results.slice(0, 12).map(r => toMediaListItem(r, mediaType, genreMap))
}

function toMediaListItem(
  raw: Record<string, unknown>,
  mediaType: "movie" | "tv",
  genreMap: Record<number, string>
): MediaItem {
  const item = baseMedia(raw, mediaType, genreMap)
  const out: Record<string, unknown> = { ...item, mediaType }
  if (mediaType === "tv") {
    out.numberOfSeasons = Number(raw.number_of_seasons ?? 0) || undefined
    out.numberOfEpisodes = Number(raw.number_of_episodes ?? 0) || undefined
  }
  return out as unknown as MediaItem
}

function getMovieCertification(data: Record<string, unknown>): string | undefined {
  const rd = data.release_dates as
    | { results?: Array<{ iso_3166_1?: string; release_dates?: Array<{ certification?: string }> }> }
    | undefined
  const results = rd?.results ?? []
  const region = results.find(r => r.iso_3166_1 === "US") ?? results[0]
  return region?.release_dates?.find(d => d.certification)?.certification
}

function getTvCertification(data: Record<string, unknown>): string | undefined {
  const cr = data.content_ratings as
    | { results?: Array<{ iso_3166_1?: string; rating?: string }> }
    | undefined
  const results = cr?.results ?? []
  const region = results.find(r => r.iso_3166_1 === "US") ?? results[0]
  return region?.rating
}

function toEpisode(raw: Record<string, unknown>): Episode {
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    episodeNumber: Number(raw.episode_number),
    seasonNumber: Number(raw.season_number),
    name: typeof raw.name === "string" ? raw.name : undefined,
    overview: typeof raw.overview === "string" ? raw.overview : undefined,
    airDate: typeof raw.air_date === "string" ? raw.air_date : undefined,
    runtime: typeof raw.runtime === "number" ? raw.runtime : undefined,
    rating: typeof raw.vote_average === "number" ? raw.vote_average : undefined,
    votes: typeof raw.vote_count === "number" ? raw.vote_count : undefined,
    still: buildImage(raw.still_path, "w300"),
  }
}

function toSeason(raw: Record<string, unknown>): SeasonDetail {
  const episodes = Array.isArray(raw.episodes)
    ? raw.episodes
        .filter((e: Record<string, unknown>) => Number(e.episode_number) > 0)
        .map((e: Record<string, unknown>) => toEpisode(e))
    : []
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    seasonNumber: Number(raw.season_number),
    name: typeof raw.name === "string" ? raw.name : undefined,
    overview: typeof raw.overview === "string" ? raw.overview : undefined,
    airDate: typeof raw.air_date === "string" ? raw.air_date : undefined,
    poster: buildImage(raw.poster_path, "w342"),
    episodes,
  }
}

function toCredits(raw: Record<string, unknown>) {
  return {
    cast: toCast({ credits: raw }) as unknown as CastMember[],
    crew: toCrew({ credits: raw }) as Record<string, CrewMember[]>,
  }
}

/* ─── Request handler ─────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawEndpoint = searchParams.get("endpoint") || "movies/trending"
  const query = searchParams.get("query") || ""
  const page = searchParams.get("page") || "1"
  const limit = searchParams.get("limit") || "20"

  const apiKey = process.env.MOVIE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "MOVIE_API_KEY is not configured", success: false },
      { status: 500 }
    )
  }

  try {
    let url: string
    let mode: "list" | "movie" | "tv" | "season" | "credits" = "list"
    let mediaType: "movie" | "tv" = "movie"

    // /movie/{id} , /tv/{id}
    const detailMatch = rawEndpoint.match(/^(movie|tv)\/(\d+)$/)
    // /tv/{id}/season/{n}
    const seasonMatch = rawEndpoint.match(/^tv\/(\d+)\/season\/(\d+)$/)
    // /movie/{id}/credits , /tv/{id}/credits
    const creditsMatch = rawEndpoint.match(/^(movie|tv)\/(\d+)\/credits$/)

    if (detailMatch) {
      const [, type, id] = detailMatch
      mediaType = type as "movie" | "tv"
      mode = mediaType
      const append =
        mediaType === "movie"
          ? "append_to_response=release_dates,videos,credits,similar"
          : "append_to_response=content_ratings,videos,credits,similar"
      url = `${TMDB_BASE}/${mediaType}/${id}?language=en-US&${append}`
    } else if (seasonMatch) {
      const [, id, seasonNumber] = seasonMatch
      mode = "season"
      url = `${TMDB_BASE}/tv/${id}/season/${seasonNumber}?language=en-US`
    } else if (creditsMatch) {
      const [, type, id] = creditsMatch
      mode = "credits"
      url = `${TMDB_BASE}/${type}/${id}/credits?language=en-US`
    } else if (SEARCH_ENDPOINTS[rawEndpoint]) {
      mode = "list"
      const target = SEARCH_ENDPOINTS[rawEndpoint]
      if (!query) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit, pageCount: 0, itemCount: 0 },
        })
      }
      url = `${TMDB_BASE}/search/${target}?query=${encodeURIComponent(
        query
      )}&language=en-US&include_adult=false&page=${page}`
    } else {
      const mapped = LIST_ENDPOINTS[rawEndpoint]
      if (!mapped) {
        return NextResponse.json(
          { error: `Unknown endpoint: ${rawEndpoint}`, success: false },
          { status: 400 }
        )
      }
      mediaType = mapped.mediaType
      url = `${TMDB_BASE}/${mapped.path}?language=en-US&page=${page}`
    }

    const res = await fetchWithRetry(`${url}&api_key=${apiKey}`)
    if (!res.ok) {
      return NextResponse.json(
        { error: `TMDB API error: ${res.status} ${res.statusText}`, success: false },
        { status: res.status }
      )
    }

    const data = await res.json()
    const genreMap = await getGenreMap(apiKey)

    if (mode === "credits") {
      return NextResponse.json({ success: true, data: toCredits(data) })
    }
    if (mode === "season") {
      return NextResponse.json({ success: true, data: toSeason(data) })
    }
    if (mode === "movie") {
      return NextResponse.json({ success: true, data: toMovie(data, genreMap) })
    }
    if (mode === "tv") {
      return NextResponse.json({ success: true, data: toTv(data, genreMap) })
    }

    // list / search
    const results = Array.isArray(data.results) ? data.results : []
    const items = results
      .map((item: unknown) => {
        const r = item as Record<string, unknown>
        let type: "movie" | "tv" = mediaType
        if (SEARCH_ENDPOINTS[rawEndpoint] === "multi" && r.media_type) {
          if (r.media_type !== "movie" && r.media_type !== "tv") return null
          type = r.media_type
        }
        return toMediaListItem(r, type, genreMap)
      })
      .filter((item: MediaItem | null): item is MediaItem => item != null)

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page: data.page ?? page,
        limit,
        pageCount: data.total_pages ?? "0",
        itemCount: data.total_results ?? "0",
      },
    })
  } catch (error) {
    console.error("TMDB API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from TMDB API", success: false },
      { status: 500 }
    )
  }
}
