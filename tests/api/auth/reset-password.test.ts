/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/reset-password/route';
import { userAction } from '@/lib/users/actions';
import { checkPasswordStrength } from '@/lib/validators/password-strength';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const mockUserAction = userAction as jest.Mocked<typeof userAction>;
const mockJwtVerify = jwtVerify as jest.Mock;
const mockPasswordValidator = checkPasswordStrength as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockJsonResponse = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: Record<string, unknown>, init?: ResponseInit) => {
      mockJsonResponse(data, init);
      return { data, init };
    },
  },
}));

jest.mock('@/lib/users/actions', () => ({
  userAction: {
    validateResetToken: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  },
}));

describe('POST /api/auth/reset-password', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.resetAllMocks();
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        token: 'valid-token',
        password: 'NewP@ssword123',
      }),
    } as unknown as Request;

    // Mock JWT verification
    mockJwtVerify.mockResolvedValue({
      payload: { userId: 1 },
    });

    // Reset the password validator mock
    mockPasswordValidator.mockReturnValue({ isValid: true });

    // Ensure bcrypt hash returns a consistent value
    mockBcryptHash.mockResolvedValue('hashed-password');

    // Mock userAction.findById to return a valid user
    mockUserAction.findById.mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'old-hashed-password',
      profileImageId: null,
      role: 'user',
      password_reset_token: null,
      password_reset_expires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock userAction.update to accept and return the expected structure
    mockUserAction.update.mockImplementation(async (user) => ({
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Mock userAction.validateResetToken
    mockUserAction.validateResetToken.mockResolvedValue(true);
  });

  it('should reset password successfully', async () => {
    await POST(mockRequest);

    expect(mockJwtVerify).toHaveBeenCalledWith(
      'valid-token',
      expect.any(Uint8Array)
    );

    // Verify the password was validated
    expect(mockPasswordValidator).toHaveBeenCalledWith('NewP@ssword123');

    // Check that password was hashed
    expect(mockBcryptHash).toHaveBeenCalledWith('NewP@ssword123', 10);

    // Verify user was fetched
    expect(mockUserAction.findById).toHaveBeenCalledWith(1);

    // Verify reset token was validated
    expect(mockUserAction.validateResetToken).toHaveBeenCalledWith(
      1,
      'valid-token'
    );

    // Verify user password was updated
    expect(mockUserAction.update).toHaveBeenCalledWith({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      profileImageId: null,
      role: 'user',
      password_reset_token: null,
      password_reset_expires: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    // Check success response
    expect(mockJsonResponse).toHaveBeenCalledWith({ success: true }, undefined);
  });

  it('should return error when password is invalid', async () => {
    // Mock the password validator to return invalid
    mockPasswordValidator.mockReturnValue({
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    });

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Password must contain at least one uppercase letter' },
      { status: 400 }
    );

    // Verify user password was NOT updated
    expect(mockUserAction.update).not.toHaveBeenCalled();
  });

  it('should return error when token is invalid', async () => {
    // Mock JWT verification to return payload without userId
    mockJwtVerify.mockResolvedValue({
      payload: {}, // No userId
    });

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Invalid reset token' },
      { status: 400 }
    );

    // Verify user password was NOT updated
    expect(mockUserAction.update).not.toHaveBeenCalled();
  });

  it('should handle JWT verification errors', async () => {
    // Mock JWT verification to throw an error
    mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Failed to reset password' },
      { status: 500 }
    );

    // Verify user password was NOT updated
    expect(mockUserAction.update).not.toHaveBeenCalled();
  });

  it('should handle internal server errors', async () => {
    // Mock update to throw an error
    mockUserAction.update.mockRejectedValue(new Error('Database error'));

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  });

  it('should return error when reset token is expired', async () => {
    // Mock validateResetToken to return false for expired token
    mockUserAction.validateResetToken.mockResolvedValue(false);

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Invalid reset token' },
      { status: 400 }
    );

    // Verify user update was called to clear the reset token
    expect(mockUserAction.update).toHaveBeenCalledWith({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'old-hashed-password',
      profileImageId: null,
      role: 'user',
      password_reset_token: null,
      password_reset_expires: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should return error when reset token is missing', async () => {
    // Mock userAction.findById to return a user with no reset token
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        token: null,
        password: 'NewP@ssword123',
      }),
    } as unknown as Request;

    // Mock validateResetToken to return false for missing token
    mockUserAction.validateResetToken.mockResolvedValue(false);

    await POST(mockRequest);

    expect(mockUserAction.validateResetToken).toHaveBeenCalledWith(
      1,
      null
    );

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Invalid reset token' },
      { status: 400 }
    );

    //Veryfy user update was called to clear the reset token
    expect(mockUserAction.update).toHaveBeenCalledWith({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'old-hashed-password',
      profileImageId: null,
      role: 'user',
      password_reset_token: null,
      password_reset_expires: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});