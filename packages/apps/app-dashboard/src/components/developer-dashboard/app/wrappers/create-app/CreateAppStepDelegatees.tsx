import { Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { theme, fonts } from '@/lib/themeClasses';

interface CreateAppStepDelegateesProps {
  delegateeAddresses: string[];
  delegateeInput: string;
  delegateeError: string | null;
  onDelegateeInputChange: (value: string) => void;
  onRemoveDelegatee: (address: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CreateAppStepDelegatees({
  delegateeAddresses,
  delegateeInput,
  delegateeError,
  onDelegateeInputChange,
  onRemoveDelegatee,
  onNext,
  onBack,
}: CreateAppStepDelegateesProps) {
  return (
    <>
      <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
          Delegatee Addresses
          <span className={`text-xs ml-2 ${theme.textMuted} font-normal`}>(Optional)</span>
        </h3>
        <p className={`${theme.textMuted} text-sm mb-2`} style={fonts.body}>
          Add Ethereum addresses that can manage this app on your behalf.
        </p>
        <div className={`p-3 rounded-lg ${theme.warningBg} mb-4`}>
          <p className={`${theme.warningText} text-xs`} style={fonts.body}>
            <strong>Note:</strong> Adding delegatees later will require a separate blockchain
            transaction and gas fees. Consider adding them now to save on gas costs.
          </p>
        </div>

        {/* Add Delegatee Input */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Paste Ethereum address (0x...) - automatically adds when valid"
            value={delegateeInput}
            onChange={(e) => onDelegateeInputChange(e.target.value)}
            className={delegateeError ? 'border-red-500 dark:border-red-400' : ''}
          />
        </div>

        {delegateeError && (
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">{delegateeError}</p>
        )}

        {/* List of Added Delegatees */}
        {delegateeAddresses.length > 0 && (
          <div className="space-y-2">
            {delegateeAddresses.map((address, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
              >
                <span className={`text-sm font-mono ${theme.text}`} style={fonts.body}>
                  {address}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDelegatee(address)}
                  className="hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="text-white px-8"
          style={{ backgroundColor: theme.brandOrange }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.brandOrange;
          }}
        >
          Next: App Details
        </Button>
      </div>
    </>
  );
}
