import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';
import { Button } from '@/components/shared/ui/button';

interface BaseFormProps {
  title: string;
  description: string;
  children: ReactNode;
  onSubmit: () => void;
  submitText: string;
  isLoading: boolean;
  isValid: boolean;
  error?: string;
  success?: string;
}

export function BaseForm({
  title,
  description,
  children,
  onSubmit,
  submitText,
  isLoading,
  isValid,
  error,
  success,
}: BaseFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}

        <Button onClick={onSubmit} disabled={isLoading || !isValid} className="w-full">
          {isLoading ? 'Processing...' : submitText}
        </Button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <p className="text-green-800">{success}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
