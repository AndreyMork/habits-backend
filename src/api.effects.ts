import { r } from '@marblejs/core';

import { withBody$ } from './utils';

export const root$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect((req$) => req$.pipe(withBody$('Hello, world!')))
);
