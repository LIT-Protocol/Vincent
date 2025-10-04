import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';

export function SidebarSkeleton() {
  const skeletonClass = 'animate-pulse bg-gray-200 dark:bg-white/10';

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <div className={`h-8 w-32 rounded ${skeletonClass}`} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className="px-3">
            <div className={`h-4 w-20 rounded ${skeletonClass}`} />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Dashboard skeleton */}
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 px-3 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                    <div className={`h-4 w-20 rounded ${skeletonClass}`} />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Apps section skeleton */}
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 px-3 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                    <div className={`h-4 w-12 rounded ${skeletonClass}`} />
                    <div className={`ml-auto w-4 h-4 rounded ${skeletonClass}`} />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* App items skeleton */}
              <div className="ml-6 space-y-1">
                {[1, 2, 3].map((i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton className="h-8 px-3 rounded-md">
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                        <div className={`h-3 w-16 rounded ${skeletonClass}`} />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-0" />

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          {/* Dashboard Switcher - 2 items */}
          {[1, 2].map((i) => (
            <div key={`dashboard-${i}`} className="h-10 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                <div className={`h-4 w-28 rounded ${skeletonClass}`} />
              </div>
            </div>
          ))}

          <div className="border-t border-gray-900/10 dark:border-white/10 my-2" />

          {/* My Account, Sign out - 2 items */}
          {[1, 2].map((i) => (
            <div key={`account-${i}`} className="h-10 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                <div className={`h-4 w-20 rounded ${skeletonClass}`} />
              </div>
            </div>
          ))}

          <div className="border-t border-gray-900/10 dark:border-white/10 my-2" />

          {/* FAQ, Theme toggle - 2 items */}
          {[1, 2].map((i) => (
            <div key={`settings-${i}`} className="h-10 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                <div className={`h-4 w-16 rounded ${skeletonClass}`} />
              </div>
            </div>
          ))}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
