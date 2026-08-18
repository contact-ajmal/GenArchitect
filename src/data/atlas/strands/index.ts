import type { AtlasSection } from '../../../atlas/types'
import { gettingStarted } from './getting-started'
import { agentFundamentals } from './agent-fundamentals'
import { stateContext } from './state-context'
import { tools } from './tools'
import { modelProviders } from './model-providers'
import { multiAgent } from './multi-agent'
import {
  streamingAsync,
  observability,
  safety,
  deployment,
  apiReference,
} from './remaining'

/** The Strands Atlas — the complete Strands Agents SDK surface, taught visually. */
export const STRANDS_SECTIONS: AtlasSection[] = [
  gettingStarted,
  agentFundamentals,
  stateContext,
  tools,
  modelProviders,
  multiAgent,
  streamingAsync,
  observability,
  safety,
  deployment,
  apiReference,
]

export const STRANDS_META = {
  title: 'Strands Atlas',
  tagline:
    'A complete, visual guide to the Strands Agents SDK — the agent loop, tools, memory, and multi-agent patterns — in original words, linking to the canonical docs for exact syntax.',
}
