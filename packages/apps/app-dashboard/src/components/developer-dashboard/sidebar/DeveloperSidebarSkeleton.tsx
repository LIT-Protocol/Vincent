import { useTheme } from '@/providers/ThemeProvider';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';

export function DeveloperSidebarSkeleton() {
  const { isDark } = useTheme();

  const skeletonClass = `animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`;

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0 w-80">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <div className={`h-8 w-32 rounded ${skeletonClass}`} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className="px-3">
            <div className={`h-4 w-28 rounded ${skeletonClass}`} />
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

              {/* Apps submenu skeleton */}
              <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                <SidebarMenuSubItem>
                  <SidebarMenuButton className="h-9 px-3 rounded-lg">
                    <div className={`h-3 w-16 rounded ${skeletonClass}`} />
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuButton className="h-9 px-3 rounded-lg">
                    <div className={`h-3 w-20 rounded ${skeletonClass}`} />
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
                {/* App list items skeleton */}
                {[1, 2].map((i) => (
                  <div key={i} className="ml-4 mt-1">
                    <div className={`h-12 px-3 rounded-lg ${skeletonClass}`} />
                  </div>
                ))}
              </SidebarMenuSub>

              {/* Abilities section skeleton */}
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 px-3 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                    <div className={`h-4 w-12 rounded ${skeletonClass}`} />
                    <div className={`ml-auto w-4 h-4 rounded ${skeletonClass}`} />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Policies section skeleton */}
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 px-3 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                    <div className={`h-4 w-16 rounded ${skeletonClass}`} />
                    <div className={`ml-auto w-4 h-4 rounded ${skeletonClass}`} />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-0" />

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          {/* Documentation, My Account, Sign out skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${skeletonClass}`} />
                <div className={`h-4 w-20 rounded ${skeletonClass}`} />
              </div>
            </div>
          ))}

          <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-900/10'} my-2`} />

          {/* Theme toggle skeleton */}
          <div className="h-10 px-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded ${skeletonClass}`} />
              <div className={`h-4 w-16 rounded ${skeletonClass}`} />
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
