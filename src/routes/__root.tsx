import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import { useConvexAuth } from 'convex/react'
import { useAnonymousAuth } from '@convex-dev/auth/providers/anonymous/react'
import { api } from '../../convex/_generated/api'
import { AppSidebar } from '~/components/app-sidebar'
import { TopNav } from '~/components/top-nav'
import { Toaster } from '~/components/ui/sonner'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { TooltipProvider } from '~/components/ui/tooltip'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Convex Releases',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <AutoSignIn />
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <TopNav />
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
      <Toaster />
    </RootDocument>
  )
}

// Every visitor gets an anonymous account on first load; Convex Auth persists it.
function AutoSignIn() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signInAnonymous } = useAnonymousAuth(api.auth.signInAnonymous)
  const started = React.useRef(false)
  React.useEffect(() => {
    if (isLoading || isAuthenticated || started.current) return
    started.current = true
    signInAnonymous().catch((e) => {
      started.current = false
      console.error('anonymous sign-in failed', e)
    })
  }, [isLoading, isAuthenticated, signInAnonymous])
  return null
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches)`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
