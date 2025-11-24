import { redis, RedisKeyPrefix } from '../config';

// Здесь примеры: AUTH, FRAUD, ETC

const demoTTL = async () => {
  // TTL: SET с EXPIRE
  await redis.set('temp:key', 'value', { EX: 10 });
  const ttl = await redis.ttl('temp:key');

  console.log('TTL seconds:', ttl);

  // И не надо удалять :)
};

// Вот здесь остановимся чуть подробнее
// Использование SCAN для итеративного сканирования ключей вместо KEYS.

// Проблема с KEYS:
// KEYS простая команда, которая возвращает все ключи по паттерну за раз.
// Удобно до ~ тысяч ключей, но в продакшене с миллионами ключей блокирует сервер на время O(N), где N — общее число ключей.
// Редиска станится на некоторое время, что приводит к задержкам для всех его клиентов (малоприемлемо для чатов, API, etc).

const demoScan = async () => {
  const pattern = `${RedisKeyPrefix.USER}*`;
  let cursor = '0';

  do {
    const result = await redis.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = result.cursor;
    const keys = result.keys;

    // console.log('Batch keys:', keys);

    if (keys.length > 0) {
      const values = await redis.mGet(keys);

      const items = keys.map((key, i) => ({ key, value: values[i] }));
      console.log(items);
    }
  } while (cursor !== '0');
};

const demoMonitor = async () => {
  // INFO: общая статистика и состояние сервера
  const info = await redis.info();
  console.log('Redis INFO:', info);

  // MEMORY USAGE: сколько памяти занимает конкретный ключ
  const memoryUsage = await redis.memoryUsage('temp:key');
  console.log('Memory usage for temp:key:', memoryUsage);

  // CLIENT LIST: список подключений к серверу
  const clients = await redis.clientList();
  console.log('Connected clients:', clients.length);

  // MONITOR: поток всех команд (только для диагностики, не в продакшн)
  await redis.monitor((reply) => {
    console.log(reply);
  });
};

demoTTL().catch(console.error);
demoScan().catch(console.error);
