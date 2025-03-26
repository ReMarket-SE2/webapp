/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/register/route';
import { userAction } from '@/lib/users/actions';
import { checkPasswordStrength } from '@/lib/validators/password-strength';
import bcrypt from 'bcryptjs';

const mockUserAction = userAction as jest.Mocked<typeof userAction>;
const mockPasswordValidator = checkPasswordStrength as jest.Mock;
const mockJsonResponse = jest.fn();
const mockBcryptHash = bcrypt.hash as jest.Mock;

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
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  },
}));

describe('POST /api/auth/register', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.resetAllMocks();
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
  });

  it('should register a new user successfully', async () => {
    // Mock service responses for a successful registration
    mockUserAction.findByUsername.mockResolvedValue(null);
    mockUserAction.findByEmail.mockResolvedValue(null);
    mockUserAction.create.mockResolvedValue({ id: 1 } as User);

    await POST(mockRequest);

    // Verify the password was validated
    expect(mockPasswordValidator).toHaveBeenCalledWith('ValidP@ss123');
    
    // Check that findByUsername and findByEmail were called
    expect(mockUserAction.findByUsername).toHaveBeenCalledWith('testuser');
    expect(mockUserAction.findByEmail).toHaveBeenCalledWith('test@example.com');
    
    // Check that password was hashed
    expect(mockBcryptHash).toHaveBeenCalledWith('ValidP@ss123', 10);
    
    // Verify user was created with correct data
    expect(mockUserAction.create).toHaveBeenCalled();
    expect(mockUserAction.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      username: 'testuser',
    }));
    
    // Check success response
    expect(mockJsonResponse).toHaveBeenCalledWith({ success: true }, undefined);
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
    mockUserAction.findByUsername.mockResolvedValue({ id: 1 } as User);

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Username already taken' },
      { status: 400 }
    );
  });

  it('should return error when email is already registered', async () => {
    // Mock findByUsername to return null (username not taken)
    mockUserAction.findByUsername.mockResolvedValue(null);
    // Mock findByEmail to return an existing user
    mockUserAction.findByEmail.mockResolvedValue({ id: 1 } as User);

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'User with this email already exists' },
      { status: 400 }
    );
  });

  it('should handle internal server errors', async () => {
    // Mock service to throw an error
    mockUserAction.findByUsername.mockImplementation(() => {
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