/**
 * @jest-environment node
 */

jest.mock('@/lib/users/actions', () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));
jest.mock('bcryptjs');

describe('NextAuth Configuration', () => {
  let authOptions: any;

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();

    jest.doMock('@/lib/db', () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.from = jest.fn().mockReturnValue(builder);
      builder.leftJoin = jest.fn().mockReturnValue(builder);
      builder.where = jest.fn().mockReturnValue(builder);
      builder.then = jest.fn().mockImplementation((cb: Function) =>
        Promise.resolve(
          cb([
            {
              id: 123,
              username: 'testuser',
              email: 'test@example.com',
              role: 'admin',
              image: 'avatar.png',
            },
          ])
        )
      );
      return { db: builder };
    });

    ({ authOptions } = require('@/lib/auth'));
  });

  describe('JWT Callback', () => {
    it('should add user ID to token', async () => {
      const jwt = (authOptions.callbacks as any).jwt as (
        params: { token: Record<string, unknown>; user: any }
      ) => Promise<Record<string, unknown>>;

      const token = {};
      const user = { id: '123', role: 'user' };

      const result = await jwt({ token, user});
      expect(result).toEqual({ id: '123', role: 'user' });
    });

    it('should return unmodified token when no user is provided', async () => {
      const jwt = (authOptions.callbacks as any).jwt as (
        params: { token: Record<string, unknown>; user: any }
      ) => Promise<Record<string, unknown>>;

      const token = { someData: 'value' };
      const result = await jwt({ token, user: null});
      expect(result).toEqual({ someData: 'value' });
    });
  });

  describe('Session Callback', () => {
    it('should populate session.user with database user info', async () => {
      const sessionCb = (authOptions.callbacks as any).session as (
        params: { session: any; token: any }
      ) => Promise<any>;

      const sessionObj = { user: {} };
      const token = { id: '123' };
      const result = await sessionCb({ session: sessionObj, token });

      expect(result).toEqual({
        user: {
          id: '123',
          name: 'testuser',
          email: 'test@example.com',
          role: 'admin',
          image: 'avatar.png',
        },
      });
    });

    it('should return unmodified session when no session.user exists', async () => {
      const sessionCb = (authOptions.callbacks as any).session as (
        params: { session: any; token: any }
      ) => Promise<any>;

      const sessionObj = { someData: 'value' };
      const token = { id: '123' };
      const result = await sessionCb({ session: sessionObj, token });

      expect(result).toEqual({ someData: 'value' });
    });
  });
});
