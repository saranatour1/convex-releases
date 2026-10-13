import type { ConvexReactClient } from 'convex/react'
import budgetSrc from '../convex/api/budget.ts?raw'
import messagesSrc from '../convex/api/messages.ts?raw'
import voiceSrc from '../convex/api/voice.ts?raw'
import modelsSrc from '../convex/models.ts?raw'
import cronsTestsSrc from '../convex/api/crons.test.ts?raw'
import { runScenario } from './demos/runScenario'

export type Result = { ok: boolean; verdict: string; data: unknown }

export type Scenario = {
  id: string
  label: string
  /** The situation you are in. */
  situation: string
  /** What this release should do about it. */
  expect: string
  run: (c: ConvexReactClient) => Promise<Result>
}

export type Release = {
  slug: string
  version: string
  unreleased?: boolean
  title: string
  summary: string
  /** Bullet lists on the left: what you are trying to do, and what the release gives you. */
  sections: { title: string; items: string[] }[]
  /** The exact source that runs on the backend. */
  files: { file: string; code: string }[]
  /** A live conversation shown beside the page instead of scenario tabs. */
  demo?: 'voice'
  scenarios?: Scenario[]
}

// Runs one convex-test scenario on the site's server. `expectFailure` is for
// the scenario whose whole point is that the component rejects the input.
const run =
  (id: string, verdict: (value: any) => string, expectFailure = false) =>
  async (): Promise<Result> => {
    const r = await runScenario({ data: id })
    if (expectFailure) {
      return {
        ok: !r.ok,
        verdict: r.ok
          ? 'Nothing rejected it.'
          : 'Rejected before anything was stored.',
        data: { error: r.error, ms: r.ms },
      }
    }
    return {
      ok: r.ok,
      verdict: r.ok ? `${verdict(r.value)} (${r.ms} ms)` : 'Test failed.',
      data: r.ok ? r.value : r.error,
    }
  }

export const releases: Release[] = [
  {
    slug: 'define-test-app',
    version: 'convex-test 0.0.61',
    title: 'defineTestApp',
    summary: 'Type-safe component APIs in tests. No anyApi casts.',
    sections: [
      {
        title: 'What you are trying to do',
        items: [
          "Test code that uses a Convex component, with the component's real types.",
          'Call the component from a test with t.mutation and t.query, and have the compiler check every argument.',
          'Start every test from fresh in-memory state.',
        ],
      },
      {
        title: 'What 0.0.61 gives you',
        items: [
          'defineTestApp({ schema, components }) gives you typed app.components references. No anyApi casts.',
          'Workpool, RAG, workflow and crons already ship test helpers that return their API. This page uses crons.',
          'convex-test rejects .paginate from components, and fixes text search on undefined.',
        ],
      },
      {
        title: 'Good to know',
        items: [
          "These tests really run, in memory, on this site's server. Nothing touches your Convex deployment.",
          'A component whose test helper returns nothing needs a one-line ComponentRegistration cast to get types.',
        ],
      },
    ],
    files: [{ file: 'convex/api/crons.test.ts', code: cronsTestsSrc }],
    scenarios: [
      {
        id: 'register',
        label: 'Register a job',
        situation:
          'You schedule a job through the crons component and want to read it back.',
        expect:
          'register and list are typed from the component. The job comes back with its schedule.',
        run: run(
          'register',
          (jobs) => `Found ${jobs.length} job: ${jobs[0]?.name}.`,
        ),
      },
      {
        id: 'remove',
        label: 'Delete one',
        situation: 'Two jobs are scheduled and you delete one by name.',
        expect: 'del takes a typed identifier. Only the other job is left.',
        run: run(
          'remove',
          (jobs) => `${jobs.length} job left: ${jobs[0]?.name}.`,
        ),
      },
      {
        id: 'invalid',
        label: 'Bad input',
        situation: 'A test passes a schedule kind the component does not have.',
        expect:
          "The compiler flags it in your editor (see @ts-expect-error), and the component's validator rejects it at runtime.",
        run: run('invalid', () => '', true),
      },
    ],
  },
  {
    slug: 'ai-sdk-provider-0-3',
    version: 'ai-sdk-provider 0.3.0',
    title: 'Talk to your backend',
    summary:
      'Voice, zero-data-retention routing and transcription retries on the Convex AI gateway.',
    demo: 'voice',
    sections: [
      {
        title: 'What you are trying to do',
        items: [
          'Talk to your backend hands-free: pause, and it answers. No provider keys.',
          'Keep the conversation in a Convex table so it survives a refresh.',
          'Stay under an AI budget: a turn costs 3 gateway calls, each visitor gets 12.',
        ],
      },
      {
        title: 'What 0.3.0 gives you',
        items: [
          'transcriptionModel and speechModel on the Convex AI gateway.',
          '{ zdr: true } on the text step keeps your words on zero-data-retention endpoints.',
          "They plug into the AI SDK's transcribe and generateSpeech from a plain action.",
          'Transcription failures keep their HTTP status, so transient ones honor maxRetries (#59458).',
        ],
      },
      {
        title: 'Good to know',
        items: [
          "The gateway bills the deployment's team and needs a paid plan.",
          'Copy the files below into your own project to run without this budget.',
        ],
      },
    ],
    files: [
      { file: 'convex/models.ts', code: modelsSrc },
      { file: 'convex/api/voice.ts', code: voiceSrc },
      { file: 'convex/api/messages.ts', code: messagesSrc },
      { file: 'convex/api/budget.ts', code: budgetSrc },
    ],
  },
]

export const getRelease = (slug: string) =>
  releases.find((r) => r.slug === slug)
