import { Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { theme, fonts } from '@/lib/themeClasses';
import { Ability } from '@/types/developer-dashboard/appTypes';
import { AbilitySelectorModal } from '@/components/developer-dashboard/ui/AbilitySelectorModal';
import { SelectedAbility } from './types';

interface CreateAppStepAbilitiesProps {
  selectedAbilities: Map<string, SelectedAbility>;
  isAbilitySelectorOpen: boolean;
  setIsAbilitySelectorOpen: (open: boolean) => void;
  onAbilityAdd: (ability: Ability) => Promise<void>;
  onAbilityRemove: (packageName: string) => void;
  onNext: () => void;
  availableAbilities: Ability[];
}

export function CreateAppStepAbilities({
  selectedAbilities,
  isAbilitySelectorOpen,
  setIsAbilitySelectorOpen,
  onAbilityAdd,
  onAbilityRemove,
  onNext,
  availableAbilities,
}: CreateAppStepAbilitiesProps) {
  return (
    <>
      <Button
        type="button"
        onClick={() => setIsAbilitySelectorOpen(true)}
        className="mb-4"
        style={{ backgroundColor: theme.brandOrange }}
      >
        Add Ability
      </Button>

      {/* Display Selected Abilities */}
      {selectedAbilities.size > 0 && (
        <div className={`mt-6 ${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
            Selected Abilities ({selectedAbilities.size})
          </h3>
          <div className="space-y-2">
            {Array.from(selectedAbilities.values()).map(({ ability }) => (
              <div
                key={ability.packageName}
                className={`flex items-center justify-between p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
              >
                <div>
                  <div className={`font-semibold ${theme.text}`} style={fonts.body}>
                    {ability.title}
                  </div>
                  <a
                    href={`https://www.npmjs.com/package/${ability.packageName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ ...fonts.body, color: theme.brandOrange }}
                  >
                    {ability.packageName} v{ability.activeVersion}
                  </a>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAbilityRemove(ability.packageName)}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onNext}
          disabled={selectedAbilities.size === 0}
          className="text-white px-8"
          style={{ backgroundColor: theme.brandOrange }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.brandOrange;
          }}
        >
          Next: Add Delegatees
        </Button>
      </div>

      {/* Ability Selector Modal */}
      <AbilitySelectorModal
        isOpen={isAbilitySelectorOpen}
        onClose={() => setIsAbilitySelectorOpen(false)}
        onAbilityAdd={onAbilityAdd}
        existingAbilities={Array.from(selectedAbilities.keys())}
        availableAbilities={availableAbilities}
      />
    </>
  );
}
