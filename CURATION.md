# Video library — curation guide

The video library is a **curated technical library**, not a firehose. A daily
GitHub Action (`.github/workflows/refresh-videos.yml`) discovers new videos via
YouTube **RSS** (free, no quota), enriches them via the YouTube Data API
**videos.list** (1 unit/call, CI-only), classifies them by rules, and commits
`data/videos.json`. The site rebuilds from that committed JSON.

Everything human lives in two files: **`data/channels.json`** (which channels)
and **`data/curation.json`** (featuring, hiding, summaries, overrides).

## Add a channel

Edit `data/channels.json` → `channels`. You need the **channel id** (`UC…`), not
the `@handle` — RSS requires the id. To find it: open the channel, then About →
Share → **Copy channel ID** (or View Source and search `channelId`). Add:

```json
{
  "id": "UCxxxxxxxxxxxxxxxxxxxxxx",
  "name": "Channel Name",
  "handle": "@handle",
  "category": "aws_official | aws_events | community | framework | general_ai",
  "trustTier": "official | curated | community",
  "topics": ["agentcore", "rag"],
  "active": true
}
```

Set `active: true` only after you’ve verified the id. Channels with an id
starting `REPLACE_ME` are skipped.

## Feature a video (collections)

Edit `data/curation.json` → `collections`. Add the video id to the ordered
`videoIds` of a collection. Featured videos always survive pruning and the
relevance gate.

```json
{ "id": "start-agentcore", "title": "Start here: AgentCore fundamentals",
  "videoIds": ["VIDEO_ID_1", "VIDEO_ID_2"] }
```

## Hide a video

Add its id to `curation.json` → `hidden`. It’s removed from the library on the
next run.

## Fix classification / add a summary

- `curatedOverrides`: `{ "VIDEO_ID": { "topics": ["agentcore"], "level": "demo" } }`
  — always wins over auto-classification.
- `summaries`: `{ "VIDEO_ID": "Our own one-line summary." }` — **original words
  only; never paste a YouTube description.**

## Force a refresh

- GitHub → Actions → **Refresh videos** → **Run workflow** (manual dispatch).
- Or locally: `YOUTUBE_API_KEY=… node scripts/fetch-videos.mjs` (RSS-only works
  without a key). See `.env.example`.

## Notes

- The recurring job never calls `search.list` (100 units + a ~100/day bucket).
  RSS is the discovery mechanism.
- The API key lives only in the CI secret `YOUTUBE_API_KEY` — never in the repo
  or the client bundle.
- We store metadata only — no full descriptions or transcripts.
