import { SquareStack, Wrench, Shield, BookOpen, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/app-dashboard/ui/card';

interface DashboardContentProps {
  filteredAppsCount: number;
  filteredToolsCount: number;
  filteredPoliciesCount: number;
  error?: string | null;
  onMenuSelection: (id: string) => void;
}

export function DashboardContent({
  filteredAppsCount,
  filteredToolsCount,
  filteredPoliciesCount,
  error,
  onMenuSelection,
}: DashboardContentProps) {
  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12 ? 'Good morning' : currentTime < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Greeting */}
      <h1 className="text-4xl font-medium text-gray-900 text-center mb-12">
        {greeting}, Developer
      </h1>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Button
          variant="outline"
          className="h-16 flex items-center justify-center gap-3 text-base font-medium"
          onClick={() => onMenuSelection('create-app')}
        >
          <SquareStack className="h-5 w-5" />
          Create an app
        </Button>
        <Button
          variant="outline"
          className="h-16 flex items-center justify-center gap-3 text-base font-medium"
          onClick={() => onMenuSelection('create-tool')}
        >
          <Wrench className="h-5 w-5" />
          Create a tool
        </Button>
        <Button
          variant="outline"
          className="h-16 flex items-center justify-center gap-3 text-base font-medium"
          onClick={() => onMenuSelection('create-policy')}
        >
          <Shield className="h-5 w-5" />
          Create a policy
        </Button>
      </div>

      {/* Announcement Card */}
      <Card className="mb-12 border border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">New to Vincent?</p>
                <p className="text-sm text-gray-600">Get started with our quick start guide</p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() =>
                window.open('https://docs.heyvincent.ai/documents/Quick_Start.html', '_blank')
              }
            >
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Stats */}
      <div className="space-y-4 mb-20">
        <h2 className="text-lg font-medium text-gray-900">Your Projects</h2>

        <div className="space-y-3">
          <Card
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onMenuSelection('app')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <SquareStack className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Apps</p>
                    <p className="text-sm text-gray-600">Create and manage your applications</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">{filteredAppsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onMenuSelection('tool')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Tools</p>
                    <p className="text-sm text-gray-600">Create and manage your tools</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">{filteredToolsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onMenuSelection('policy')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Policies</p>
                    <p className="text-sm text-gray-600">Create and manage your policies</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">{filteredPoliciesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Button */}
      <div className="flex justify-center pb-8">
        <Button
          variant="ghost"
          className="text-gray-600 hover:text-gray-800"
          onClick={() => window.open('https://t.me/+vZWoA5k8jGoxZGEx', '_blank')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Help & Feedback
        </Button>
      </div>
    </div>
  );
}
