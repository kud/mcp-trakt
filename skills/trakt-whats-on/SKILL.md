---
name: trakt-whats-on
description: "Shows your Trakt watchlist, recently watched, and upcoming releases. Use this to get a quick overview of your watch queue and activity."
---

## Step 1 — Fetch the data

Fetch all of the following in parallel:

- `get_watchlist` to get your current watchlist
- `get_history` to get recently watched items
- `get_my_show_calendar` and `get_my_movie_calendar` to see what's coming up

## Step 2 — Present the overview

Structure your response as:

```
### Watchlist
<up to 5 movies and shows, with type>

### Recently watched
<last 5 items with date>

### Up next
<upcoming episodes or releases from your calendar>
```

Keep it concise — no more than 5 items per section unless the user asks for more.
