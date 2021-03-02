import * as F from 'fp-ts/function';

import {
  withStatus,
  withBody,
  withHeader,
  setStatus,
  setBody,
  setHeader,
  defaultResponse,
} from '.';

describe('#Response', () => {
  test('Default response is correct', () => {
    expect(defaultResponse).toStrictEqual({
      status: 200,
      body: undefined,
      headers: {},
    });
  });

  test.each([200, 404, 409])('Sets status #%#', (status) => {
    expect(withStatus(status)).toStrictEqual({
      status,
      body: undefined,
      headers: {},
    });
  });

  test.each(['abc', { message: 'Hello, world!' }, 123])(
    'Sets body #%#',
    (body) => {
      expect(withBody(body)).toStrictEqual({
        status: 200,
        body,
        headers: {},
      });
    }
  );

  test.each(['abc', 123, ['abc', '123']])('Sets header #%#', (headerValue) => {
    const headerName = 'x-custom-header';
    expect(withHeader(headerName, headerValue)).toStrictEqual({
      status: 200,
      body: undefined,
      headers: {
        [headerName]: headerValue,
      },
    });
  });

  test('Preserves headers', () => {
    const headerName1 = 'x-custom-header-1';
    const headerValue1 = 1;

    const headerName2 = 'x-custom-header-2';
    const headerValue2 = 2;
    expect(
      F.pipe(
        withHeader(headerName1, headerValue1),
        setHeader(headerName2, headerValue2)
      )
    ).toStrictEqual({
      status: 200,
      body: undefined,
      headers: {
        [headerName1]: headerValue1,
        [headerName2]: headerValue2,
      },
    });
  });

  test('Constructs response', () => {
    const status = 405;
    const body = { message: 'Hello, world!' };

    const headerName1 = 'x-custom-header-1';
    const headerValue1 = 1;

    const headerName2 = 'x-custom-header-2';
    const headerValue2 = 2;

    expect(
      F.pipe(
        defaultResponse,
        setStatus(status),
        setBody(body),
        setHeader(headerName1, headerValue1),
        setHeader(headerName2, headerValue2)
      )
    ).toStrictEqual({
      status,
      body,
      headers: {
        [headerName1]: headerValue1,
        [headerName2]: headerValue2,
      },
    });
  });
});
