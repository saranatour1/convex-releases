import { createRouter } from '@tanstack/react-router'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { api } from '../convex/_generated/api'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: ({ error }) => (
      <p className="p-6">{String(error)}</p>
    ),
    defaultNotFoundComponent: () => <p className="p-6">Not found</p>,
    Wrap: ({ children }) => (
      <ConvexAuthProvider
        client={convex}
        api={{
          refreshSession: api.auth.refreshSession,
          signOut: api.auth.signOut,
        }}
      >
        {children}
      </ConvexAuthProvider>
    ),
  })
}
