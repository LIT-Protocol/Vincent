"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileCode, ArrowLeft } from "lucide-react";
import axios from "axios";

const IpfsDetails = () => {
    const [ipfsContent, setIpfsContent] = useState<string | null>(null);
    const params = useParams();
    const router = useRouter();
    const ipfsCid = params.cid;

    const fetchIpfsContent = useCallback(async () => {
        try {
            const response = await axios.get(`https://ipfs.io/ipfs/${ipfsCid}`);
            setIpfsContent(response.data);
        } catch (error) {
            console.error("Error fetching IPFS content:", error);
            setIpfsContent("Error loading IPFS content");
        }
    }, [ipfsCid]);

    useEffect(() => {
        fetchIpfsContent();
    }, [fetchIpfsContent]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="mr-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
                <h1 className="text-3xl font-bold">IPFS Content Details</h1>
            </div>

            <Alert className="mb-6">
                <FileCode className="h-4 w-4" />
                <AlertTitle>IPFS Content Identifier</AlertTitle>
                <AlertDescription className="font-mono break-all">
                    {ipfsCid}
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Source Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <pre className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-md font-mono text-sm whitespace-pre-wrap break-all">
                            {ipfsContent}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default IpfsDetails;
