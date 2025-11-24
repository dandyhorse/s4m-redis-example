// Здесь смотрим на простые хэши (хэшмапы, если угодно)
// Интересно, если порядок удаления/добавления безразличны,
// удобно, потому что просто (!)

import { redis, RedisKeyPrefix } from '../config';

const demoHashes = async () => {
  await redis.flushAll();

  const user = { id: 1, name: 'dandyhorse', age: 4, iq: 0.0214, dumbass: true };
  const userKey = `${RedisKeyPrefix.USER}:${user.id}`; // Закрепляем, использование префиксов!
  const promises = [];

  for (const key in user) {
    promises.push(redis.hSet(userKey, key, String(user[key])));
  }

  await Promise.all(promises);

  // Получение всех
  const userFromRedis = await redis.hGetAll(userKey);
  console.log('Значение:', userFromRedis, 'Тип:', typeof userFromRedis, '\n');

  const userName = await redis.hGet(userKey, 'name');
  const userAge = await redis.hGet(userKey, 'age');
  const userIq = await redis.hGet(userKey, 'iq');

  console.log('Значение:', userName, 'Тип:', typeof userFromRedis);
  console.log('Значение:', userAge, 'Тип:', typeof userFromRedis);
  console.log('Значение:', userIq, 'Тип:', typeof userFromRedis);

  const memoryUsage = await redis.memoryUsage(userKey);
  console.log('Значение memoryUsage:', memoryUsage, '\n');

  await redis.flushAll();
};

demoHashes().catch(console.error);
