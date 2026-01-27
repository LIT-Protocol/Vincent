/**
 * Wraps a kernel account to intercept UserOp preparation and provide it to the signer.
 *
 * This allows the signer to receive both the UserOp hash AND the full UserOp structure,
 * which is needed for passing to Lit Actions for policy validation.
 */
export function wrapKernelAccountWithUserOpCapture(
  kernelAccount: any,
  customSigner: any & { setCurrentUserOp: (userOp: any) => void },
) {
  return new Proxy(kernelAccount, {
    get(target, prop) {
      const original = target[prop];

      // Intercept signUserOperation - this is where the UserOp is passed!
      if (prop === 'signUserOperation') {
        return async function (userOp: any) {
          console.log('[wrapKernelAccount] Intercepted signUserOperation');
          console.log('[wrapKernelAccount] UserOp keys:', Object.keys(userOp || {}));

          // Provide the UserOp to the signer BEFORE signing
          customSigner.setCurrentUserOp(userOp);

          // Call the original signUserOperation method
          const result = await original.call(target, userOp);
          return result;
        };
      }

      // Return original property/method
      if (typeof original === 'function') {
        return original.bind(target);
      }
      return original;
    },
  });
}
