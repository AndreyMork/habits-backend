import { DatabasePoolType } from 'slonik';
// import * as F from 'fp-ts/function';
// import * as TE from 'fp-ts/TaskEither';

import { HabitType, HabitsType, TaskEitherError } from './types';
import { HabitsSqlStore } from './habits';
import { tryCatch } from './utils';

export class DatabaseClient {
  readonly #pool: DatabasePoolType;

  constructor(pool: DatabasePoolType) {
    this.#pool = pool;
  }

  getHabits(): TaskEitherError<HabitsType> {
    return tryCatch(
      async (): Promise<HabitsType> =>
        this.#pool.any(HabitsSqlStore.getHabits())
    );
  }

  getHabit(id: number): TaskEitherError<HabitType> {
    return tryCatch(
      async (): Promise<HabitType> =>
        this.#pool.one(HabitsSqlStore.getHabit(id))
    );
  }

  newHabit(title: string): TaskEitherError<HabitType> {
    return tryCatch(async () => this.#pool.one(HabitsSqlStore.newHabit(title)));
  }
}
