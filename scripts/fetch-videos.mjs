#!/usr/bin/env node
/**
 * GenArchitect video refresh — RUN ONLY IN CI (or locally with a key).
 *
 * COMPLIANCE (do not change without reading):
 *  - NO scraping, NO hidden/internal endpoints.
 *  - Discovery: YouTube PUBLIC RSS feeds (free) for recent items, and the
 *    official YouTube Data API playlistItems.list (1 unit/page, 50/page) over a
 *    channel's UPLOADS playlist for full history — this is how we get hundreds,
 *    including old re:Invent sessions. We NEVER call search.list (100 units +
 *    a separate ~100/day bucket).
 *  - Handle -> channelId resolution uses channels.list (1 unit).
 *  - Enrichment uses videos.list (1 unit/call, 50 ids).
 *  - The API key is read ONLY from process.env.YOUTUBE_API_KEY.
 *  - Metadata only — no full descriptions, no transcripts.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const CHANNELS = new URL('../data/channels.json', import.meta.url)
const VIDEOS = new URL('../data/videos.json', import.meta.url)
const CURATION = new URL('../data/curation.json', import.meta.url)

const KEY = process.env.YOUTUBE_API_KEY || ''
const FETCH_MAX_PER_CHANNEL = 400 // how many history items to pull per channel (API path)
const RETAIN_MAX_PER_CHANNEL = 150 // how many to keep per channel in the output
const GLOBAL_MAX = 1200 // total cap so the JSON stays reasonable
const REQUEST_TIMEOUT_MS = 20000
const API = 'https://www.googleapis.com/youtube/v3'

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
  'genai-general': ['generative ai', 'gen ai', 'genai', 'llm', 'foundation model', 'amazon q', 'agent', 'sagemaker', 'anthropic', 'claude', 'inference'],
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
  for (const [key, kws] of Object.entries(map)) if (kws.some((k) => text.includes(k))) out.push(key)
  return out
}

function classify(title, channel) {
  const text = (title + ' ' + channel.name).toLowerCase()
  const topics = new Set(matchKeys(text, TOPIC_KEYWORDS))
  if (topics.size === 0) topics.add('genai-general')

  let level = 'talk'
  if (/re:?invent|keynote|session|fireside|panel|summit/.test(text) || channel.category === 'aws_events') level = 'talk'
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
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
const isRealId = (id) => /^UC[\w-]{20,}$/.test(id || '')

function isoDurationToLabel(pt) {
  if (!pt) return undefined
  const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return undefined
  const h = +(m[1] || 0), min = +(m[2] || 0), s = +(m[3] || 0)
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
const fetchJson = async (url) => JSON.parse(await fetchText(url))

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
      channelName,
    })
  }
  return entries
}

/** Resolve a channel to { id, uploads } (needs the API for @handle-only entries). */
async function resolve(channel, quota) {
  if (isRealId(channel.id)) return { id: channel.id, uploads: 'UU' + channel.id.slice(2) }
  if (!KEY || !channel.handle) return null
  const handle = channel.handle.replace(/^@/, '')
  const json = await fetchJson(`${API}/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${KEY}`)
  quota.units += 1
  const item = (json.items || [])[0]
  if (!item) return null
  return { id: item.id, uploads: item.contentDetails?.relatedPlaylists?.uploads }
}

/** Full upload history via playlistItems.list (API). Paginated, capped. */
async function fetchHistory(uploads, channel, quota) {
  const out = []
  let pageToken = ''
  while (out.length < FETCH_MAX_PER_CHANNEL) {
    const url = `${API}/playlistItems?part=snippet&maxResults=50&playlistId=${uploads}` +
      (pageToken ? `&pageToken=${pageToken}` : '') + `&key=${KEY}`
    const json = await fetchJson(url)
    quota.units += 1
    for (const it of json.items || []) {
      const s = it.snippet || {}
      const id = s.resourceId?.videoId
      if (!id) continue
      out.push({
        id,
        title: decode(s.title || ''),
        publishedAt: s.publishedAt || '',
        channelId: s.videoOwnerChannelId || s.channelId || channel.id || '',
        channelName: s.videoOwnerChannelTitle || s.channelTitle || channel.name,
      })
    }
    pageToken = json.nextPageToken
    if (!pageToken) break
  }
  return out
}

async function enrich(ids, quota) {
  const byId = {}
  if (!KEY || ids.length === 0) return byId
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    try {
      const json = await fetchJson(`${API}/videos?part=snippet,contentDetails&id=${batch.join(',')}&maxResults=50&key=${KEY}`)
      quota.units += 1
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

function validate(e) {
  return e && typeof e.id === 'string' && typeof e.title === 'string' && e.title.length > 0 &&
    typeof e.channelId === 'string' && typeof e.channelName === 'string' &&
    typeof e.publishedAt === 'string' && typeof e.url === 'string' &&
    typeof e.thumbnail === 'string' && Array.isArray(e.topics) &&
    typeof e.level === 'string' && typeof e.trustTier === 'string'
}

/* --- main ---------------------------------------------------------------- */
async function main() {
  const registry = readJson(CHANNELS)
  const curation = readJson(CURATION)
  const previous = readJson(VIDEOS)

  const channels = (registry.channels || []).filter((c) => c.active && !String(c.id).startsWith('REPLACE_ME'))
  const activeIds = new Set()
  const channelMetaById = {}
  const featured = new Set([
    ...(curation.collections || []).flatMap((c) => c.videoIds || []),
    ...Object.keys(curation.curatedOverrides || {}),
    ...Object.keys(curation.summaries || {}),
  ])
  const hidden = new Set(curation.hidden || [])

  const byId = new Map()
  for (const v of previous.videos || []) byId.set(v.id, v)

  const quota = { units: 0 }
  const report = { channelsChecked: 0, discovered: 0, newVideos: 0, failures: [] }
  const pending = []

  for (const channel of channels) {
    report.channelsChecked += 1
    try {
      const resolved = await resolve(channel, quota)
      if (!resolved) {
        report.failures.push({ channel: channel.name, error: 'no channel id (set id, or provide YOUTUBE_API_KEY to resolve the @handle)' })
        console.warn(`  ! ${channel.name}: unresolved (needs id or API key)`)
        continue
      }
      activeIds.add(resolved.id)
      channelMetaById[resolved.id] = channel

      let items
      if (KEY && resolved.uploads) {
        items = await fetchHistory(resolved.uploads, channel, quota)
      } else {
        items = parseRss(await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${resolved.id}`))
      }
      report.discovered += items.length
      console.log(`  ✓ ${channel.name}: ${items.length} ${KEY && resolved.uploads ? 'from history' : 'from RSS'}`)

      for (const e of items) {
        if (hidden.has(e.id)) continue
        if (!byId.has(e.id)) {
          pending.push({ e: { ...e, channelId: e.channelId || resolved.id }, channel })
        }
      }
    } catch (err) {
      report.failures.push({ channel: channel.name, error: err.message })
      console.warn(`  ! ${channel.name} (${channel.id || channel.handle}): ${err.message}`)
    }
  }

  const enriched = await enrich(pending.map((p) => p.e.id), quota)

  for (const { e, channel } of pending) {
    const meta = classify(e.title, channel)
    const ex = enriched[e.id] || {}
    byId.set(e.id, {
      id: e.id,
      title: ex.title || e.title,
      channelId: e.channelId,
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
    })
    report.newVideos += 1
  }

  // Curation always wins.
  for (const [id, over] of Object.entries(curation.curatedOverrides || {})) if (byId.has(id)) Object.assign(byId.get(id), over)
  for (const [id, summary] of Object.entries(curation.summaries || {})) if (byId.has(id)) byId.get(id).summary = summary

  // Retention: curated sources (official / aws_events) keep everything; broad
  // channels must earn relevance. Featured always kept.
  const relevant = (v) =>
    v.topics.some((t) => t !== 'genai-general') ||
    (v.relatedPatternIds && v.relatedPatternIds.length) ||
    (v.relatedAtlasTopicIds && v.relatedAtlasTopicIds.length)
  const isCuratedSource = (v) => {
    const c = channelMetaById[v.channelId]
    return c && (c.trustTier === 'official' || c.category === 'aws_events')
  }
  let kept = [...byId.values()].filter(
    (v) => !hidden.has(v.id) && (featured.has(v.id) || (activeIds.has(v.channelId) && (isCuratedSource(v) || relevant(v)))),
  )

  // Cap per channel (newest first), keeping featured.
  kept.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
  const perChannel = new Map()
  const capped = []
  for (const v of kept) {
    const list = perChannel.get(v.channelId) || []
    if (list.length < RETAIN_MAX_PER_CHANNEL || featured.has(v.id)) {
      list.push(v)
      capped.push(v)
    }
    perChannel.set(v.channelId, list)
  }
  kept = capped.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, GLOBAL_MAX)

  for (const v of kept) {
    const c = channelMetaById[v.channelId]
    if (c && !curation.curatedOverrides?.[v.id]?.trustTier) v.trustTier = c.trustTier
  }

  if (!kept.every(validate)) throw new Error('validation failed — refusing to write invalid videos.json')

  writeFileSync(VIDEOS, JSON.stringify({ generatedAt: new Date().toISOString(), videos: kept }, null, 2) + '\n')

  console.log('\n── refresh summary ──')
  console.log(`  channels checked : ${report.channelsChecked}`)
  console.log(`  items discovered : ${report.discovered}`)
  console.log(`  new videos       : ${report.newVideos}`)
  console.log(`  total retained   : ${kept.length}`)
  console.log(`  quota units used : ${quota.units} (playlistItems/videos.list/channels @ 1 each; daily limit 10,000)`)
  console.log(`  api key present  : ${KEY ? 'yes (history + enrichment)' : 'no (RSS-only, recent items from channels with a known id)'}`)
  if (report.failures.length) {
    console.log(`  failures         : ${report.failures.length}`)
    for (const f of report.failures) console.log(`    - ${f.channel}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error('fetch-videos failed:', err)
  process.exit(1)
})
