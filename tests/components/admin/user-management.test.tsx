import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagement } from '@/components/admin/user-management';
import { User, UserRole, UserStatus } from '@/lib/db/schema/users';
import { adminUpdateUser, getAllUsersForAdmin } from '@/lib/users/actions';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/users/actions', () => ({
  adminUpdateUser: jest.fn(),
  getAllUsersForAdmin: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock UserForm component
jest.mock('@/components/admin/user-form', () => ({
  UserForm: jest.fn(({ onClose }) => (
    <div data-testid="mock-user-form">
      <button onClick={onClose} data-testid="close-form-button">
        Close Form
      </button>
    </div>
  )),
}));

// Mock test users
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin1',
    email: 'admin@example.com',
    role: 'admin' as UserRole,
    passwordHash: null,
    status: 'active' as UserStatus,
    profileImageId: null,
    bio: null,
    password_reset_token: null,
    password_reset_expires: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@example.com',
    role: 'user' as UserRole,
    passwordHash: null,
    status: 'active' as UserStatus,
    profileImageId: null,
    bio: null,
    password_reset_token: null,
    password_reset_expires: null,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
  },
  {
    id: 3,
    username: 'suspended1',
    email: 'suspended@example.com',
    role: 'user' as UserRole,
    passwordHash: null,
    status: 'suspended' as UserStatus,
    profileImageId: null,
    bio: null,
    password_reset_token: null,
    password_reset_expires: null,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-01'),
  },
];

describe('UserManagement Component', () => {
  // Set up user event instance
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllUsersForAdmin as jest.Mock).mockResolvedValue({
      users: mockUsers,
      totalUsers: mockUsers.length,
    });
  });

  it('renders the table with initial users', () => {
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );
    
    // Check heading
    expect(screen.getByText('User Management')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check user data in table
    expect(screen.getByText('admin1')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('suspended1')).toBeInTheDocument();
    
    // Check roles and statuses in table - be more specific with queries
    const adminBadges = screen.getAllByText('Admin');
    expect(adminBadges[0]).toBeInTheDocument();

    const userBadges = screen.getAllByText('User');
    expect(userBadges[0]).toBeInTheDocument();

    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges[0]).toBeInTheDocument();

    // Find the suspended status by checking within a table cell that contains the badge
    const tableRows = screen.getAllByRole('row');
    const suspendedUserRow = tableRows.find(row => 
      row.textContent?.includes('suspended1')
    );
    expect(suspendedUserRow).toBeInTheDocument();
    const suspendedBadgeInTable = within(suspendedUserRow as HTMLElement).getByText('Suspended');
    expect(suspendedBadgeInTable).toBeInTheDocument();
  });

  it('fetches users on initial load', async () => {
    render(
      <UserManagement 
        initialUsers={[]} 
        totalUsers={0} 
      />
    );

    // Wait for the component to fetch users
    await waitFor(() => {
      expect(getAllUsersForAdmin).toHaveBeenCalledTimes(1);
    });
    
    // Check that the mock was called with default parameters
    expect(getAllUsersForAdmin).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      pageSize: 10,
      sortOrder: 'desc',
      sortBy: 'createdAt',
    }));
  });

  it('opens edit user form when edit option is clicked', async () => {
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );

    // Click on the edit button dropdown for the first user
    const editButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(editButtons[0]);

    // Click on the Edit option
    const editOption = screen.getByText(/edit/i);
    await user.click(editOption);

    // Check if the UserForm component is rendered
    expect(screen.getByTestId('mock-user-form')).toBeInTheDocument();
  });

  it('shows suspension confirmation dialog when suspend option is clicked', async () => {
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );

    // Click on the edit button dropdown for a user
    const editButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(editButtons[0]);

    // Click on the Suspend option using the data-testid
    const suspendOption = screen.getByTestId('suspend-user-button');
    await user.click(suspendOption);

    // Check if dialog appears
    expect(screen.getByText(/are you sure you want to suspend this user/i)).toBeInTheDocument();
  });

  it('suspends a user when confirmed', async () => {
    (adminUpdateUser as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );

    // Click on the edit button dropdown for a user
    const editButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(editButtons[0]);

    // Click on the Suspend option using the data-testid
    const suspendOption = screen.getByTestId('suspend-user-button');
    await user.click(suspendOption);

    // Confirm the suspension using the data-testid
    const suspendButton = screen.getByTestId('confirm-suspend-button');
    await user.click(suspendButton);

    // Check if adminUpdateUser was called correctly
    await waitFor(() => {
      expect(adminUpdateUser).toHaveBeenCalledWith(mockUsers[0].id, { status: 'suspended' });
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('suspended successfully'));
    });
  });

  it('shows deactivation confirmation dialog when deactivate option is clicked', async () => {
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );

    // Click on the edit button dropdown for a user
    const editButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(editButtons[0]);

    // Click on the Deactivate option
    const deactivateOption = screen.getByText(/deactivate/i);
    await user.click(deactivateOption);

    // Check if dialog appears
    expect(screen.getByText(/are you sure you want to deactivate this user/i)).toBeInTheDocument();
  });

  it('deactivates a user when confirmed', async () => {
    (adminUpdateUser as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );

    // Click on the edit button dropdown for a user
    const editButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(editButtons[0]);

    // Click on the Deactivate option
    const deactivateOption = screen.getByText(/deactivate/i);
    await user.click(deactivateOption);

    // Confirm the deactivation
    const deactivateButton = screen.getByRole('button', { name: /deactivate/i });
    await user.click(deactivateButton);

    // Check if adminUpdateUser was called correctly
    await waitFor(() => {
      expect(adminUpdateUser).toHaveBeenCalledWith(mockUsers[0].id, { status: 'inactive' });
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('deactivated successfully'));
    });
  });

  it('changes page when pagination is clicked', async () => {
    // Mock a larger result set to ensure pagination is rendered
    (getAllUsersForAdmin as jest.Mock).mockImplementation(({ page }) => ({
      users: mockUsers,
      totalUsers: 100 // More than one page
    }));
    
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={100} // More than one page
      />
    );

    // Wait for initial render to complete
    await waitFor(() => {
      expect(getAllUsersForAdmin).toHaveBeenCalled();
    });

    // Clear mock calls from initial render
    (getAllUsersForAdmin as jest.Mock).mockClear();
    
    // Find and click the "Next" button
    const nextButton = screen.getByRole('link', { name: /next/i });
    await user.click(nextButton);

    // Check that getAllUsersForAdmin was called with page 2
    await waitFor(() => {
      expect(getAllUsersForAdmin).toHaveBeenCalled();
      const calls = (getAllUsersForAdmin as jest.Mock).mock.calls;
      const lastCallArgs = calls[calls.length - 1][0];
      expect(lastCallArgs.page).toBe(2);
      expect(lastCallArgs.pageSize).toBe(10);
    });
  });

  it('updates sorting when column header is clicked', async () => {
    render(
      <UserManagement 
        initialUsers={mockUsers} 
        totalUsers={mockUsers.length} 
      />
    );

    // Clear mock to ignore initial load
    (getAllUsersForAdmin as jest.Mock).mockClear();
    
    // Click on the Username column header
    const usernameHeader = screen.getByRole('button', { name: /username/i });
    await user.click(usernameHeader);

    // Check that getAllUsersForAdmin was called with proper sorting
    await waitFor(() => {
      expect(getAllUsersForAdmin).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'username',
        sortOrder: 'asc'
      }));
    });
  });
});
