import { redis } from '../config';

// Так же называют hll:

const demoHyperLogLog = async () => {
  const hllKey = 'demoHyperLogLog';

  await redis.pfAdd(hllKey, ['user:123', 'user:456', 'user:123']);
  await redis.pfAdd(hllKey, ['user:789', 'user:012']);

  const uniqueCount = await redis.pfCount(hllKey);
  console.log(`Estimated unique users: ${uniqueCount}`);
};

demoHyperLogLog().catch(console.error);
