"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Wallet } from "ethers";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { VincentApp } from "@/services/types";
import { VincentContracts } from "@/services";

interface DelegateeManagerProps {
    onBack: () => void;
    dashboard: VincentApp;
}

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

    useEffect(() => {
        setDelegatees(dashboard.delegatees || []);
    }, [dashboard.delegatees]);

    const handleGenerateDelegatee = () => {
        const wallet = Wallet.createRandom();
        setNewPrivateKey(wallet.privateKey);
        setNewAddress(wallet.address);
        setShowKeyDialog(true);
    };

    async function handleConfirmSaved() {
        const contracts = new VincentContracts('datil');
        await contracts.registerNextAppVersion(
            dashboard.appId,
            dashboard.toolPolicies.map(tool => tool.toolIpfsCid),
            dashboard.toolPolicies.map(tool => tool.policyVarsSchema.map(schema => schema.defaultValue)),
            dashboard.toolPolicies.map(tool => tool.policyVarsSchema.map(schema => [schema.paramName]))
        );
        setDelegatees((prev) => [...prev, newAddress]);
        setShowKeyDialog(false);
        setNewPrivateKey("");
        setNewAddress("");
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Delegatees</h1>
                </div>
                <Button onClick={handleGenerateDelegatee}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Delegatee Address
                </Button>
            </div>

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
                                className="flex-1"
                                onClick={() => setCopying(true)}
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
                                className="w-full"
                                variant="default"
                                onClick={handleConfirmSaved}
                            >
                                I have saved the private key
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                {/* <Button variant="destructive" size="sm">
                                    Remove
                                </Button> */}
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
        </div>
    );
}
