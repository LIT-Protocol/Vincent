import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { addDelegatee } from './addDelegatee';
import { getTestContext } from '../testContext';
import { getAppById } from '../VincentAppViewFacet/getAppById';

describe('addDelegatee', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should add a delegatee to an existing app', async () => {
    const { appId } = testContext.registerAppRes;
    const newDelegatee = privateKeyToAccount(generatePrivateKey());

    const res = await addDelegatee(
      {
        appId: appId,
        delegatee: newDelegatee.address,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the DelegateeAdded event
    const event = res.decodedLogs.find(
      (log) => log.eventName === 'DelegateeAdded',
    );
    expect(event).toBeDefined();
    expect(event?.args.appId).toEqual(appId);
    expect(event?.args.delegatee.toLowerCase()).toEqual(
      newDelegatee.address.toLowerCase(),
    );

    // Verify the delegatee was added to the app
    const app = await getAppById({ appId }, testContext.networkContext);
    console.log('app.delegatees:', app.delegatees);
    expect(app.delegatees).toContain(newDelegatee.address);
  });
});
