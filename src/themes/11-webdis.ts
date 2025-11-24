// bonus/03-webdis.ts
// Webdis: HTTP-интерфейс к Redis. Запуск: в docker-compose на порту 7379

import axios from 'axios'; // npm i axios

import { webdisBaseUrl } from '../config';

// TODO: Не забудь что это говно 403 кидает:

async function demoWebdis() {
  const key = 'HELLO';
  const value = 'WORLD';

  // SET
  await axios.get(`${webdisBaseUrl}/SET/${key}/${value}`);
  console.log('SET via Webdis');

  // GET
  const { data: result } = await axios.get(`${webdisBaseUrl}/GET/${key}`);
  console.log('GET result:', result);

  // KEYS *
  const { data: keys } = await axios.get(`${webdisBaseUrl}/KEYS/*`);
  console.log('Keys:', keys);

  // FLUSHALL
  await axios.get(`${webdisBaseUrl}/FLUSHALL`);

  const { data: flushedKeys } = await axios.get(`${webdisBaseUrl}/KEYS/*`);
  console.log('MUST BE EMPTY:', flushedKeys);
}

demoWebdis().catch(console.error);
