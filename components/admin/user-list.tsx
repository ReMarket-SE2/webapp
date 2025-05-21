'use client';

import { User } from '@/lib/db/schema/users';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserX, Search, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void; // Will mark as inactive
  onSuspend: (user: User) => void; // Will toggle suspend/active
}

export function UserList({ users, onEdit, onDelete, onSuspend }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter(user => 
      String(user.id).toLowerCase().includes(lowerSearchTerm) || // Convert id to string for searching
      user.username.toLowerCase().includes(lowerSearchTerm) ||
      (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
    );
  }, [users, searchTerm]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Search by ID, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            data-testid="user-search-input"
          />
        </div>

        {filteredUsers.length === 0 && searchTerm && (
          <p className="text-center text-muted-foreground">No users match your search.</p>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell className="font-mono text-xs truncate max-w-[200px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{user.id}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === 'active' ? 'default' : user.status === 'suspended' ? 'secondary' : 'outline' } 
                      className={`capitalize ${user.status === 'suspended' ? 'bg-yellow-500 text-white' : user.status === 'inactive' ? 'bg-red-700 text-white' : ''}`}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(user)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit {user.username}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit User</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${user.status === 'suspended' 
                            ? "text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-700/20" 
                            : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-700/20"}`}
                          onClick={() => onSuspend(user)}
                          disabled={user.status === 'inactive'} // Cannot suspend/reactivate inactive user
                          data-testid={`suspend-user-${user.id}`}
                        >
                          {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          <span className="sr-only">{user.status === 'suspended' ? 'Reactivate' : 'Suspend'} {user.username}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(user)}
                          disabled={user.status === 'inactive'} // Cannot delete (mark inactive) already inactive user
                          data-testid={`delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {user.username} (Mark Inactive)</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark Inactive</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredUsers.length === 0 && !searchTerm && (
           <p className="text-center text-muted-foreground py-4">No users available.</p>
        )}
      </div>
    </TooltipProvider>
  );
}
