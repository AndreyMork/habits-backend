import type { Context, HttpHeaders, HttpStatus } from '@marblejs/core';
import type { Reader } from 'fp-ts/Reader';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { Observable } from 'rxjs';
import type { TaggedTemplateLiteralInvocationType } from 'slonik';

// export type Refinement<T> = (value: unknown) => value is T;
export type Constructor<T> = new (...args: Array<never>) => T;

export type DateType = number;
export type HabitType = Readonly<{
  id: number;
  createdAt: DateType;
  title: string;
}>;
export type HabitsType = ReadonlyArray<HabitType>;

export type ContextReaderType<T> =
  | Reader<Context, T>
  | Reader<Context, Promise<T>>;

// NOTE: HttpEffectResponse without request property and rest properties are required
export type HttpResponse<T> = {
  status: HttpStatus;
  body: T;
  headers: HttpHeaders;
};
export type HttpHeaderName = keyof HttpHeaders;
export type HttpHeaderValue = HttpHeaders[HttpHeaderName];
export type HttpResponse$<T> = Observable<HttpResponse<T>>;

export type HttpResponseOperator<T1, T2> = (
  x: HttpResponse<T1>
) => HttpResponse<T2>;

export type TaskEitherError<T> = TaskEither<Error, T>;
export type SlonikSql<T> = TaggedTemplateLiteralInvocationType<T>;
