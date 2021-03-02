import { httpListener } from '@marblejs/core';
import { logger$ } from '@marblejs/middleware-logger';
import { bodyParser$ } from '@marblejs/middleware-body';

import { root$ } from './api.effects';
import { habits$ } from './habits';

const middlewares = [logger$(), bodyParser$()];

const effects = [root$, habits$];

export const listener = httpListener({
  middlewares,
  effects,
});
