/**
 * Playground plumbing — deliberately minimal and clearly a teaching stand-in,
 * NOT the AgentCore/Bedrock path this app teaches.
 *
 * The model call sits behind a thin ModelProvider adapter so the UI never
 * touches secrets. Two providers are offered:
 *   - "custom": the user configures their own endpoint/proxy URL (any auth
 *     lives server-side in that proxy — never in this client).
 *   - "artifacts": the Anthropic-in-artifacts fetch pattern (no API key in
 *     code), which only works inside a Claude artifact environment.
 *
 * Retrieval is a lexical keyword match over in-memory snippets — a stand-in to
 * illustrate retrieval + grounded generation, not production retrieval.
 */

export type ProviderKind = 'custom' | 'artifacts'

export interface ModelProvider {
  kind: ProviderKind
  label: string
  /** Complete a system + user prompt into text. Throws on failure. */
  complete(system: string, user: string): Promise<string>
}

/** User-supplied endpoint/proxy. Expected to accept {system, prompt} JSON. */
export function createCustomProvider(endpoint: string): ModelProvider {
  return {
    kind: 'custom',
    label: 'Custom endpoint',
    async complete(system, user) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ system, prompt: user }),
      })
      if (!res.ok) {
        throw new Error(`Endpoint returned ${res.status} ${res.statusText}`)
      }
      const ct = res.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        return data.text ?? data.completion ?? data.output ?? JSON.stringify(data)
      }
      return res.text()
    },
  }
}

/**
 * Anthropic-in-artifacts pattern: no API key in code. Only succeeds inside a
 * Claude artifact environment; elsewhere the fetch fails and we surface a
 * friendly error.
 */
export function createArtifactsProvider(): ModelProvider {
  return {
    kind: 'artifacts',
    label: 'Claude artifact environment',
    async complete(system, user) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      })
      if (!res.ok) {
        throw new Error(
          `This provider only works inside a Claude artifact environment (got ${res.status}).`,
        )
      }
      const data = await res.json()
      const text = data?.content?.[0]?.text
      if (typeof text !== 'string') throw new Error('Unexpected response shape.')
      return text
    },
  }
}

export interface Snippet {
  id: number
  text: string
}

export interface RetrievedSnippet {
  snippet: Snippet
  score: number
}

/** Split a pasted corpus into snippets on blank lines. */
export function splitCorpus(raw: string): Snippet[] {
  return raw
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text, id) => ({ id, text }))
}

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

/** Lexical (keyword-overlap) retrieval — a labeled stand-in for embeddings. */
export function lexicalRetrieve(
  query: string,
  snippets: Snippet[],
  k = 3,
): RetrievedSnippet[] {
  const terms = new Set(tokenize(query))
  if (terms.size === 0) return []
  const scored = snippets.map((snippet) => {
    const tokens = tokenize(snippet.text)
    let score = 0
    for (const t of tokens) if (terms.has(t)) score += 1
    // Normalize slightly by length so long snippets don't dominate.
    return { snippet, score: score / Math.sqrt(tokens.length || 1) }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

/** Build a grounded prompt from retrieved context. */
export function buildGroundedPrompt(
  question: string,
  retrieved: RetrievedSnippet[],
): { system: string; user: string } {
  const context = retrieved
    .map((r, i) => `[${i + 1}] ${r.snippet.text}`)
    .join('\n\n')
  return {
    system:
      'You are a careful assistant. Answer ONLY from the provided context. ' +
      'Cite sources as [n]. If the context does not contain the answer, say so.',
    user: `Context:\n${context || '(no relevant context found)'}\n\nQuestion: ${question}`,
  }
}
