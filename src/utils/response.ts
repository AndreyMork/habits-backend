import { HttpStatus, HttpError } from '@marblejs/core';
import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';
import * as F from 'fp-ts/function';

import type {
  HttpResponse,
  HttpHeaderName,
  HttpHeaderValue,
  HttpResponseOperator,
} from '../types';

export const defaultResponse: HttpResponse<void> = {
  status: HttpStatus.OK,
  body: undefined,
  headers: {},
};

export const setStatus = <T>(status: HttpStatus) => ({
  body,
  headers,
}: HttpResponse<T>): HttpResponse<T> => ({
  status,
  body,
  headers,
});

export const setBody = <T1, T2>(body: T2) => ({
  status,
  headers,
}: HttpResponse<T1>): HttpResponse<T2> => ({
  status,
  body,
  headers,
});

export const setHeader = <T>(name: HttpHeaderName, value: HttpHeaderValue) => ({
  status,
  body,
  headers,
}: HttpResponse<T>): HttpResponse<T> => ({
  status,
  body,
  headers: { ...headers, [name]: value },
});

export const setLocationHeader = <T>(
  location: string
): HttpResponseOperator<T, T> => setHeader('location', location);

export const withStatus = (status: HttpStatus): HttpResponse<void> =>
  F.pipe(defaultResponse, setStatus(status));

export const withBody = <T>(body: T): HttpResponse<T> =>
  F.pipe(defaultResponse, setBody(body));

export const withHeader = (
  name: HttpHeaderName,
  value: HttpHeaderValue
): HttpResponse<void> => F.pipe(defaultResponse, setHeader(name, value));

export const withStatus$ = <T>(
  status: HttpStatus
): Rx.OperatorFunction<T, HttpResponse<void>> => RxOp.mapTo(withStatus(status));

export const asBody$ = RxOp.map(withBody);
export const withBody$ = <T1, T2>(
  body: T2
): Rx.OperatorFunction<T1, HttpResponse<T2>> => RxOp.mapTo(withBody(body));

export const toHttpError = (
  ...args: ConstructorParameters<typeof HttpError>
): F.Lazy<HttpError> => F.constant(new HttpError(...args));
