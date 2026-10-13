import { Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { SidebarTrigger } from '~/components/ui/sidebar'

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <span className="size-3 rounded-sm bg-convex-yellow" aria-hidden />
        Convex Releases
      </Link>
      <nav className="ml-auto flex items-center gap-1 text-sm">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">All releases</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a
            href="https://docs.convex.dev/ai-gateway"
            target="_blank"
            rel="noreferrer"
          >
            AI Gateway
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href="https://docs.convex.dev" target="_blank" rel="noreferrer">
            Docs
          </a>
        </Button>
      </nav>
    </header>
  )
}
