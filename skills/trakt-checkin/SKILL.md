---
name: trakt-checkin
description: "Checks in to a movie or episode you're about to watch on Trakt. Use this when you start watching something."
---

## Step 1 — Resolve the title

If the user provided a title (e.g. `/trakt-checkin Dune`), use it directly.

If no title was given, ask: "What are you watching?"

## Step 2 — Search for the item

Call `search` with the title to find matches.

If multiple results are returned, show them (title, year, type) and ask the user to pick one.

## Step 3 — Check in

Call `checkin` with the selected movie or episode.

## Step 4 — Confirm

Confirm the check-in:

```
✓ Checked in to <title> (<year>) — <type>
```
