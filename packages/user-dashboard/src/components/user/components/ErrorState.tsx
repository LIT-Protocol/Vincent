import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  onBack: () => void;
  message?: string;
  title?: string;
}

/**
 * Component to display authentication errors
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  onBack,
  message = 'Your session has expired or you need to sign in again.',
  title = 'Authentication Required',
}) => (
  <div className="p-6">
    <Button onClick={onBack} variant="outline" className="mb-4">
      <ArrowLeft className="mr-2 h-4 w-4" /> Back
    </Button>
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-red-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4">{message}</p>
        <Button onClick={onBack} variant="default" className="mx-auto">
          Go to Login Page
        </Button>
      </CardContent>
    </Card>
  </div>
);

/**
 * Component to display app not found error
 */
export const AppNotFound: React.FC<{ appId?: string; onBack: () => void }> = ({
  appId,
  onBack,
}) => (
  <div className="p-6">
    <Button onClick={onBack} variant="outline" className="mb-4">
      <ArrowLeft className="mr-2 h-4 w-4" /> My Applications
    </Button>
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-red-500">App Not Found</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center">
          The application with ID {appId} could not be found or you do not have permission to view
          it.
        </p>
      </CardContent>
    </Card>
  </div>
);

/**
 * Component to display loading state
 */
export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-[50vh]">
    <div className="space-y-4 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      <p className="text-sm text-gray-600">Loading application details...</p>
    </div>
  </div>
);
