import { Button } from '@/components/shared/ui/button';
import { theme, fonts } from '@/lib/themeClasses';
import { SelectedAbility } from './types';
import { AppMetadataFormData } from './useCreateAppFormState';

interface CreateAppStepReviewProps {
  metadataFormData: AppMetadataFormData | null;
  selectedAbilities: Map<string, SelectedAbility>;
  delegateeAddresses: string[];
  onSubmit: () => void;
  onBack: () => void;
}

export function CreateAppStepReview({
  metadataFormData,
  selectedAbilities,
  delegateeAddresses,
  onSubmit,
  onBack,
}: CreateAppStepReviewProps) {
  return (
    <>
      <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
          Review Your App
        </h3>

        {/* App Details */}
        {metadataFormData && (
          <div className="mb-6">
            <h4 className={`text-sm font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
              App Details
            </h4>
            <div className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder} space-y-2`}>
              <div>
                <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  Name:
                </span>
                <div className={`font-semibold ${theme.text}`} style={fonts.body}>
                  {metadataFormData.name}
                </div>
              </div>
              <div>
                <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  Description:
                </span>
                <div className={`${theme.text}`} style={fonts.body}>
                  {metadataFormData.description}
                </div>
              </div>
              <div>
                <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  Contact Email:
                </span>
                <div className={`${theme.text}`} style={fonts.body}>
                  {metadataFormData.contactEmail}
                </div>
              </div>
              <div>
                <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  App URL:
                </span>
                <div className={`${theme.text}`} style={fonts.body}>
                  {metadataFormData.appUrl}
                </div>
              </div>
              {metadataFormData.logo && (
                <div>
                  <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                    Logo:
                  </span>
                  <div className={`${theme.text}`} style={fonts.body}>
                    {metadataFormData.logo}
                  </div>
                </div>
              )}
              <div>
                <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  Deployment Status:
                </span>
                <div className={`${theme.text} capitalize`} style={fonts.body}>
                  {metadataFormData.deploymentStatus}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Abilities */}
        <div className="mb-6">
          <h4 className={`text-sm font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
            Selected Abilities ({selectedAbilities.size})
          </h4>
          <div className="space-y-2">
            {Array.from(selectedAbilities.values()).map(({ ability }) => (
              <div
                key={ability.packageName}
                className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
              >
                <div className={`font-semibold ${theme.text}`} style={fonts.body}>
                  {ability.title}
                </div>
                <div className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                  {ability.packageName} v{ability.activeVersion}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delegatee Addresses */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
            Delegatee Addresses ({delegateeAddresses.length})
          </h4>
          {delegateeAddresses.length > 0 ? (
            <div className="space-y-2">
              {delegateeAddresses.map((address, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                >
                  <span className={`text-sm font-mono ${theme.text}`} style={fonts.body}>
                    {address}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
              <span className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                No delegatees added. You can add them later from the app management page.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button
          onClick={onSubmit}
          className="text-white px-8"
          style={{ backgroundColor: theme.brandOrange }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.brandOrange;
          }}
        >
          Register App On-Chain
        </Button>
      </div>
    </>
  );
}
