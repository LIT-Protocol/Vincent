import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ethers } from 'ethers';
import { Button } from '@/components/shared/ui/button';
import { Form } from '@/components/shared/ui/form';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Plus, Trash2, Dices, Check } from 'lucide-react';
import { TextField } from '../../form-fields';
import { CopyButton } from '@/components/shared/ui/CopyButton';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { theme, fonts } from '@/lib/themeClasses';

const AddDelegateeSchema = z.object({
  address: z.string().refine((val) => ethers.utils.isAddress(val), {
    message: 'Invalid Ethereum address',
  }),
});

type AddDelegateeFormData = z.infer<typeof AddDelegateeSchema>;

interface ManageDelegateesFormProps {
  existingDelegatees: string[];
  onDelegateeAdded?: (address: string) => void;
  onDelegateeRemoved?: (address: string) => void;
}

export function ManageDelegateesForm({
  existingDelegatees,
  onDelegateeAdded,
  onDelegateeRemoved,
}: ManageDelegateesFormProps) {
  const { appId } = useParams<{ appId: string }>();
  const { getSigner } = useWagmiSigner();
  const { ensureChain, infoMessage } = useEnsureChain();
  const [error, setError] = useState<string>('');
  const [removingDelegatee, setRemovingDelegatee] = useState<string | null>(null);
  const [generatedWallet, setGeneratedWallet] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [addingGeneratedWallet, setAddingGeneratedWallet] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Local state for optimistic updates (RPC caching can cause stale data)
  const [localDelegatees, setLocalDelegatees] = useState<string[]>(existingDelegatees);

  // Sync local state when prop changes (e.g., after page refresh)
  useEffect(() => {
    setLocalDelegatees(existingDelegatees);
  }, [existingDelegatees]);

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
    const success = await addDelegateeAddress(data.address);
    if (success) {
      form.reset(); // Clear the form on success
    }
  };

  const handleRemoveDelegatee = async (addressToRemove: string) => {
    if (!appId) return;

    // Ensure user is on Base Sepolia
    try {
      const canProceed = await ensureChain('Remove Delegatee');
      if (!canProceed) return; // Chain was switched, user needs to click again
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to switch network');
      return;
    }

    setRemovingDelegatee(addressToRemove);

    try {
      const signer = await getSigner();
      const client = getClient({ signer });

      const result = await client.removeDelegatee({
        appId: Number(appId),
        delegateeAddress: addressToRemove,
      });

      // Wait for transaction to be confirmed on-chain
      if (result.txHash && signer.provider) {
        await signer.provider.waitForTransaction(result.txHash);
      }

      // Update local state immediately (RPC caching makes refetch unreliable)
      setLocalDelegatees((prev) => prev.filter((addr) => addr !== addressToRemove));
      onDelegateeRemoved?.(addressToRemove);
    } catch (error) {
      console.error('Failed to remove delegatee:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(`Failed to remove delegatee: ${message}`);
      }
    }

    setRemovingDelegatee(null);
  };

  const handleOpenGenerateDialog = () => {
    const randomWallet = ethers.Wallet.createRandom();
    setGeneratedWallet({
      address: randomWallet.address,
      privateKey: randomWallet.privateKey,
    });
    setIsGenerateDialogOpen(true);
  };

  const addDelegateeAddress = async (address: string): Promise<boolean> => {
    if (!appId) return false;

    // Check if delegatee is already in the current app's delegatee list
    if (localDelegatees.includes(address)) {
      setError(`Delegatee ${address} is already registered to app ${appId}`);
      return false;
    }

    // Ensure user is on Base Sepolia
    try {
      const canProceed = await ensureChain('Add Delegatee');
      if (!canProceed) return false; // Chain was switched, user needs to click again
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to switch network');
      return false;
    }

    // TODO: Add delegatees batch endpoint in the contracts, make sure to addPayees as well

    try {
      const signer = await getSigner();
      const client = getClient({ signer });

      const result = await client.addDelegatee({
        appId: Number(appId),
        delegateeAddress: address,
      });

      // Wait for transaction to be confirmed on-chain
      if (result.txHash && signer.provider) {
        await signer.provider.waitForTransaction(result.txHash);
      }

      // Update local state immediately (RPC caching makes refetch unreliable)
      setLocalDelegatees((prev) => [...prev, address]);
      onDelegateeAdded?.(address);
      return true;
    } catch (error) {
      console.error('Failed to add delegatee:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(`Failed to add delegatee: ${message}`);
      }
      return false;
    }
  };

  const handleConfirmAndAddWallet = async () => {
    if (!generatedWallet) return;

    setAddingGeneratedWallet(true);

    const success = await addDelegateeAddress(generatedWallet.address);

    setAddingGeneratedWallet(false);

    if (success) {
      // Success - close dialog and clear wallet
      setGeneratedWallet(null);
      setIsGenerateDialogOpen(false);
    }
    // If !success, error is already set by addDelegateeAddress, dialog stays open
  };

  const handleCancelGeneration = () => {
    setGeneratedWallet(null);
    setIsGenerateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Info Message */}
      {infoMessage && <StatusMessage message={infoMessage} type="info" />}

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

          {/* Generate Random Wallet Button */}
          <div className={`pt-4 border-t ${theme.cardBorder} mt-6`}>
            <Button
              onClick={handleOpenGenerateDialog}
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
            >
              <Dices className="h-4 w-4 mr-2" />
              Generate Random Wallet
            </Button>
          </div>
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
            {localDelegatees.length === 0
              ? 'No delegatees configured yet.'
              : `${localDelegatees.length} delegatee${localDelegatees.length === 1 ? '' : 's'} configured`}
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {localDelegatees.map((delegatee, index) => (
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
            {localDelegatees.length === 0 && (
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

      {/* Generate Random Wallet Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent
          className={`sm:max-w-[550px] ${theme.mainCard} border ${theme.mainCardBorder}`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className={theme.text} style={fonts.heading}>
              Generate Random Wallet
            </DialogTitle>
            <DialogDescription className={theme.textMuted} style={fonts.body}>
              Create a new random wallet to use as a delegatee
            </DialogDescription>
          </DialogHeader>

          {generatedWallet && (
            <div className="space-y-4">
              {/* Generated Address */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                    Generated Address
                  </label>
                  <CopyButton textToCopy={generatedWallet.address} iconSize="w-3 h-3" />
                </div>
                <div className={`p-3 ${theme.itemBg} border ${theme.mainCardBorder} rounded-lg`}>
                  <code className={`text-xs ${theme.text} break-all`} style={fonts.body}>
                    {generatedWallet.address}
                  </code>
                </div>
              </div>

              {/* Private Key */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                    Private Key
                  </label>
                  <CopyButton textToCopy={generatedWallet.privateKey} iconSize="w-3 h-3" />
                </div>
                <div className={`p-3 ${theme.itemBg} border ${theme.mainCardBorder} rounded-lg`}>
                  <code className={`text-xs ${theme.text} break-all`} style={fonts.body}>
                    {generatedWallet.privateKey}
                  </code>
                </div>
              </div>

              {/* Warning */}
              <div className={`p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg`}>
                <p className={`text-sm ${theme.text} font-medium mb-1`} style={fonts.heading}>
                  Important: Save Your Private Key
                </p>
                <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                  Make sure you have saved the private key securely before proceeding. You will not
                  be able to see it again after adding the delegatee.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConfirmAndAddWallet}
                  disabled={addingGeneratedWallet}
                  className="flex-1 text-white"
                  style={{ backgroundColor: theme.brandOrange }}
                  onMouseEnter={(e) => {
                    if (!addingGeneratedWallet)
                      e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                  }}
                  onMouseLeave={(e) => {
                    if (!addingGeneratedWallet)
                      e.currentTarget.style.backgroundColor = theme.brandOrange;
                  }}
                >
                  {addingGeneratedWallet ? (
                    <div className="flex items-center gap-2" style={fonts.heading}>
                      <div className="h-4 w-4 bg-white/50 rounded animate-pulse" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      I've Saved the Private Key, Add Delegatee
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelGeneration}
                  disabled={addingGeneratedWallet}
                  variant="outline"
                  className="sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
