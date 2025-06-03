/**
 * @jest-environment node
 */

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock all the dependencies
jest.mock('@/lib/actions', () => ({
  sendEmailVerificationEmail: jest.fn(),
}));

jest.mock('@/lib/validators/password-strength', () => ({
  checkPasswordStrength: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('@/lib/users/actions', () => ({
  findUserByUsername: jest.fn(),
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateEmailVerificationToken: jest.fn(),
}));

// Mock the entire jose module
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

import { POST } from '@/app/api/auth/register/route';
import { findUserByEmail, findUserByUsername, createUser, updateEmailVerificationToken } from '@/lib/users/actions';
import { sendEmailVerificationEmail } from '@/lib/actions';
import { checkPasswordStrength } from '@/lib/validators/password-strength';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// Cast the imported functions as Jest mock functions
const mockFindUserByEmail = findUserByEmail as jest.Mock;
const mockFindUserByUsername = findUserByUsername as jest.Mock;
const mockCreateUser = createUser as jest.Mock;
const mockUpdateEmailVerificationToken = updateEmailVerificationToken as jest.Mock;
const mockSendEmailVerificationEmail = sendEmailVerificationEmail as jest.Mock;
const mockPasswordValidator = checkPasswordStrength as jest.Mock;
const mockJsonResponse = jest.fn();
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockSignJWT = SignJWT as jest.MockedClass<typeof SignJWT>;

interface User {
  id: number;
  username: string;
  passwordHash: string;
  email: string;
  profileImageId: number | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

describe('POST /api/auth/register', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Setup SignJWT mock
    const mockInstance = {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('mock-jwt-token'),
    };
    mockSignJWT.mockImplementation(() => mockInstance as any);

    // Create a mock request with JSON body
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        password: 'ValidP@ss123',
        confirmPassword: 'ValidP@ss123',
        username: 'testuser',
      }),
    } as unknown as Request;

    // Reset the password validator mock
    mockPasswordValidator.mockReturnValue({ isValid: true });
    // Ensure bcrypt hash returns a consistent value
    mockBcryptHash.mockResolvedValue('hashed-password');

    mockFindUserByEmail.mockResolvedValue(null);
    mockFindUserByUsername.mockResolvedValue(null);

    mockCreateUser.mockResolvedValue({
      id: 1,
      username: 'testuser',
      passwordHash: 'hashed-password',
      email: 'test@example.com',
      profileImageId: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdateEmailVerificationToken.mockResolvedValue({});
    mockSendEmailVerificationEmail.mockResolvedValue(undefined);
  });

  it('should register a new user successfully with email verification', async () => {
    const result = await POST(mockRequest);

    // Verify the password was validated
    expect(mockPasswordValidator).toHaveBeenCalledWith('ValidP@ss123');
    
    // Check that findByUsername and findByEmail were called
    expect(findUserByUsername).toHaveBeenCalledWith('testuser');
    expect(findUserByEmail).toHaveBeenCalledWith('test@example.com');
    
    // Check that password was hashed
    expect(mockBcryptHash).toHaveBeenCalledWith('ValidP@ss123', 10);
    
    // Verify user was created with correct data including email verification fields
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      username: 'testuser',
      status: 'inactive',
      emailVerified: false,
      email_verification_token: null,
      email_verification_expires: null,
    }));
    
    // Check success response with message about email verification
    expect(mockJsonResponse).toHaveBeenCalledWith(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.'
      },
      undefined
    );
  });

  it('should return error when passwords do not match', async () => {
    // Override the mock request with non-matching passwords
    mockRequest.json = jest.fn().mockResolvedValue({
      email: 'test@example.com',
      password: 'ValidP@ss123',
      confirmPassword: 'DifferentP@ss',
      username: 'testuser',
    });

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Passwords do not match' },
      { status: 400 }
    );
  });

  it('should return error when password is invalid', async () => {
    // Mock the password validator to return invalid
    mockPasswordValidator.mockReturnValue({ 
      isValid: false, 
      error: 'Password must contain at least one uppercase letter' 
    });

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Password must contain at least one uppercase letter' },
      { status: 400 }
    );
  });

  it('should return error when username is already taken', async () => {
    // Mock findByUsername to return an existing user
    mockFindUserByUsername.mockResolvedValue({ id: 1 } as User);

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Username already taken' },
      { status: 400 }
    );
  });

  it('should return error when email is already registered', async () => {
    // Mock findByUsername to return null (username not taken)
    mockFindUserByUsername.mockResolvedValue(null);
    // Mock findByEmail to return an existing user
    mockFindUserByEmail.mockResolvedValue({ id: 1 } as User);

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'User with this email already exists' },
      { status: 400 }
    );
  });

  it('should handle internal server errors', async () => {
    // Mock service to throw an error
    mockFindUserByUsername.mockImplementation(() => {
      throw new Error('Database error');
    });

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Internal server error' },
      { status: 500 }
    );
  });
});
