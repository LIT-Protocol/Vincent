import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VersionParametersForm from '@/components/consent/components/authForm/VersionParametersForm';

interface ParameterSettingsSectionProps {
  versionInfo: any;
  isLoading: boolean;
  existingParameters: any[];
  isSaving: boolean;
  isUpgrading: boolean;
  onParametersChange: (params: any[]) => void;
  onApprove: () => Promise<any>;
}

/**
 * Component to display and handle parameter settings
 */
export const ParameterSettingsSection: React.FC<ParameterSettingsSectionProps> = ({
  versionInfo,
  isLoading,
  existingParameters,
  isSaving,
  isUpgrading,
  onParametersChange,
  onApprove,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Parameter Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {versionInfo ? (
          <>
            <VersionParametersForm
              versionInfo={versionInfo}
              onChange={onParametersChange}
              existingParameters={existingParameters}
            />
          </>
        ) : (
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
            {isLoading
              ? 'Loading version information...'
              : 'No version information available for this application.'}
          </div>
        )}

        <div className="text-sm text-gray-500 mt-4">
          You can change your parameters anytime by revisiting this page.
        </div>

        <div className="mt-6 flex space-x-4">
          <Button
            onClick={onApprove}
            className="flex-1"
            disabled={isSaving || !versionInfo || isUpgrading}
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Updating...
              </>
            ) : (
              'Save Parameters'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
