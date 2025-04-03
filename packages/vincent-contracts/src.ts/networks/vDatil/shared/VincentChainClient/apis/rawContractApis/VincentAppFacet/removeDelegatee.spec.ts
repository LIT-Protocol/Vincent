import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { removeDelegatee } from './removeDelegatee';
import { addDelegatee } from './addDelegatee';
import { vincentNetworkContext } from '../../../NetworkContextManager';
import { getTestContext } from '../testContext';

describe('removeDelegatee', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;
  let delegateeToRemove: ReturnType<typeof privateKeyToAccount>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
    
    // Create a delegatee that we'll add and then remove
    delegateeToRemove = privateKeyToAccount(generatePrivateKey());
    
    // First add the delegatee
    await addDelegatee(
      {
        appId: testContext.registerAppRes.appId,
        delegatee: delegateeToRemove.address
      },
      vincentNetworkContext
    );
  });

  it('should remove a delegatee from an existing app', async () => {
    const { appId } = testContext.registerAppRes;

    const res = await removeDelegatee(
      {
        appId: appId,
        delegatee: delegateeToRemove.address
      },
      vincentNetworkContext
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();
    
    // Find the DelegateeRemoved event
    const event = res.decodedLogs.find((log) => log.eventName === 'DelegateeRemoved');
    expect(event).toBeDefined();
    expect(event?.args.appId).toEqual(appId);
    expect(event?.args.delegatee.toLowerCase()).toEqual(delegateeToRemove.address.toLowerCase());
  });
}); 