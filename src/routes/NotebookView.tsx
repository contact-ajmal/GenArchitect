import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ARCHITECTURES } from '../data/architectures'
import {
  FEATURED_NOTEBOOKS,
  definitionFromId,
} from '../data/notebookTemplates'
import { Button, Eyebrow, Pill } from '../components/ui'
import NotebookPreview from '../components/notebooks/NotebookPreview'
import { DIFFICULTY_LABELS } from '../lib/display'

export default function NotebookView() {
  const { id } = useParams<{ id: string }>()
  const def = id ? definitionFromId(id) : null

  if (!def) {
    return (
      <div className="mx-auto max-w-content px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-ink">Notebook not found</h1>
        <Link to="/notebooks" className="mt-6 inline-block">
          <Button>Back to the library</Button>
        </Link>
      </div>
    )
  }

  const isFeatured = FEATURED_NOTEBOOKS.some((n) => n.id === def.id)

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <Link
        to="/notebooks"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Notebook library
      </Link>

      <header className="mt-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill variant="managed">{ARCHITECTURES[def.patternId].name}</Pill>
          <Pill variant="aws">{def.flavor.industry}</Pill>
          <Pill variant="difficulty">{DIFFICULTY_LABELS[def.difficulty]}</Pill>
          {!isFeatured ? <Pill>generated</Pill> : null}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {def.title}
        </h1>
        <p className="mt-3 text-ink-soft">{def.description}</p>
        {!isFeatured ? (
          <p className="mt-2 text-sm text-ink-muted">
            This is a generated (mechanical) assembly, not a curated featured
            notebook — still a complete end-to-end arc.
          </p>
        ) : null}
      </header>

      <div className="mt-8">
        <Eyebrow>Notebook preview</Eyebrow>
        <div className="mt-3">
          <NotebookPreview def={def} />
        </div>
      </div>
    </div>
  )
}
