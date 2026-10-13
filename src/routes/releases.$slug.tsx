import { createFileRoute, notFound } from '@tanstack/react-router'
import { useConvex, useConvexAuth } from 'convex/react'
import { useState } from 'react'
import { PlayIcon } from 'lucide-react'
import { CodeBlock } from '~/components/code-block'
import { Phone } from '~/components/phone'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { getRelease, type Result, type Scenario } from '~/releases'

export const Route = createFileRoute('/releases/$slug')({
  loader: ({ params }) => {
    if (!getRelease(params.slug)) throw notFound()
  },
  component: ReleasePage,
})

function ReleasePage() {
  const { slug } = Route.useParams()
  const release = getRelease(slug)!
  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-10 p-6">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <header>
            <Badge variant={release.unreleased ? 'outline' : 'secondary'}>
              {release.version}
            </Badge>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {release.title}
            </h1>
            <p className="mt-1 text-muted-foreground">{release.summary}</p>
          </header>
          {release.sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-sm font-semibold">{section.title}</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-convex-yellow">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
          {release.scenarios && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Try it in a situation</h2>
              {/* key resets the selected tab and results when switching releases */}
              <Scenarios key={release.slug} scenarios={release.scenarios} />
            </section>
          )}
        </div>
        {release.demo === 'voice' && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Phone />
          </div>
        )}
      </div>
      <Files key={release.slug} files={release.files} />
    </div>
  )
}

function Scenarios({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <Tabs defaultValue={scenarios[0].id}>
      <TabsList>
        {scenarios.map((s) => (
          <TabsTrigger key={s.id} value={s.id}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {scenarios.map((s) => (
        <TabsContent key={s.id} value={s.id}>
          <ScenarioPanel scenario={s} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function ScenarioPanel({ scenario }: { scenario: Scenario }) {
  const convex = useConvex()
  const { isAuthenticated } = useConvexAuth()
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result>()
  const [error, setError] = useState<string>()

  const run = async () => {
    setRunning(true)
    setError(undefined)
    try {
      setResult(await scenario.run(convex))
    } catch (e) {
      setResult(undefined)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">Situation</dt>
          <dd className="text-muted-foreground">{scenario.situation}</dd>
        </div>
        <div>
          <dt className="font-medium">What this release does</dt>
          <dd className="text-muted-foreground">{scenario.expect}</dd>
        </div>
      </dl>
      <Button onClick={run} disabled={!isAuthenticated || running}>
        <PlayIcon />
        {running ? 'Running…' : isAuthenticated ? 'Run' : 'Signing in…'}
      </Button>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-sm font-medium">{result.verdict}</p>
          <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function Files({ files }: { files: { file: string; code: string }[] }) {
  if (files.length === 1) return <CodeBlock {...files[0]} />
  return (
    <Tabs key={files[0].file} defaultValue={files[0].file} className="min-w-0">
      <TabsList>
        {files.map((f) => (
          <TabsTrigger
            key={f.file}
            value={f.file}
            className="font-mono text-xs"
          >
            {f.file.split('/').slice(1).join('/')}
          </TabsTrigger>
        ))}
      </TabsList>
      {files.map((f) => (
        <TabsContent key={f.file} value={f.file}>
          <CodeBlock {...f} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
