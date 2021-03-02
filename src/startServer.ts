import {
  createServer,
  bindTo,
  bindEagerlyTo,
  createReader,
} from '@marblejs/core';
import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import * as IO from 'fp-ts/lib/IO';
import dotenv from 'dotenv';
import envVar from 'env-var';
import { createPool } from 'slonik';
import type { DatabasePoolType } from 'slonik';

import { listener } from './http.listener';
import { HabitsRepositoryToken, HabitsRepository } from './habits';
import { DatabasePoolToken } from './databasePool.context';
import { buildPostgresUri, waitPostgresConnection } from './utils';
import type { ContextReaderType } from './types';

const nodeEnv: string = envVar
  .get('NODE_ENV')
  .default('development')
  .asString();

if (nodeEnv === 'development') {
  dotenv.config();
}

const port: number = envVar.get('PORT').required().asPortNumber();
const hostname: string = envVar.get('HOSTNAME').default('localhost').asString();

const postgresUri: URL = buildPostgresUri({
  hostname: envVar.get('POSTGRES_HOST').required().asString(),
  port: envVar.get('POSTGRES_PORT').required().asPortNumber(),
  database: envVar.get('POSTGRES_DB').required().asString(),
  username: envVar.get('POSTGRES_USER').required().asString(),
  password: envVar.get('POSTGRES_PASSWORD').required().asString(),
});

const PoolReader: ContextReaderType<DatabasePoolType> = createReader(
  async (): Promise<DatabasePoolType> =>
    F.pipe(
      waitPostgresConnection({
        pool: createPool(postgresUri.href),
        retries: 10,
        interval: 1000,
      }),
      TE.getOrElse((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
      })
    )()
);

const server = createServer({
  port,
  hostname,
  listener,
  dependencies: [
    bindEagerlyTo(DatabasePoolToken)(PoolReader),
    bindTo(HabitsRepositoryToken)(HabitsRepository),
  ],
});

const main: IO.IO<void> = async () => (await server)();

main();
