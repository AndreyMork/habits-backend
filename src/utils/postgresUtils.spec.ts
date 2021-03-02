import { buildPostgresUri } from '.';

describe('#buildPostgesUri', () => {
  test('Builds postgres uri', () => {
    const uri: URL = buildPostgresUri({
      hostname: 'localhost',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: 'postgres',
    });

    expect(uri.href).toBe(
      'postgresql://postgres:postgres@localhost:5432/postgres'
    );
  });

  test('Handles missing options', () => {
    const uri: URL = buildPostgresUri({
      hostname: '0.0.0.0',
      port: null,
    });

    expect(uri.href).toBe('postgresql://0.0.0.0/');
  });
});
