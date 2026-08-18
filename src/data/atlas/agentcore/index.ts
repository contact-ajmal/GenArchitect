import type { AtlasSection } from '../../../atlas/types'
import { whatIs } from './what-is'
import { runtime } from './runtime'
import { memory } from './memory'
import { gateway } from './gateway'
import {
  identity,
  builtInTools,
  policy,
  observability,
  evaluations,
  toolingOps,
  additional,
} from './remaining'

/** The AgentCore Atlas — the complete Amazon Bedrock AgentCore surface, visual. */
export const AGENTCORE_SECTIONS: AtlasSection[] = [
  whatIs,
  runtime,
  memory,
  gateway,
  identity,
  builtInTools,
  policy,
  observability,
  evaluations,
  toolingOps,
  additional,
]

export const AGENTCORE_META = {
  title: 'AgentCore Atlas',
  tagline:
    'A complete, visual guide to Amazon Bedrock AgentCore — Runtime, Memory, Gateway, Identity, Policy, and Observability — in original words, linking to the canonical AWS docs for exact syntax.',
}
