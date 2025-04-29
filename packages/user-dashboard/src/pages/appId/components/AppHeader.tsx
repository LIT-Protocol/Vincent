import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  onBack: () => void;
}

/**
 * Component for app header with back button
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ onBack }) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
    </div>
  );
};
