import { Link } from 'react-router-dom'
import { Button, Eyebrow } from '../components/ui'

/** Temporary placeholder until the Strands/AgentCore atlases are authored
 *  (Phases 22–23). Keeps the nav links from being dead. */
export default function AtlasPlaceholder({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-content px-4 py-24 text-center sm:px-6">
      <Eyebrow>Visual atlas</Eyebrow>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
        The {name} Atlas is being authored
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        The shared infrastructure and visual primitives are built. The content
        atlas lands next.
      </p>
      <Link to="/atlas-demo" className="mt-6 inline-block">
        <Button variant="subtle">Preview the visual primitives</Button>
      </Link>
    </div>
  )
}
