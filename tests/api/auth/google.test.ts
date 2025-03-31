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
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ id: 1 }])),
        })),
      })),
    })),
  },
}));

// Mock fetch for profile image
global.fetch = jest.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    headers: new Headers({ 'content-type': 'image/jpeg' }),
  })
) as jest.Mock;

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
    picture: 'https://example.com/profile.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sign in existing user with linked Google account without updating profile image', async () => {
    const result = await authOptions.callbacks?.signIn?.({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
    });

    expect(result).toBe(true);
    expect(mockUser.id).toBe('1');
    expect(mockUser.email).toBe('test@example.com');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalledWith(expect.any(Object));
    expect(db.update).not.toHaveBeenCalled();
  });

  it('should link Google account to existing user with matching email and set profile image', async () => {
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
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/profile.jpg');
    expect(db.update).toHaveBeenCalled();
  });

  it('should create new user for new Google account with profile image', async () => {
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
    expect(userAction.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      username: 'TestUser',
      profileImageId: 1,
    }));
    expect(db.insert).toHaveBeenCalledWith(oauthAccounts);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/profile.jpg');
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

  it('should handle profile image fetch errors gracefully', async () => {
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

    // Mock fetch error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await authOptions.callbacks?.signIn?.({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
    });

    expect(result).toBe(true); // Should still succeed even if image fetch fails
    expect(userAction.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      username: 'TestUser',
      profileImageId: null,
    }));
    expect(db.insert).toHaveBeenCalledWith(oauthAccounts);
  });
}); 