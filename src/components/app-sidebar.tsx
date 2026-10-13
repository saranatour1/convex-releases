import { Link } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { releases } from '~/releases'

export function AppSidebar() {
  const { isAuthenticated } = useConvexAuth()
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="px-2 py-1 text-sm font-semibold">
          Convex Releases
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Releases</SidebarGroupLabel>
          <SidebarMenu>
            {releases.map((r) => (
              <SidebarMenuItem key={r.slug}>
                <SidebarMenuButton
                  asChild
                  className="h-auto flex-col items-start gap-0 py-2"
                >
                  <Link
                    to="/releases/$slug"
                    params={{ slug: r.slug }}
                    activeProps={{ 'data-active': true }}
                  >
                    <span className="text-xs text-muted-foreground">
                      {r.version}
                    </span>
                    <span className="font-mono text-[13px]">{r.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 text-xs text-muted-foreground">
        {isAuthenticated
          ? 'Anonymous session. Demos only touch your own rows.'
          : 'Starting anonymous session…'}
      </SidebarFooter>
    </Sidebar>
  )
}
