// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Add TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock Request for Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.input = input;
    this.init = init;
  }
};

// Mock window.matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // Deprecated
  removeListener: jest.fn(), // Deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Add DOM testing matchers
require('@testing-library/jest-dom');

// Mock services
jest.mock('@/lib/users/actions', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  updatePassword: jest.fn(),
  verifyEmail: jest.fn(),
  validateResetToken: jest.fn(),
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

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue(null),
}));

// Mock console.error to suppress error messages during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock Request API for Next.js
global.Request = class Request {
  constructor(input, init) {
    this.input = input;
    this.init = init;
  }
};

// Mock next/navigation hooks
jest.mock('next/navigation', () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };
  return {
    useRouter: () => router,
    usePathname: () => '/listings',
    useSearchParams: () => new URLSearchParams(),
  };
});