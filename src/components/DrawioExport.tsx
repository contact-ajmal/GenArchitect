import { useMemo, useState } from 'react'
import { Check, Copy, Download, Network } from 'lucide-react'
import type { DiagramSource } from '../lib/layout'
import { downloadDrawio, toDrawioXml } from '../export/drawio'
import { Button } from './ui'

export interface DrawioExportProps {
  source: DiagramSource
  /** Base filename without extension. */
  name: string
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'architecture'
}

/**
 * Exports the architecture as a draw.io (diagrams.net) template — mxGraph XML
 * with AWS icons and flow — that opens straight into draw.io.
 */
export default function DrawioExport({ source, name }: DrawioExportProps) {
  const [copied, setCopied] = useState(false)
  const xml = useMemo(() => toDrawioXml(source), [source])

  async function copy() {
    try {
      await navigator.clipboard.writeText(xml)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-xl border border-hairline bg-neutral-0 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-strong">
          <Network className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">Open it in draw.io</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Download a ready-to-edit draw.io template of this architecture — AWS
            icons and flow included — as a starting point for your own diagram.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => downloadDrawio(source, `${slug(name)}.drawio`)}>
          <Download className="h-4 w-4" />
          Download .drawio
        </Button>
        <Button size="sm" variant="subtle" onClick={copy}>
          {copied ? <Check className="h-4 w-4 text-accent-strong" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied XML' : 'Copy XML'}
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Open the downloaded file in{' '}
        <a href="https://app.diagrams.net/" target="_blank" rel="noreferrer" className="text-accent-strong hover:underline">
          app.diagrams.net
        </a>{' '}
        (File → Open), or paste the copied XML via <strong>Extras → Edit Diagram</strong>.
        For the AWS icons, enable the AWS 2019 shape library (More Shapes → AWS).
        It’s a reference template — adjust it for your real design.
      </p>
    </div>
  )
}
