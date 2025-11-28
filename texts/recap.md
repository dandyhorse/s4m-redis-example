# Redis — Recap первых 8 тем

## 1. Strings (SDS)

Redis хранит строки в формате **SDS** (Simple Dynamic String) — структура с метаданными (длина, вместимость, флаги). Каждый ключ — это `RedisObject`, содержащий тип данных, ссылку на SDS, LRU/TTL счётчики и флаги.

Память выделяется через **jemalloc** фиксированными чанками (8, 16, 32, 64 байт и т.д.), поэтому реальный расход памяти всегда больше, чем длина самой строки.

**Ключевые моменты:**
- `GET` всегда возвращает `string | null` — нужно кастовать к нужному типу (`Number()`, `Boolean()`)
- Для несуществующего ключа `GET` вернёт `null`
- JSON хранится через `JSON.stringify()` / `JSON.parse()`
- Хорошая практика — использовать **префиксы** для ключей: `user:1`, `session:abc`

```ts
await redis.set(`user:${id}`, JSON.stringify(user));
const parsed = JSON.parse((await redis.get(`user:${id}`)) as string);
```

---

## 2. Bitmap

Bitmap — по сути **массив булевых значений**, хранимый как обычная SDS-строка. Каждый бит — это 0 или 1.

**Ключевые моменты:**
- `SETBIT key offset 1` — установить бит по индексу
- `GETBIT key offset` — получить бит (вернёт `number`: 0 или 1)
- Неустановленные биты логически равны 0, память под них **не выделяется** до записи
- Минимальный реальный размер ключа ~64 байта (SDS + RedisObject + jemalloc-чанк)

```ts
await redis.setBit('online', 0, 1);
const bit = await redis.getBit('online', 5713); // 0 — бит не был установлен
```

---

## 3. Bitfield

Позволяет работать с **произвольными целочисленными полями** внутри одной строки, задавая ширину и смещение в битах.

**Ключевые моменты:**
- Encoding (`u8`, `i8`, `u16` и т.д.) при **записи** определяет только ширину (количество бит), но **не ограничивает диапазон**
- При **чтении** encoding определяет интерпретацию (signed/unsigned)
- `INCRBY` поддерживает **wrap-around**: `u8` 200 + 100 = 44 (mod 256), `i8` 120 + 20 = -116
- `u64` не поддерживается, но `i64` — да

```ts
await redis.bitField(key, [{ operation: 'SET', encoding: 'u8', offset: 0, value: 200 }]);
await redis.bitField(key, [{ operation: 'GET', encoding: 'u8', offset: 0 }]);
await redis.bitField(key, [{ operation: 'INCRBY', encoding: 'u8', offset: 0, increment: 100 }]);
```

---

## 4. Hashes

Hash — это **хэш-таблица** (словарь) внутри одного ключа Redis. Удобно для хранения объектов, когда порядок полей не важен.

**Ключевые моменты:**
- `HSET key field value` — установить поле
- `HGET key field` — получить одно поле (возвращает `string | null`)
- `HGETALL key` — получить все поля как объект
- Все значения хранятся как строки — нужен каст при чтении
- Удобно для кэширования сущностей с доступом к отдельным полям без десериализации всего объекта

```ts
await redis.hSet('user:1', 'name', 'dandyhorse');
await redis.hSet('user:1', 'age', '4');
const all = await redis.hGetAll('user:1'); // { name: 'dandyhorse', age: '4', ... }
```

---

## 5. Lists

List — **двусвязный список** (HEAD <-> a <-> b <-> c <-> TAIL). Элементы упорядочены, есть начало и конец.

**Паттерны:**
- **Очередь (FIFO):** `LPUSH` + `RPOP`
- **Стек (LIFO):** `LPUSH` + `LPOP`

**Ключевые моменты:**
- `LRANGE key 0 -1` — получить все элементы
- `LPUSH` добавляет в начало, `RPUSH` — в конец
- `LPOP` / `RPOP` — извлечь элемент (удаляет из списка)

```ts
await redis.lPush('TASKS', ['task1', 'task2', 'task3']);
const next = await redis.rPop('TASKS'); // 'task1' — FIFO
```

---

## 6. Sets

Set — **неупорядоченное множество** уникальных элементов. Нет индексов, нет позиций, нет порядка.

**Ключевые моменты:**
- Дубликаты автоматически отбрасываются
- `SINTER` — пересечение множеств (удобно для JS, где нет встроенного оператора `&` как в Python)
- `SISMEMBER` — проверка принадлежности элемента (O(1))
- `SMEMBERS` — получить все элементы

```ts
await redis.sAdd('SET_1', ['js', 'redis', 'nodejs', 'redis']); // 'redis' сохранится один раз
const common = await redis.sInter(['SET_1', 'SET_2']);          // пересечение
const has = await redis.sIsMember('SET_1', 'redis');            // true
```

---

## 7. Sorted Sets (ZSet)

Sorted Set — как Set, но каждый элемент имеет **score** (числовой вес). Элементы автоматически отсортированы по score.

**Ключевые моменты:**
- `ZADD` — добавить элемент(ы) со score
- `ZRANGE key 0 -1` — получить все элементы по возрастанию score (ASC)
- `ZRANGEBYSCORE` — получить элементы в диапазоне score
- `ZINCRBY` — увеличить score элемента на N
- Идеально подходит для лидербордов, рейтингов, приоритетных очередей

```ts
await redis.zAdd('LEADERBOARD', [{ value: 'user:1', score: 42 }]);
const top = await redis.zRangeWithScores('LEADERBOARD', 0, -1);
// [{ value: 'user:5', score: 3 }, { value: 'user:1', score: 42 }, ...]
await redis.zIncrBy('LEADERBOARD', 1000, 'user:5'); // поднять в топ
```

---

## 8. Geospatial

Geospatial — хранение и поиск **геокоординат**. Под капотом данные лежат в **Sorted Set** (ZSet), где score — это закодированная позиция.

**Ключевые моменты:**
- `GEOADD` — добавить точки (longitude, latitude, member)
- `GEOPOS` — получить координаты (с погрешностью ~7.5 см из-за 52-битного квантования)
- `GEODIST` — расстояние между двумя точками (в m, km)
- `GEOSEARCH` — найти точки в радиусе от заданной позиции
- `GEOHASH` — получить 11-символьный геохеш (можно сокращать справа, теряя точность)
- Удаление — через `ZREM`, т.к. это ZSet

```ts
await redis.geoAdd('Samara', [{ member: 'center', latitude: 53.3214, longitude: 50.0611 }]);
const dist = await redis.geoDist('Samara', 'center', 'square', 'km');
const nearby = await redis.geoSearch('Samara', position, { radius: 1, unit: 'km' });
```

---

## Общие принципы

| Принцип | Детали |
|---|---|
| **Атомарность** | Redis однопоточный — каждая команда выполняется целиком или никак |
| **Типы** | Всё хранится как строки/байты — кастуйте при чтении |
| **Префиксы** | Используйте `entity:id` для организации ключей |
| **Память** | jemalloc выделяет чанками — реальный расход > логического размера данных |
| **Одно соединение** | Good practice — держать одно соединение через `createClient()` + `connect()` |
