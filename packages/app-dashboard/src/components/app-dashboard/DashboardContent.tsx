import { Plus, Wrench, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';

interface DashboardContentProps {
  filteredAppsCount: number;
  filteredToolsCount: number;
  filteredPoliciesCount: number;
  onMenuSelection: (id: string) => void;
}

export function DashboardContent({
  filteredAppsCount,
  filteredToolsCount,
  filteredPoliciesCount,
  onMenuSelection,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Apps Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-200"
          onClick={() => onMenuSelection('app')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Apps</CardTitle>
            <CardDescription className="text-gray-600">Manage your applications</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{filteredAppsCount}</div>
          </CardContent>
        </Card>

        {/* Tools Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-200"
          onClick={() => onMenuSelection('tool')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Tools</CardTitle>
            <CardDescription className="text-gray-600">
              Create and manage your tools
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{filteredToolsCount}</div>
          </CardContent>
        </Card>

        {/* Policies Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-purple-200"
          onClick={() => onMenuSelection('policy')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Policies</CardTitle>
            <CardDescription className="text-gray-600">
              Create and manage your policies
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">{filteredPoliciesCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
