#!/usr/bin/env node
/**
 * GenArchitect video refresh — RUN ONLY IN CI.
 *
 * COMPLIANCE (do not change without reading):
 *  - Discovery uses YouTube's PUBLIC RSS feeds (free, no quota, no scraping).
 *  - Enrichment uses ONLY the official YouTube Data API v3 videos.list
 *    (1 unit/call, batched 50 ids). We NEVER call search.list (100 units +
 *    separate ~100/day bucket) in this recurring job.
 *  - The API key is read ONLY from process.env.YOUTUBE_API_KEY. It must never
 *    be committed or shipped to the client.
 *  - We store metadata only — no full descriptions, no transcripts.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const CHANNELS = new URL('../data/channels.json', import.meta.url)
const VIDEOS = new URL('../data/videos.json', import.meta.url)
const CURATION = new URL('../data/curation.json', import.meta.url)

const KEY = process.env.YOUTUBE_API_KEY || ''
const MAX_PER_CHANNEL = 12
const REQUEST_TIMEOUT_MS = 15000

const readJson = (u) => JSON.parse(readFileSync(u, 'utf8'))

/* --- classification (deterministic, transparent) ------------------------- */
const TOPIC_KEYWORDS = {
  agentcore: ['agentcore', 'agent core'],
  strands: ['strands'],
  rag: ['rag', 'retrieval augmented', 'retrieval-augmented', 'knowledge base'],
  bedrock: ['bedrock'],
  'vector-search': ['vector', 'opensearch', 'pgvector', 'embedding'],
  guardrails: ['guardrail'],
  observability: ['observability', 'opentelemetry', 'tracing', 'cloudwatch'],
  'multi-agent': ['multi-agent', 'multi agent', 'swarm', 'supervisor', 'agents as tools', 'a2a'],
  'well-architected': ['well-architected', 'well architected'],
}
const PATTERN_KEYWORDS = {
  managed_kb_rag: ['knowledge base', 'managed kb'],
  hybrid_rerank_rag: ['rerank', 'hybrid search'],
  agentic_rag: ['agentic retrieval', 'agentic rag'],
  multi_kb_agentic_rag: ['multi-kb', 'multiple knowledge base', 'route across'],
  graph_rag: ['graphrag', 'graph rag', 'neptune', 'knowledge graph'],
  memory_augmented_rag: ['long-term memory', 'agentcore memory'],
  multi_agent_rag: ['multi-agent', 'supervisor', 'agents as tools'],
  guardrailed_secure_rag: ['guardrail', 'secure rag', 'document-level access'],
  naive_rag: ['naive rag'],
}
const ATLAS_KEYWORDS = {
  'gateway-targets': ['gateway'],
  'memory-vs-rag': ['agentcore memory'],
  'runtime-hosting': ['agentcore runtime'],
  'observability-trace': ['observability'],
  'agent-loop': ['agent loop', 'strands'],
  'mcp-tools': ['mcp', 'model context protocol'],
  identity: ['agentcore identity'],
  policy: ['agentcore policy', 'cedar'],
}

function matchKeys(text, map) {
  const out = []
  for (const [key, kws] of Object.entries(map)) {
    if (kws.some((k) => text.includes(k))) out.push(key)
  }
  return out
}

function classify(title, channel) {
  const text = (title + ' ' + channel.name).toLowerCase()
  // Topics are driven by the TITLE, not the channel's broad registry topics —
  // otherwise a generic ops video on a broad channel gets mis-tagged. Registry
  // topics still decide which channels we watch; per-video relevance is earned.
  const topics = new Set(matchKeys(text, TOPIC_KEYWORDS))
  if (topics.size === 0) topics.add('genai-general')

  let level = 'talk'
  if (/re:?invent|keynote|session|fireside|panel/.test(text) || channel.category === 'aws_events') level = 'talk'
  else if (/demo|hands.?on|build|tutorial|walkthrough|how.?to/.test(text)) level = 'demo'
  else if (/deep.?dive|under the hood|architecture|advanced|internals/.test(text)) level = 'deep-dive'
  else if (/intro|getting started|what is|overview|101|beginner/.test(text)) level = 'intro'

  const relatedPatternIds = matchKeys(text, PATTERN_KEYWORDS)
  const relatedAtlasTopicIds = matchKeys(text, ATLAS_KEYWORDS)
  return {
    topics: [...topics],
    level,
    ...(relatedPatternIds.length ? { relatedPatternIds } : {}),
    ...(relatedAtlasTopicIds.length ? { relatedAtlasTopicIds } : {}),
  }
}

/* --- helpers ------------------------------------------------------------- */
const decode = (s) =>
  (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

function isoDurationToLabel(pt) {
  if (!pt) return undefined
  const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return undefined
  const h = +(m[1] || 0)
  const min = +(m[2] || 0)
  const s = +(m[3] || 0)
  const mm = h > 0 ? String(min).padStart(2, '0') : String(min)
  return (h > 0 ? `${h}:` : '') + `${mm}:${String(s).padStart(2, '0')}`
}

async function fetchText(url) {
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(to)
  }
}

function parseRss(xml) {
  const channelName = decode((xml.match(/<author>\s*<name>([^<]+)<\/name>/) || [])[1] || '')
  const entries = []
  for (const block of xml.split('<entry>').slice(1)) {
    const id = (block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1]
    if (!id) continue
    entries.push({
      id,
      title: decode((block.match(/<title>([^<]*)<\/title>/) || [])[1] || ''),
      publishedAt: (block.match(/<published>([^<]+)<\/published>/) || [])[1] || '',
      channelId: (block.match(/<yt:channelId>([^<]+)<\/yt:channelId>/) || [])[1] || '',
    })
  }
  return { channelName, entries }
}

async function enrich(ids, quota) {
  const byId = {}
  if (!KEY || ids.length === 0) return byId
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const url =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails` +
      `&id=${batch.join(',')}&maxResults=50&key=${KEY}`
    try {
      const json = JSON.parse(await fetchText(url))
      quota.units += 1 // videos.list = 1 unit per call
      for (const item of json.items || []) {
        const th = item.snippet?.thumbnails || {}
        byId[item.id] = {
          title: decode(item.snippet?.title || ''),
          duration: isoDurationToLabel(item.contentDetails?.duration),
          thumbnail: th.medium?.url || th.high?.url || thumb(item.id),
        }
      }
    } catch (e) {
      console.warn(`  ! enrichment batch failed: ${e.message}`)
    }
  }
  return byId
}

/* --- validation ---------------------------------------------------------- */
function validate(entry) {
  return (
    entry &&
    typeof entry.id === 'string' &&
    typeof entry.title === 'string' &&
    entry.title.length > 0 &&
    typeof entry.channelId === 'string' &&
    typeof entry.channelName === 'string' &&
    typeof entry.publishedAt === 'string' &&
    typeof entry.url === 'string' &&
    typeof entry.thumbnail === 'string' &&
    Array.isArray(entry.topics) &&
    typeof entry.level === 'string' &&
    typeof entry.trustTier === 'string'
  )
}

/* --- main ---------------------------------------------------------------- */
async function main() {
  const registry = readJson(CHANNELS)
  const curation = readJson(CURATION)
  const previous = readJson(VIDEOS)

  const channels = (registry.channels || []).filter(
    (c) => c.active && !String(c.id).startsWith('REPLACE_ME'),
  )
  const activeIds = new Set(channels.map((c) => c.id))
  const channelById = Object.fromEntries((registry.channels || []).map((c) => [c.id, c]))

  const featured = new Set([
    ...(curation.collections || []).flatMap((c) => c.videoIds || []),
    ...Object.keys(curation.curatedOverrides || {}),
    ...Object.keys(curation.summaries || {}),
  ])
  const hidden = new Set(curation.hidden || [])

  const byId = new Map()
  for (const v of previous.videos || []) byId.set(v.id, v)

  const quota = { units: 0 }
  const report = { channelsChecked: 0, newVideos: 0, failures: [] }
  const newIds = []
  const pending = [] // {rssEntry, channel}

  for (const channel of channels) {
    report.channelsChecked += 1
    try {
      const xml = await fetchText(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
      )
      const { channelName, entries } = parseRss(xml)
      for (const e of entries) {
        if (hidden.has(e.id)) continue
        if (!byId.has(e.id)) {
          pending.push({ e: { ...e, channelName: channelName || channel.name }, channel })
          newIds.push(e.id)
        }
      }
      console.log(`  ✓ ${channel.name}: ${entries.length} in feed`)
    } catch (err) {
      report.failures.push({ channel: channel.name, error: err.message })
      console.warn(`  ! ${channel.name} (${channel.id}): ${err.message}`)
    }
  }

  const enriched = await enrich(newIds, quota)

  for (const { e, channel } of pending) {
    const meta = classify(e.title, channel)
    const ex = enriched[e.id] || {}
    const entry = {
      id: e.id,
      title: ex.title || e.title,
      channelId: e.channelId || channel.id,
      channelName: e.channelName,
      publishedAt: e.publishedAt,
      url: `https://www.youtube.com/watch?v=${e.id}`,
      ...(ex.duration ? { duration: ex.duration } : {}),
      thumbnail: ex.thumbnail || thumb(e.id),
      topics: meta.topics,
      level: meta.level,
      trustTier: channel.trustTier,
      ...(meta.relatedPatternIds ? { relatedPatternIds: meta.relatedPatternIds } : {}),
      ...(meta.relatedAtlasTopicIds ? { relatedAtlasTopicIds: meta.relatedAtlasTopicIds } : {}),
    }
    byId.set(e.id, entry)
    report.newVideos += 1
  }

  // Apply curation overrides + summaries (always win).
  for (const [id, over] of Object.entries(curation.curatedOverrides || {})) {
    if (byId.has(id)) Object.assign(byId.get(id), over)
  }
  for (const [id, summary] of Object.entries(curation.summaries || {})) {
    if (byId.has(id)) byId.get(id).summary = summary
  }

  // Keep videos from active channels (or manually featured); drop hidden.
  // Relevance gate: an auto-added video must earn its place with a specific
  // topic or a pattern/atlas match — generic ops videos are dropped. Anything
  // manually featured always stays, regardless.
  const relevant = (v) =>
    v.topics.some((t) => t !== 'genai-general') ||
    (v.relatedPatternIds && v.relatedPatternIds.length) ||
    (v.relatedAtlasTopicIds && v.relatedAtlasTopicIds.length)
  let kept = [...byId.values()].filter(
    (v) =>
      !hidden.has(v.id) &&
      (featured.has(v.id) || (activeIds.has(v.channelId) && relevant(v))),
  )

  // Cap most-recent N per channel, but always keep featured.
  const perChannel = new Map()
  for (const v of kept.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))) {
    const list = perChannel.get(v.channelId) || []
    if (list.length < MAX_PER_CHANNEL || featured.has(v.id)) list.push(v)
    perChannel.set(v.channelId, list)
  }
  kept = [...perChannel.values()].flat().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))

  // Backfill trustTier if a channel's tier changed.
  for (const v of kept) {
    const c = channelById[v.channelId]
    if (c && v.trustTier !== c.trustTier && !curation.curatedOverrides?.[v.id]?.trustTier) {
      v.trustTier = c.trustTier
    }
  }

  if (!kept.every(validate)) throw new Error('validation failed — refusing to write invalid videos.json')

  const output = { generatedAt: new Date().toISOString(), videos: kept }
  writeFileSync(VIDEOS, JSON.stringify(output, null, 2) + '\n')

  console.log('\n── refresh summary ──')
  console.log(`  channels checked : ${report.channelsChecked}`)
  console.log(`  new videos       : ${report.newVideos}`)
  console.log(`  total retained   : ${kept.length}`)
  console.log(`  quota units used : ${quota.units} (videos.list @ 1/call; daily limit is 10,000)`)
  console.log(`  api key present  : ${KEY ? 'yes (enrichment on)' : 'no (RSS-only)'}`)
  if (report.failures.length) {
    console.log(`  failures         : ${report.failures.length}`)
    for (const f of report.failures) console.log(`    - ${f.channel}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error('fetch-videos failed:', err)
  process.exit(1)
})
