import { SquareStack, Wrench, Shield, BookOpen, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { MenuId } from '@/types/developer-dashboard/menuId';

interface DashboardContentProps {
  filteredAppsCount: number;
  filteredAbilitiesCount: number;
  filteredPoliciesCount: number;
  onMenuSelection: (id: MenuId) => void;
}

export function DashboardContent({
  filteredAppsCount,
  filteredAbilitiesCount,
  filteredPoliciesCount,
  onMenuSelection,
}: DashboardContentProps) {
  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12 ? 'Good morning' : currentTime < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Greeting */}
      <h1 className="text-4xl font-medium text-neutral-800 dark:text-white text-center mb-12">
        {greeting}, Developer
      </h1>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Button
          variant="outline"
          className="h-16 flex items-center justify-center gap-3 text-base font-medium border-gray-300 dark:border-white/20 hover:!border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 focus:!border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:!outline-none active:!border-orange-500 focus-visible:!border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:!outline-none transition-all"
          onClick={() => onMenuSelection('create-app')}
        >
          <SquareStack className="h-5 w-5 text-orange-500" />
          Create an app
        </Button>
        <Button
          variant="outline"
          className="h-16 flex items-center justify-center gap-3 text-base font-medium border-gray-300 dark:border-white/20 hover:!border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 focus:!border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:!outline-none active:!border-orange-500 focus-visible:!border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:!outline-none transition-all"
          onClick={() => onMenuSelection('create-ability')}
        >
          <Wrench className="h-5 w-5 text-orange-500" />
          Create an ability
        </Button>
        <Button
          variant="outline"
          className="h-16 flex items-center justify-center gap-3 text-base font-medium border-gray-300 dark:border-white/20 hover:!border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 focus:!border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:!outline-none active:!border-orange-500 focus-visible:!border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:!outline-none transition-all"
          onClick={() => onMenuSelection('create-policy')}
        >
          <Shield className="h-5 w-5 text-orange-500" />
          Create a policy
        </Button>
      </div>

      {/* Announcement Card */}
      <Card className="mb-12 border border-orange-200 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-800 dark:text-white">New to Vincent?</p>
                <p className="text-sm text-gray-600 dark:text-white/60">
                  Get started with the quick start guide and join the builder&apos;s thread
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() =>
                  window.open('https://docs.heyvincent.ai/documents/Getting_Started.html', '_blank')
                }
              >
                View Docs
              </Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => window.open('https://t.me/+vZWoA5k8jGoxZGEx', '_blank')}
              >
                Builder&apos;s Thread
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Stats */}
      <div className="space-y-4 mb-20">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Your Projects</h2>

        <div className="space-y-3">
          <Card
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-orange-500/5 hover:border-orange-200 dark:hover:border-orange-500/20 transition-all border-gray-200 dark:border-white/10"
            onClick={() => onMenuSelection('app')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-500/20 rounded flex items-center justify-center">
                    <SquareStack className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white">Apps</p>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Create and manage your applications
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-neutral-800 dark:text-white">
                    {filteredAppsCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-orange-500/5 hover:border-orange-200 dark:hover:border-orange-500/20 transition-all border-gray-200 dark:border-white/10"
            onClick={() => onMenuSelection('ability')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-500/20 rounded flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white">Abilities</p>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Create and manage your abilities
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-neutral-800 dark:text-white">
                    {filteredAbilitiesCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-orange-500/5 hover:border-orange-200 dark:hover:border-orange-500/20 transition-all border-gray-200 dark:border-white/10"
            onClick={() => onMenuSelection('policy')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-500/20 rounded flex items-center justify-center">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white">Policies</p>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Create and manage your policies
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-neutral-800 dark:text-white">
                    {filteredPoliciesCount}
                  </p>
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
          className="text-gray-600 dark:text-white/60 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10"
          onClick={() => window.open('https://t.me/+vZWoA5k8jGoxZGEx', '_blank')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Help & Feedback
        </Button>
      </div>
    </div>
  );
}
