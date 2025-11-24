import { JobsOptions, Queue, Worker } from 'bullmq';

import { redisConfig } from '../config';

const queueName = 'bull-mq-example';

const worker = new Worker(
  queueName,
  async (job) => {
    console.log('Processing job:', job.name, 'for data:', job.data.id);

    await new Promise((resolve) => setTimeout(resolve, 20000)); // 1 сек задержка

    return { processed: true, result: `Job ${job.data.id} completed` };
  },
  {
    concurrency: 1,
    connection: redisConfig,
    autorun: true,
  },
);

worker.on('failed', (job, err: any) => {
  console.error('Job failed:', job?.id, err.message);
});

worker.on('completed', async (job: any) => {
  console.log('Job completed:', job.id, 'result:', job.returnvalue);
});

export const queue = new Queue(queueName, {
  connection: redisConfig,
});

export const addJob = async (jobName: string, jobData: { id: string }) => {
  const opts: JobsOptions = {
    attempts: 1,
    backoff: {
      type: 'fixed',
      delay: 100,
    },
    removeOnComplete: true,
    removeOnFail: false,
  };

  opts.jobId = `${jobData.id}`;

  const addedJob = await queue.add(jobName, jobData, opts);

  return addedJob;
};
