import { beforeEach, describe, expect, it, vi } from "vitest"
import * as api from "../index.js"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

const jsonResponse = (data: unknown, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    json: () => Promise.resolve(data),
  })

const errorResponse = (status = 404) =>
  Promise.resolve({
    ok: false,
    status,
    statusText: "Not Found",
    json: () => Promise.resolve({}),
  })

beforeEach(() => vi.clearAllMocks())

// ─── Search ───

describe("search", () => {
  it("returns results on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ movie: { title: "Inception" } }]))
    const result = await api.search({
      query: "inception",
      type: "movie",
      limit: 10,
    })
    expect(result.content[0].text).toContain("Inception")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/search/movie?query=inception&limit=10&extended=full",
      expect.anything(),
    )
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.search({ query: "x", type: "movie", limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Movies ───

describe("getMovie", () => {
  it("returns movie on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ title: "Inception", year: 2010 }))
    const result = await api.getMovie({ id: "inception-2010", extended: true })
    expect(result.content[0].text).toContain("Inception")
  })

  it("returns error when not found", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getMovie({ id: "unknown", extended: true })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getTrendingMovies", () => {
  it("returns list on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ watchers: 100, movie: { title: "Dune" } }]),
    )
    const result = await api.getTrendingMovies({ limit: 10 })
    expect(result.content[0].text).toContain("Dune")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getTrendingMovies({ limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getAnticipatedMovies", () => {
  it("returns list on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ list_count: 50, movie: { title: "Dune Part Three" } }]),
    )
    const result = await api.getAnticipatedMovies({ limit: 10 })
    expect(result.content[0].text).toContain("Dune Part Three")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getAnticipatedMovies({ limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getBoxofficeMovies", () => {
  it("returns box office list on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ revenue: 100000000, movie: { title: "Avatar" } }]),
    )
    const result = await api.getBoxofficeMovies()
    expect(result.content[0].text).toContain("Avatar")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getBoxofficeMovies()
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getMovieRatings", () => {
  it("returns ratings on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ rating: 8.4, votes: 45000 }))
    const result = await api.getMovieRatings({ id: "inception-2010" })
    expect(result.content[0].text).toContain("8.4")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getMovieRatings({ id: "x" })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getMovieRelated", () => {
  it("returns related movies on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ title: "The Matrix" }]))
    const result = await api.getMovieRelated({
      id: "inception-2010",
      limit: 10,
    })
    expect(result.content[0].text).toContain("The Matrix")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getMovieRelated({ id: "x", limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getMoviePeople", () => {
  it("returns people on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ cast: [{ person: { name: "Leonardo DiCaprio" } }] }),
    )
    const result = await api.getMoviePeople({ id: "inception-2010" })
    expect(result.content[0].text).toContain("Leonardo DiCaprio")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getMoviePeople({ id: "x" })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Shows ───

describe("getShow", () => {
  it("returns show on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ title: "Breaking Bad", year: 2008 }),
    )
    const result = await api.getShow({ id: "breaking-bad", extended: true })
    expect(result.content[0].text).toContain("Breaking Bad")
  })

  it("returns error when not found", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getShow({ id: "unknown", extended: true })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getAnticipatedShows", () => {
  it("returns list on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([
        { list_count: 200, show: { title: "House of the Dragon" } },
      ]),
    )
    const result = await api.getAnticipatedShows({ limit: 10 })
    expect(result.content[0].text).toContain("House of the Dragon")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getAnticipatedShows({ limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getShowRelated", () => {
  it("returns related shows on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ title: "Better Call Saul" }]))
    const result = await api.getShowRelated({ id: "breaking-bad", limit: 10 })
    expect(result.content[0].text).toContain("Better Call Saul")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getShowRelated({ id: "x", limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getShowSeasons", () => {
  it("returns seasons on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ number: 1, episode_count: 7 }]))
    const result = await api.getShowSeasons({
      id: "breaking-bad",
      with_episodes: false,
    })
    expect(result.content[0].text).toContain("episode_count")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getShowSeasons({ id: "x", with_episodes: false })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Episodes ───

describe("getSeasonEpisodes", () => {
  it("returns episodes on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ title: "Pilot", season: 1, number: 1 }]),
    )
    const result = await api.getSeasonEpisodes({
      id: "breaking-bad",
      season: 1,
    })
    expect(result.content[0].text).toContain("Pilot")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getSeasonEpisodes({ id: "x", season: 1 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getEpisode", () => {
  it("returns episode on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ title: "Pilot", season: 1, number: 1 }),
    )
    const result = await api.getEpisode({
      id: "breaking-bad",
      season: 1,
      episode: 1,
    })
    expect(result.content[0].text).toContain("Pilot")
  })

  it("returns error when not found", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getEpisode({ id: "x", season: 1, episode: 1 })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── People ───

describe("getPerson", () => {
  it("returns person on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ name: "Bryan Cranston" }))
    const result = await api.getPerson({ id: "bryan-cranston" })
    expect(result.content[0].text).toContain("Bryan Cranston")
  })

  it("returns error when not found", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getPerson({ id: "unknown" })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getPersonCredits", () => {
  it("returns credits on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ cast: [{ movie: { title: "Drive" } }] }),
    )
    const result = await api.getPersonCredits({
      id: "ryan-gosling",
      type: "movies",
    })
    expect(result.content[0].text).toContain("Drive")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getPersonCredits({ id: "x", type: "movies" })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Calendar ───

describe("getMyShowCalendar", () => {
  it("returns calendar on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ episode: { title: "Pilot" } }]))
    const result = await api.getMyShowCalendar({ days: 7 })
    expect(result.content[0].text).toContain("Pilot")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getMyShowCalendar({ days: 7 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getAllMovieCalendar", () => {
  it("returns calendar on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ movie: { title: "New Release" } }]),
    )
    const result = await api.getAllMovieCalendar({ days: 7 })
    expect(result.content[0].text).toContain("New Release")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getAllMovieCalendar({ days: 7 })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── History ───

describe("getHistory", () => {
  it("returns history on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ watched_at: "2024-01-01", movie: { title: "Dune" } }]),
    )
    const result = await api.getHistory({ limit: 20, page: 1 })
    expect(result.content[0].text).toContain("Dune")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getHistory({ limit: 20, page: 1 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("addToHistory", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ added: { movies: 1 } }))
    const result = await api.addToHistory({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("added")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.addToHistory({})
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("removeFromHistory", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ deleted: { movies: 1 } }))
    const result = await api.removeFromHistory({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("deleted")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.removeFromHistory({})
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Collection ───

describe("getCollectionMovies", () => {
  it("returns collection on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([
        { collected_at: "2024-01-01", movie: { title: "Inception" } },
      ]),
    )
    const result = await api.getCollectionMovies({ extended: true })
    expect(result.content[0].text).toContain("Inception")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/collection/movies?extended=full",
      expect.anything(),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getCollectionMovies({ extended: true })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getCollectionShows", () => {
  it("returns collection on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ show: { title: "Breaking Bad" } }]),
    )
    const result = await api.getCollectionShows({ extended: false })
    expect(result.content[0].text).toContain("Breaking Bad")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/collection/shows",
      expect.anything(),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getCollectionShows({ extended: false })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("addToCollection", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ added: { movies: 1 } }))
    const result = await api.addToCollection({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("added")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.addToCollection({})
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("removeFromCollection", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ deleted: { movies: 1 } }))
    const result = await api.removeFromCollection({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("deleted")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.removeFromCollection({})
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Watched ───

describe("getWatchedMovies", () => {
  it("returns watched movies on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ plays: 2, movie: { title: "Inception" } }]),
    )
    const result = await api.getWatchedMovies({ extended: true })
    expect(result.content[0].text).toContain("Inception")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/watched/movies?extended=full",
      expect.anything(),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getWatchedMovies({ extended: true })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getWatchedShows", () => {
  it("returns watched shows on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ plays: 62, show: { title: "Breaking Bad" } }]),
    )
    const result = await api.getWatchedShows({ extended: false })
    expect(result.content[0].text).toContain("Breaking Bad")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/watched/shows",
      expect.anything(),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getWatchedShows({ extended: false })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Playback ───

describe("getPlayback", () => {
  it("returns playback progress on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([
        { progress: 45.5, type: "movie", movie: { title: "Dune" } },
      ]),
    )
    const result = await api.getPlayback({})
    expect(result.content[0].text).toContain("Dune")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/playback",
      expect.anything(),
    )
  })

  it("filters by type when provided", async () => {
    mockFetch.mockReturnValue(jsonResponse([]))
    await api.getPlayback({ type: "movies" })
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/playback/movies",
      expect.anything(),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getPlayback({})
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("deletePlayback", () => {
  it("requires confirm: true", async () => {
    const result = await api.deletePlayback({ id: 42, confirm: false })
    expect(result.content[0].text).toContain("Error:")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("deletes when confirmed", async () => {
    mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204 }))
    const result = await api.deletePlayback({ id: 42, confirm: true })
    expect(result.content[0].text).toContain("success")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/playback/42",
      expect.objectContaining({ method: "DELETE" }),
    )
  })
})

// ─── Sync ───

describe("getSyncLastActivities", () => {
  it("returns last activities on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ all: "2024-01-01T00:00:00.000Z", movies: {} }),
    )
    const result = await api.getSyncLastActivities()
    expect(result.content[0].text).toContain("2024-01-01")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/sync/last_activities",
      expect.anything(),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getSyncLastActivities()
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Ratings ───

describe("getRatings", () => {
  it("returns ratings on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ rating: 9, movie: { title: "Inception" } }]),
    )
    const result = await api.getRatings({})
    expect(result.content[0].text).toContain("Inception")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getRatings({})
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("addRating", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ added: { movies: 1 } }))
    const result = await api.addRating({
      movies: [{ rating: 9, ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("added")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.addRating({})
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("removeRating", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ deleted: { movies: 1 } }))
    const result = await api.removeRating({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("deleted")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.removeRating({})
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Watchlist ───

describe("getWatchlist", () => {
  it("returns watchlist on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse([{ rank: 1, movie: { title: "Tenet" } }]),
    )
    const result = await api.getWatchlist({ sort: "rank" })
    expect(result.content[0].text).toContain("Tenet")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getWatchlist({ sort: "rank" })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("addToWatchlist", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ added: { movies: 1 } }))
    const result = await api.addToWatchlist({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("added")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.addToWatchlist({})
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("removeFromWatchlist", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ deleted: { movies: 1 } }))
    const result = await api.removeFromWatchlist({
      movies: [{ ids: { imdb: "tt1375666" } }],
    })
    expect(result.content[0].text).toContain("deleted")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.removeFromWatchlist({})
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Checkin ───

describe("checkin", () => {
  it("returns checkin result on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ action: "checkin", movie: { title: "Inception" } }),
    )
    const result = await api.checkin({ movie: { ids: { imdb: "tt1375666" } } })
    expect(result.content[0].text).toContain("checkin")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.checkin({ movie: { ids: {} } })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("deleteCheckin", () => {
  it("requires confirm: true", async () => {
    const result = await api.deleteCheckin({ confirm: false })
    expect(result.content[0].text).toContain("Error:")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("deletes when confirmed", async () => {
    mockFetch.mockReturnValue(Promise.resolve({ ok: true, status: 204 }))
    const result = await api.deleteCheckin({ confirm: true })
    expect(result.content[0].text).toContain("success")
  })
})

// ─── Scrobble ───

describe("scrobbleStart", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ action: "start", progress: 1 }))
    const result = await api.scrobbleStart({
      movie: { ids: { imdb: "tt1375666" } },
      progress: 1,
    })
    expect(result.content[0].text).toContain("start")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/scrobble/start",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.scrobbleStart({ progress: 1 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("scrobblePause", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ action: "pause", progress: 50 }))
    const result = await api.scrobblePause({
      movie: { ids: { imdb: "tt1375666" } },
      progress: 50,
    })
    expect(result.content[0].text).toContain("pause")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/scrobble/pause",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.scrobblePause({ progress: 50 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("scrobbleStop", () => {
  it("returns result on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ action: "scrobble", progress: 98 }),
    )
    const result = await api.scrobbleStop({
      movie: { ids: { imdb: "tt1375666" } },
      progress: 98,
    })
    expect(result.content[0].text).toContain("scrobble")
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.trakt.tv/scrobble/stop",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.scrobbleStop({ progress: 98 })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── Recommendations ───

describe("getMovieRecommendations", () => {
  it("returns recommendations on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ title: "Interstellar" }]))
    const result = await api.getMovieRecommendations({ limit: 10 })
    expect(result.content[0].text).toContain("Interstellar")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getMovieRecommendations({ limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getShowRecommendations", () => {
  it("returns recommendations on success", async () => {
    mockFetch.mockReturnValue(jsonResponse([{ title: "Succession" }]))
    const result = await api.getShowRecommendations({ limit: 10 })
    expect(result.content[0].text).toContain("Succession")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getShowRecommendations({ limit: 10 })
    expect(result.content[0].text).toContain("Error:")
  })
})

// ─── User ───

describe("getUserProfile", () => {
  it("returns profile on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ username: "johnnyb", name: "Johnny B" }),
    )
    const result = await api.getUserProfile({ username: "me" })
    expect(result.content[0].text).toContain("johnnyb")
  })

  it("returns error when not found", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getUserProfile({ username: "unknown" })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getUserStats", () => {
  it("returns stats on success", async () => {
    mockFetch.mockReturnValue(jsonResponse({ movies: { plays: 142 } }))
    const result = await api.getUserStats({ username: "me" })
    expect(result.content[0].text).toContain("142")
  })

  it("returns error on failure", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getUserStats({ username: "me" })
    expect(result.content[0].text).toContain("Error:")
  })
})

describe("getUserWatching", () => {
  it("returns currently watching on success", async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ action: "checkin", movie: { title: "Dune" } }),
    )
    const result = await api.getUserWatching({ username: "me" })
    expect(result.content[0].text).toContain("Dune")
  })

  it("returns error when not watching", async () => {
    mockFetch.mockReturnValue(errorResponse())
    const result = await api.getUserWatching({ username: "me" })
    expect(result.content[0].text).toContain("Error:")
  })
})
