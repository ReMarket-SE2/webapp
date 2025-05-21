'use client';

import { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/db/schema';
import { UserRole, UserStatus } from '@/lib/db/schema/users'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, Edit3, Trash2, Ban } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { adminUpdateUser, getAllUsersForAdmin } from '@/lib/users/actions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { UserForm } from './user-form'; // To be created

interface UserManagementProps {
  initialUsers: User[];
  totalUsers: number;
}

const USER_STATUS_MAP: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

const USER_ROLE_MAP: Record<UserRole, string> = {
  admin: 'Admin',
  user: 'User',
};

export function UserManagement({ initialUsers, totalUsers: initialTotalUsers }: UserManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [totalUsers, setTotalUsers] = useState(initialTotalUsers);
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<User | null>(null); // For 'inactive' status
  const [isSuspendingUser, setIsSuspendingUser] = useState<User | null>(null); // For 'suspended' status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize') || '10', 10));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');


  const fetchUsers = async () => {
    setIsSubmitting(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('pageSize', pageSize.toString());
      if (searchTerm) params.set('searchTerm', searchTerm);
      params.set('sortOrder', sortOrder);
      params.set('sortBy', sortBy);
      
      router.replace(`${pathname}?${params.toString()}`);

      const result = await getAllUsersForAdmin({ 
        page: currentPage, 
        pageSize, 
        searchTerm: searchTerm || undefined,
        sortOrder,
        sortBy: sortBy as any, // Cast because AdminUserListOptions sortBy is more specific
      });
      setUsers(result.users);
      setTotalUsers(result.totalUsers);
    } catch (error) {
      toast.error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchTerm, sortOrder, sortBy]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchUsers();
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handleUpdateStatus = async (user: User, status: UserStatus, actionVerb: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await adminUpdateUser(user.id, { status });
      toast.success(`User "${user.username}" ${actionVerb} successfully`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${actionVerb.toLowerCase()} user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setIsDeletingUser(null);
      setIsSuspendingUser(null);
    }
  };

  const handleDelete = () => {
    if (isDeletingUser) {
      handleUpdateStatus(isDeletingUser, 'inactive', 'deactivated');
    }
  };

  const handleSuspend = () => {
    if (isSuspendingUser) {
      handleUpdateStatus(isSuspendingUser, 'suspended', 'suspended');
    }
  };
  
  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl">User Management</CardTitle>
          <CardDescription>Manage user accounts, roles, and statuses.</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
          <Input 
            placeholder="Search by ID, Username, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </form>

        {isSubmitting && users.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">No users found matching your criteria.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                        {USER_ROLE_MAP[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {USER_STATUS_MAP[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setIsEditingUser(user)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {user.status !== 'suspended' && (
                            <DropdownMenuItem onClick={() => setIsSuspendingUser(user)}>
                              <Ban className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                          )}
                           {user.status === 'suspended' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'active', 'unsuspended')}>
                              <Ban className="mr-2 h-4 w-4" /> Unsuspend
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'inactive' && (
                            <DropdownMenuItem onClick={() => setIsDeletingUser(user)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                            </DropdownMenuItem>
                          )}
                           {user.status === 'inactive' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'active', 'reactivated')}>
                              <Trash2 className="mr-2 h-4 w-4" /> Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>

      {/* Edit User Modal */}
      {isEditingUser && (
        <UserForm
          userToEdit={isEditingUser}
          onClose={() => {
            setIsEditingUser(null);
            fetchUsers(); // Refresh list after edit
          }}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!isDeletingUser} onOpenChange={(open: boolean) => !open && setIsDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to deactivate this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the user as inactive. They will not be able to log in. This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={!!isSuspendingUser} onOpenChange={(open: boolean) => !open && setIsSuspendingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to suspend this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the user as suspended. They will not be able to log in or perform most actions. This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspend}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Suspending...' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
