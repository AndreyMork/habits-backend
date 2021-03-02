import { createContextToken } from '@marblejs/core';
import type { ContextToken } from '@marblejs/core';
import type { DatabasePoolType } from 'slonik';

export const DatabasePoolToken: ContextToken<DatabasePoolType> = createContextToken<DatabasePoolType>(
  'DatabasePoolToken'
);
