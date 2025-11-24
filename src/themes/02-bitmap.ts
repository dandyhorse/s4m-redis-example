// Читай - массив булевых значений;
// Redis хранит битовые массивы  nfr как обычную строку (SDS);
// Строка автоматически расширяется до самого большого индекса, к которому обращаемся на запись.
// Хотя мы устанавливаем всего 1 бит, Redis не выделяет 1 байт, аллоцированная память состоит из:
// + структуры SDS
// + RedisObject-а
// + контейнера, выделяемого jemalloc (Джейсон Эванс malloc)
//
// Как итог: минимальный реальный размер = ~64 байта.

import { redis } from '../config';

const demoBitMap = async () => {
  await redis.flushAll();

  const key = 'demoBitMap';

  await redis.setBit(key, 0, 1);

  const memoryUsage = await redis.memoryUsage(key);
  console.log('Значение memoryUsage:', memoryUsage, 'Тип:', '\n');

  const valueFromRedis = await redis.getBit(key, 5713);

  // Если сделать GETBIT key N для бита, который ещё не был установлен, Redis вернёт 0.
  // Место в памяти не выделяется до того момента, пока ты не установишь бит.
  // То есть, «пропущенные» биты логически = 0, но память будет использоваться только для младшего заданного бита.

  console.log('Значение memoryUsage:', memoryUsage, 'Тип:', typeof memoryUsage);
  console.log('Значение:', valueFromRedis, 'Тип:', typeof valueFromRedis);

  // OPTIONAL:
  // console.log(Boolean(valueFromRedis));

  // По типам - NUMBER (!)
  if (valueFromRedis) {
    console.log(`Интерпретация ${true}`);
  } else {
    console.log(`Интерпретация ${false}`);
  }

  await redis.flushAll();
};

demoBitMap().catch(console.error);
