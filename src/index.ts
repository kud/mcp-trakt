#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { execFileSync } from "child_process"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

if (process.argv[2] === "setup") {
  const { spawn } = await import("child_process")
  const setupScript = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "setup.js",
  )
  spawn(process.execPath, [setupScript], { stdio: "inherit" }).on(
    "exit",
    (code) => process.exit(code ?? 0),
  )
}

const KEYCHAIN_SERVICE = "mcp-trakt"

const keychainRead = (account: string): string | null => {
  try {
    return (
      execFileSync(
        "security",
        ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", account, "-w"],
        { stdio: ["pipe", "pipe", "pipe"] },
      )
        .toString()
        .trim() || null
    )
  } catch {
    return null
  }
}

const CLIENT_ID = process.env.TRAKT_CLIENT_ID || keychainRead("client-id")
const ACCESS_TOKEN =
  process.env.TRAKT_ACCESS_TOKEN || keychainRead("access-token")

if (!CLIENT_ID) {
  console.error(
    "Missing client ID — set TRAKT_CLIENT_ID or run: npx @kud/mcp-trakt setup",
  )
  process.exit(1)
}

if (!ACCESS_TOKEN) {
  console.error(
    "Missing access token — set TRAKT_ACCESS_TOKEN or run: npx @kud/mcp-trakt setup",
  )
  process.exit(1)
}

export const API_BASE = "https://api.trakt.tv"

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID!,
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        ...options.headers,
      },
    })
    if (!response.ok) {
      console.error(
        `API error: ${response.status} ${response.statusText} — ${path}`,
      )
      return null
    }
    if (response.status === 204) return null
    return (await response.json()) as T
  } catch (error) {
    console.error(`Fetch failed: ${path}`, error)
    return null
  }
}

const apiDelete = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: {
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID!,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })
    return response.ok
  } catch (error) {
    console.error(`Delete failed: ${path}`, error)
    return false
  }
}

export const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
})

export const err = (msg: string) => ({
  content: [{ type: "text" as const, text: `Error: ${msg}` }],
})

const today = () => new Date().toISOString().split("T")[0]!

// ─── Search ───

export const search = async ({
  query,
  type,
  limit,
}: {
  query: string
  type: "movie" | "show" | "episode" | "person" | "list"
  limit: number
}) => {
  const data = await apiFetch<unknown[]>(
    `/search/${type}?query=${encodeURIComponent(query)}&limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("search failed")
}

// ─── Movies ───

export const getMovie = async ({
  id,
  extended,
}: {
  id: string
  extended: boolean
}) => {
  const params = extended ? "?extended=full" : ""
  const data = await apiFetch<unknown>(`/movies/${id}${params}`)
  return data ? ok(data) : err("movie not found")
}

export const getTrendingMovies = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/movies/trending?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch trending movies")
}

export const getPopularMovies = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/movies/popular?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch popular movies")
}

export const getAnticipatedMovies = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/movies/anticipated?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch anticipated movies")
}

export const getBoxofficeMovies = async () => {
  const data = await apiFetch<unknown[]>("/movies/boxoffice?extended=full")
  return data ? ok(data) : err("failed to fetch box office movies")
}

export const getMovieRatings = async ({ id }: { id: string }) => {
  const data = await apiFetch<unknown>(`/movies/${id}/ratings`)
  return data ? ok(data) : err("failed to fetch movie ratings")
}

export const getMovieRelated = async ({
  id,
  limit,
}: {
  id: string
  limit: number
}) => {
  const data = await apiFetch<unknown[]>(
    `/movies/${id}/related?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch related movies")
}

export const getMoviePeople = async ({ id }: { id: string }) => {
  const data = await apiFetch<unknown>(`/movies/${id}/people?extended=full`)
  return data ? ok(data) : err("failed to fetch movie people")
}

// ─── Shows ───

export const getShow = async ({
  id,
  extended,
}: {
  id: string
  extended: boolean
}) => {
  const params = extended ? "?extended=full" : ""
  const data = await apiFetch<unknown>(`/shows/${id}${params}`)
  return data ? ok(data) : err("show not found")
}

export const getTrendingShows = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/shows/trending?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch trending shows")
}

export const getPopularShows = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/shows/popular?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch popular shows")
}

export const getAnticipatedShows = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/shows/anticipated?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch anticipated shows")
}

export const getShowRatings = async ({ id }: { id: string }) => {
  const data = await apiFetch<unknown>(`/shows/${id}/ratings`)
  return data ? ok(data) : err("failed to fetch show ratings")
}

export const getShowSeasons = async ({
  id,
  with_episodes,
}: {
  id: string
  with_episodes: boolean
}) => {
  const extended = with_episodes ? "?extended=full,episodes" : "?extended=full"
  const data = await apiFetch<unknown[]>(`/shows/${id}/seasons${extended}`)
  return data ? ok(data) : err("failed to fetch seasons")
}

export const getShowPeople = async ({ id }: { id: string }) => {
  const data = await apiFetch<unknown>(`/shows/${id}/people?extended=full`)
  return data ? ok(data) : err("failed to fetch show people")
}

export const getShowRelated = async ({
  id,
  limit,
}: {
  id: string
  limit: number
}) => {
  const data = await apiFetch<unknown[]>(
    `/shows/${id}/related?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch related shows")
}

// ─── Episodes ───

export const getSeasonEpisodes = async ({
  id,
  season,
}: {
  id: string
  season: number
}) => {
  const data = await apiFetch<unknown[]>(
    `/shows/${id}/seasons/${season}?extended=full`,
  )
  return data ? ok(data) : err("failed to fetch episodes")
}

export const getEpisode = async ({
  id,
  season,
  episode,
}: {
  id: string
  season: number
  episode: number
}) => {
  const data = await apiFetch<unknown>(
    `/shows/${id}/seasons/${season}/episodes/${episode}?extended=full`,
  )
  return data ? ok(data) : err("episode not found")
}

// ─── People ───

export const getPerson = async ({ id }: { id: string }) => {
  const data = await apiFetch<unknown>(`/people/${id}?extended=full`)
  return data ? ok(data) : err("person not found")
}

export const getPersonCredits = async ({
  id,
  type,
}: {
  id: string
  type: "movies" | "shows"
}) => {
  const data = await apiFetch<unknown>(`/people/${id}/${type}?extended=full`)
  return data ? ok(data) : err("failed to fetch credits")
}

// ─── Calendar ───

export const getMyShowCalendar = async ({
  start_date,
  days,
}: {
  start_date?: string
  days: number
}) => {
  const data = await apiFetch<unknown>(
    `/calendars/my/shows/${start_date ?? today()}/${days}`,
  )
  return data ? ok(data) : err("failed to fetch show calendar")
}

export const getMyMovieCalendar = async ({
  start_date,
  days,
}: {
  start_date?: string
  days: number
}) => {
  const data = await apiFetch<unknown>(
    `/calendars/my/movies/${start_date ?? today()}/${days}`,
  )
  return data ? ok(data) : err("failed to fetch movie calendar")
}

export const getAllShowCalendar = async ({
  start_date,
  days,
}: {
  start_date?: string
  days: number
}) => {
  const data = await apiFetch<unknown>(
    `/calendars/all/shows/${start_date ?? today()}/${days}`,
  )
  return data ? ok(data) : err("failed to fetch calendar")
}

export const getAllMovieCalendar = async ({
  start_date,
  days,
}: {
  start_date?: string
  days: number
}) => {
  const data = await apiFetch<unknown>(
    `/calendars/all/movies/${start_date ?? today()}/${days}`,
  )
  return data ? ok(data) : err("failed to fetch movie calendar")
}

// ─── History ───

export const getHistory = async ({
  type,
  limit,
  page,
}: {
  type?: "movies" | "shows" | "episodes"
  limit: number
  page: number
}) => {
  const path = type ? `/sync/history/${type}` : "/sync/history"
  const data = await apiFetch<unknown[]>(
    `${path}?limit=${limit}&page=${page}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch history")
}

export const addToHistory = async ({
  movies,
  episodes,
}: {
  movies?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/history", {
    method: "POST",
    body: JSON.stringify({ movies: movies ?? [], episodes: episodes ?? [] }),
  })
  return data ? ok(data) : err("failed to add to history")
}

export const removeFromHistory = async ({
  movies,
  episodes,
}: {
  movies?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/history/remove", {
    method: "POST",
    body: JSON.stringify({ movies: movies ?? [], episodes: episodes ?? [] }),
  })
  return data ? ok(data) : err("failed to remove from history")
}

// ─── Collection ───

export const getCollectionMovies = async ({
  extended,
}: {
  extended: boolean
}) => {
  const params = extended ? "?extended=full" : ""
  const data = await apiFetch<unknown[]>(`/sync/collection/movies${params}`)
  return data ? ok(data) : err("failed to fetch movie collection")
}

export const getCollectionShows = async ({
  extended,
}: {
  extended: boolean
}) => {
  const params = extended ? "?extended=full" : ""
  const data = await apiFetch<unknown[]>(`/sync/collection/shows${params}`)
  return data ? ok(data) : err("failed to fetch show collection")
}

export const addToCollection = async ({
  movies,
  shows,
  episodes,
}: {
  movies?: unknown[]
  shows?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/collection", {
    method: "POST",
    body: JSON.stringify({
      movies: movies ?? [],
      shows: shows ?? [],
      episodes: episodes ?? [],
    }),
  })
  return data ? ok(data) : err("failed to add to collection")
}

export const removeFromCollection = async ({
  movies,
  shows,
  episodes,
}: {
  movies?: unknown[]
  shows?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/collection/remove", {
    method: "POST",
    body: JSON.stringify({
      movies: movies ?? [],
      shows: shows ?? [],
      episodes: episodes ?? [],
    }),
  })
  return data ? ok(data) : err("failed to remove from collection")
}

// ─── Watched ───

export const getWatchedMovies = async ({ extended }: { extended: boolean }) => {
  const params = extended ? "?extended=full" : ""
  const data = await apiFetch<unknown[]>(`/sync/watched/movies${params}`)
  return data ? ok(data) : err("failed to fetch watched movies")
}

export const getWatchedShows = async ({ extended }: { extended: boolean }) => {
  const params = extended ? "?extended=full" : ""
  const data = await apiFetch<unknown[]>(`/sync/watched/shows${params}`)
  return data ? ok(data) : err("failed to fetch watched shows")
}

// ─── Playback ───

export const getPlayback = async ({
  type,
}: {
  type?: "movies" | "episodes"
}) => {
  const path = type ? `/sync/playback/${type}` : "/sync/playback"
  const data = await apiFetch<unknown[]>(path)
  return data ? ok(data) : err("failed to fetch playback progress")
}

export const deletePlayback = async ({
  id,
  confirm,
}: {
  id: number
  confirm: boolean
}) => {
  if (!confirm) return err("set confirm: true to delete playback progress")
  const success = await apiDelete(`/sync/playback/${id}`)
  return success ? ok({ success: true }) : err(`delete playback failed`)
}

// ─── Sync ───

export const getSyncLastActivities = async () => {
  const data = await apiFetch<unknown>("/sync/last_activities")
  return data ? ok(data) : err("failed to fetch last activities")
}

// ─── Ratings ───

export const getRatings = async ({
  type,
  rating,
}: {
  type?: "movies" | "shows" | "episodes" | "seasons"
  rating?: number
}) => {
  const path = type ? `/sync/ratings/${type}` : "/sync/ratings"
  const ratingFilter = rating ? `/${rating}` : ""
  const data = await apiFetch<unknown[]>(`${path}${ratingFilter}?extended=full`)
  return data ? ok(data) : err("failed to fetch ratings")
}

export const addRating = async ({
  movies,
  shows,
  episodes,
}: {
  movies?: unknown[]
  shows?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/ratings", {
    method: "POST",
    body: JSON.stringify({
      movies: movies ?? [],
      shows: shows ?? [],
      episodes: episodes ?? [],
    }),
  })
  return data ? ok(data) : err("failed to add ratings")
}

export const removeRating = async ({
  movies,
  shows,
  episodes,
}: {
  movies?: unknown[]
  shows?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/ratings/remove", {
    method: "POST",
    body: JSON.stringify({
      movies: movies ?? [],
      shows: shows ?? [],
      episodes: episodes ?? [],
    }),
  })
  return data ? ok(data) : err("failed to remove ratings")
}

// ─── Watchlist ───

export const getWatchlist = async ({
  type,
  sort,
}: {
  type?: "movies" | "shows" | "episodes" | "seasons"
  sort: string
}) => {
  const path = type ? `/sync/watchlist/${type}/${sort}` : "/sync/watchlist"
  const data = await apiFetch<unknown[]>(`${path}?extended=full`)
  return data ? ok(data) : err("failed to fetch watchlist")
}

export const addToWatchlist = async ({
  movies,
  shows,
  episodes,
}: {
  movies?: unknown[]
  shows?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/watchlist", {
    method: "POST",
    body: JSON.stringify({
      movies: movies ?? [],
      shows: shows ?? [],
      episodes: episodes ?? [],
    }),
  })
  return data ? ok(data) : err("failed to add to watchlist")
}

export const removeFromWatchlist = async ({
  movies,
  shows,
  episodes,
}: {
  movies?: unknown[]
  shows?: unknown[]
  episodes?: unknown[]
}) => {
  const data = await apiFetch<unknown>("/sync/watchlist/remove", {
    method: "POST",
    body: JSON.stringify({
      movies: movies ?? [],
      shows: shows ?? [],
      episodes: episodes ?? [],
    }),
  })
  return data ? ok(data) : err("failed to remove from watchlist")
}

// ─── Checkin ───

export const checkin = async ({
  movie,
  episode,
  message,
}: {
  movie?: unknown
  episode?: unknown
  message?: string
}) => {
  const body: Record<string, unknown> = {}
  if (movie) body.movie = movie
  if (episode) body.episode = episode
  if (message) body.message = message
  const data = await apiFetch<unknown>("/checkin", {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!data)
    return err(
      "checkin failed — you may already be checked in, or the item was not found",
    )
  return ok(data)
}

export const deleteCheckin = async ({ confirm }: { confirm: boolean }) => {
  if (!confirm) return err("set confirm: true to cancel the active checkin")
  const success = await apiDelete("/checkin")
  return success ? ok({ success: true }) : err("delete checkin failed")
}

// ─── Scrobble ───

export const scrobbleStart = async ({
  movie,
  episode,
  show,
  progress,
}: {
  movie?: unknown
  episode?: unknown
  show?: unknown
  progress: number
}) => {
  const body: Record<string, unknown> = { progress }
  if (movie) body.movie = movie
  if (episode) body.episode = episode
  if (show) body.show = show
  const data = await apiFetch<unknown>("/scrobble/start", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return data ? ok(data) : err("scrobble start failed")
}

export const scrobblePause = async ({
  movie,
  episode,
  show,
  progress,
}: {
  movie?: unknown
  episode?: unknown
  show?: unknown
  progress: number
}) => {
  const body: Record<string, unknown> = { progress }
  if (movie) body.movie = movie
  if (episode) body.episode = episode
  if (show) body.show = show
  const data = await apiFetch<unknown>("/scrobble/pause", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return data ? ok(data) : err("scrobble pause failed")
}

export const scrobbleStop = async ({
  movie,
  episode,
  show,
  progress,
}: {
  movie?: unknown
  episode?: unknown
  show?: unknown
  progress: number
}) => {
  const body: Record<string, unknown> = { progress }
  if (movie) body.movie = movie
  if (episode) body.episode = episode
  if (show) body.show = show
  const data = await apiFetch<unknown>("/scrobble/stop", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return data ? ok(data) : err("scrobble stop failed")
}

// ─── Recommendations ───

export const getMovieRecommendations = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/recommendations/movies?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch movie recommendations")
}

export const getShowRecommendations = async ({ limit }: { limit: number }) => {
  const data = await apiFetch<unknown[]>(
    `/recommendations/shows?limit=${limit}&extended=full`,
  )
  return data ? ok(data) : err("failed to fetch show recommendations")
}

// ─── User ───

export const getUserProfile = async ({ username }: { username: string }) => {
  const data = await apiFetch<unknown>(`/users/${username}?extended=full`)
  return data ? ok(data) : err("user not found")
}

export const getUserStats = async ({ username }: { username: string }) => {
  const data = await apiFetch<unknown>(`/users/${username}/stats`)
  return data ? ok(data) : err("failed to fetch user stats")
}

export const getUserWatching = async ({ username }: { username: string }) => {
  const data = await apiFetch<unknown>(`/users/${username}/watching`)
  return data ? ok(data) : err("user is not currently watching anything")
}

// ─── Server ───

const server = new McpServer({ name: "trakt", version: "1.0.0" })

// ─── Search ───

server.registerTool(
  "search",
  {
    description:
      "Search for movies, shows, episodes, people, or lists on Trakt",
    inputSchema: {
      query: z.string().describe("Search query"),
      type: z
        .enum(["movie", "show", "episode", "person", "list"])
        .default("movie")
        .describe("Type of content to search"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Number of results to return"),
    },
  },
  search,
)

// ─── Movies ───

server.registerTool(
  "get_movie",
  {
    description: "Get detailed information about a movie",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
      extended: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include full info"),
    },
  },
  getMovie,
)

server.registerTool(
  "get_trending_movies",
  {
    description: "Get movies currently being watched across Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getTrendingMovies,
)

server.registerTool(
  "get_popular_movies",
  {
    description: "Get the most popular movies on Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getPopularMovies,
)

server.registerTool(
  "get_anticipated_movies",
  {
    description: "Get the most anticipated movies based on watchlist activity",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getAnticipatedMovies,
)

server.registerTool(
  "get_boxoffice_movies",
  {
    description: "Get the top 10 weekend box office movies updated weekly",
    inputSchema: {},
  },
  getBoxofficeMovies,
)

server.registerTool(
  "get_movie_ratings",
  {
    description: "Get community rating distribution for a movie",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  getMovieRatings,
)

server.registerTool(
  "get_movie_related",
  {
    description: "Get movies related to a given movie",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
      limit: z.number().optional().default(10),
    },
  },
  getMovieRelated,
)

server.registerTool(
  "get_movie_people",
  {
    description: "Get cast and crew for a movie",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  getMoviePeople,
)

// ─── Shows ───

server.registerTool(
  "get_show",
  {
    description: "Get detailed information about a TV show",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
      extended: z.boolean().optional().default(true),
    },
  },
  getShow,
)

server.registerTool(
  "get_trending_shows",
  {
    description: "Get TV shows currently being watched across Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getTrendingShows,
)

server.registerTool(
  "get_popular_shows",
  {
    description: "Get the most popular TV shows on Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getPopularShows,
)

server.registerTool(
  "get_anticipated_shows",
  {
    description:
      "Get the most anticipated TV shows based on watchlist activity",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getAnticipatedShows,
)

server.registerTool(
  "get_show_ratings",
  {
    description: "Get community rating distribution for a TV show",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  getShowRatings,
)

server.registerTool(
  "get_show_seasons",
  {
    description:
      "Get all seasons for a TV show, optionally with full episode details",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
      with_episodes: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include episode list per season"),
    },
  },
  getShowSeasons,
)

server.registerTool(
  "get_show_people",
  {
    description: "Get cast and crew for a TV show",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  getShowPeople,
)

server.registerTool(
  "get_show_related",
  {
    description: "Get TV shows related to a given show",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
      limit: z.number().optional().default(10),
    },
  },
  getShowRelated,
)

// ─── Episodes ───

server.registerTool(
  "get_season_episodes",
  {
    description: "Get all episodes in a specific season of a TV show",
    inputSchema: {
      id: z.string().describe("Show Trakt ID or slug"),
      season: z.number().describe("Season number"),
    },
  },
  getSeasonEpisodes,
)

server.registerTool(
  "get_episode",
  {
    description: "Get full details for a specific episode of a TV show",
    inputSchema: {
      id: z.string().describe("Show Trakt ID or slug"),
      season: z.number().describe("Season number"),
      episode: z.number().describe("Episode number"),
    },
  },
  getEpisode,
)

// ─── People ───

server.registerTool(
  "get_person",
  {
    description: "Get details about a person (actor, director, etc.)",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB ID"),
    },
  },
  getPerson,
)

server.registerTool(
  "get_person_credits",
  {
    description: "Get movie or show credits for a person",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB ID"),
      type: z.enum(["movies", "shows"]).default("movies"),
    },
  },
  getPersonCredits,
)

// ─── Calendar ───

server.registerTool(
  "get_my_show_calendar",
  {
    description: "Get my upcoming show episodes based on shows I watch",
    inputSchema: {
      start_date: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD, defaults to today"),
      days: z.number().optional().default(7).describe("Number of days ahead"),
    },
  },
  getMyShowCalendar,
)

server.registerTool(
  "get_my_movie_calendar",
  {
    description: "Get my upcoming movies based on movies in my watchlist",
    inputSchema: {
      start_date: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD, defaults to today"),
      days: z.number().optional().default(7),
    },
  },
  getMyMovieCalendar,
)

server.registerTool(
  "get_all_show_calendar",
  {
    description: "Get all shows premiering and airing across all Trakt users",
    inputSchema: {
      start_date: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD, defaults to today"),
      days: z.number().optional().default(7),
    },
  },
  getAllShowCalendar,
)

server.registerTool(
  "get_all_movie_calendar",
  {
    description: "Get all movies releasing across all Trakt users",
    inputSchema: {
      start_date: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD, defaults to today"),
      days: z.number().optional().default(7),
    },
  },
  getAllMovieCalendar,
)

// ─── History ───

server.registerTool(
  "get_history",
  {
    description: "Get watch history for the authenticated user",
    inputSchema: {
      type: z
        .enum(["movies", "shows", "episodes"])
        .optional()
        .describe("Filter by content type"),
      limit: z.number().optional().default(20),
      page: z.number().optional().default(1),
    },
  },
  getHistory,
)

server.registerTool(
  "add_to_history",
  {
    description: "Mark movies or episodes as watched",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
              tmdb: z.number().optional(),
            }),
            watched_at: z
              .string()
              .optional()
              .describe("ISO 8601 datetime — defaults to now if omitted"),
          }),
        )
        .optional(),
      episodes: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              tvdb: z.number().optional(),
            }),
            watched_at: z.string().optional(),
          }),
        )
        .optional(),
    },
  },
  addToHistory,
)

server.registerTool(
  "remove_from_history",
  {
    description: "Remove items from watch history",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(z.object({ ids: z.object({ trakt: z.number().optional() }) }))
        .optional(),
    },
  },
  removeFromHistory,
)

// ─── Collection ───

server.registerTool(
  "get_collection_movies",
  {
    description: "Get all movies in the authenticated user's collection",
    inputSchema: {
      extended: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include full movie info"),
    },
  },
  getCollectionMovies,
)

server.registerTool(
  "get_collection_shows",
  {
    description: "Get all shows in the authenticated user's collection",
    inputSchema: {
      extended: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include full show info"),
    },
  },
  getCollectionShows,
)

server.registerTool(
  "add_to_collection",
  {
    description: "Add movies, shows, or episodes to the user's collection",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
              tmdb: z.number().optional(),
            }),
            collected_at: z.string().optional(),
            media_type: z.string().optional(),
            resolution: z.string().optional(),
          }),
        )
        .optional(),
      shows: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(z.object({ ids: z.object({ trakt: z.number().optional() }) }))
        .optional(),
    },
  },
  addToCollection,
)

server.registerTool(
  "remove_from_collection",
  {
    description: "Remove movies, shows, or episodes from the user's collection",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      shows: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(z.object({ ids: z.object({ trakt: z.number().optional() }) }))
        .optional(),
    },
  },
  removeFromCollection,
)

// ─── Watched ───

server.registerTool(
  "get_watched_movies",
  {
    description:
      "Get all movies the authenticated user has watched with play counts",
    inputSchema: {
      extended: z.boolean().optional().default(true),
    },
  },
  getWatchedMovies,
)

server.registerTool(
  "get_watched_shows",
  {
    description:
      "Get all shows the authenticated user has watched with play counts per episode",
    inputSchema: {
      extended: z.boolean().optional().default(true),
    },
  },
  getWatchedShows,
)

// ─── Playback ───

server.registerTool(
  "get_playback",
  {
    description:
      "Get paused playback progress for movies or episodes to resume later",
    inputSchema: {
      type: z
        .enum(["movies", "episodes"])
        .optional()
        .describe("Filter by content type"),
    },
  },
  getPlayback,
)

server.registerTool(
  "delete_playback",
  {
    description: "Delete a paused playback entry",
    inputSchema: {
      id: z.number().describe("Playback ID to delete"),
      confirm: z
        .boolean()
        .default(false)
        .describe("Set to true to confirm deletion"),
    },
  },
  deletePlayback,
)

// ─── Sync ───

server.registerTool(
  "get_sync_last_activities",
  {
    description:
      "Get timestamps for when each resource was last updated — useful for syncing only changed data",
    inputSchema: {},
  },
  getSyncLastActivities,
)

// ─── Ratings ───

server.registerTool(
  "get_ratings",
  {
    description: "Get ratings given by the authenticated user",
    inputSchema: {
      type: z
        .enum(["movies", "shows", "episodes", "seasons"])
        .optional()
        .describe("Filter by content type"),
      rating: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Filter by specific rating value"),
    },
  },
  getRatings,
)

server.registerTool(
  "add_rating",
  {
    description: "Rate movies, shows, seasons, or episodes (1–10)",
    inputSchema: {
      movies: z
        .array(
          z.object({
            rating: z.number().min(1).max(10),
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
              tmdb: z.number().optional(),
            }),
          }),
        )
        .optional(),
      shows: z
        .array(
          z.object({
            rating: z.number().min(1).max(10),
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(
          z.object({
            rating: z.number().min(1).max(10),
            ids: z.object({ trakt: z.number().optional() }),
          }),
        )
        .optional(),
    },
  },
  addRating,
)

server.registerTool(
  "remove_rating",
  {
    description: "Remove ratings from movies, shows, or episodes",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      shows: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(z.object({ ids: z.object({ trakt: z.number().optional() }) }))
        .optional(),
    },
  },
  removeRating,
)

// ─── Watchlist ───

server.registerTool(
  "get_watchlist",
  {
    description: "Get the authenticated user's watchlist",
    inputSchema: {
      type: z.enum(["movies", "shows", "episodes", "seasons"]).optional(),
      sort: z
        .enum([
          "rank",
          "added",
          "title",
          "released",
          "runtime",
          "popularity",
          "percentage",
          "votes",
        ])
        .optional()
        .default("rank"),
    },
  },
  getWatchlist,
)

server.registerTool(
  "add_to_watchlist",
  {
    description: "Add movies, shows, or episodes to the watchlist",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
              tmdb: z.number().optional(),
            }),
          }),
        )
        .optional(),
      shows: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(z.object({ ids: z.object({ trakt: z.number().optional() }) }))
        .optional(),
    },
  },
  addToWatchlist,
)

server.registerTool(
  "remove_from_watchlist",
  {
    description: "Remove movies, shows, or episodes from the watchlist",
    inputSchema: {
      movies: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      shows: z
        .array(
          z.object({
            ids: z.object({
              trakt: z.number().optional(),
              imdb: z.string().optional(),
            }),
          }),
        )
        .optional(),
      episodes: z
        .array(z.object({ ids: z.object({ trakt: z.number().optional() }) }))
        .optional(),
    },
  },
  removeFromWatchlist,
)

// ─── Checkin ───

server.registerTool(
  "checkin",
  {
    description: "Check in to a movie or episode you are watching right now",
    inputSchema: {
      movie: z
        .object({
          ids: z.object({
            trakt: z.number().optional(),
            imdb: z.string().optional(),
            tmdb: z.number().optional(),
          }),
        })
        .optional()
        .describe("Movie to check in to (mutually exclusive with episode)"),
      episode: z
        .object({
          ids: z.object({
            trakt: z.number().optional(),
            tvdb: z.number().optional(),
          }),
        })
        .optional()
        .describe("Episode to check in to (mutually exclusive with movie)"),
      message: z.string().optional().describe("Optional shout message"),
    },
  },
  checkin,
)

server.registerTool(
  "delete_checkin",
  {
    description: "Cancel the current active checkin",
    inputSchema: {
      confirm: z
        .boolean()
        .default(false)
        .describe("Set to true to confirm cancellation"),
    },
  },
  deleteCheckin,
)

// ─── Scrobble ───

const scrobbleSchema = {
  movie: z
    .object({
      title: z.string().optional(),
      year: z.number().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        imdb: z.string().optional(),
        tmdb: z.number().optional(),
      }),
    })
    .optional()
    .describe("Movie to scrobble (mutually exclusive with episode)"),
  episode: z
    .object({
      season: z.number().optional(),
      number: z.number().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        tvdb: z.number().optional(),
      }),
    })
    .optional()
    .describe("Episode to scrobble (mutually exclusive with movie)"),
  show: z
    .object({
      title: z.string().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        imdb: z.string().optional(),
      }),
    })
    .optional()
    .describe("Show context when scrobbling an episode"),
  progress: z
    .number()
    .min(0)
    .max(100)
    .describe("Playback progress percentage (0–100)"),
}

server.registerTool(
  "scrobble_start",
  {
    description:
      "Start scrobbling — call when playback begins to track what you are watching",
    inputSchema: scrobbleSchema,
  },
  scrobbleStart,
)

server.registerTool(
  "scrobble_pause",
  {
    description:
      "Pause scrobbling — call when playback is paused to save progress",
    inputSchema: scrobbleSchema,
  },
  scrobblePause,
)

server.registerTool(
  "scrobble_stop",
  {
    description:
      "Stop scrobbling — call when playback ends to record the watch",
    inputSchema: scrobbleSchema,
  },
  scrobbleStop,
)

// ─── Recommendations ───

server.registerTool(
  "get_movie_recommendations",
  {
    description:
      "Get personalized movie recommendations for the authenticated user",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getMovieRecommendations,
)

server.registerTool(
  "get_show_recommendations",
  {
    description:
      "Get personalized TV show recommendations for the authenticated user",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  getShowRecommendations,
)

// ─── User ───

server.registerTool(
  "get_user_profile",
  {
    description:
      "Get profile information for a user (defaults to authenticated user)",
    inputSchema: {
      username: z
        .string()
        .optional()
        .default("me")
        .describe("Trakt username, or 'me' for the authenticated user"),
    },
  },
  getUserProfile,
)

server.registerTool(
  "get_user_stats",
  {
    description: "Get watch statistics for a user",
    inputSchema: {
      username: z.string().optional().default("me"),
    },
  },
  getUserStats,
)

server.registerTool(
  "get_user_watching",
  {
    description: "Get what a user is currently watching",
    inputSchema: {
      username: z.string().optional().default("me"),
    },
  },
  getUserWatching,
)

const main = async () => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("mcp-trakt running")
}

main().catch((error) => {
  console.error("Fatal:", error)
  process.exit(1)
})
