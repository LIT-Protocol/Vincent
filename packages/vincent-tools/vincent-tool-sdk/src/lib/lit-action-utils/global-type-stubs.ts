declare global {
    const LIT_NETWORK: string;

    const Lit: {
        Actions: {
            call: (args: {
                ipfsId: string;
                params: Record<string, unknown>;
            }) => Promise<void>;
        }
    }
}