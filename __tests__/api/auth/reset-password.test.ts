import { POST } from '@/app/api/auth/reset-password/route';
import { UserService } from '@/services/user-service';
import { checkPasswordStrength } from '@/lib/validators/password-strength';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockJwtVerify = jwtVerify as jest.Mock;
const mockPasswordValidator = checkPasswordStrength as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockJsonResponse = jest.fn();

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
  });

  it('should reset password successfully', async () => {
    // Mock services for a successful password reset
    mockUserService.updatePassword.mockResolvedValue({ id: 1 } as User);

    await POST(mockRequest);

    // Verify the token was verified
    expect(mockJwtVerify).toHaveBeenCalledWith(
      'valid-token',
      expect.any(Uint8Array)
    );
    
    // Verify the password was validated
    expect(mockPasswordValidator).toHaveBeenCalledWith('NewP@ssword123');
    
    // Check that password was hashed
    expect(mockBcryptHash).toHaveBeenCalledWith('NewP@ssword123', 10);
    
    // Verify user password was updated
    expect(mockUserService.updatePassword).toHaveBeenCalledWith(1, 'hashed-password');
    
    // Check success response
    expect(mockJsonResponse).toHaveBeenCalledWith({ success: true }, undefined);
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
    
    // Verify user password was NOT updated
    expect(mockUserService.updatePassword).not.toHaveBeenCalled();
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
    expect(mockUserService.updatePassword).not.toHaveBeenCalled();
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
    expect(mockUserService.updatePassword).not.toHaveBeenCalled();
  });

  it('should handle internal server errors', async () => {
    // Mock updatePassword to throw an error
    mockUserService.updatePassword.mockRejectedValue(new Error('Database error'));

    await POST(mockRequest);

    // Check error response
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  });
}); 