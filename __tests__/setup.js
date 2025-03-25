// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Mock services
jest.mock('@/services/user-service', () => ({
  UserService: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

jest.mock('@/services/email-service', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

jest.mock('@/lib/validators/password-strength', () => ({
  checkPasswordStrength: jest.fn().mockReturnValue({ isValid: true }),
}));

// Create a proper jose mock to handle JWT operations
const signMock = jest.fn().mockResolvedValue('test-token');
const setProtectedHeaderMock = jest.fn().mockReturnThis();
const setExpirationTimeMock = jest.fn().mockReturnThis();

class MockSignJWT {
  constructor(payload) {
    this.payload = payload;
  }
  
  setProtectedHeader() {
    return setProtectedHeaderMock();
  }
  
  setExpirationTime() {
    return setExpirationTimeMock();
  }
  
  sign() {
    return signMock();
  }
}

jest.mock('jose', () => ({
  SignJWT: MockSignJWT,
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { userId: 1 },
  }),
})); 