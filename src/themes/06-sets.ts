// SET — НЕупорядоченная структура (множество)
// - нет индексов
// - нет позиций
// - нет начала/конца
// - нет порядка вставки
//

import { redis } from '../config';

const demoSets = async () => {
  // Добавление уникальных элементов
  const firstSetKey = 'SET_1';
  const firstSetItems = ['javascript', 'redis', 'nodejs', 'redis', 'js', 'javascript'];
  await redis.sAdd(firstSetKey, firstSetItems);

  let members = await redis.sMembers(firstSetKey);
  console.log('FIRST Set members:', members); // Здесь всё работает согласно ожиданиям

  const secondSetKey = 'SET_2';
  const secondSetItems = ['js', 'javascript', 'typescript'];
  await redis.sAdd(secondSetKey, secondSetItems);

  members = await redis.sMembers(secondSetKey);
  console.log('SECOND Set members:', members);

  const thirdSetKey = 'SET_3';
  const thirdSetItems = ['js'];
  await redis.sAdd(thirdSetKey, thirdSetItems);

  members = await redis.sMembers(thirdSetKey);
  console.log('THIRD Set members:', members, '\n');

  // Пересечение множеств:
  // По крайней мере с точки зрения JS сделать функцию вычисляющую пересечения двух списков - это придумать велосипед,
  // поэтому для Жабускриптизёров это однозначный плюс!
  // Тут ожидается, что вы меня закидаете помидорами или каким-нибудь Питоном:
  // # Два списка
  // list1 = [1, 2, 3, 4, 5]
  // list2 = [3, 4, 6, 7]
  //
  // # Пересечение через & (или .intersection())
  // intersection = list(set(list1) & set(list2))
  //
  // print(intersection)  # Вывод: [3, 4]

  let intersection = await redis.sInter([firstSetKey, secondSetKey]);
  console.log('Пересечение первых двух:', intersection);

  intersection = await redis.sInter([firstSetKey, secondSetKey, thirdSetKey]);
  console.log('Пересечение всех трёх:', intersection);

  const hasValue = await redis.sIsMember(firstSetKey, 'redis');
  console.log('Has "redis":', hasValue);

  await redis.flushAll();
};

demoSets().catch(console.error);
