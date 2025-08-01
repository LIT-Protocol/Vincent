import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Ability } from '@/types/developer-dashboard/appTypes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { AbilitySelectorModal } from '../../AbilitySelectorModal';
import { Plus } from 'lucide-react';

interface CreateAppVersionAbilitiesFormProps {
  onAbilityAdd: (ability: Ability) => Promise<void>;
  existingAbilities?: string[]; // Array of package names already added
  availableAbilities: Ability[];
}

export function CreateAppVersionAbilitiesForm({
  onAbilityAdd,
  existingAbilities = [],
  availableAbilities,
}: CreateAppVersionAbilitiesFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAbilityAdd = async (ability: Ability) => {
    await onAbilityAdd(ability);
    setIsModalOpen(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Abilities to App Version</CardTitle>
        <CardDescription>
          Clicking the package name will open the ability's npm page. Otherwise, abilities will be
          added immediately when selected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <Button type="button" onClick={() => setIsModalOpen(true)} className="px-6 py-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Abilities to Version
          </Button>
        </div>
      </CardContent>

      <AbilitySelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAbilityAdd={handleAbilityAdd}
        existingAbilities={existingAbilities}
        availableAbilities={availableAbilities}
      />
    </Card>
  );
}
