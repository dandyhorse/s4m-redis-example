import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express, { Express } from 'express';
import basicAuth from 'express-basic-auth';

import { appPassword, appPort, appUser } from './config';
import { addJob, queue } from './themes/12-bull-mq';

const app: Express = express();
const adapter = new ExpressAdapter();
const dashboardUrl = `/`; 

adapter.setBasePath(dashboardUrl);

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter: adapter,
});

app.use(
  dashboardUrl,
  basicAuth({
    users: { [appUser]: appPassword },
    challenge: true,
  }),
  adapter.getRouter(),
);

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

app.listen(appPort, async () => {
  await addJob('send-email', { id: 'user123' });
  await addJob('send-email', { id: 'user124' });
  await addJob('send-email', { id: 'user125' });
});
