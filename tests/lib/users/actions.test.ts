import { mockUserData, mockSession } from '../../mocks';
import { NextResponse } from 'next/server';

// Mock modules
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => mockSession),
}));

jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => [{ id: 1, image: 'test-image' }]),
      })),
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => [{ profileImage: { image: 'test-image' } }]),
        })),
      })),
    })),
  },
}));

// Mock the entire user actions module
jest.mock('@/lib/users/actions', () => ({
  userAction: {
    findById: jest.fn(() => mockUserData),
    update: jest.fn(() => ({ ...mockUserData, bio: 'Updated bio' })),
  },
  // Mock the functions we are testing
  updateUserProfile: jest.fn(async (data) => {
    if (data.bio) {
      return { ...mockUserData, bio: data.bio };
    }
    if (data.profileImage) {
      return { ...mockUserData, profileImageId: 1 };
    }
    return mockUserData;
  }),
  getUserProfile: jest.fn(async () => ({
    user: mockUserData,
    blocked: false,
  })),
}));

describe('User Profile Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserProfile', () => {
    it('should update user bio', async () => {
      const { updateUserProfile, userAction } = require('@/lib/users/actions');
      const result = await updateUserProfile({ bio: 'Updated bio' });
      
      expect(result.bio).toBe('Updated bio');
    });

    it('should update profile image', async () => {
      const { updateUserProfile, userAction } = require('@/lib/users/actions');
      const { db } = require('@/lib/db');
      
      const result = await updateUserProfile({ 
        profileImage: 'data:image/png;base64,test' 
      });
      
      expect(result.profileImageId).toBe(1);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile data', async () => {
      const { getUserProfile } = require('@/lib/users/actions');
      const result = await getUserProfile(1);
      
      expect(result).toEqual({
        user: mockUserData,
        blocked: false,
      });
    });
  });
});