import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Ability } from '@/types/developer-dashboard/appTypes';
import { AbilitySelectorModal } from '../../AbilitySelectorModal';
import { Plus } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

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
    <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}>
      <div className={`p-6 border-b ${theme.cardBorder}`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
          Add Abilities to App Version
        </h3>
        <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
          Clicking the package name will open the ability's npm page. Otherwise, abilities will be
          added immediately when selected.
        </p>
      </div>
      <div className="p-6">
        <div className="text-center py-8">
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-white"
            style={{ backgroundColor: theme.brandOrange }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.brandOrange;
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Abilities to Version
          </Button>
        </div>
      </div>

      <AbilitySelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAbilityAdd={handleAbilityAdd}
        existingAbilities={existingAbilities}
        availableAbilities={availableAbilities}
      />
    </div>
  );
}
