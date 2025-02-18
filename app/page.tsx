"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
// import {
//     DEFAULT_REGISTRY_CONFIG,
//     getPkpToolRegistryContract,
//     getRegisteredToolsAndDelegatees,
// } from "@lit-protocol/aw-contracts-sdk";
// import { useEffect } from "react";
// import { LitContracts } from "@lit-protocol/contracts-sdk";

export default function Home() {

    // const network = "datil-test";
    // function getPKPToolRegistryContract() {
    //     const contract = getPkpToolRegistryContract({
    //         rpcUrl: DEFAULT_REGISTRY_CONFIG[network].rpcUrl,
    //         contractAddress: DEFAULT_REGISTRY_CONFIG[network].contractAddress,
    //     });
    //     console.log("registry", contract);
    //     return contract;
    // }

    // async function getTokenIdByPkpEthAddress(pkpEthAddress: string) {
    //     const litContracts = new LitContracts({
    //         network,
    //         debug: false,
    //     });
    //     await litContracts.connect();
    //     const contract = litContracts.pubkeyRouterContract.read;
    //     const tokenId = await contract.ethAddressToPkpId(pkpEthAddress);
    //     console.log("tokenId", tokenId);
    //     return tokenId;
    // }

    // async function fetchDetails() {
    //     const tokenId = await getTokenIdByPkpEthAddress(
    //         "0x9bb681f026e31DB3693C05129a36E00da6418898"
    //     );

    //     const litContracts = new LitContracts({
    //         network,
    //         debug: false,
    //     });
    //     await litContracts.connect();
    //     const registryContract = getPKPToolRegistryContract();
    //     const details = await getRegisteredToolsAndDelegatees(
    //         registryContract,
    //         litContracts,
    //         tokenId.toString()
    //     );
    //     console.log("details", details);
    // }

    // useEffect(() => {
    //     fetchDetails();
    // }, []);

    return (
        <div className="space-y-8">
            <section className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Welcome to VINCENT</h1>
                <p className="text-lg text-muted-foreground">
                    Free the web!
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Register your app</CardTitle>
                        <CardDescription>Register and manage your Vincent apps</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/developer">
                            <Button className="w-full">
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Explore Vincent Apps</CardTitle>
                        <CardDescription>Browse all applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/explore">
                            <Button className="w-full">
                                View Apps <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Checkout Library</CardTitle>
                        <CardDescription>Manage your app permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/library">
                            <Button className="w-full">
                                Manage App <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
