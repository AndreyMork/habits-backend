import { createContextToken, createReader, useContext } from '@marblejs/core';
import * as F from 'fp-ts/function';
import type { ContextToken } from '@marblejs/core';
import type { DependencyCleanup } from '@marblejs/testing';
import type { DatabasePoolType } from 'slonik';

import { toPromise } from '../utils';
import type { ContextReaderType } from '../types';

import { PostgresContainer, TestDatabase } from '.';
import type { PostgresContainerOptionsType } from '.';

export const PostgresContainerToken: ContextToken<PostgresContainer> = createContextToken(
  'PostgresContainer'
);

export const PostgresContainerReader = (
  options: PostgresContainerOptionsType
): ContextReaderType<PostgresContainer> =>
  createReader(async () => F.pipe(PostgresContainer.run(options), toPromise));

export const PostgresSharedContainerReader = (
  options: PostgresContainerOptionsType
): ContextReaderType<PostgresContainer> =>
  F.pipe(options, PostgresContainer.run, toPromise, F.constant, createReader);

// export const PostgresPoolReader: ContextReaderType<DatabasePoolType> = createReader(
//   (ask) => {
//     const container = useContext(PostgresContainerToken)(ask);
//     return container.pool;
//   }
// );

export const PostgresContainerCleanup: DependencyCleanup<PostgresContainer> = {
  token: PostgresContainerToken,
  cleanup: async (container: PostgresContainer): Promise<PostgresContainer> =>
    F.pipe(container.stop(), toPromise),
};

export const TestDatabaseToken: ContextToken<TestDatabase> = createContextToken(
  'TestDatabase'
);

export const TestDatabaseReader = ({
  baseName,
  retries,
  interval,
}: {
  baseName: string;
  retries: number;
  interval: number;
}): ContextReaderType<TestDatabase> =>
  createReader(async (ask) => {
    const container = useContext(PostgresContainerToken)(ask);

    return F.pipe(
      TestDatabase.createDatabase({
        container,
        databaseName: `${baseName}_${Math.random()}`,
        retries,
        interval,
      }),
      toPromise
    );
  });

export const PostgresPoolReader: ContextReaderType<DatabasePoolType> = createReader(
  (ask) => {
    const database = useContext(TestDatabaseToken)(ask);
    return database.pool;
  }
);

export const TestDatabaseCleanup: DependencyCleanup<TestDatabase> = {
  token: TestDatabaseToken,
  cleanup: async (database: TestDatabase): Promise<TestDatabase> =>
    F.pipe(database.cleanup(), toPromise),
};
