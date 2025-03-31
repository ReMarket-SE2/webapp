/**
 * @jest-environment node
 */

import { authOptions } from '@/lib/auth';
import { userAction } from '@/lib/users/actions';
import { db } from '@/lib/db';
import { oauthAccounts } from '@/lib/db/schema/oauth_accounts';
import type { User } from '@/lib/db/schema/users';
import type { Account, Profile } from 'next-auth';

// Mock the needed services and dependencies
jest.mock('@/lib/users/actions');
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve([{
              users: {
                id: 1,
                email: 'test@example.com',
                username: 'testuser',
              },
            }])),
          })),
        })),
      })),
    })),
    insert: jest.fn().mockReturnValue({ values: jest.fn() }),
  },
}));

describe('Google OAuth Authentication', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAccount: Account = {
    provider: 'google',
    type: 'oauth',
    providerAccountId: '12345',
  };

  const mockProfile: Profile = {
    sub: '12345',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sign in existing user with linked Google account', async () => {
    const result = await authOptions.callbacks?.signIn?.({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
    });

    expect(result).toBe(true);
    expect(mockUser.id).toBe('1');
    expect(mockUser.email).toBe('test@example.com');
  });

  it('should link Google account to existing user with matching email', async () => {
    // Mock no existing OAuth account
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValueOnce([]),
    };
    (db.select as jest.Mock).mockReturnValue(mockChain);

    // Mock finding existing user by email
    (userAction.findByEmail as jest.Mock).mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
    } as User);

    const result = await authOptions.callbacks?.signIn?.({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
    });

    expect(result).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(oauthAccounts);
    expect(mockUser.id).toBe('1');
  });

  it('should create new user for new Google account', async () => {
    // Mock no existing OAuth account
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValueOnce([]),
    };
    (db.select as jest.Mock).mockReturnValue(mockChain);

    // Mock no existing user
    (userAction.findByEmail as jest.Mock).mockResolvedValueOnce(null);

    // Mock user creation
    (userAction.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
    } as User);

    const result = await authOptions.callbacks?.signIn?.({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
    });

    expect(result).toBe(true);
    expect(userAction.create).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledWith(oauthAccounts);
  });

  it('should handle errors gracefully', async () => {
    // Mock an error
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValueOnce(new Error('Database error')),
    };
    (db.select as jest.Mock).mockReturnValue(mockChain);

    const result = await authOptions.callbacks?.signIn?.({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
    });

    expect(result).toBe(false);
  });
}); 