import * as Rx from 'rxjs';
import { observableEither as FxEither } from 'fp-ts-rxjs';
import * as F from 'fp-ts/function';

import type { Constructor } from '../types';

import { throwError, isInstanceOf } from '.';

export type FxEitherOperatorFunction<
  TLeftSource,
  TRightSource,
  TLeftDest,
  TRightDest
> = (
  source: FxEither.ObservableEither<TLeftSource, TRightSource>
) => FxEither.ObservableEither<TLeftDest, TRightDest>;

export type FxEitherDestructor<TLeft, TRight, TResult> = (
  source: FxEither.ObservableEither<TLeft, TRight>
) => Rx.Observable<TResult>;

export const fromRight$ = <TLeft extends Error, TRight>(): FxEitherDestructor<
  TLeft,
  TRight,
  TRight
> => FxEither.getOrElse(throwError);

export const mapLeftWhen$ = <TLeft, TRight, TValue, TNewLeft>(
  predicate: F.Refinement<unknown, TValue>,
  callback: (value: TValue) => TNewLeft
): FxEitherOperatorFunction<TLeft, TRight, TLeft | TNewLeft, TRight> =>
  FxEither.mapLeft((left) => {
    if (!predicate(left)) {
      return left;
    }

    return callback(left);
  });

export const mapLeftWhenInstanceOf$ = <TLeft, TRight, TInstance, TNewLeft>(
  aClass: Constructor<TInstance>,
  callback: (value: TInstance) => TNewLeft
): FxEitherOperatorFunction<TLeft, TRight, TLeft | TNewLeft, TRight> =>
  mapLeftWhen$(isInstanceOf(aClass), callback);
