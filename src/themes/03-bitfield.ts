// Здесь вот прям сложненькая пошла, но это недолго:

import { redis } from '../config';

const demoBitField = async () => {
  await redis.flushAll();

  const key = 'demoBitField';

  // Такое поведение характерно для языков и компиляторов:
  // SET i8 200 -> i8 max=127 -> запишем 127 (01111111)
  // SET u8 200 -> ok, запишет 200
  // но НЕ для BITFIELD в Redis, encoding при записи влияет только на ширину (кол-во бит), но НЕ на диапазон значений.
  // u - unsigned
  // i - signed

  // SET u8 = N в первых 8 битах
  await redis.bitField(key, [{ operation: 'SET', encoding: 'u8', offset: 0, value: 512 }]);
  const valU8 = await redis.bitField(key, [{ operation: 'GET', encoding: 'u16', offset: 16 }]);
  console.log('u8:', valU8[0]); // 200

  const memoryUsage = await redis.memoryUsage(key);
  console.log('Значение memoryUsage:', memoryUsage, '\n');

  // ПОВТОРИМ:
  // при записи encoding НЕ ограничивает диапазон, а влияет на ширину (читай, количствово бит)
  // при чтении encoding определяет интерпретацию

  // SET i8 = 120 в следующем байте (offset 8)
  await redis.bitField(key, [{ operation: 'SET', encoding: 'i8', offset: 8, value: 120 }]);
  const valI8 = await redis.bitField(key, [{ operation: 'GET', encoding: 'i8', offset: 8 }]);
  console.log('i8:', valI8[0]); // 120

  // INCRBY u8 = 100 с wrap-around на первых 8 битах
  await redis.bitField(key, [{ operation: 'INCRBY', encoding: 'u8', offset: 0, increment: 100 }]);
  const wrapU8 = await redis.bitField(key, [{ operation: 'GET', encoding: 'u8', offset: 0 }]);
  console.log('u8 wrap-around:', wrapU8[0]); // 200 + 100 = 300 → 44 (wrap-around modulo 256)

  // INCRBY i8 = 20 с wrap-around на втором байте
  await redis.bitField(key, [{ operation: 'INCRBY', encoding: 'i8', offset: 8, increment: 20 }]);
  const wrapI8 = await redis.bitField(key, [{ operation: 'GET', encoding: 'i8', offset: 8 }]);
  console.log('i8 wrap-around:', wrapI8[0]); // 120 + 20 = 140 → -116 (wrap-around signed)

  // И момент, что можно указать:
  // SimpleError: ERR Invalid bitfield type. Use something like i16 u8. Note that u64 is not supported but i64 is.
  await redis.flushAll();
};

demoBitField().catch(console.error);
