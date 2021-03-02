import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import * as slonik from 'slonik';

import { waitPostgresConnection, tryCatch, taskEitherLet } from '../utils';
import type { TaskEitherError, SlonikSql } from '../types';

import type { PostgresContainer } from './PostgresContainer';

const createDatabaseSql = (name: string): SlonikSql<void> =>
  slonik.sql`CREATE DATABASE ${slonik.sql.identifier([name])} TEMPLATE habits`;

export type TestDatabaseOptionsType = {
  container: PostgresContainer;
  databaseName: string;
  retries: number;
  interval: number;
};

export class TestDatabase {
  readonly postgresUri: URL;
  readonly pool: slonik.DatabasePoolType;
  readonly #container: PostgresContainer;
  readonly databaseName: string;

  protected constructor({
    postgresUri,
    pool,
    container,
    databaseName,
  }: {
    postgresUri: URL;
    pool: slonik.DatabasePoolType;
    container: PostgresContainer;
    databaseName: string;
  }) {
    this.postgresUri = postgresUri;
    this.pool = pool;
    this.#container = container;
    this.databaseName = databaseName;
  }

  static createDatabase({
    container,
    databaseName,
    retries,
    interval,
  }: TestDatabaseOptionsType): TaskEitherError<TestDatabase> {
    return F.pipe(
      tryCatch(async () => container.pool.any(createDatabaseSql(databaseName))),
      TE.map(F.constant(new URL(databaseName, container.postgresUri))),
      TE.bindTo('postgresUri'),
      taskEitherLet('pool', ({ postgresUri }) =>
        slonik.createPool(postgresUri.href)
      ),
      TE.chainFirst(({ pool }) =>
        waitPostgresConnection({ pool, retries, interval })
      ),
      TE.map(
        ({ postgresUri, pool }) =>
          new TestDatabase({
            postgresUri,
            pool,
            container,
            databaseName,
          })
      )
    );
  }

  cleanup(): TaskEitherError<TestDatabase> {
    return F.pipe(
      tryCatch(async () => this.pool.end()),
      TE.map(F.constant(this))
    );
  }
}
