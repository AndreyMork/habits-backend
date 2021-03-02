import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';

import type { Constructor } from '../types';

export const tryCatch = <T>(
  callback: () => Promise<T>
): TE.TaskEither<Error, T> => TE.tryCatch(callback, E.toError);

export const throwError = (error: Error): never => {
  throw error;
};

export const isInstanceOf = <T>(aClass: Constructor<T>) => (
  y: unknown
): y is T => y instanceof aClass;

export const toPromise = async <TLeft, TRight>(
  task: TE.TaskEither<TLeft, TRight>
): Promise<TRight> =>
  F.pipe(
    task,
    // eslint-disable-next-line promise/no-promise-in-callback
    TE.getOrElse((error) => F.constant(Promise.reject(error)))
  )();

export const taskEitherLet = <TName extends string, TRight, TLeft, TResult>(
  name: Exclude<TName, keyof TRight>,
  callback: (env: TRight) => TResult
): ((
  source: TE.TaskEither<TLeft, TRight>
) => TE.TaskEither<
  TLeft,
  {
    [TKey in TName | keyof TRight]: TKey extends keyof TRight
      ? TRight[TKey]
      : TResult;
  }
>) => {
  const f = (env: TRight): TE.TaskEither<TLeft, TResult> =>
    F.pipe(env, callback, TE.right);

  return TE.bind(name, f);
};
