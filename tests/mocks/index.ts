// Mock user data for testing
export const mockUserData = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  profileImageId: null,
  bio: 'Test bio',
  role: 'user',
  password_reset_token: null,
  password_reset_expires: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock session data for testing
export const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};