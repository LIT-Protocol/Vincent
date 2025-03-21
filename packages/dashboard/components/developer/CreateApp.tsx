'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { VincentContracts } from '@/services';
import { Network } from '@/services';
import { ArrowLeft } from 'lucide-react';

// URL normalization helpers
const normalizeURL = (url: string): string => {
  if (!url) return url;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (url.startsWith('http://')) {
    url = 'https://' + url.slice(7);
  }
  return url;
};

const normalizeGitHubURL = (url: string): string => {
  if (!url) return url;
  url = url.trim();
  if (!url.includes('github.com') && url.includes('/')) {
    url = 'https://github.com/' + url;
  }
  if (!url.includes('github.com') && !url.includes('/')) {
    url = 'https://github.com/' + url;
  }
  return normalizeURL(url);
};

const formSchema = z.object({
  appName: z
    .string()
    .min(2, 'App name must be at least 2 characters')
    .max(50, 'App name cannot exceed 50 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),

  authorizedRedirectUris: z
    .string()
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .map((uri) => normalizeURL(uri.trim()))
        .filter(Boolean);
    }),

  logo: z.string().optional(),

  githubLink: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return normalizeGitHubURL(val);
    })
    .pipe(
      z
        .string()
        .url('Please enter a valid GitHub URL')
        .refine((url) => {
          try {
            const parsed = new URL(url);
            return parsed.hostname === 'github.com';
          } catch {
            return false;
          }
        }, 'Must be a GitHub URL (e.g., github.com/username/repo)')
        .optional()
    ),

  websiteUrl: z
    .string()
    .transform(normalizeURL)
    .pipe(
      z
        .string()
        .url('Please enter a valid website URL')
        .refine((url) => {
          try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:';
          } catch {
            return false;
          }
        }, 'Website URL must use HTTPS')
    )
    .optional()
    .transform((val) => val || undefined),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAppScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function CreateAppScreen({ onBack, onSuccess }: CreateAppScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const chainId = useChainId();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: '',
      description: '',
      authorizedRedirectUris: [],
    },
    mode: 'onBlur',
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = form.getValues();
    const validationResult = formSchema.safeParse(values);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      setError(`${firstError.path.join('.')}: ${firstError.message}`);
      return;
    }
    await onSubmit(validationResult.data);
  };

  async function onSubmit(values: FormValues) {
    console.log('Form submitted with values:', values);
    console.log('address', address);
    console.log('chainId', chainId);
    if (!address || !chainId) {
      console.log('Missing address or chainId:', { address, chainId });
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);

      const contracts = new VincentContracts('datil' as Network);
      const receipt = await contracts.registerApp(
        values.appName,
        values.description,
        values.authorizedRedirectUris,
        [address]
      );
      console.log('receipt', receipt);
      onSuccess?.();
      window.location.reload();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to create app');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <h1 className="text-3xl font-bold">Create New App</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Register New Vincent App</CardTitle>
          <CardDescription>
            Submit your application to the Vincent registry
            <div className="mt-2 text-sm">
              App Manager Address: <code>{address}</code>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My DCA App" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your application..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="authorizedRedirectUris"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Redirect URIs</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/callback, https://app.example.com/callback"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
