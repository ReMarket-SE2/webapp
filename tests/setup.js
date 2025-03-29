// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Add TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Add DOM testing matchers
require('@testing-library/jest-dom');

// Mock services
jest.mock('@/lib/users/actions', () => ({
  userAction: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/lib/actions', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

jest.mock('@/lib/validators/password-strength', () => ({
  checkPasswordStrength: jest.fn(() => ({ isValid: true })),
}))

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

// Mock console.error to suppress error messages during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});