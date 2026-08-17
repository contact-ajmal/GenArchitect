import type { HighlighterCore } from 'shiki/core'
import type { TokensResult } from 'shiki'

/** Languages GenArchitect highlights: Python, TypeScript, bash, and JSON. */
export const SUPPORTED_LANGS = ['python', 'typescript', 'bash', 'json'] as const
export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

/** Themes bundled into the singleton (light + dark). */
export const LIGHT_THEME = 'github-light'
export const DARK_THEME = 'github-dark'

let highlighterPromise: Promise<HighlighterCore> | null = null

/**
 * Lazily create a single shared Shiki core highlighter with only the languages
 * and themes we need, using the pure-JS regex engine (no wasm).
 */
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    // Dynamic imports so Shiki + its grammars form a lazy chunk that loads
    // only when the first CodeBlock mounts — the initial bundle stays lean.
    highlighterPromise = (async () => {
      const [
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        githubLight,
        githubDark,
        python,
        typescript,
        bash,
        json,
      ] = await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
        import('shiki/themes/github-light.mjs'),
        import('shiki/themes/github-dark.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/json.mjs'),
      ])

      return createHighlighterCore({
        themes: [githubLight.default, githubDark.default],
        langs: [python.default, typescript.default, bash.default, json.default],
        engine: createJavaScriptRegexEngine({ forgiving: true }),
      })
    })()
  }
  return highlighterPromise
}

function resolveLang(highlighter: HighlighterCore, lang: SupportedLang): string {
  return highlighter.getLoadedLanguages().includes(lang) ? lang : 'plaintext'
}

/**
 * Tokenize a snippet into themed tokens (per line) so a component can render
 * its own line numbers, gutters, and line-highlighting. Never executes code.
 */
export async function tokenizeCode(
  code: string,
  lang: SupportedLang,
  theme: string = LIGHT_THEME,
): Promise<TokensResult> {
  const highlighter = await getHighlighter()
  return highlighter.codeToTokens(code, {
    lang: resolveLang(highlighter, lang),
    theme,
  })
}

/**
 * Highlight a snippet directly to an HTML string. Kept for simple, one-off use
 * where the richer {@link tokenizeCode} rendering isn't needed.
 */
export async function highlightCode(
  code: string,
  lang: SupportedLang,
  theme: string = LIGHT_THEME,
): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang: resolveLang(highlighter, lang),
    theme,
  })
}
