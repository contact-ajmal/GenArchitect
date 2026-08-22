import type { AtlasSection } from '../../../atlas/types'
import { chunking } from './chunking'
import { embeddings } from './embeddings'
import { vectorStores } from './vector-stores'
import { retrievalOptimisation } from './retrieval-optimisation'
import { generationOptimisation } from './generation-optimisation'

/**
 * The Retrieval Atlas — the techniques between a document and a grounded
 * answer, taught visually.
 *
 * Unlike the Strands and AgentCore atlases, this one does not track a single
 * vendor's product surface. It covers the retrieval discipline itself, which
 * is why several topics cite the original research rather than AWS docs: HyDE
 * and the lost-in-the-middle effect are findings, not features. Where AWS
 * implements a technique — chunking strategies, hybrid search, reranking,
 * contextual grounding — the topic links to the service documentation and
 * carries a freshness id like every other atlas topic.
 */
export const RETRIEVAL_SECTIONS: AtlasSection[] = [
  chunking,
  embeddings,
  vectorStores,
  retrievalOptimisation,
  generationOptimisation,
]

export const RETRIEVAL_META = {
  title: 'Retrieval Atlas',
  tagline:
    'How a document becomes a grounded answer — chunking, embeddings, vector stores, and the techniques that make retrieval and generation actually work, in original words with the canonical sources linked.',
}
