import { useState } from 'react';
import { BaseForm, TextField, useAsyncForm, validateEntityId } from '../generic';

interface DeleteResponse {
  success: boolean;
  message: string;
  deletedAppId: number;
}

const mockDeleteApp = async (appId: string): Promise<DeleteResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    message: `App ${appId} has been successfully deleted`,
    deletedAppId: parseInt(appId),
  };
};

export function DeleteAppForm() {
  const [appId, setAppId] = useState('');
  const asyncForm = useAsyncForm((id: string) => mockDeleteApp(id));

  const handleSubmit = async () => {
    if (appId.trim()) {
      await asyncForm.submit(appId);
    }
  };

  // Use Zod validation instead of regex
  const validationError = appId ? validateEntityId('app', appId) : undefined;
  const isValidAppId = appId.trim() && !validationError;

  // Extract error and success messages from result
  const error = asyncForm.error || undefined;
  const success =
    asyncForm.result && !asyncForm.error && 'message' in asyncForm.result
      ? asyncForm.result.message
      : undefined;

  return (
    <BaseForm
      title="Delete App"
      description="Permanently delete an application (use with caution)"
      onSubmit={handleSubmit}
      submitText="Delete App"
      isLoading={asyncForm.isLoading}
      isValid={!!isValidAppId}
      error={error}
      success={success}
    >
      <TextField
        label="App ID"
        id="app-id"
        type="number"
        value={appId}
        onChange={setAppId}
        placeholder="Enter app ID to delete"
        required
        error={validationError}
      />

      {/* Display returned data when available */}
      {asyncForm.result && !asyncForm.error && (
        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Response Data:</h4>
          <pre className="text-sm text-blue-800 whitespace-pre-wrap overflow-auto max-h-64">
            {JSON.stringify(asyncForm.result, null, 2)}
          </pre>
        </div>
      )}
    </BaseForm>
  );
}
