import { getAuthUserId } from '@convex-dev/auth/core'
import type { QueryCtx } from './_generated/server'

/** The signed-in user's id. Demos only ever touch the caller's own rows. */
export async function requireUser(ctx: Pick<QueryCtx, 'auth'>) {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new Error('Not signed in')
  return userId
}

/** Dollar cost the gateway reports in provider metadata, when it reports one. */
export function gatewayCost(meta: Record<string, unknown> | undefined) {
  const cost = (meta?.convexGateway as { cost?: unknown } | undefined)?.cost
  return typeof cost === 'number' ? cost : null
}
