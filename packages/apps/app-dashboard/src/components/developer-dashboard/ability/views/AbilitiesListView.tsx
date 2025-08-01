import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { formatDate } from '@/utils/developer-dashboard/formatDateAndTime';
import { UndeleteAbilityButton } from '../wrappers';
import { Ability } from '@/types/developer-dashboard/appTypes';

interface AbilitiesListViewProps {
  abilities: Ability[];
  deletedAbilities: Ability[];
}

export function AbilitiesListView({ abilities, deletedAbilities }: AbilitiesListViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Abilities</h1>
      </div>

      {abilities.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Abilities Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first ability to get started with Vincent.
          </p>
          <Button
            variant="outline"
            className="text-gray-700"
            onClick={() => navigate('/developer/create-ability')}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create Ability
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {abilities.map((ability) => (
            <Card
              key={ability.packageName}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                navigate(`/developer/ability/${encodeURIComponent(ability.packageName)}`)
              }
            >
              <CardHeader>
                <CardTitle className="text-gray-900">{ability.packageName}</CardTitle>
                <CardDescription className="text-gray-700">
                  {ability.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {ability.activeVersion}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(ability.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Deleted Abilities Section */}
      {deletedAbilities && deletedAbilities.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Abilities</h3>
            <div className="grid grid-cols-1 gap-4">
              {deletedAbilities.map((ability) => (
                <Card key={ability.packageName} className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="line-through">{ability.packageName}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400">
                          DELETED
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          v{ability.activeVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UndeleteAbilityButton ability={ability} />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-500 line-through">
                      {ability.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Version:</span> {ability.activeVersion}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {formatDate(ability.createdAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
