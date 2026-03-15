#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import { z } from "zod"

const loadConfigFile = () => {
  try {
    return JSON.parse(
      readFileSync(join(homedir(), ".config", "trakt.json"), "utf8"),
    )
  } catch {
    return {}
  }
}

const fileConfig = loadConfigFile()

const CLIENT_ID = process.env.TRAKT_CLIENT_ID ?? fileConfig.clientId
const ACCESS_TOKEN = process.env.TRAKT_ACCESS_TOKEN ?? fileConfig.accessToken

if (!CLIENT_ID) {
  console.error(
    "TRAKT_CLIENT_ID env var or clientId in ~/.config/trakt.json is required",
  )
  process.exit(1)
}

if (!ACCESS_TOKEN) {
  console.error(
    "TRAKT_ACCESS_TOKEN env var or accessToken in ~/.config/trakt.json is required",
  )
  process.exit(1)
}

const API_BASE = "https://api.trakt.tv"

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
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

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
})

const err = (msg: string) => ({
  content: [{ type: "text" as const, text: `Error: ${msg}` }],
})

const today = () => new Date().toISOString().split("T")[0]!

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
  async ({ query, type, limit }) => {
    const data = await apiFetch<unknown[]>(
      `/search/${type}?query=${encodeURIComponent(query)}&limit=${limit}&extended=full`,
    )
    if (!data) return err("search failed")
    return ok(data)
  },
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
  async ({ id, extended }) => {
    const params = extended ? "?extended=full" : ""
    const data = await apiFetch<unknown>(`/movies/${id}${params}`)
    if (!data) return err("movie not found")
    return ok(data)
  },
)

server.registerTool(
  "get_trending_movies",
  {
    description: "Get movies currently being watched across Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  async ({ limit }) => {
    const data = await apiFetch<unknown[]>(
      `/movies/trending?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch trending movies")
    return ok(data)
  },
)

server.registerTool(
  "get_popular_movies",
  {
    description: "Get the most popular movies on Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  async ({ limit }) => {
    const data = await apiFetch<unknown[]>(
      `/movies/popular?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch popular movies")
    return ok(data)
  },
)

server.registerTool(
  "get_movie_ratings",
  {
    description: "Get community rating distribution for a movie",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  async ({ id }) => {
    const data = await apiFetch<unknown>(`/movies/${id}/ratings`)
    if (!data) return err("failed to fetch movie ratings")
    return ok(data)
  },
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
  async ({ id, limit }) => {
    const data = await apiFetch<unknown[]>(
      `/movies/${id}/related?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch related movies")
    return ok(data)
  },
)

server.registerTool(
  "get_movie_people",
  {
    description: "Get cast and crew for a movie",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  async ({ id }) => {
    const data = await apiFetch<unknown>(`/movies/${id}/people?extended=full`)
    if (!data) return err("failed to fetch movie people")
    return ok(data)
  },
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
  async ({ id, extended }) => {
    const params = extended ? "?extended=full" : ""
    const data = await apiFetch<unknown>(`/shows/${id}${params}`)
    if (!data) return err("show not found")
    return ok(data)
  },
)

server.registerTool(
  "get_trending_shows",
  {
    description: "Get TV shows currently being watched across Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  async ({ limit }) => {
    const data = await apiFetch<unknown[]>(
      `/shows/trending?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch trending shows")
    return ok(data)
  },
)

server.registerTool(
  "get_popular_shows",
  {
    description: "Get the most popular TV shows on Trakt",
    inputSchema: {
      limit: z.number().optional().default(10),
    },
  },
  async ({ limit }) => {
    const data = await apiFetch<unknown[]>(
      `/shows/popular?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch popular shows")
    return ok(data)
  },
)

server.registerTool(
  "get_show_ratings",
  {
    description: "Get community rating distribution for a TV show",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  async ({ id }) => {
    const data = await apiFetch<unknown>(`/shows/${id}/ratings`)
    if (!data) return err("failed to fetch show ratings")
    return ok(data)
  },
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
  async ({ id, with_episodes }) => {
    const extended = with_episodes
      ? "?extended=full,episodes"
      : "?extended=full"
    const data = await apiFetch<unknown[]>(`/shows/${id}/seasons${extended}`)
    if (!data) return err("failed to fetch seasons")
    return ok(data)
  },
)

server.registerTool(
  "get_show_people",
  {
    description: "Get cast and crew for a TV show",
    inputSchema: {
      id: z.string().describe("Trakt ID, slug, or IMDB/TMDB ID"),
    },
  },
  async ({ id }) => {
    const data = await apiFetch<unknown>(`/shows/${id}/people?extended=full`)
    if (!data) return err("failed to fetch show people")
    return ok(data)
  },
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
  async ({ id, season }) => {
    const data = await apiFetch<unknown[]>(
      `/shows/${id}/seasons/${season}?extended=full`,
    )
    if (!data) return err("failed to fetch episodes")
    return ok(data)
  },
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
  async ({ id, season, episode }) => {
    const data = await apiFetch<unknown>(
      `/shows/${id}/seasons/${season}/episodes/${episode}?extended=full`,
    )
    if (!data) return err("episode not found")
    return ok(data)
  },
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
  async ({ id }) => {
    const data = await apiFetch<unknown>(`/people/${id}?extended=full`)
    if (!data) return err("person not found")
    return ok(data)
  },
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
  async ({ id, type }) => {
    const data = await apiFetch<unknown>(`/people/${id}/${type}?extended=full`)
    if (!data) return err("failed to fetch credits")
    return ok(data)
  },
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
  async ({ start_date, days }) => {
    const data = await apiFetch<unknown>(
      `/calendars/my/shows/${start_date ?? today()}/${days}`,
    )
    if (!data) return err("failed to fetch show calendar")
    return ok(data)
  },
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
  async ({ start_date, days }) => {
    const data = await apiFetch<unknown>(
      `/calendars/my/movies/${start_date ?? today()}/${days}`,
    )
    if (!data) return err("failed to fetch movie calendar")
    return ok(data)
  },
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
  async ({ start_date, days }) => {
    const data = await apiFetch<unknown>(
      `/calendars/all/shows/${start_date ?? today()}/${days}`,
    )
    if (!data) return err("failed to fetch calendar")
    return ok(data)
  },
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
  async ({ type, limit, page }) => {
    const path = type ? `/sync/history/${type}` : "/sync/history"
    const data = await apiFetch<unknown[]>(
      `${path}?limit=${limit}&page=${page}&extended=full`,
    )
    if (!data) return err("failed to fetch history")
    return ok(data)
  },
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
  async ({ movies, episodes }) => {
    const data = await apiFetch<unknown>("/sync/history", {
      method: "POST",
      body: JSON.stringify({ movies: movies ?? [], episodes: episodes ?? [] }),
    })
    if (!data) return err("failed to add to history")
    return ok(data)
  },
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
  async ({ movies, episodes }) => {
    const data = await apiFetch<unknown>("/sync/history/remove", {
      method: "POST",
      body: JSON.stringify({ movies: movies ?? [], episodes: episodes ?? [] }),
    })
    if (!data) return err("failed to remove from history")
    return ok(data)
  },
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
  async ({ type, rating }) => {
    const path = type ? `/sync/ratings/${type}` : "/sync/ratings"
    const ratingFilter = rating ? `/${rating}` : ""
    const data = await apiFetch<unknown[]>(
      `${path}${ratingFilter}?extended=full`,
    )
    if (!data) return err("failed to fetch ratings")
    return ok(data)
  },
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
  async ({ movies, shows, episodes }) => {
    const data = await apiFetch<unknown>("/sync/ratings", {
      method: "POST",
      body: JSON.stringify({
        movies: movies ?? [],
        shows: shows ?? [],
        episodes: episodes ?? [],
      }),
    })
    if (!data) return err("failed to add ratings")
    return ok(data)
  },
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
  async ({ movies, shows, episodes }) => {
    const data = await apiFetch<unknown>("/sync/ratings/remove", {
      method: "POST",
      body: JSON.stringify({
        movies: movies ?? [],
        shows: shows ?? [],
        episodes: episodes ?? [],
      }),
    })
    if (!data) return err("failed to remove ratings")
    return ok(data)
  },
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
  async ({ type, sort }) => {
    const path = type ? `/sync/watchlist/${type}/${sort}` : "/sync/watchlist"
    const data = await apiFetch<unknown[]>(`${path}?extended=full`)
    if (!data) return err("failed to fetch watchlist")
    return ok(data)
  },
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
  async ({ movies, shows, episodes }) => {
    const data = await apiFetch<unknown>("/sync/watchlist", {
      method: "POST",
      body: JSON.stringify({
        movies: movies ?? [],
        shows: shows ?? [],
        episodes: episodes ?? [],
      }),
    })
    if (!data) return err("failed to add to watchlist")
    return ok(data)
  },
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
  async ({ movies, shows, episodes }) => {
    const data = await apiFetch<unknown>("/sync/watchlist/remove", {
      method: "POST",
      body: JSON.stringify({
        movies: movies ?? [],
        shows: shows ?? [],
        episodes: episodes ?? [],
      }),
    })
    if (!data) return err("failed to remove from watchlist")
    return ok(data)
  },
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
  async ({ movie, episode, message }) => {
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
  },
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
  async ({ confirm }) => {
    if (!confirm) return err("set confirm: true to cancel the active checkin")
    const response = await fetch(`${API_BASE}/checkin`, {
      method: "DELETE",
      headers: {
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID!,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) return err(`delete checkin failed: ${response.status}`)
    return ok({ success: true })
  },
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
  async ({ limit }) => {
    const data = await apiFetch<unknown[]>(
      `/recommendations/movies?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch movie recommendations")
    return ok(data)
  },
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
  async ({ limit }) => {
    const data = await apiFetch<unknown[]>(
      `/recommendations/shows?limit=${limit}&extended=full`,
    )
    if (!data) return err("failed to fetch show recommendations")
    return ok(data)
  },
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
  async ({ username }) => {
    const data = await apiFetch<unknown>(`/users/${username}?extended=full`)
    if (!data) return err("user not found")
    return ok(data)
  },
)

server.registerTool(
  "get_user_stats",
  {
    description: "Get watch statistics for a user",
    inputSchema: {
      username: z.string().optional().default("me"),
    },
  },
  async ({ username }) => {
    const data = await apiFetch<unknown>(`/users/${username}/stats`)
    if (!data) return err("failed to fetch user stats")
    return ok(data)
  },
)

server.registerTool(
  "get_user_watching",
  {
    description: "Get what a user is currently watching",
    inputSchema: {
      username: z.string().optional().default("me"),
    },
  },
  async ({ username }) => {
    const data = await apiFetch<unknown>(`/users/${username}/watching`)
    if (!data) return err("user is not currently watching anything")
    return ok(data)
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("mcp-trakt running")
}

main().catch((error) => {
  console.error("Fatal:", error)
  process.exit(1)
})
