import {
  sql,
  // ValueExpressionType,
} from 'slonik';

import type { HabitType, SlonikSql } from '../types';

// const orDefault = <T>(value: ValueExpressionType | undefined): SlonikSql<T> =>
//   value !== undefined ? sql<T>`${value}` : sql`DEFAULT`;

export class HabitsSqlStore {
  static getHabits(): SlonikSql<HabitType> {
    return sql`
      SELECT
        id,
        created_at,
        title
      FROM
        habits
  `;
  }

  static getHabit(id: number): SlonikSql<HabitType> {
    return sql`
      SELECT
        id,
        created_at,
        title
      FROM
        habits
      WHERE
        id = ${id}
  `;
  }

  static newHabit(title: string): SlonikSql<HabitType> {
    return sql`
      INSERT INTO habits
        (title)
      VALUES
        (${title})
      RETURNING
        id,
        created_at,
        title
    `;
  }
}
