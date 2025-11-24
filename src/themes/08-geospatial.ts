import { redis } from '../config';

enum GeoUnits {
  M = 'm',
  KM = 'km',
  // Вы че, в Америке живёте чтоле? Не выскрывайте тему, вы молодые, шутливые
  //   MI = 'mi',
  //   FT = 'ft',
}

const demoGeospatial = async () => {
  await redis.flushAll();

  const key = 'Samara';
  const members = [
    { member: 'center', latitude: 53.3214, longitude: 50.0611 },
    { member: 'square', latitude: 53.1955, longitude: 50.1018 },
    { member: 'struk', latitude: 53.2001, longitude: 50.15 },
    { member: 'rocket', latitude: 53.2239, longitude: 50.2241 },
  ];

  const memberKeys = members.map((m) => m.member);

  await redis.geoAdd(key, members);

  const positions = await redis.geoPos('Samara', [memberKeys[0]]); // возвращает массив даже если members[0] в качестве единственного аргумента
  console.log(positions[0]);

  // небольшие изменения из-за:
  // - квантования
  // - округления при преобразовании туда-обратно
  // - ограниченной точности 52-битной сетки
  // вставлено: 53.3214
  // прочитано: 53.3213993247938447
  // разница: 0.0000006752 ~ 7.5 см (хороший результат, кмк)

  const distanceFromCenterToSquare = await redis.geoDist(
    key,
    memberKeys[0],
    memberKeys[1],
    GeoUnits.KM,
  );

  const distanceFromCenterToRocket = await redis.geoDist(
    key,
    memberKeys[0],
    memberKeys[3],
    GeoUnits.KM,
  );

  console.log(distanceFromCenterToSquare - distanceFromCenterToRocket);

  // key здесь нужен для того, чтобы понять в каком наборе искать
  // position - может быть задан извне
  const nearest = await redis.geoSearch(key, positions[0], { radius: 1, unit: GeoUnits.KM });

  // похожая ситуация, но position - это member нашего zset (geospatial)
  // const nearest = await redis.geoRadiusByMember(key, memberKeys[0], 10, GeoUnits.KM);
  console.log(nearest);

  const geoHashes = await redis.geoHash(key, memberKeys);
  console.log(geoHashes);

  //   Geo Set хранится как ZSET, поэтому удаляется так:
  //   await redis.zRem(key, memberKeys[2]);

  await redis.flushAll();
};

// Из доки про GEOHASH:
// Команда возвращает строки геохеша длиной 11 символов, поэтому точность не теряется по сравнению с внутренним 52-битным представлением Redis.
// Возвращаемые геохеши обладают следующими свойствами:
// - Их можно сокращать, убирая символы справа. Это уменьшит точность, но всё ещё будет указывать на тот же самый район.
// - Их можно использовать в URL геохеша, например: http://geohash.org/<geohash-string> Это пример такого URL.
// - Строки с похожим префиксом находятся рядом, но обратное не всегда верно: строки с разными префиксами тоже могут быть рядом.

demoGeospatial().catch(console.error);
