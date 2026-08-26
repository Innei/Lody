import { MarkdownRenderer } from '@/components/ai-gui/markdown-renderer'
import { ThemeProvider } from '@/theme-provider'

const FIXTURE_MARKDOWN = [
  '```ts',
  'export const hello = (name: string) => `Hello, ${name}`;',
  '```',
  '',
  '```mermaid',
  'flowchart TD',
  '  A[User] --> B[Renderer]',
  '  B --> C[Shiki]',
  '```'
].join('\n')

export const MARKDOWN_FIXTURE_HASH = '#/__markdown-fixture'

export function isMarkdownFixtureHash(hash = window.location.hash): boolean {
  return hash.includes('__markdown-fixture')
}

export function MarkdownFixturePanel(): React.JSX.Element {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background p-6 text-foreground">
        <div
          data-testid="electron-markdown-fixture"
          className="mx-auto max-w-[800px] rounded-xl border border-border bg-background p-4"
        >
          <MarkdownRenderer text={FIXTURE_MARKDOWN} size="default" />
        </div>
      </div>
    </ThemeProvider>
  )
}
