import { redis } from '../config';

const demoStreams = async () => {
  const key = 'demoStreams';

  // добавляем одно сообщение
  const id1 = await redis.xAdd(key, '*', { field1: 'value1', field2: 'value2' });
  console.log('Added ID:', id1);

  // добавляем несколько сообщений
  const ids = [
    await redis.xAdd(key, '*', { user: 'Alice', msg: 'Hello' }),
    await redis.xAdd(key, '*', { user: 'Bob', msg: 'Hi' }),
  ];

  const allMessages = await redis.xRange(key, '+', '-');
  console.log(allMessages[0]);

  // последние 2 сообщения
  const lastTwo = await redis.xRevRange(key, '+', '-', { COUNT: 2 });
  console.log(lastTwo);

  console.log(ids);
};

demoStreams().catch(console.error);
