import { QueueOptions } from 'bullmq';
import dotenv from 'dotenv';
import { createClient, RedisClientType } from 'redis';

enum RedisKeyPrefix {
  USER = 'user',
}

dotenv.config();

const appHost = process.env.APP_HOST || '127.0.0.1';
const appPort = Number(process.env.APP_PORT) || 8090;
const appUser = process.env.APP_USER || 'user';
const appPassword = process.env.APP_PASSWORD || 'password';

const redisHost = process.env.REDIS_HOST || '0.0.0.0';
const redisPort = process.env.REDIS_PORT || '6379';
const redisDb = process.env.REDIS_DB || '0';
const redisUrl = `redis://${redisHost}:${redisPort}/${redisDb}`;
const redis: RedisClientType = createClient({ url: redisUrl });
const redisConfig: QueueOptions['connection'] = {
  host: redisHost,
  port: Number(redisPort),
};

const webdisBaseUrl = 'http://localhost:7379';

// Коннектим один раз,
// в общем-то, ГУД ПРАКТИС держать одно соединение,
// но есть опции контроллировать соединение мануальненько (если есть потребность)

redis.connect().catch(console.error);

export {
  appHost,
  appPassword,
  appPort,
  appUser,
  redis,
  redisConfig,
  webdisBaseUrl,
  RedisKeyPrefix,
};
