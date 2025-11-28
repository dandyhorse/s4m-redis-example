// Redis — однопоточный (single-threaded) сервер, где все операции выполняются в одном потоке без блокировок;
// Это обеспечивает атомарность: каждая команда (SET, INCR) выполняется целиком или никак.

// Здесь разбираем:
// - как сконфигурировать;
// - как использовать;
// - как и почему кастовать типы;
// - как и зачем делать префиксы для ключей;
// - некоторые особенности SDS

import { redis, RedisKeyPrefix } from '../config';

const demoStrings = async () => {
  await redis.flushAll();

  const key = 'key';
  const value = 'value';

  await redis.set(key, value);

  // Redis хранит строку (SDS — Simple Dynamic String);
  // SDS имеет служебную область: длина, вместимость, флаги;
  // Каждый ключ — это структура RedisObject, в которой лежат:
  // - тип данных;
  // - ссылка на SDS;
  // - Last Recently Used (LRU) /Time To Live (TTL) счётчики;
  // - флаги;
  // Redis использует системный менеджер памяти (JEmalloc похожий на malloc);
  // Он не выделяет каждый объект ровно по размеру;
  // jemalloc выделяет фиксированные «чанки» — например, 8, 16, 32 или 64 байта, etc;

  let valueFromRedis = await redis.get(key);
  console.log('Значение:', valueFromRedis, 'Тип:', typeof valueFromRedis, '\n');

  const newValue = 'new value';
  await redis.set(key, newValue);

  valueFromRedis = await redis.get(key);
  console.log('Значение:', valueFromRedis, 'Тип:', typeof valueFromRedis, '\n');

  const booleanValue = false;
  // await redis.set(key, String(booleanValue)); // Можно и так, однако в нашем случае лучше:
  await redis.set(key, Number(booleanValue));

  valueFromRedis = Number(await redis.get(key)); // Не забываем делать нужное нам преобразование
  console.log('Значение:', valueFromRedis, 'Тип:', typeof valueFromRedis, '\n');

  valueFromRedis = Boolean(valueFromRedis); // Совсем правильно !
  console.log('Значение:', valueFromRedis, 'Тип:', typeof valueFromRedis, '\n');

  valueFromRedis = await redis.get('Несуществующий ключ!'); // А что же произойдёт ?..
  console.log('Значение:', valueFromRedis, 'Тип:', typeof valueFromRedis, '\n');

  // JSON, имитируем прогрев гоев (зачеркнуто) кэша
  const user = { id: 1, name: 'dandyhorse', age: 4, iq: 3.14, dumbass: true };
  const userKey = `${RedisKeyPrefix.USER}:${user.id}`; // Использование префиксов

  await redis.set(userKey, JSON.stringify(user));

  const jsonStr = (await redis.get(userKey)) as string;
  const parsedUser = JSON.parse(jsonStr);

  console.log('JSON:', parsedUser);

  await redis.flushAll(); // Пример, как можно быстро очистимть вообще весь кэш
};

demoStrings().catch(console.error);
