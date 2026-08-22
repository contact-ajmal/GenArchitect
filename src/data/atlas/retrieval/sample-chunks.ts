import type { ChunkStrategy } from '../../../atlas/types'

/**
 * One document, split every way the atlas teaches.
 *
 * Every strategy below splits THIS text and no other, because the only way to
 * see what a chunking rule actually costs is to watch several rules meet the
 * same paragraph. The chunk texts are written out in full rather than derived
 * from offsets: a rule that severs "late-notification" is unremarkable as a
 * config value and obvious as a string.
 *
 * The token budgets are scaled down (≈50 tokens rather than a realistic
 * 300–500) so the boundaries land inside a document short enough to read on
 * one screen. The effect is real; the numbers are miniature, and the strategy
 * config lines say so.
 */

export const POLICY_DOC = {
  title: 'meridian-claims-policy.md · §4',
  body: `## 4. Claims handling

### 4.1 Notification window
A member must notify Meridian of a claimable event within 30 calendar days. Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.

### 4.2 Required evidence
Every claim requires proof of loss. Acceptable evidence is:
- an itemised invoice from a registered provider
- a police report, where the loss involves theft
- a medical certificate signed within 14 days of the event

### 4.3 Settlement timing
Standard claims settle within 10 business days of evidence acceptance. Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.`,
}

export const FIXED_SIZE: ChunkStrategy = {
  id: 'fixed',
  label: 'Fixed-size',
  rule: 'Count characters and cut, then step back a fixed distance and start the next chunk there. The rule never looks at what it is cutting.',
  config: 'max ≈50 tokens · overlap ≈6 tokens (scaled down so the boundaries land inside a readable document)',
  benefit:
    'Trivial to implement, perfectly predictable cost, and no dependence on the document being well-formed. It is the correct choice for genuinely unstructured text.',
  caveat:
    'Three of the four chunks here are damaged. Overlap repairs some of it by repeating the seam, which is why overlap exists — but repeating text also means paying to embed and store the same sentence twice.',
  chunks: [
    {
      id: 'f1',
      label: 'chunk 1',
      tokens: 47,
      text: `## 4. Claims handling

### 4.1 Notification window
A member must notify Meridian of a claimable event within 30 calendar days. Claims filed after this window are reviewed under the late-notif`,
      warning:
        'Cuts inside a word. "late-notif" will never match a query about the late-notification exception, because the term no longer exists in this chunk.',
    },
    {
      id: 'f2',
      label: 'chunk 2',
      tokens: 51,
      overlapChars: 20,
      text: `under the late-notification exception process and are not automatically declined.

### 4.2 Required evidence
Every claim requires proof of loss. Acceptable evidence is:
- an itemised invoice from a registered`,
      warning:
        'Opens mid-clause and closes mid-list. A retriever that returns this chunk hands the model one third of an evidence rule.',
    },
    {
      id: 'f3',
      label: 'chunk 3',
      tokens: 53,
      overlapChars: 39,
      text: `- an itemised invoice from a registered provider
- a police report, where the loss involves theft
- a medical certificate signed within 14 days of the event

### 4.3 Settlement timing
Standard claims settle within 10`,
      warning:
        'Ends on a bare number. "settle within 10" loses its unit — a model reading only this chunk cannot tell days from weeks.',
    },
    {
      id: 'f4',
      label: 'chunk 4',
      tokens: 49,
      overlapChars: 32,
      text: 'Standard claims settle within 10 business days of evidence acceptance. Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.',
    },
  ],
}

export const RECURSIVE: ChunkStrategy = {
  id: 'recursive',
  label: 'Recursive',
  rule: 'Try to split on the biggest separator first — headings, then blank lines, then sentences — and only fall back to a blunt character cut if a piece is still over budget.',
  config: 'separators: heading → paragraph → sentence · max ≈80 tokens',
  benefit:
    'Chunks end where the author ended something. No sentence is ever severed, and each chunk is a unit a human would recognise as complete.',
  caveat:
    'Chunk 2 no longer says which policy it belongs to — the "## 4. Claims handling" heading stayed in chunk 1. Structure-aware splitting fixes severed sentences but not lost context; prepending the heading trail to each chunk is a separate, deliberate step.',
  chunks: [
    {
      id: 'r1',
      label: 'chunk 1',
      tokens: 52,
      text: `## 4. Claims handling

### 4.1 Notification window
A member must notify Meridian of a claimable event within 30 calendar days. Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.`,
    },
    {
      id: 'r2',
      label: 'chunk 2',
      tokens: 54,
      text: `### 4.2 Required evidence
Every claim requires proof of loss. Acceptable evidence is:
- an itemised invoice from a registered provider
- a police report, where the loss involves theft
- a medical certificate signed within 14 days of the event`,
    },
    {
      id: 'r3',
      label: 'chunk 3',
      tokens: 51,
      text: `### 4.3 Settlement timing
Standard claims settle within 10 business days of evidence acceptance. Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.`,
    },
  ],
}

export const SEMANTIC: ChunkStrategy = {
  id: 'semantic',
  label: 'Semantic',
  rule: 'Embed each sentence, walk the document comparing neighbours, and cut wherever consecutive sentences stop being about the same thing.',
  config: 'sentence embeddings · breakpoint at a similarity drop below the 95th-percentile threshold',
  benefit:
    'Boundaries land on meaning rather than on markup, so a chunk covers one idea. Notice it split §4.3 in two: standard settlement and complex settlement are different rules, even though the author wrote them as one paragraph under one heading.',
  caveat:
    'Costs an embedding pass at ingest just to decide where to cut, and the breakpoint threshold is a knob you have to tune per corpus. On clean, well-structured documents it often lands where recursive splitting already would — pay for it where prose runs on.',
  chunks: [
    {
      id: 's1',
      label: 'chunk 1',
      tokens: 52,
      text: `## 4. Claims handling

### 4.1 Notification window
A member must notify Meridian of a claimable event within 30 calendar days. Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.`,
    },
    {
      id: 's2',
      label: 'chunk 2',
      tokens: 54,
      text: `### 4.2 Required evidence
Every claim requires proof of loss. Acceptable evidence is:
- an itemised invoice from a registered provider
- a police report, where the loss involves theft
- a medical certificate signed within 14 days of the event`,
    },
    {
      id: 's3',
      label: 'chunk 3',
      tokens: 22,
      text: `### 4.3 Settlement timing
Standard claims settle within 10 business days of evidence acceptance.`,
    },
    {
      id: 's4',
      label: 'chunk 4',
      tokens: 30,
      text: 'Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.',
    },
  ],
}

export const HIERARCHICAL: ChunkStrategy = {
  id: 'hierarchical',
  label: 'Hierarchical',
  rule: 'Split twice. Small children get embedded so matching stays precise; the large parent they came from is what gets returned.',
  config: 'parent ≈ subsection · child ≈ one rule · only children are embedded',
  benefit:
    'Resolves the tension that makes chunking hard. Small chunks match well and read badly; large chunks read well and match badly. Here the query matches a single evidence line and the model still receives the whole evidence rule around it.',
  retrievedNote:
    'a query matching "police report" hits child 2, and the retriever returns parent §4.2 in full — so the model sees that a police report is one of three acceptable options, not the only one.',
  chunks: [
    {
      id: 'p1',
      label: 'parent §4.1',
      tokens: 52,
      text: `### 4.1 Notification window
A member must notify Meridian of a claimable event within 30 calendar days. Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.`,
    },
    {
      id: 'p1c1',
      parentId: 'p1',
      label: 'child 1',
      tokens: 18,
      text: 'A member must notify Meridian of a claimable event within 30 calendar days.',
    },
    {
      id: 'p1c2',
      parentId: 'p1',
      label: 'child 2',
      tokens: 24,
      text: 'Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.',
    },
    {
      id: 'p2',
      label: 'parent §4.2',
      tokens: 54,
      text: `### 4.2 Required evidence
Every claim requires proof of loss. Acceptable evidence is:
- an itemised invoice from a registered provider
- a police report, where the loss involves theft
- a medical certificate signed within 14 days of the event`,
    },
    { id: 'p2c1', parentId: 'p2', label: 'child 1', tokens: 11, text: '- an itemised invoice from a registered provider' },
    { id: 'p2c2', parentId: 'p2', label: 'child 2', tokens: 11, text: '- a police report, where the loss involves theft' },
    { id: 'p2c3', parentId: 'p2', label: 'child 3', tokens: 14, text: '- a medical certificate signed within 14 days of the event' },
    {
      id: 'p3',
      label: 'parent §4.3',
      tokens: 51,
      text: `### 4.3 Settlement timing
Standard claims settle within 10 business days of evidence acceptance. Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.`,
    },
    { id: 'p3c1', parentId: 'p3', label: 'child 1', tokens: 15, text: 'Standard claims settle within 10 business days of evidence acceptance.' },
    { id: 'p3c2', parentId: 'p3', label: 'child 2', tokens: 30, text: 'Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.' },
  ],
}

export const SENTENCE_WINDOW: ChunkStrategy = {
  id: 'sentence-window',
  label: 'Sentence window',
  rule: 'Embed one sentence at a time, but remember each sentence’s neighbours and hand those back with it on a hit.',
  config: 'embed: 1 sentence · return: ±1 sentence of context',
  benefit:
    'The most precise matching unit there is — a single sentence carries no competing topics to dilute its vector. Precision at match time, context at read time.',
  caveat:
    'The index grows: more chunks means more vectors, more storage and more candidates for the reranker to sort. And a sentence that depends on the one before it ("this window", "such claims") still embeds as a fragment, so pronouns and back-references match poorly.',
  retrievedNote:
    'matching chunk 4 returns chunks 3–5 concatenated, so the model reads the evidence requirement together with the list item that satisfies it.',
  chunks: [
    { id: 'w1', label: 'chunk 1', tokens: 18, text: 'A member must notify Meridian of a claimable event within 30 calendar days.' },
    { id: 'w2', label: 'chunk 2', tokens: 24, text: 'Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.', warning: '"this window" refers to a sentence that is now a different chunk.' },
    { id: 'w3', label: 'chunk 3', tokens: 12, text: 'Every claim requires proof of loss. Acceptable evidence is:' },
    { id: 'w4', label: 'chunk 4', tokens: 11, text: '- an itemised invoice from a registered provider' },
    { id: 'w5', label: 'chunk 5', tokens: 11, text: '- a police report, where the loss involves theft' },
    { id: 'w6', label: 'chunk 6', tokens: 14, text: '- a medical certificate signed within 14 days of the event' },
    { id: 'w7', label: 'chunk 7', tokens: 15, text: 'Standard claims settle within 10 business days of evidence acceptance.' },
    { id: 'w8', label: 'chunk 8', tokens: 30, text: 'Complex claims — those exceeding £25,000 or involving a third party — move to the specialist queue and settle within 30 business days.' },
  ],
}

/** Every strategy, for the flagship side-by-side lab. */
export const ALL_STRATEGIES: ChunkStrategy[] = [
  FIXED_SIZE,
  RECURSIVE,
  SEMANTIC,
  HIERARCHICAL,
  SENTENCE_WINDOW,
]
