import { type FastifyInstance } from 'fastify';
import { User } from '../models/user.model';

export async function userRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get('/users', async () => {
    return User.find().lean();
  });

  // Get user by wallet address
  fastify.get('/users/:walletAddress', async (request, reply) => {
    const { walletAddress } = request.params as { walletAddress: string };
    const user = await User.findOne({ walletAddress }).lean();

    if (!user) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }

    return user;
  });

  // Create new user
  fastify.post('/users', async (request, reply) => {
    const userData = request.body as {
      walletAddress: string;
      purchaseIntervalMinutes: number;
    };

    try {
      const user = new User(userData);
      await user.save();
      reply.code(201).send(user.toObject());
    } catch (error) {
      reply.code(400).send({ error: 'Invalid user data' });
    }
  });
}
