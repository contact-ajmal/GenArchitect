#!/usr/bin/env node
/**
 * GenArchitect updates refresh — the "latest across the AWS GenAI landscape" feed.
 *
 * COMPLIANCE (do not change without reading):
 *  - AWS's own PUBLIC RSS feeds only. No API key, no auth, no scraping, no
 *    hidden/internal endpoints. Every source is listed in data/feeds.json.
 *  - We keep headline + canonical link + date + a SHORT syndicated excerpt.
 *    RSS descriptions are publisher-supplied for exactly this purpose; we trim
 *    them, always name the source, and always link back to aws.amazon.com.
 *  - No full article bodies. No paywalled or gated content.
 *  - data/updates-curation.json is human-owned and is never written here.
 *
 * Runs with zero configuration: `node scripts/fetch-updates.mjs`
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const FEEDS = new URL('../data/feeds.json', import.meta.url)
const UPDATES = new URL('../data/updates.json', import.meta.url)
const CURATION = new URL('../data/updates-curation.json', import.meta.url)

const REQUEST_TIMEOUT_MS = 20000
const RETAIN_MAX_PER_SOURCE = 80 // per-feed cap in the committed output
const GLOBAL_MAX = 500 // total cap so the JSON stays reasonable
const EXCERPT_MAX = 220 // characters of syndicated excerpt we keep
const UA = 'GenArchitect-feed-reader/1.0 (+https://github.com/contact-ajmal/GenArchitect)'

const readJson = (u) => JSON.parse(readFileSync(u, 'utf8'))

/* --- the GenAI filter ----------------------------------------------------
 * Deliberately TIGHT. The lesson from the video library: a loose match on
 * bare "agent" swallows SSM Agent, CloudWatch Agent and Partner Central
 * announcements, and 85% of the library ends up in a useless catch-all
 * bucket. Every term below is a strong signal on its own. Matching is
 * word-boundary based, so "mcp" will not fire on "mcpherson".
 * ------------------------------------------------------------------------ */
const GENAI_TERMS = [
  // AWS GenAI services & frameworks
  'bedrock', 'agentcore', 'agent core', 'strands', 'sagemaker',
  'amazon nova', 'amazon titan', 'amazon kendra', 'amazon q', 'q developer',
  // model vendors that ship on AWS
  'claude', 'anthropic',
  // the field
  'generative ai', 'gen ai', 'genai', 'agentic', 'ai agent', 'ai agents',
  'llm', 'llms', 'large language model', 'foundation model', 'frontier model',
  // RAG & retrieval
  'rag', 'retrieval augmented', 'retrieval-augmented', 'knowledge base',
  'vector search', 'vector database', 'vector store', 'vector index',
  'embedding', 'embeddings', 'semantic search', 'reranking', 'rerank',
  // agent plumbing
  'model context protocol', 'mcp', 'multi-agent', 'multi agent',
  'tool calling', 'function calling', 'guardrail', 'guardrails',
  'prompt engineering', 'prompt caching', 'inference profile',
  'fine-tuning', 'fine tuning', 'model distillation', 'model evaluation',
]

// Escape regex metacharacters, then require a word boundary on each side.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const GENAI_RE = new RegExp(`\\b(${GENAI_TERMS.map(esc).join('|')})\\b`, 'i')

/**
 * AWS tags every What's New item with its own taxonomy, e.g.
 * "marketing:marchitecture/artificial-intelligence". That is AWS itself saying
 * "this is an AI announcement" — a stronger signal than any keyword we invent.
 */
const AI_CATEGORY_RE =
  /artificial-intelligence|machine-learning|generative|amazon-bedrock|amazon-sagemaker|sagemaker|amazon-q\b/i

/** How much of the body counts as the lede. */
const LEDE_CHARS = 300

/**
 * Is this item ABOUT GenAI, rather than merely mentioning it?
 *
 * The distinction matters: What's New bodies run to ~2000 characters and
 * routinely name-drop SageMaker or Amazon Q deep in the copy as a place to
 * click. Matching the whole body kept "AWS Glue 6.0" (sagemaker at char 1357)
 * and "AWS Marketplace notifications" (amazon q at char 1646). So the signal
 * has to appear where the subject is actually stated — the headline or the
 * lede — or in AWS's own category tags.
 */
function isGenAi({ title, body, categories }) {
  if (GENAI_RE.test(title)) return true
  if (AI_CATEGORY_RE.test(categories)) return true
  return GENAI_RE.test(body.slice(0, LEDE_CHARS))
}

/* --- topic tagging (shares the video library's vocabulary) --------------- */
const TOPIC_KEYWORDS = {
  agentcore: ['agentcore', 'agent core'],
  strands: ['strands'],
  rag: ['rag', 'retrieval augmented', 'retrieval-augmented', 'knowledge base'],
  bedrock: ['bedrock'],
  'vector-search': ['vector', 'opensearch', 'pgvector', 'embedding', 'semantic search'],
  guardrails: ['guardrail'],
  observability: ['observability', 'opentelemetry', 'tracing', 'cloudwatch'],
  'multi-agent': ['multi-agent', 'multi agent', 'swarm', 'supervisor', 'agents as tools', 'a2a'],
  'well-architected': ['well-architected', 'well architected'],
  'genai-general': [
    'generative ai', 'gen ai', 'genai', 'llm', 'foundation model', 'amazon q',
    'agentic', 'sagemaker', 'anthropic', 'claude', 'inference', 'nova',
  ],
}

function classify(text) {
  const t = text.toLowerCase()
  const topics = []
  for (const [key, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some((k) => t.includes(k))) topics.push(key)
  }
  if (topics.length === 0) topics.push('genai-general')
  return topics
}

/* --- helpers ------------------------------------------------------------- */
const decode = (s) =>
  (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

const stripTags = (s) => decode(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

/** Trim to a whole word, never mid-sentence-fragment ugly. */
function excerptOf(html) {
  const text = stripTags(html)
  if (!text) return undefined
  if (text.length <= EXCERPT_MAX) return text
  const cut = text.slice(0, EXCERPT_MAX)
  const at = cut.lastIndexOf(' ')
  return (at > 80 ? cut.slice(0, at) : cut).replace(/[,;:.\s]+$/, '') + '…'
}

/** Stable id from the canonical URL's last path segment. */
function slugFor(url) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '')
    const last = path.split('/').filter(Boolean).pop() || ''
    const slug = last.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return slug.slice(0, 90) || null
  } catch {
    return null
  }
}

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? m[1] : ''
}

function parseRss(xml) {
  const items = []
  for (const block of xml.split(/<item[\s>]/).slice(1)) {
    const link = stripTags(tag(block, 'link'))
    const title = stripTags(tag(block, 'title'))
    if (!link || !title) continue
    const pub = stripTags(tag(block, 'pubDate')) || stripTags(tag(block, 'dc:date'))
    const when = pub ? new Date(pub) : null
    items.push({
      title,
      link,
      publishedAt: when && !Number.isNaN(when.getTime()) ? when.toISOString() : '',
      description: tag(block, 'description'),
      author: stripTags(tag(block, 'dc:creator')) || undefined,
      categories: (block.match(/<category[^>]*>([\s\S]*?)<\/category>/gi) || [])
        .map((c) => stripTags(c)).filter(Boolean),
    })
  }
  return items
}

async function fetchText(url) {
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, */*' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(to)
  }
}

function validate(e) {
  return e && typeof e.id === 'string' && e.id.length > 0 &&
    typeof e.title === 'string' && e.title.length > 0 &&
    typeof e.url === 'string' && e.url.startsWith('http') &&
    typeof e.publishedAt === 'string' && typeof e.sourceId === 'string' &&
    typeof e.sourceName === 'string' && typeof e.kind === 'string' &&
    Array.isArray(e.topics)
}

/* --- main ---------------------------------------------------------------- */
async function main() {
  const registry = readJson(FEEDS)
  const curation = existsSync(new URL(CURATION)) ? readJson(CURATION) : { pinned: [], hidden: [], notes: {} }
  const previous = existsSync(new URL(UPDATES)) ? readJson(UPDATES) : { updates: [] }

  const sources = (registry.sources || []).filter((s) => s.active)
  const activeSourceIds = new Set(sources.map((s) => s.id))
  const hidden = new Set(curation.hidden || [])
  const pinned = curation.pinned || []
  const notes = curation.notes || {}

  // Start from what we already have — RSS only exposes ~20 recent items, so
  // the committed JSON is how the feed accumulates history over time.
  const byId = new Map()
  for (const u of previous.updates || []) byId.set(u.id, u)

  const report = { sourcesChecked: 0, discovered: 0, kept: 0, filteredOut: 0, newItems: 0, failures: [] }

  for (const source of sources) {
    report.sourcesChecked += 1
    try {
      const items = parseRss(await fetchText(source.feed))
      report.discovered += items.length
      let addedHere = 0
      let droppedHere = 0

      for (const it of items) {
        const id = slugFor(it.link)
        if (!id || hidden.has(id)) continue

        const body = stripTags(it.description)
        const categories = it.categories.join(' ')
        if (!source.keepAll && !isGenAi({ title: it.title, body, categories })) {
          droppedHere += 1
          report.filteredOut += 1
          continue
        }
        // Tag from the headline + lede for the same reason we filter on them.
        const haystack = `${it.title} ${body.slice(0, LEDE_CHARS)} ${categories}`

        const isNew = !byId.has(id)
        // Re-tagging on every run is cheap and lets keyword changes take effect.
        byId.set(id, {
          id,
          title: it.title,
          url: it.link,
          publishedAt: it.publishedAt || byId.get(id)?.publishedAt || '',
          sourceId: source.id,
          sourceName: source.name,
          kind: source.kind,
          topics: classify(haystack),
          ...(excerptOf(it.description) ? { excerpt: excerptOf(it.description) } : {}),
          ...(it.author ? { author: it.author } : {}),
        })
        if (isNew) {
          addedHere += 1
          report.newItems += 1
        }
      }
      console.log(
        `  ✓ ${source.name}: ${items.length} in feed, ${addedHere} new` +
          (droppedHere ? `, ${droppedHere} off-topic` : ''),
      )
    } catch (err) {
      report.failures.push({ source: source.name, error: err.message })
      console.warn(`  ! ${source.name}: ${err.message}`)
    }
  }

  // Curation always wins.
  for (const [id, note] of Object.entries(notes)) if (byId.has(id)) byId.get(id).note = note
  for (const id of pinned) if (byId.has(id)) byId.get(id).pinned = true

  // Drop hidden + items from sources that are no longer active.
  let kept = [...byId.values()].filter((u) => !hidden.has(u.id) && activeSourceIds.has(u.sourceId))

  // Newest first, then cap per source (pinned items are never capped away).
  kept.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
  const perSource = new Map()
  const capped = []
  for (const u of kept) {
    const n = perSource.get(u.sourceId) || 0
    if (n < RETAIN_MAX_PER_SOURCE || u.pinned) {
      capped.push(u)
      perSource.set(u.sourceId, n + 1)
    }
  }
  kept = capped.slice(0, GLOBAL_MAX)
  report.kept = kept.length

  if (!kept.every(validate)) throw new Error('validation failed — refusing to write invalid updates.json')

  writeFileSync(UPDATES, JSON.stringify({ generatedAt: new Date().toISOString(), updates: kept }, null, 2) + '\n')

  console.log('\n── updates refresh ──')
  console.log(`  sources checked  : ${report.sourcesChecked}`)
  console.log(`  items in feeds   : ${report.discovered}`)
  console.log(`  filtered as off-topic : ${report.filteredOut}`)
  console.log(`  new this run     : ${report.newItems}`)
  console.log(`  total retained   : ${report.kept}`)
  if (report.failures.length) {
    console.log(`  failures         : ${report.failures.length}`)
    for (const f of report.failures) console.log(`    - ${f.source}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error('fetch-updates failed:', err)
  process.exit(1)
})
