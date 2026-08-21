import type { UpdateCuration, UpdateData, UpdateEntry, UpdateTopic } from '../types'
import rawUpdates from '../../data/updates.json'
import rawCuration from '../../data/updates-curation.json'

/**
 * Build-time update data (static JSON, refreshed daily by CI from AWS's public
 * RSS feeds). No runtime fetch, no API key — the page reads only what the
 * pipeline committed.
 */
export const UPDATE_DATA = rawUpdates as unknown as UpdateData
export const UPDATE_CURATION = rawCuration as unknown as UpdateCuration
export const UPDATES: UpdateEntry[] = UPDATE_DATA.updates ?? []
export const UPDATES_GENERATED_AT = UPDATE_DATA.generatedAt

/** Pinned items, in the order the curation file lists them. */
export const PINNED_UPDATES: UpdateEntry[] = (UPDATE_CURATION.pinned ?? [])
  .map((id) => UPDATES.find((u) => u.id === id))
  .filter((u): u is UpdateEntry => Boolean(u))

/** Every source name present in the data, for the filter dropdown. */
export const UPDATE_SOURCES: string[] = [...new Set(UPDATES.map((u) => u.sourceName))].sort()

/** Topics actually present in the data, so the filter never offers a dead option. */
export const UPDATE_TOPICS: UpdateTopic[] = [
  ...new Set(UPDATES.flatMap((u) => u.topics)),
].sort() as UpdateTopic[]

/** Days since the last refresh (Infinity if never). */
export function daysSinceUpdateRefresh(): number {
  const t = Date.parse(UPDATES_GENERATED_AT)
  if (!t || t < Date.parse('2020-01-01')) return Infinity
  return (Date.now() - t) / 86_400_000
}

/** Most recent updates, for surfacing a short rail elsewhere on the site. */
export function latestUpdates(limit = 4): UpdateEntry[] {
  return UPDATES.slice(0, limit)
}
