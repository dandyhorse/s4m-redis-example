import { redis, RedisKeyPrefix } from '../config';

// Шпаргалка:
// export interface ZRangeOptions {
//     BY?: 'SCORE' | 'LEX';
//     REV?: boolean;
//     LIMIT?: {
//         offset: number;
//         count: number;
//     };
// }

const demoZSets = async () => {
  const membersWithScores = [];

  for (let id = 0; id < 10; id++) {
    membersWithScores.push({
      value: `${RedisKeyPrefix.USER}:${id}`,
      score: Math.floor(Math.random() * 101),
    });
  }

  const leaderboardKey = 'LEADERBOARD';

  await redis.zAdd(leaderboardKey, membersWithScores);

  // Здесь указываем диапазон элементов
  const top = await redis.zRangeWithScores(leaderboardKey, 0, -1); // Приходит ASC (!)
  console.log('Top: ', top, '\n');

  //   Здесь указываем интересующий нас диапазон очков
  const topByScore = await redis.zRangeByScoreWithScores(leaderboardKey, 0, 100);
  console.log('Top: ', topByScore, '\n');

  // Аналогично этим командам, можно брать без указания [command]WithScores - тогда получим чистый список строк,
  // а не объекты типа {value: 'value', score: 0}

  // Увеличение очков, возьмём лузера и поднимем в топ:
  await redis.zIncrBy(leaderboardKey, 1234, `${top[0].value}`); // Увеличение НА n , можем просто перезаписать ключ:
  const newTop = await redis.zRangeWithScores(leaderboardKey, 0, -1);
  console.log('New Top: ', newTop, '\n');

  await redis.flushAll();
};

demoZSets().catch(console.error);
