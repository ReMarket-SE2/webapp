/**
 * @jest-environment node
 */

import { authOptions } from '@/lib/auth';

// Mock the needed services and dependencies
jest.mock('@/lib/users/actions', () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));
jest.mock('bcryptjs');

interface JwtCallback {
  token: Record<string, unknown>;
  user: { id: string; email?: string; role?: string; avatar?: string } | null;
  account: unknown;
  profile: unknown;
}

interface SessionCallback {
  session: Record<string, unknown>;
  token: Record<string, unknown>;
  user: { id: string; email?: string; role?: string; avatar?: string } | null;
}

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('JWT Callback', () => {
    it('should add user ID to token', async () => {
      const { jwt } = authOptions.callbacks as unknown as { jwt: (params: JwtCallback) => Promise<Record<string, unknown>> };
      
      const token = {};
      const user = { id: '123' };
      
      const result = await jwt({ token, user, account: null, profile: null });
      
      expect(result).toEqual({ id: '123' });
    });

    it('should return unmodified token when no user is provided', async () => {
      const { jwt } = authOptions.callbacks as unknown as { jwt: (params: JwtCallback) => Promise<Record<string, unknown>> };
      
      const token = { someData: 'value' };
      
      const result = await jwt({ token, user: null, account: null, profile: null });
      
      expect(result).toEqual({ someData: 'value' });
    });
  });

  describe('Session Callback', () => {
    it('should add user ID to session user object', async () => {
      const { session } = authOptions.callbacks as unknown as { session: (params: SessionCallback) => Promise<Record<string, unknown>> };
      
      const sessionObj = { user: { id: '123' } };
      const token = { id: '123' };
      
      const result = await session({ session: sessionObj, token, user: null });
      
      expect(result).toEqual({ user: { id: '123' } });
    });

    it('should return unmodified session when no user object exists', async () => {
      const { session } = authOptions.callbacks as unknown as { session: (params: SessionCallback) => Promise<Record<string, unknown>> };
      
      const sessionObj = { someData: 'value' };
      const token = { id: '123' };
      
      const result = await session({ session: sessionObj, token, user: null });
      
      expect(result).toEqual({ someData: 'value' });
      
    });
  });
});