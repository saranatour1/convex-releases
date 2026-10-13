import { createServerFn } from '@tanstack/react-start'

// convex-test needs Node (AsyncLocalStorage), so the tests run on the site's
// server, in memory. Nothing here touches a Convex deployment.
export const runScenario = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { scenarios } = await import('../../convex/api/crons.test')
    if (!(id in scenarios)) throw new Error('Unknown scenario')
    const started = performance.now()
    try {
      const value = await scenarios[id as keyof typeof scenarios]()
      return {
        ok: true,
        ms: Math.round(performance.now() - started),
        value: value ?? null,
        error: null,
      }
    } catch (e) {
      const error = (e instanceof Error ? e.message : String(e))
        .split('\n')
        .slice(0, 6)
        .join('\n')
      return {
        ok: false,
        ms: Math.round(performance.now() - started),
        value: null,
        error,
      }
    }
  })
