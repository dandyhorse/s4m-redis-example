// LIST — это по сути двухсвязный список:
// HEAD -> a -> b -> c -> d -> TAIL
// - существует порядок,
// - элементы идут строго друг за другом,
// - есть начало и конец,
// - команды типа LPUSH/RPUSH указывают место вставки.
// LIST -> имеет порядок (!)
//
// Очередь (FIFO): LPUSH + RPOP
// Стек (LIFO): LPUSH + LPOP

import { redis } from '../config';

const demoLists = async () => {
  await redis.flushAll();

  // QUEUE
  const fifoKey = 'TASKS';
  const tasks = ['task1', 'task2', 'task3'];

  await redis.lPush(fifoKey, tasks);
  const task = await redis.rPop(fifoKey);
  console.log('Значение:', task, 'Тип:', typeof task, '\n');

  const remainingFifo = await redis.lRange(fifoKey, 0, -1);
  console.log('Значение:', remainingFifo, '\n');

  // STACK
  const lifoKey = 'STACK';
  const items = ['itemA', 'itemB'];
  await redis.lPush(lifoKey, items);

  const item = await redis.lPop(lifoKey);
  console.log('Значение:', item, 'Тип:', typeof item, '\n');

  const remainingLifo = await redis.lRange(lifoKey, 0, -1);
  console.log('Значение:', remainingLifo, '\n');

  // Существует так же RPUSH, RPOP (ну если очень надо ...)
  const rPushKey = 'RPUSHME';
  // await redis.rPop(rPushKey);

  await redis.rPush(rPushKey, items);

  const rPushArr = await redis.lRange(rPushKey, 0, -1);
  console.log('Значение:', rPushArr, '\n');

  await redis.flushAll();
};

demoLists().catch(console.error);
