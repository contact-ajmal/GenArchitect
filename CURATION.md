# Content curation guide

Two libraries run on the same pattern: a nightly GitHub Action reads public
feeds, applies deterministic rules, and commits a JSON file the site builds
from. Everything editorial lives in small, human-owned files that the jobs
never overwrite.

- [Video library](#video-library) — YouTube, needs an API key for full history
- [Updates feed](#updates-feed) — AWS blogs + What’s New, no key needed

---

## Video library

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

---

## Updates feed

`/updates` — the "latest across the AWS GenAI landscape" section. A daily
GitHub Action (`.github/workflows/refresh-updates.yml`) reads AWS's **public
RSS feeds**, keeps only items that are actually about GenAI, and commits
`data/updates.json`.

**No API key, no secret, no quota.** It works the moment it lands. To run it
yourself: `node scripts/fetch-updates.mjs`.

Two human-owned files:

| File | What it controls |
| --- | --- |
| `data/feeds.json` | Which AWS feeds are read |
| `data/updates-curation.json` | Pinning, hiding, your own notes |

Neither is ever written by the job.

### Add or mute a source

Edit `data/feeds.json` → `sources`. Any AWS blog works — find it at
`https://aws.amazon.com/blogs/<slug>/` and its feed is that URL + `feed/`.

```json
{
  "id": "containers",
  "name": "AWS Containers Blog",
  "feed": "https://aws.amazon.com/blogs/containers/feed/",
  "kind": "blog",
  "keepAll": false,
  "active": true
}
```

- `keepAll: true` — keep every item. Only for feeds already on-topic
  (the ML blog is the sole one set this way).
- `keepAll: false` — an item must pass the GenAI filter below.
- `active: false` — mute a source without deleting it. Its items disappear
  from the feed on the next run.

### The GenAI filter

Deliberately tight, and it does **not** simply grep the whole article. An item
survives when a strong term appears in the **headline**, or in the **first 300
characters**, or when AWS's own category tags mark it as AI.

This matters. What's New bodies run to ~2,000 characters and name-drop services
in passing — matching the full body kept "AWS Glue 6.0" (because *SageMaker*
appeared at character 1,357, describing which console menu to click) and "AWS
Marketplace notifications" (*Amazon Q* at character 1,646, as a delivery
channel). Neither is a GenAI story. Requiring the signal up front fixes both
while still keeping items like the EC2 P6-B300 launch, which carries AWS's
`artificial-intelligence` category tag.

The term list lives at the top of `scripts/fetch-updates.mjs`. Bare `agent` is
deliberately **excluded** — it fires on SSM Agent, CloudWatch Agent and Partner
Central. Use `agentic`, `ai agent` or `multi-agent` instead.

### Pin, hide, annotate

Edit `data/updates-curation.json`. Ids are the URL slug — read them from
`data/updates.json`.

```json
{
  "pinned": ["govern-ai-agent-tool-access-with-amazon-bedrock-agentcore-gateway"],
  "hidden": ["some-off-topic-launch"],
  "notes": {
    "govern-ai-agent-tool-access-with-amazon-bedrock-agentcore-gateway":
      "Read this if you're wiring tool auth — covers the Gateway egress path end to end."
  }
}
```

- **pinned** — shown in a "Worth your time" rail above the feed, in the order
  listed. Never dropped by the retention cap.
- **hidden** — removed entirely, on this and every future run.
- **notes** — your own line, displayed *instead of* the syndicated excerpt.
  **Original words only; never paste AWS's copy.**

### Force a refresh

GitHub → Actions → **Refresh updates** → **Run workflow**. Or locally,
`node scripts/fetch-updates.mjs`.

### Notes

- The feed accumulates. RSS exposes only ~20 recent items per source, so the
  committed JSON is how history builds up over time. Deleting
  `data/updates.json` resets that.
- The `awsf.whats-new-categories=…` URL parameter is **ignored** by AWS's RSS
  endpoint — it returns all items regardless. Filtering has to happen locally.
- Retention: 80 items per source, 500 total, newest first. Pinned items are
  exempt from the per-source cap.
- We keep headline, link, date and a trimmed excerpt — never a full article.
