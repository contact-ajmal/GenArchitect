import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import type { RagArchitectureId } from '../../types'
import { useCasesForPattern } from '../../lib/usecases'
import UseCaseCard from './UseCaseCard'

export interface RelatedUseCasesProps {
  patternId: RagArchitectureId
  title?: string
  limit?: number
}

/**
 * A quiet row of real-world deployments that map to this pattern. Renders
 * NOTHING when there's no match — no empty placeholder.
 */
export default function RelatedUseCases({
  patternId,
  title = 'In the wild',
  limit = 3,
}: RelatedUseCasesProps) {
  const cases = useMemo(() => useCasesForPattern(patternId, limit), [patternId, limit])
  if (cases.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          <Building2 className="h-3.5 w-3.5" />
          {title}
        </p>
        <Link to="/use-cases" className="text-xs font-medium text-accent-strong hover:underline">
          All case studies
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((u) => (
          <UseCaseCard key={u.id} useCase={u} compact />
        ))}
      </div>
    </div>
  )
}
