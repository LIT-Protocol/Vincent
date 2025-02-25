import { Agenda, Job } from 'agenda';

import { User } from '../models/user.model';
import { PurchasedCoin } from '../models/purchased-coin.model';
import { logger } from '../logger';
import { executeSwap } from '../services/execute-swap/execute-swap';

// Export a singleton agenda instance that will be configured by the server
export let agenda: Agenda | null = null;

// Function to create and configure a new agenda instance
export function createAgenda(dbUri: string, debug = false): Agenda {
  logger.setDebugMode(debug);
  agenda = new Agenda({
    db: {
      address: dbUri,
      collection: 'agendaJobs',
    },
    processEvery: '1 second', // Process as frequently as possible
  });

  // Define the job
  const JOB_NAME = 'check user purchases';

  agenda.define(JOB_NAME, async (job: Job) => {
    logger.debug('\n--- Starting purchase check job ---');
    const users = await User.find();
    logger.debug(`Found ${users.length} users to check`);

    for (const user of users) {
      logger.debug(`\nProcessing user: ${user.walletAddress}`);
      logger.debug(`Purchase interval: ${user.purchaseIntervalSeconds}s`);

      const lastPurchase = await PurchasedCoin.findOne({
        user: user._id,
      }).sort({ purchasedAt: -1 });

      const now = new Date();
      let timeSinceLastPurchase: number;
      const secondsSinceRegistration =
        (now.getTime() - user.registeredAt.getTime()) / 1000;

      if (lastPurchase) {
        timeSinceLastPurchase =
          (now.getTime() - lastPurchase.purchasedAt.getTime()) / 1000;
        logger.debug(
          `Last purchase was ${timeSinceLastPurchase.toFixed(3)}s ago`
        );
      } else {
        timeSinceLastPurchase = secondsSinceRegistration;
        logger.debug('No previous purchases found');
      }

      // Calculate how many intervals have passed since registration
      const intervalsPassed = Math.floor(
        secondsSinceRegistration / user.purchaseIntervalSeconds
      );

      logger.debug(
        `Time since registration: ${secondsSinceRegistration.toFixed(3)}s`
      );
      logger.debug(`Intervals passed: ${intervalsPassed}`);

      // We should purchase when:
      // For first purchase: At least one interval has passed since registration
      // For subsequent purchases: Enough time has passed since last purchase
      const shouldPurchase = !lastPurchase
        ? secondsSinceRegistration >= user.purchaseIntervalSeconds
        : timeSinceLastPurchase >= user.purchaseIntervalSeconds;

      logger.debug(
        `Comparison: ${
          !lastPurchase ? 'First purchase' : 'Subsequent purchase'
        } - ${
          !lastPurchase
            ? secondsSinceRegistration.toFixed(3)
            : timeSinceLastPurchase.toFixed(3)
        }s elapsed >= ${user.purchaseIntervalSeconds}s interval`
      );
      logger.debug(`Should purchase? ${shouldPurchase}`);

      if (shouldPurchase) {
        try {
          const purchase = await executeSwap({
            user: user._id,
            purchasedAt: now,
          });

          if (!purchase) {
            logger.error(
              'Failed to execute swap for user:',
              user.walletAddress
            );
          }
        } catch (error) {
          logger.error('Purchase failed:', error);
        }
      } else {
        logger.debug('Skipping purchase - not time yet');
      }
    }
    logger.debug('\n--- Finished purchase check job ---\n');
  });

  return agenda;
}

// Start function
export async function startScheduler() {
  if (!agenda) {
    throw new Error('Agenda not initialized. Call createAgenda first.');
  }

  logger.debug('Starting scheduler...');
  await agenda.start();

  // Schedule the job to run every second
  logger.debug('Scheduling job to run every second...');
  await agenda.every('1 second', 'check user purchases');

  // List all jobs
  const jobs = await agenda.jobs({});
  logger.debug(`Scheduled jobs: ${jobs.length}`);

  logger.debug('Scheduler started');
}

// Stop function to gracefully shutdown the scheduler
export async function stopScheduler() {
  if (!agenda) {
    return;
  }

  try {
    // Store agenda reference since we'll null it later
    const agendaInstance = agenda;

    // Cancel all scheduled jobs
    try {
      await agendaInstance.cancel({});
    } catch (error) {
      logger.error('Error canceling jobs:', error);
    }

    // Stop processing new jobs
    try {
      await agendaInstance.stop();
    } catch (error) {
      logger.error('Error stopping agenda:', error);
    }

    // Get all jobs to ensure none are running
    let jobs: any[] = [];
    try {
      jobs = await agendaInstance.jobs({});
    } catch (error) {
      logger.error('Error fetching jobs:', error);
    }

    // If there are running jobs, wait for them with a timeout
    if (jobs.length > 0) {
      const timeoutPromise = new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 3000);
        timer.unref();
      });

      await Promise.race([
        Promise.allSettled(
          jobs.map(
            (job) =>
              new Promise<void>((resolve) => {
                if (job.attrs.lockedAt) {
                  const onComplete = () => {
                    agendaInstance.off(
                      'complete:' + job.attrs.name,
                      onComplete
                    );
                    agendaInstance.off('fail:' + job.attrs.name, onComplete);
                    resolve();
                  };

                  agendaInstance.once('complete:' + job.attrs.name, onComplete);
                  agendaInstance.once('fail:' + job.attrs.name, onComplete);
                } else {
                  resolve();
                }
              })
          )
        ),
        timeoutPromise,
      ]);
    }

    // Close MongoDB connection separately to ensure proper cleanup
    try {
      const mongoClient = (agendaInstance as any)._mdb?.client;
      if (mongoClient) {
        await mongoClient.close();
      }
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  } catch (error) {
    logger.error('Unexpected error stopping scheduler:', error);
  } finally {
    // Ensure agenda is cleared even if an error occurs
    agenda = null;
  }
}
