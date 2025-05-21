import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '@/components/admin/user-form';
import { User, UserRole } from '@/lib/db/schema/users';
import { adminUpdateUser } from '@/lib/users/actions';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/users/actions', () => ({
  adminUpdateUser: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock test user with all required properties
const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user' as UserRole,
  passwordHash: null,
  status: 'active',
  profileImageId: null,
  bio: null,
  password_reset_token: null,
  password_reset_expires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserForm Component', () => {
  const onCloseMock = jest.fn();
  
  // Set up user event instance
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with user data when editing', () => {
    render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);

    // Use getByRole with more specific queries instead of assuming text content
    expect(screen.getByTestId('username-input')).toHaveValue('testuser');
    
    // For role selection, use appropriate query
    const roleElement = screen.getByRole('combobox', { name: /role/i });
    expect(roleElement).toHaveTextContent(/user/i);
    
    // For email field
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue('test@example.com');
    
    // For user ID field
    const userIdInput = screen.getByLabelText(/user id/i);
    expect(userIdInput).toHaveValue('1');
  });

  it('validates username - length constraint', async () => {
    render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);
    
    const usernameInput = screen.getByTestId('username-input');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'ab');
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    expect(screen.getByTestId('username-error')).toHaveTextContent('Username must be between 3 and 50 characters');
    expect(adminUpdateUser).not.toHaveBeenCalled();
  });

  it('validates username - character constraint', async () => {
    render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);
    
    const usernameInput = screen.getByTestId('username-input');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'test@user');
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    expect(screen.getByTestId('username-error')).toHaveTextContent('Username can only contain letters, numbers, and underscores');
    expect(adminUpdateUser).not.toHaveBeenCalled();
  });

  it('submits form with updated username', async () => {
    (adminUpdateUser as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);
    
    const usernameInput = screen.getByTestId('username-input');
    await user.clear(usernameInput);
    await user.type(usernameInput, 'newusername');
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    expect(adminUpdateUser).toHaveBeenCalledWith(1, { username: 'newusername' });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('updated successfully')));
    expect(onCloseMock).toHaveBeenCalled();
  });

  // todo: fix this test
//   it('submits form with updated role', async () => {
//     (adminUpdateUser as jest.Mock).mockResolvedValueOnce(undefined);
    
//     render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);
    
//     // Use a more robust way to select and change the role
//     const roleSelect = screen.getByRole('combobox', { name: /role/i });
//     await user.click(roleSelect);
    
//     // Wait for the dropdown to open and then select admin
//     await waitFor(() => {
//       expect(screen.getByText(/admin/i)).toBeInTheDocument();
//     });
    
//     // Click on the Admin option
//     const adminOption = screen.getByText(/admin/i);
//     await user.click(adminOption);
    
//     const submitButton = screen.getByTestId('submit-button');
//     await user.click(submitButton);
    
//     await waitFor(() => {
//       expect(adminUpdateUser).toHaveBeenCalledWith(1, { role: 'admin' });
//     });
    
//     expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('updated successfully'));
//     expect(onCloseMock).toHaveBeenCalled();
//   });

  it('shows toast message when no changes are detected', async () => {
    render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    expect(adminUpdateUser).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('No changes detected.');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('closes form when cancel button is clicked', async () => {
    render(<UserForm userToEdit={mockUser} onClose={onCloseMock} />);
    
    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);
    
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('disables submit button when no user is provided', () => {
    render(<UserForm onClose={onCloseMock} />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
  });
});
