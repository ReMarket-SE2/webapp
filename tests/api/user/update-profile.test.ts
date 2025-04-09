/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/user/update-profile/route';
import { mockUserData, mockSession } from '../../mocks';

// Mock modules
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => mockSession),
}));

jest.mock('@/lib/users/actions', () => ({
  userAction: {
    updateUserProfile: jest.fn(() => ({
      ...mockUserData,
      bio: 'Updated bio from API',
    })),
  }
}));

describe('Update Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update profile and return success response', async () => {
    const { userAction } = require('@/lib/users/actions');

    // Create mock request with JSON body
    const request = new NextRequest('http://localhost/api/user/update-profile', {
      method: 'POST',
      body: JSON.stringify({
        bio: 'Updated bio from API',
        profileImage: null,
      }),
    });

    // Call the API route handler
    const response = await POST(request);
    const data = await response.json();

    // Verify the update was called with correct data
    expect(userAction.updateUserProfile).toHaveBeenCalledWith(
      'Updated bio from API', 
      null
    );

    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      user: expect.objectContaining({
        id: mockUserData.id,
        username: mockUserData.username,
        bio: 'Updated bio from API',
      }),
    });
  });

  it('should return unauthorized error when no session', async () => {
    const { getServerSession } = require('next-auth/next');
    jest.mocked(getServerSession).mockResolvedValueOnce(null);

    // Create mock request
    const request = new NextRequest('http://localhost/api/user/update-profile', {
      method: 'POST',
      body: JSON.stringify({ bio: 'Test bio' }),
    });

    // Call the API route handler
    const response = await POST(request);
    const data = await response.json();

    // Check error response
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });
});