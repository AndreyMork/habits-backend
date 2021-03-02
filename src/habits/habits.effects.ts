import { r, useContext, combineRoutes, HttpStatus } from '@marblejs/core';
import type { ContextProvider } from '@marblejs/core';
import { requestValidator$ } from '@marblejs/middleware-io';
import * as iots from 'io-ts';
import * as iotsTypes from 'io-ts-types';
// import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';
import { observableEither as FxEither } from 'fp-ts-rxjs';
import * as F from 'fp-ts/function';
import * as slonik from 'slonik';

import {
  fromRight$,
  mapLeftWhenInstanceOf$,
  asBody$,
  withStatus$,
  withStatus,
  setBody,
  setLocationHeader,
  toHttpError,
} from '../utils';
import type { DatabaseClient } from '../DatabaseClient';
import type { HabitType, HabitsType, HttpResponse$ } from '../types';

import { HabitsRepositoryToken } from './habits.repository';

const askDatabaseClient = (ask: ContextProvider): DatabaseClient =>
  useContext(HabitsRepositoryToken)(ask);

export const getAllHabits$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(
    (req$, ctx): HttpResponse$<HabitsType> => {
      const databaseClient: DatabaseClient = askDatabaseClient(ctx.ask);

      return req$.pipe(
        // NOTE: arrow for early binding
        RxOp.map(() => databaseClient.getHabits()),
        RxOp.mergeMap(FxEither.fromTaskEither),
        fromRight$(),
        asBody$
      );
    }
  )
);

export const getHabit$ = r.pipe(
  r.matchPath('/:id'),
  r.matchType('GET'),
  r.useEffect(
    (req$, ctx): HttpResponse$<HabitType> => {
      const databaseClient: DatabaseClient = askDatabaseClient(ctx.ask);

      return req$.pipe(
        requestValidator$({
          params: iots.type({
            id: iotsTypes.IntFromString,
          }),
        }),
        RxOp.map((req) => databaseClient.getHabit(req.params.id)),
        RxOp.mergeMap(FxEither.fromTaskEither),
        mapLeftWhenInstanceOf$(
          slonik.NotFoundError,
          toHttpError('Resource not found', HttpStatus.NOT_FOUND)
        ),
        fromRight$(),
        asBody$
      );
    }
  )
);

export const newHabit$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(
    (req$, ctx): HttpResponse$<HabitType> => {
      const databaseClient: DatabaseClient = askDatabaseClient(ctx.ask);

      return req$.pipe(
        requestValidator$({
          body: iots.type({
            title: iotsTypes.NonEmptyString,
          }),
        }),
        RxOp.map((req) => databaseClient.newHabit(req.body.title)),
        RxOp.mergeMap(FxEither.fromTaskEither),
        mapLeftWhenInstanceOf$(
          slonik.UniqueIntegrityConstraintViolationError,
          toHttpError('Habit with provided title exists', HttpStatus.CONFLICT)
        ),
        FxEither.map((habit) =>
          F.pipe(
            withStatus(HttpStatus.CREATED),
            setBody(habit),
            setLocationHeader(`/habits/${habit.id}`)
          )
        ),
        fromRight$()
      );
    }
  )
);

export const deleteAllHabits$ = r.pipe(
  r.matchPath('/'),
  r.matchType('DELETE'),
  r.useEffect(
    (req$): HttpResponse$<void> =>
      req$.pipe(withStatus$(HttpStatus.METHOD_NOT_ALLOWED))
  )
);

export const habits$ = combineRoutes('/habits', [
  getAllHabits$,
  getHabit$,
  newHabit$,
  deleteAllHabits$,
]);
