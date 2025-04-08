"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Copy, Check } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Wallet } from "ethers";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { AppView } from "@/services/types";
import { Input } from "@/components/ui/input";
import { useErrorPopup } from "@/providers/error-popup";
import { createDatilChainManager } from '@lit-protocol/vincent-contracts';
import { useWalletClient } from 'wagmi';

interface DelegateeManagerProps {
    onBack: () => void;
    dashboard: AppView;
}

const StatusMessage = ({ message, type = 'info' }: { message: string, type?: 'info' | 'warning' | 'success' | 'error' }) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {type === 'info' && <div className="spinner"></div>}
      <span>{message}</span>
    </div>
  );
};

export default function DelegateeManagerScreen({
    onBack,
    dashboard,
}: DelegateeManagerProps) {
    const [delegatees, setDelegatees] = useState<string[]>(
        dashboard.delegatees || []
    );
    const [showKeyDialog, setShowKeyDialog] = useState(false);
    const [newPrivateKey, setNewPrivateKey] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [copying, setCopying] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [manualAddress, setManualAddress] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
    
    const { showError } = useErrorPopup();
    const { data: walletClient } = useWalletClient();
    const chainManager = useMemo(() => {
        if (!walletClient) return null;
        
        return createDatilChainManager({
            account: walletClient,
            network: 'datil',
        });
    }, [walletClient]);
    
    const showStatus = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
        setStatusMessage(message);
        setStatusType(type);
    }, []);
    
    const clearStatus = useCallback(() => {
        setStatusMessage('');
    }, []);
    
    const showErrorWithStatus = useCallback((errorMessage: string, title?: string, details?: string) => {
        showError(errorMessage, title || 'Error', details);
        showStatus(errorMessage, 'error');
    }, [showError, showStatus]);
    
    useEffect(() => {
        setDelegatees(dashboard.delegatees || []);
    }, [dashboard.delegatees]);

    const handleGenerateDelegatee = () => {
        const wallet = Wallet.createRandom();
        setNewPrivateKey(wallet.privateKey);
        setNewAddress(wallet.address);
        setShowKeyDialog(true);
    };

    const handleCopyPrivateKey = async () => {
        try {
            await navigator.clipboard.writeText(newPrivateKey);
            setCopying(true);
            setTimeout(() => setCopying(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        }
    };

    async function handleConfirmSaved() {
        if (!chainManager) {
            showErrorWithStatus("Please connect your wallet first", "Wallet Not Connected");
            return;
        }
        
        try {
            setIsSaving(true);
            showStatus("Adding new delegatee...", "info");
            
            try {
                if (delegatees.includes(newAddress)) {
                    showErrorWithStatus("This address is already a delegatee for this app", "Duplicate Address");
                    setIsSaving(false);
                    return;
                }
                
                showStatus("Sending transaction...", "info");
                const result = await chainManager.vincentApi.appManagerDashboard.addDelegatee({
                    appId: BigInt(dashboard.appId),
                    delegatee: newAddress
                });
                
                showStatus("Waiting for confirmation...", "info");
                await result.receipt;
                console.log("Transaction confirmed");
                
                setDelegatees((prev) => [...prev, newAddress]);
                setShowKeyDialog(false);
                showStatus("Delegatee added successfully!", "success");
                
                setTimeout(() => {
                    clearStatus();
                    onBack();
                }, 2000);
            } catch (innerError: any) {
                console.error("Detailed error:", innerError);
                let errorMessage = "Failed to add delegatee. ";
                
                if (innerError.message) {
                    if (innerError.message.includes("CALL_EXCEPTION")) {
                        errorMessage += "Transaction was rejected by the contract. You might not have permission to add delegatees for this app.";
                    } else if (innerError.message.includes("user rejected")) {
                        errorMessage = "Transaction was rejected by the user.";
                    } else {
                        errorMessage += innerError.message.split('(')[0]; // Get first part of error
                    }
                }
                
                showErrorWithStatus(errorMessage, "Transaction Error");
            }
        } catch (error: any) {
            console.error("Error adding delegatee:", error);
            showErrorWithStatus(`Failed to add delegatee: ${error.message || "Unknown error"}`, "Error");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddDelegatee() {
        if (!manualAddress || !manualAddress.startsWith('0x') || manualAddress.length !== 42) {
            showErrorWithStatus("Please enter a valid Ethereum address", "Invalid Address");
            return;
        }

        if (!chainManager) {
            showErrorWithStatus("Please connect your wallet first", "Wallet Not Connected");
            return;
        }

        try {
            setIsAdding(true);
            showStatus("Adding delegatee...", "info");
            
            try {
                if (delegatees.includes(manualAddress)) {
                    showErrorWithStatus("This address is already a delegatee for this app", "Duplicate Address");
                    setIsAdding(false);
                    return;
                }
                
                console.log("Adding delegatee to app ID:", dashboard.appId);
                console.log("Delegatee address:", manualAddress);
                
                showStatus("Sending transaction...", "info");
                const result = await chainManager.vincentApi.appManagerDashboard.addDelegatee({
                    appId: BigInt(dashboard.appId),
                    delegatee: manualAddress
                });
                
                showStatus("Waiting for confirmation...", "info");
                await result.receipt;
                console.log("Transaction confirmed");
                
                setDelegatees((prev) => [...prev, manualAddress]);
                setShowAddDialog(false);
                setManualAddress("");
                showStatus("Delegatee added successfully!", "success");
                
                setTimeout(() => {
                    clearStatus();
                    onBack();
                }, 2000);
            } catch (innerError: any) {
                console.error("Detailed error:", innerError);
                let errorMessage = "Failed to add delegatee. ";
                
                if (innerError.message) {
                    if (innerError.message.includes("CALL_EXCEPTION")) {
                        errorMessage += "Transaction was rejected by the contract. You might not have permission to add delegatees for this app.";
                    } else if (innerError.message.includes("user rejected")) {
                        errorMessage = "Transaction was rejected by the user.";
                    } else {
                        errorMessage += innerError.message.split('(')[0]; // Get first part of error
                    }
                }
                
                showErrorWithStatus(errorMessage, "Transaction Error");
            }
        } catch (error: any) {
            console.error("Error adding delegatee:", error);
            showErrorWithStatus(`Failed to add delegatee: ${error.message || "Unknown error"}`, "Error");
        } finally {
            setIsAdding(false);
        }
    }

    async function handleRemoveDelegatee(delegateeAddress: string) {
        if (!confirm(`Are you sure you want to remove ${delegateeAddress} from delegatees?`)) {
            return;
        }
        
        if (!chainManager) {
            showErrorWithStatus("Please connect your wallet first", "Wallet Not Connected");
            return;
        }
        
        try {
            showStatus("Removing delegatee...", "info");
            
            const result = await chainManager.vincentApi.appManagerDashboard.removeDelegatee({
                appId: BigInt(dashboard.appId),
                delegatee: delegateeAddress
            });
            
            showStatus("Waiting for confirmation...", "info");
            await result.receipt;
            
            setDelegatees(current => current.filter(d => d !== delegateeAddress));
            showStatus("Delegatee removed successfully!", "success");
            
            setTimeout(() => clearStatus(), 2000);
        } catch (error: any) {
            console.error("Error removing delegatee:", error);
            showErrorWithStatus(`Failed to remove delegatee: ${error.message || "Unknown error"}`, "Error");
        }
    }

    return (
        <div className="space-y-8">
            {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="p-0 text-black"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold text-black">Manage Delegatees</h1>
                </div>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="default"
                        onClick={handleGenerateDelegatee}
                        className="text-black"
                    >
                        <Plus className="h-4 w-4 mr-2 font-bold text-black" />
                        Generate Delegatee
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => setShowAddDialog(true)}
                        className="text-black"
                    >
                        <Plus className="h-4 w-4 mr-2 font-bold text-black" />
                        Add Delegatee
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Delegatee Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {delegatees.map((address) => (
                            <div
                                key={address}
                                className="flex justify-between items-center p-4 border rounded-lg"
                            >
                                <div className="font-mono text-sm break-all">
                                    {address}
                                </div>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="text-black"
                                    onClick={() => handleRemoveDelegatee(address)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        {delegatees.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No delegatees found. Create one to get started.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Delegatee</DialogTitle>
                        <DialogDescription>
                            Enter the Ethereum address of the delegatee you want to add.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="delegateeAddress" className="text-sm font-medium">
                                Delegatee Address
                            </label>
                            <Input
                                id="delegateeAddress"
                                placeholder="0x..."
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddDialog(false);
                                    setManualAddress("");
                                }}
                                className="text-black"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAddDelegatee}
                                disabled={isAdding}
                                className="text-black"
                            >
                                {isAdding ? "Adding..." : "Add Delegatee"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Private Key</DialogTitle>
                        <DialogDescription>
                            WARNING: Save this private key securely. It will
                            never be shown again!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Eth Address:{" "}
                            <span className="font-mono">{newAddress}</span>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="font-mono text-sm break-all">
                                <div className="text-muted-foreground mb-1">
                                    Private Key:
                                </div>
                                {newPrivateKey}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                className="flex-1 text-black"
                                onClick={handleCopyPrivateKey}
                                disabled={copying}
                            >
                                {copying ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Private Key
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="border-t pt-4">
                            <Button
                                className="w-full text-black"
                                variant="default"
                                onClick={handleConfirmSaved}
                                disabled={isSaving}
                            >
                                {isSaving ? "Adding Delegatee..." : "I have saved the private key"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
