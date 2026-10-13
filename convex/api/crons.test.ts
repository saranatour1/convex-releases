import crons from '@convex-dev/crons/test'
import { defineTestApp } from 'convex-test'
import { defineSchema } from 'convex/server'

// 0.0.61: describe the app once. Each component's test helper registers it and
// returns its API, so app.components.crons is fully typed. No anyApi casts.
const app = defineTestApp({ schema: defineSchema({}), components: { crons } })
const { createTest } = app.defineModules({})
const jobs = app.components.crons.public

const job = (name: string) => ({
  name,
  functionHandle: 'function://report',
  args: {},
  schedule: { kind: 'interval', ms: 60_000 } as const,
})

export const scenarios = {
  // Register a job, then read it back through the component's own query.
  register: async () => {
    const t = createTest() // fresh in-memory state every time
    await t.mutation(jobs.register, job('nightly-report'))
    return t.query(jobs.list, {})
  },

  // Two jobs, delete one by name. The identifier shape is checked by the types.
  remove: async () => {
    const t = createTest()
    await t.mutation(jobs.register, job('nightly-report'))
    await t.mutation(jobs.register, job('weekly-digest'))
    await t.mutation(jobs.del, { identifier: { name: 'nightly-report' } })
    return t.query(jobs.list, {})
  },

  // Bad input never reaches the component: the compiler rejects it, and so do
  // the component's own validators at runtime.
  invalid: async () => {
    const t = createTest()
    const bad = { ...job('bad'), schedule: { kind: 'weekly' } }
    // @ts-expect-error `weekly` is not a schedule kind
    await t.mutation(jobs.register, bad)
  },
}

export type ScenarioId = keyof typeof scenarios
