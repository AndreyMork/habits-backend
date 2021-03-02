// eslint-disable-next-line import/no-extraneous-dependencies
import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { bindTo, bindEagerlyTo } from '@marblejs/core';
import { pipe } from 'fp-ts/lib/pipeable';

import { listener } from '../http.listener';
import {
  HabitsRepositoryToken,
  HabitsRepository,
} from '../habits/habits.repository';
import { DatabasePoolToken } from '../databasePool.context';
import {
  PostgresContainerToken,
  PostgresSharedContainerReader,
  PostgresPoolReader,
  PostgresContainerCleanup,
  TestDatabaseToken,
  TestDatabaseReader,
  TestDatabaseCleanup,
} from '../testUtils';
import type { PostgresContainerOptionsType } from '../testUtils';
import type { HabitsType } from '../types';

const retryOptions = {
  retries: 20,
  interval: 250,
};

const postgresContainerOptions: PostgresContainerOptionsType = {
  image: 'habits-backend-test-db',
  env: { POSTGRES_PASSWORD: 'postgres' },
  exposedPort: '5432/tcp',
  username: 'postgres',
  password: 'postgres',
  database: 'habits',
  ...retryOptions,
};

const dependencies = [
  bindEagerlyTo(PostgresContainerToken)(
    PostgresSharedContainerReader(postgresContainerOptions)
  ),
  bindEagerlyTo(TestDatabaseToken)(
    TestDatabaseReader({ baseName: 'habits', ...retryOptions })
  ),
  bindTo(DatabasePoolToken)(PostgresPoolReader),
  bindTo(HabitsRepositoryToken)(HabitsRepository),
];

const testBed = createHttpTestBed({
  listener,
  defaultHeaders: {},
});

const useTestBedSetup = createTestBedSetup({
  testBed,
  dependencies,
  cleanups: [TestDatabaseCleanup, PostgresContainerCleanup],
});

// NOTE: see 'test-database/data.sql' for initial database data

const testBedSetup = useTestBedSetup();

afterAll(async () => {
  await testBedSetup.cleanup();
});

describe('#getHabits - GET /habits', () => {
  // const testBedSetup = useTestBedSetup();

  // afterAll(async () => {
  //   await testBedSetup.cleanup();
  // });

  test('Lists all habits', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/habits'),
      request.send
    );

    expect(response.statusCode).toBe(200);

    const expected = ['Habit 1', 'Habit 2', 'Habit 3'];
    const body: HabitsType = response.body;

    expect(Array.isArray(body)).toBe(true);
    expect(body.map(({ title }) => title)).toStrictEqual(expected);
  });
});

describe('#getHabit - GET /habits/id', () => {
  // const testBedSetup = useTestBedSetup();

  //   afterAll(async () => {
  //     await testBedSetup.cleanup();
  //   });

  test.each([1, 2, 3])('Gets habit: id = %p', async (id) => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath(`/habits/${id}`),
      request.send
    );

    expect(response.statusCode).toBe(200);

    const expected = `Habit ${id}`;
    expect(response.body?.title).toBe(expected);
  });

  test('Handles missing resource', async () => {
    const { request } = await testBedSetup.useTestBed();

    const id = 4;
    const response = await pipe(
      request('GET'),
      request.withPath(`/habits/${id}`),
      request.send
    );

    expect(response.statusCode).toBe(404);
  });

  test.each([
    'abc',
    // '1.0',
    '1.5',
    // '-123'
  ])('Validates parameters: param = %p', async (param) => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath(`/habits/${param}`),
      request.send
    );

    expect(response.statusCode).toBe(400);
  });
});

describe('#newHabit - POST /habits', () => {
  // const testBedSetup = useTestBedSetup();

  // afterAll(async () => {
  //   await testBedSetup.cleanup();
  // });

  test('Creates resource', async () => {
    const { request } = await testBedSetup.useTestBed();

    const newHabitTitle = 'New Habit';

    const response = await pipe(
      request('POST'),
      request.withPath('/habits'),
      request.withBody({ title: newHabitTitle }),
      request.send
    );

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(newHabitTitle);
  });

  test('Provides new resource location', async () => {
    const { request } = await testBedSetup.useTestBed();

    const newHabitTitle = 'New Habit';

    const response = await pipe(
      request('POST'),
      request.withPath('/habits'),
      request.withBody({ title: newHabitTitle }),
      request.send
    );

    const newResourceLocation = response.headers.location;
    expect(newResourceLocation).toBeDefined();
    expect(typeof newResourceLocation).toBe('string');

    const resourceResponse = await pipe(
      request('GET'),
      request.withPath(newResourceLocation as string),
      request.send
    );

    expect(resourceResponse.statusCode).toBe(200);
    expect(resourceResponse.body.title).toBe(newHabitTitle);
  });

  test('Validates empty request', async () => {
    const { request } = await testBedSetup.useTestBed();

    const noBodyResponse = await pipe(
      request('POST'),
      request.withPath('/habits'),
      request.send
    );

    expect(noBodyResponse.statusCode).toBe(400);
  });

  test.each(['', 123, null, undefined])(
    'Validates request: title = %p',
    async (title) => {
      const { request } = await testBedSetup.useTestBed();

      const noBodyResponse = await pipe(
        request('POST'),
        request.withPath('/habits'),
        request.withBody({ title }),
        request.send
      );

      expect(noBodyResponse.statusCode).toBe(400);
    }
  );

  test('Handles duplicates', async () => {
    const { request } = await testBedSetup.useTestBed();

    const newHabitTitle = 'New Habit';

    const response = await pipe(
      request('POST'),
      request.withPath('/habits'),
      request.withBody({ title: newHabitTitle }),
      request.send
    );

    expect(response.statusCode).toBe(201);

    const duplicateResponse = await pipe(
      request('POST'),
      request.withPath('/habits'),
      request.withBody({ title: newHabitTitle }),
      request.send
    );

    expect(duplicateResponse.statusCode).toBe(409);
  });
});

describe('#deleteAllHabits - DELETE /habits', () => {
  // const testBedSetup = useTestBedSetup();

  // afterAll(async () => {
  //   await testBedSetup.cleanup();
  // });

  test('Not allowed', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('DELETE'),
      request.withPath('/habits'),
      request.send
    );

    expect(response.statusCode).toBe(405);
  });
});
