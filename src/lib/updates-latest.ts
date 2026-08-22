import type { UpdateLatestData, UpdateSummary } from '../types'
import rawLatest from '../../data/updates-latest.json'

/**
 * The homepage band's data, kept in its own module ON PURPOSE.
 *
 * `lib/updates.ts` imports the full feed (~19 kB gzipped) at module scope, so
 * anything importing from it drags the whole library along. The homepage is
 * eagerly loaded, so it must not. Importing from here keeps the critical path
 * to the ~0.7 kB it actually needs to draw six cards.
 */
const DATA = rawLatest as unknown as UpdateLatestData

/** Newest items, pinned first — ordering is baked in by the refresh script. */
export const LATEST_UPDATES: UpdateSummary[] = DATA.updates ?? []
export const LATEST_GENERATED_AT: string = DATA.generatedAt
