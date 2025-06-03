/**
 * @jest-environment node
 */

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock dependencies
jest.mock('@/lib/users/actions', () => ({
  findUserByEmail: jest.fn(),
  updateEmailVerificationToken: jest.fn(),
}));

jest.mock('@/lib/actions', () => ({
  sendEmailVerificationEmail: jest.fn(),
}));

jest.mock('jose', () => ({
  SignJWT: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: Record<string, unknown>, init?: ResponseInit) => {
      mockJsonResponse(data, init);
      return { data, init };
    },
  },
}));

import { POST } from '@/app/api/auth/resend-verification/route';
import { findUserByEmail, updateEmailVerificationToken } from '@/lib/users/actions';
import { sendEmailVerificationEmail } from '@/lib/actions';
import { SignJWT } from 'jose';

// Cast the imported functions as Jest mock functions
const mockFindUserByEmail = findUserByEmail as jest.Mock;
const mockUpdateEmailVerificationToken = updateEmailVerificationToken as jest.Mock;
const mockSendEmailVerificationEmail = sendEmailVerificationEmail as jest.Mock;
const mockSignJWT = SignJWT as jest.MockedClass<typeof SignJWT>;
const mockJsonResponse = jest.fn();

describe('POST /api/auth/resend-verification', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Setup SignJWT mock
    const mockInstance = {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('new-jwt-token'),
    };
    mockSignJWT.mockImplementation(() => mockInstance as any);

    // Create a mock request with JSON body
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
      }),
    } as unknown as Request;

    // Setup default mocks
    mockFindUserByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      emailVerified: false,
    });

    mockUpdateEmailVerificationToken.mockResolvedValue({});
    mockSendEmailVerificationEmail.mockResolvedValue(undefined);
  });

  it('should resend verification email successfully', async () => {
    await POST(mockRequest);

    // Verify user was found by email
    expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');

    // Verify new token was generated and saved
    expect(mockUpdateEmailVerificationToken).toHaveBeenCalledWith(
      1,
      'new-jwt-token',
      expect.any(Date)
    );

    // Verify email was sent
    expect(mockSendEmailVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'new-jwt-token'
    );

    // Check success response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { success: true, message: 'If an account with that email exists and is not verified, a verification email has been sent. Please check your email.' },
      undefined
    );
  });

  it('should return error when email is missing', async () => {
    mockRequest.json = jest.fn().mockResolvedValue({});

    await POST(mockRequest);

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Email is required' },
      { status: 400 }
    );
  });

  it('should return success when user is not found (security: prevent email enumeration)', async () => {
    mockFindUserByEmail.mockResolvedValue(null);

    await POST(mockRequest);

    // Should not send any email
    expect(mockUpdateEmailVerificationToken).not.toHaveBeenCalled();
    expect(mockSendEmailVerificationEmail).not.toHaveBeenCalled();

    // But should still return success to prevent email enumeration
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { success: true, message: 'If an account with that email exists and is not verified, a verification email has been sent. Please check your email.' },
      undefined
    );
  });

  it('should return success when email is already verified (security: prevent email enumeration)', async () => {
    mockFindUserByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      emailVerified: true,
    });

    await POST(mockRequest);

    // Should not send any email
    expect(mockUpdateEmailVerificationToken).not.toHaveBeenCalled();
    expect(mockSendEmailVerificationEmail).not.toHaveBeenCalled();

    // But should still return success to prevent email enumeration
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { success: true, message: 'If an account with that email exists and is not verified, a verification email has been sent. Please check your email.' },
      undefined
    );
  });

  it('should handle internal server errors', async () => {
    mockFindUserByEmail.mockImplementation(() => {
      throw new Error('Database error');
    });

    await POST(mockRequest);

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  });

  it('should handle JWT generation errors', async () => {
    const mockInstance = {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockRejectedValue(new Error('JWT error')),
    };
    mockSignJWT.mockImplementation(() => mockInstance as any);

    await POST(mockRequest);

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  });

  it('should handle email sending errors', async () => {
    mockSendEmailVerificationEmail.mockRejectedValue(new Error('Email error'));

    await POST(mockRequest);

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  });
}); 