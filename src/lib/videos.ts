import type {
  CurationData,
  RagArchitectureId,
  VideoData,
  VideoEntry,
  VideoTopic,
} from '../types'
import rawVideos from '../../data/videos.json'
import rawCuration from '../../data/curation.json'

/**
 * Build-time video data (static JSON, refreshed daily by CI). No runtime fetch,
 * no API key — the library reads only what the pipeline committed.
 */
export const VIDEO_DATA = rawVideos as unknown as VideoData
export const CURATION = rawCuration as unknown as CurationData
export const VIDEOS: VideoEntry[] = VIDEO_DATA.videos ?? []
export const GENERATED_AT = VIDEO_DATA.generatedAt

const byId = new Map(VIDEOS.map((v) => [v.id, v]))

/**
 * The topics this site is actually about. The library is broad (every upload
 * from the tracked AWS channels), so the video page opens on this lens instead
 * of the raw firehose — "All" is one click away.
 */
export const FOCUS_TOPICS: VideoTopic[] = ['agentcore', 'strands', 'bedrock']
export const FOCUS_LABEL = 'AgentCore · Strands · Bedrock'

/** True when a video carries at least one focus topic. */
export function isFocusVideo(v: VideoEntry): boolean {
  return v.topics.some((t) => FOCUS_TOPICS.includes(t))
}

/** Videos that mention a RAG pattern. */
export function videosForPattern(id: RagArchitectureId, limit = 3): VideoEntry[] {
  return VIDEOS.filter((v) => v.relatedPatternIds?.includes(id)).slice(0, limit)
}

/** Videos that mention an atlas topic id. */
export function videosForAtlasTopic(topicId: string, limit = 3): VideoEntry[] {
  return VIDEOS.filter((v) => v.relatedAtlasTopicIds?.includes(topicId)).slice(0, limit)
}

/** Resolve a curation collection to available videos (order preserved). */
export function collectionVideos(videoIds: string[]): VideoEntry[] {
  return videoIds.map((id) => byId.get(id)).filter((v): v is VideoEntry => Boolean(v))
}

/** Days since the last refresh (Infinity if never / epoch default). */
export function daysSinceRefresh(): number {
  const t = Date.parse(GENERATED_AT)
  if (!t || t < Date.parse('2020-01-01')) return Infinity
  return (Date.now() - t) / 86_400_000
}

/** "3 weeks ago" style relative time. */
export function relativeTime(iso: string): string {
  const t = Date.parse(iso)
  if (!t) return ''
  const s = Math.max(0, (Date.now() - t) / 1000)
  const units: [number, string][] = [
    [31_536_000, 'year'],
    [2_592_000, 'month'],
    [604_800, 'week'],
    [86_400, 'day'],
    [3_600, 'hour'],
    [60, 'minute'],
  ]
  for (const [secs, label] of units) {
    const n = Math.floor(s / secs)
    if (n >= 1) return `${n} ${label}${n > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
