import { ConnectionError } from 'slonik';
import type { DatabasePoolType } from 'slonik';
import {
  limitRetries,
  monoidRetryPolicy,
  constantDelay,
  RetryPolicy,
} from 'retry-ts';
import { retrying } from 'retry-ts/lib/Task';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';

import { tryCatch } from '.';

export const buildPostgresUri = ({
  hostname,
  port,
  database,
  username,
  password,
}: {
  hostname: string;
  port?: string | number | null;
  database?: string | null;
  username?: string | null;
  password?: string | null;
}): URL => {
  const uri = new URL(`postgresql://${hostname}`);

  uri.port = port == null ? '' : port.toString();
  uri.pathname = database ?? '/';
  uri.username = username ?? '';
  uri.password = password ?? '';

  return uri;
};

export const checkConnection = (
  pool: DatabasePoolType
): TE.TaskEither<Error, DatabasePoolType> =>
  tryCatch(async () => {
    await pool.connect(async () => Promise.resolve());
    return pool;
  });

export const waitPostgresConnection = ({
  pool,
  retries,
  interval,
}: {
  pool: DatabasePoolType;
  retries: number;
  interval: number;
}): TE.TaskEither<Error, DatabasePoolType> => {
  const policy: RetryPolicy = monoidRetryPolicy.concat(
    constantDelay(interval),
    limitRetries(retries)
  );

  return retrying(
    policy,
    () => checkConnection(pool),
    (result) => E.isLeft(result) && result.left instanceof ConnectionError
  );
};
