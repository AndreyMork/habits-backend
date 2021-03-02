import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import { createPool } from 'slonik';
import type { DatabasePoolType } from 'slonik';

import {
  buildPostgresUri,
  waitPostgresConnection,
  tryCatch,
  taskEitherLet,
} from '../utils';
import type { TaskEitherError } from '../types';

import { TestContainer } from '.';

export type PostgresContainerOptionsType = {
  image: string;
  exposedPort: string;
  env: Record<string, string>;
  database: string;
  password: string;
  username: string;
  retries: number;
  interval: number;
};

export class PostgresContainer {
  readonly container: TestContainer;
  readonly pool: DatabasePoolType;
  readonly postgresUri: URL;

  protected constructor({
    pool,
    container,
    postgresUri,
  }: {
    pool: DatabasePoolType;
    container: TestContainer;
    postgresUri: URL;
  }) {
    this.pool = pool;
    this.container = container;
    this.postgresUri = postgresUri;
  }

  static run({
    image,
    exposedPort,
    env,
    database,
    password,
    username,
    retries,
    interval,
  }: PostgresContainerOptionsType): TaskEitherError<PostgresContainer> {
    return F.pipe(
      TestContainer.run({ image, env }),
      TE.chain((container) =>
        F.pipe(
          container.getPortAndHost(exposedPort),
          taskEitherLet('postgresUri', ({ ip, port }) =>
            buildPostgresUri({
              hostname: ip,
              port,
              database,
              username,
              password,
            })
          ),
          taskEitherLet('pool', ({ postgresUri }) =>
            createPool(postgresUri.href)
          ),
          TE.chainFirst(({ pool }) =>
            waitPostgresConnection({ pool, interval, retries })
          ),
          TE.map(
            ({ pool, postgresUri }) =>
              new PostgresContainer({ container, pool, postgresUri })
          ),
          TE.mapLeft((error) => F.pipe(container.stop(), F.constant(error)))
        )
      )
    );
  }

  stop(): TaskEitherError<PostgresContainer> {
    return F.pipe(
      tryCatch(async () => this.pool.end()),
      TE.chain(() => this.container.stop()),
      TE.map(F.constant(this))
    );
  }
}
