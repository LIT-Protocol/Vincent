import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/app-dashboard/Sidebar';
import { useAppSidebar } from '@/hooks/app-dashboard/useAppSidebar';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  // Get sidebar state and handlers from custom hook
  const {
    shouldShowSidebar,
    expandedMenus,
    selectedForm,
    selectedListView,
    selectedApp,
    selectedAppView,
    apps,
    onToggleMenu,
    onCategoryClick,
    onMenuSelection,
    onAppSelection,
    onAppViewSelection,
  } = useAppSidebar();

  return (
    <div className={cn('min-h-screen min-w-screen bg-gray flex', className)}>
      {shouldShowSidebar && (
        <Sidebar
          expandedMenus={expandedMenus}
          selectedForm={selectedForm}
          selectedListView={selectedListView}
          selectedApp={selectedApp}
          selectedAppView={selectedAppView}
          apps={apps}
          onToggleMenu={onToggleMenu}
          onCategoryClick={onCategoryClick}
          onMenuSelection={onMenuSelection}
          onAppSelection={onAppSelection}
          onAppViewSelection={onAppViewSelection}
        />
      )}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default AppLayout;
