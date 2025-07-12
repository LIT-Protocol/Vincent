import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { TextField } from '../../form-fields';
import {
  addDelegatee,
  removeDelegatee,
  getAppByDelegatee,
} from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { SkeletonButton } from '@/components/layout/MutationButtonStates';

const AddDelegateeSchema = z.object({
  address: z.string().refine((val) => ethers.utils.isAddress(val), {
    message: 'Invalid Ethereum address',
  }),
});

type AddDelegateeFormData = z.infer<typeof AddDelegateeSchema>;

interface ManageDelegateesFormProps {
  appData: string[];
  refetchBlockchainData: () => void;
}

export function ManageDelegateesForm({
  appData,
  refetchBlockchainData,
}: ManageDelegateesFormProps) {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [removingDelegatee, setRemovingDelegatee] = useState<string | null>(null);

  const form = useForm<AddDelegateeFormData>({
    resolver: zodResolver(AddDelegateeSchema),
    defaultValues: {
      address: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const showError = (message: string) => {
    setError(message);
  };

  // Clear error messages after 3 seconds
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  const handleAddDelegatee = async (data: AddDelegateeFormData) => {
    if (!appId) return;

    // Check if delegatee is already in the current app's delegatee list
    if (appData.includes(data.address)) {
      showError(`Delegatee ${data.address} is already registered to app ${appId}`);
      return;
    }

    // Check if delegatee is already registered to another app
    try {
      const existingApp = await getAppByDelegatee({
        signer: readOnlySigner,
        args: { delegatee: data.address },
      });

      if (existingApp.id !== appId) {
        showError(`Delegatee ${data.address} is already registered to app ${existingApp.id}`);
        return;
      }
    } catch (error: any) {
      // If DelegateeNotRegistered, that's fine - continue
      if (!error?.message?.includes('DelegateeNotRegistered')) {
        showError(
          `Failed to check delegatee registration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return;
      }
    }

    // Now add the delegatee
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      await addDelegatee({
        signer: signer,
        args: {
          appId: appId,
          delegatee: data.address,
        },
      });

      refetchBlockchainData();
    } catch (error: any) {
      if (error?.message?.includes('user rejected')) {
        showError('Transaction rejected.');
      } else if (error?.message?.includes('DelegateeAlreadyRegistered')) {
        showError(`Delegatee ${data.address} is already registered to app ${appId}`);
      } else {
        showError(
          `Failed to add delegatee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  };

  const handleRemoveDelegatee = async (addressToRemove: string) => {
    if (!appId) return;

    setRemovingDelegatee(addressToRemove);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      await removeDelegatee({
        signer: signer,
        args: {
          appId: appId,
          delegatee: addressToRemove,
        },
      });

      refetchBlockchainData();
    } catch (error: any) {
      if (error?.message?.includes('user rejected')) {
        showError('Transaction rejected.');
      } else {
        showError(
          `Failed to remove delegatee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    } finally {
      setRemovingDelegatee(null);
    }
  };

  // Show error state
  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/appId/${appId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Manage Delegatees</h1>
          <p className="text-gray-600">Add or remove delegatees for your application</p>
        </div>
      </div>

      {/* Add Delegatee Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Delegatee</CardTitle>
          <CardDescription>Enter an Ethereum address to add as a delegatee</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleSubmit(handleAddDelegatee)}
              className="flex flex-col sm:flex-row gap-4 sm:items-end"
            >
              <div className="flex-1">
                <TextField
                  name="address"
                  register={register}
                  error={errors.address?.message}
                  label="Delegatee Address"
                  placeholder="0x..."
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <SkeletonButton />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Delegatee
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Delegatees List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Delegatees</CardTitle>
          <CardDescription>
            {appData.length === 0
              ? 'No delegatees configured yet.'
              : `${appData.length} delegatee${appData.length === 1 ? '' : 's'} configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appData.map((delegatee, index) => (
              <div
                key={delegatee}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm break-all">{delegatee}</div>
                  <div className="text-xs text-gray-500">Delegatee #{index + 1}</div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveDelegatee(delegatee)}
                  disabled={removingDelegatee === delegatee}
                  className="w-full sm:w-auto"
                >
                  {removingDelegatee === delegatee ? (
                    <SkeletonButton />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            ))}
            {appData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No delegatees configured yet.</p>
                <p className="text-sm mt-2">Add delegatee addresses above to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
