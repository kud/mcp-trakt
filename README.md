<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-@kud%2Fmcp--trakt-CB3837?style=flat-square&logo=npm&logoColor=white)
![MIT](https://img.shields.io/badge/licence-MIT-22C55E?style=flat-square)

**MCP server for Trakt — TV show and movie tracking with full sync support.**

<a href="https://kud.io/projects/mcp-trakt">Website</a> · <a href="https://kud.io/projects/mcp-trakt/docs">Documentation</a>

</div>

## Features

- **53 tools** — complete coverage of the Trakt API: search, metadata, sync, ratings, watchlists, and check-ins.
- **OAuth via macOS Keychain** — credentials stored securely; one-time setup with `npx @kud/mcp-trakt setup`.
- **Personalised calendars** — see your upcoming episodes and movies, or browse what's airing across all Trakt users.
- **Full sync support** — history, collection, watched state, playback progress, and last-activity timestamps.
- **Scrobble lifecycle** — start, pause, and stop playback tracking so watches are recorded automatically.
- **Recommendations** — personalised movie and show suggestions driven by your viewing history.

## Install

Run the one-time OAuth setup to store your Trakt credentials in the macOS Keychain:

```sh
npx @kud/mcp-trakt@latest setup
```

Then register the server with your MCP client:

```sh
claude mcp add trakt npx -- -y @kud/mcp-trakt@latest
```

Or add it manually to your MCP client config:

```json
{
  "mcpServers": {
    "trakt": {
      "command": "npx",
      "args": ["-y", "@kud/mcp-trakt@latest"]
    }
  }
}
```

## Usage

Once connected, the following tools are available grouped by category.

### Search

| Tool     | Description                                          |
| -------- | ---------------------------------------------------- |
| `search` | Search for movies, shows, episodes, people, or lists |

### Movies

| Tool                        | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `get_movie`                 | Get detailed information about a movie              |
| `get_trending_movies`       | Movies currently being watched across Trakt         |
| `get_popular_movies`        | Most popular movies on Trakt                        |
| `get_anticipated_movies`    | Most anticipated movies based on watchlist activity |
| `get_boxoffice_movies`      | Top 10 weekend box office movies, updated weekly    |
| `get_movie_ratings`         | Community rating distribution for a movie           |
| `get_movie_related`         | Movies related to a given movie                     |
| `get_movie_people`          | Cast and crew for a movie                           |
| `get_movie_recommendations` | Personalised movie recommendations                  |

### Shows

| Tool                       | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `get_show`                 | Get detailed information about a TV show                |
| `get_trending_shows`       | TV shows currently being watched across Trakt           |
| `get_popular_shows`        | Most popular TV shows on Trakt                          |
| `get_anticipated_shows`    | Most anticipated TV shows based on watchlist activity   |
| `get_show_ratings`         | Community rating distribution for a TV show             |
| `get_show_seasons`         | All seasons for a show, optionally with episode details |
| `get_show_people`          | Cast and crew for a TV show                             |
| `get_show_related`         | TV shows related to a given show                        |
| `get_show_recommendations` | Personalised TV show recommendations                    |

### Episodes

| Tool                  | Description                         |
| --------------------- | ----------------------------------- |
| `get_season_episodes` | All episodes in a specific season   |
| `get_episode`         | Full details for a specific episode |

### People

| Tool                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `get_person`         | Details about a person (actor, director, etc.) |
| `get_person_credits` | Movie or show credits for a person             |

### Calendar

| Tool                     | Description                                 |
| ------------------------ | ------------------------------------------- |
| `get_my_show_calendar`   | Upcoming episodes based on shows you watch  |
| `get_my_movie_calendar`  | Upcoming movies based on your watchlist     |
| `get_all_show_calendar`  | All shows airing across all Trakt users     |
| `get_all_movie_calendar` | All movies releasing across all Trakt users |

### History

| Tool                  | Description                              |
| --------------------- | ---------------------------------------- |
| `get_history`         | Watch history for the authenticated user |
| `add_to_history`      | Mark movies or episodes as watched       |
| `remove_from_history` | Remove items from watch history          |

### Collection

| Tool                     | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `get_collection_movies`  | All movies in your collection                     |
| `get_collection_shows`   | All shows in your collection                      |
| `add_to_collection`      | Add movies, shows, or episodes to your collection |
| `remove_from_collection` | Remove items from your collection                 |

### Watched

| Tool                 | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `get_watched_movies` | All movies you have watched with play counts            |
| `get_watched_shows`  | All shows you have watched with play counts per episode |

### Playback

| Tool              | Description                              |
| ----------------- | ---------------------------------------- |
| `get_playback`    | Paused playback progress to resume later |
| `delete_playback` | Delete a paused playback entry           |

### Sync

| Tool                       | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `get_sync_last_activities` | Timestamps for when each resource was last updated |

### Ratings

| Tool            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `get_ratings`   | Ratings you have given, filterable by type and value |
| `add_rating`    | Rate movies, shows, seasons, or episodes (1–10)      |
| `remove_rating` | Remove ratings from movies, shows, or episodes       |

### Watchlist

| Tool                    | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `get_watchlist`         | Your watchlist, filterable by type and sort order |
| `add_to_watchlist`      | Add movies, shows, or episodes to your watchlist  |
| `remove_from_watchlist` | Remove items from your watchlist                  |

### Check-in

| Tool             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `checkin`        | Check in to a movie or episode you are watching right now |
| `delete_checkin` | Cancel the current active check-in                        |

### Scrobble

| Tool             | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `scrobble_start` | Start scrobbling when playback begins                  |
| `scrobble_pause` | Pause scrobbling when playback is paused               |
| `scrobble_stop`  | Stop scrobbling when playback ends to record the watch |

### User

| Tool                | Description                            |
| ------------------- | -------------------------------------- |
| `get_user_profile`  | Profile information for any Trakt user |
| `get_user_stats`    | Watch statistics for a user            |
| `get_user_watching` | What a user is currently watching      |

## Development

```sh
git clone https://github.com/kud/mcp-trakt.git
cd mcp-trakt
npm install
npm run dev          # run directly with tsx, no build needed
npm run inspect:dev  # open the MCP Inspector against live tsx
npm run build        # compile TypeScript to dist/
npm run typecheck    # type-check without emitting
npm test             # run the test suite
```

📚 **Full documentation → [mcp-trakt/docs](https://kud.io/projects/mcp-trakt/docs)**
