import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge } from '~/components/ui/badge'
import { releases } from '~/releases'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Convex Releases</h1>
      <p className="mt-2 text-muted-foreground">
        Not docs. Each page takes one Convex release, drops you into a situation
        where it matters, and runs the real code against a real backend. You are
        signed in anonymously, so you can press Run, copy the code, and change
        it.
      </p>
      {releases.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No releases yet.</p>
      )}
      <ul className="mt-8 grid gap-3">
        {releases.map((r) => (
          <li key={r.slug}>
            <Link
              to="/releases/$slug"
              params={{ slug: r.slug }}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Badge variant={r.unreleased ? 'outline' : 'secondary'}>
                  {r.version}
                </Badge>
                <span className="font-mono text-sm">{r.title}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
