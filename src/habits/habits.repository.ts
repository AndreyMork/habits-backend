import {
  createContextToken,
  createReader,
  useContext,
  ContextToken,
  Context,
  ContextProvider,
} from '@marblejs/core';
import { Reader } from 'fp-ts/lib/Reader';

import { DatabaseClient } from '../DatabaseClient';
import { DatabasePoolToken } from '../databasePool.context';

export const HabitsRepositoryToken: ContextToken<DatabaseClient> = createContextToken<DatabaseClient>(
  'HabitsRepository'
);

export const HabitsRepository: Reader<Context, DatabaseClient> = createReader(
  (ask: ContextProvider): DatabaseClient => {
    const pool = useContext(DatabasePoolToken)(ask);
    return new DatabaseClient(pool);
  }
);
