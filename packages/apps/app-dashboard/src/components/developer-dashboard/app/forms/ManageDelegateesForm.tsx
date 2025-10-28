import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ethers } from 'ethers';
import { Button } from '@/components/shared/ui/button';
import { Form } from '@/components/shared/ui/form';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { Plus, Trash2 } from 'lucide-react';
import { TextField } from '../../form-fields';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import { addPayee } from '@/utils/user-dashboard/addPayee';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

const AddDelegateeSchema = z.object({
  address: z.string().refine((val) => ethers.utils.isAddress(val), {
    message: 'Invalid Ethereum address',
  }),
});

type AddDelegateeFormData = z.infer<typeof AddDelegateeSchema>;

interface ManageDelegateesFormProps {
  existingDelegatees: string[];
  refetchBlockchainData: () => void;
}

export function ManageDelegateesForm({
  existingDelegatees,
  refetchBlockchainData,
}: ManageDelegateesFormProps) {
  const { appId } = useParams<{ appId: string }>();
  const { authInfo, sessionSigs } = useReadAuthInfo();
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
    if (existingDelegatees.includes(data.address)) {
      setError(`Delegatee ${data.address} is already registered to app ${appId}`);
      return;
    }

    // Now add the delegatee
    try {
      // First, add the specific delegatee address as a payee
      // if an error happens, at least it won't be written to chain
      await addPayee(data.address);

      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      await client.addDelegatee({
        appId: Number(appId),
        delegateeAddress: data.address,
      });

      refetchBlockchainData();
    } catch (error) {
      console.error('Failed to add delegatee:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setError('Transaction rejected.');
      } else if (message.includes('DelegateeAlreadyRegistered')) {
        setError(`Delegatee ${data.address} is already registered to app ${appId}`);
      } else {
        setError(`Failed to add delegatee: ${message}`);
      }
    }
  };

  const handleRemoveDelegatee = async (addressToRemove: string) => {
    if (!appId) return;

    setRemovingDelegatee(addressToRemove);

    try {
      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      await client.removeDelegatee({
        appId: Number(appId),
        delegateeAddress: addressToRemove,
      });

      refetchBlockchainData();
    } catch (error) {
      console.error('Failed to remove delegatee:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(`Failed to remove delegatee: ${message}`);
      }
    } finally {
      setRemovingDelegatee(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && <StatusMessage message={error} type="error" />}

      {/* Add Delegatee Section */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Add Delegatee
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Enter an Ethereum address to add as a delegatee
          </p>
        </div>
        <div className="p-6">
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto text-white"
                style={{ backgroundColor: theme.brandOrange }}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.currentTarget.style.backgroundColor = theme.brandOrange;
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2" style={fonts.heading}>
                    <div className="h-4 w-4 bg-white/50 rounded animate-pulse" />
                    <span>Adding...</span>
                  </div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Delegatee
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Current Delegatees Section */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Current Delegatees
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            {existingDelegatees.length === 0
              ? 'No delegatees configured yet.'
              : `${existingDelegatees.length} delegatee${existingDelegatees.length === 1 ? '' : 's'} configured`}
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {existingDelegatees.map((delegatee, index) => (
              <div
                key={delegatee}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 ${theme.itemBg} border ${theme.mainCardBorder} rounded-lg`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-mono text-sm break-all ${theme.text}`} style={fonts.body}>
                    {delegatee}
                  </div>
                  <div className={`text-xs ${theme.textMuted} mt-1`} style={fonts.body}>
                    Delegatee #{index + 1}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRemoveDelegatee(delegatee)}
                  disabled={removingDelegatee === delegatee}
                  className="w-full sm:w-auto text-white"
                  style={{ backgroundColor: 'rgb(220 38 38)' }}
                  onMouseEnter={(e) => {
                    if (removingDelegatee !== delegatee)
                      e.currentTarget.style.backgroundColor = 'rgb(185 28 28)';
                  }}
                  onMouseLeave={(e) => {
                    if (removingDelegatee !== delegatee)
                      e.currentTarget.style.backgroundColor = 'rgb(220 38 38)';
                  }}
                >
                  {removingDelegatee === delegatee ? (
                    <div className="flex items-center gap-2" style={fonts.heading}>
                      <div className="h-4 w-4 bg-white/30 rounded animate-pulse" />
                      <span>Removing...</span>
                    </div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            ))}
            {existingDelegatees.length === 0 && (
              <div className={`text-center py-8 ${theme.textMuted}`}>
                <p style={fonts.body}>No delegatees configured yet.</p>
                <p className={`text-sm mt-2`} style={fonts.body}>
                  Add delegatee addresses above to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
