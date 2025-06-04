import { Plus, LayoutDashboard, Wrench, Shield, ChevronDown, ChevronRight } from 'lucide-react';

// Menu items with hierarchical structure
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'app',
    label: 'App',
    icon: Plus,
    submenu: [{ id: 'create-app', label: 'Create App' }],
  },
  {
    id: 'tool',
    label: 'Tool',
    icon: Wrench,
    submenu: [{ id: 'create-tool', label: 'Create Tool' }],
  },
  {
    id: 'policy',
    label: 'Policy',
    icon: Shield,
    submenu: [{ id: 'create-policy', label: 'Create Policy' }],
  },
];

interface SidebarProps {
  expandedMenus: Set<string>;
  selectedForm: string | null;
  selectedListView: string | null;
  onToggleMenu: (menuId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onMenuSelection: (id: string) => void;
}

export function Sidebar({
  expandedMenus,
  selectedForm,
  selectedListView,
  onToggleMenu,
  onCategoryClick,
  onMenuSelection,
}: SidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-black mb-6">Vincent</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Handle items with submenus
            if (item.submenu) {
              const isExpanded = expandedMenus.has(item.id);
              return (
                <div key={item.id}>
                  <div
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                      selectedListView === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      className="flex items-center flex-1 text-left focus:outline-none"
                      onClick={() => onCategoryClick(item.id)}
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </button>
                    <button
                      onClick={() => onToggleMenu(item.id)}
                      className="p-1 hover:bg-gray-100 rounded focus:outline-none"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {isExpanded && (
                    <div
                      className="ml-8 mt-1 space-y-1 focus:outline-none"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    >
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => onMenuSelection(subItem.id)}
                          className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                            selectedForm === subItem.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Handle regular items
            return (
              <button
                key={item.id}
                onClick={() => onMenuSelection(item.id)}
                className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                  item.id === 'dashboard' && !selectedForm && !selectedListView
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
