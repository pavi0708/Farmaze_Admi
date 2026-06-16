import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users as UsersIcon, Plus, Shield, ShieldCheck, UserX, Loader2, Copy, Eye, EyeOff, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { userApi, ClientUser, CreateUserRequest } from '@/api/userApi';

const Users: React.FC = () => {
  const { branches } = useAuth();
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<ClientUser | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<ClientUser | null>(null);
  const [newRole, setNewRole] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branchUser, setBranchUser] = useState<ClientUser | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'client' as string,
    first_name: '',
    last_name: '',
    email: '',
    branch_ids: [] as string[],
  });

  const loadUsers = useCallback(async () => {
    try {
      const data = await userApi.listMyOrgUsers();
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to load users', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password }));
  };

  const handleAddUser = async () => {
    if (!form.username || form.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const req: CreateUserRequest = {
        username: form.username,
        password: form.password,
        role: form.role,
        branch_ids: form.branch_ids.length > 0 ? form.branch_ids : undefined,
      };
      if (form.first_name) req.first_name = form.first_name;
      if (form.last_name) req.last_name = form.last_name;
      if (form.email) req.email = form.email;

      const result = await userApi.createUser(req);
      toast.success(`User "${result.username}" created`);
      setCreatedPassword(result.password);
      setShowPassword(true);
      setForm({ username: '', password: '', role: 'client', first_name: '', last_name: '', email: '', branch_ids: [] });
      setIsAddOpen(false);
      await loadUsers();
    } catch (error: any) {
      toast.error('Failed to create user', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editRoleUser || !newRole) return;
    setIsSaving(true);
    try {
      await userApi.updateRole(editRoleUser.id, newRole);
      toast.success(`Role updated to ${newRole === 'client_admin' ? 'Admin' : 'User'}`);
      setEditRoleUser(null);
      setNewRole('');
      await loadUsers();
    } catch (error: any) {
      toast.error('Failed to update role', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    setIsSaving(true);
    try {
      await userApi.deactivateUser(deactivateUser.id);
      toast.success(`User "${deactivateUser.username}" deactivated`);
      setDeactivateUser(null);
      await loadUsers();
    } catch (error: any) {
      toast.error('Failed to deactivate user', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranches = async () => {
    if (!branchUser) return;
    setIsSaving(true);
    try {
      await userApi.setBranches(branchUser.id, selectedBranchIds);
      toast.success('Branch access updated');
      setBranchUser(null);
      await loadUsers();
    } catch (error: any) {
      toast.error('Failed to update branches', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const branchNameMap = new Map(branches.map((b) => [b.id, b.branch_name]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Team Members</h1>
          <Badge variant="secondary">{users.filter((u) => u.is_active).length} active</Badge>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {createdPassword && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">New user created! Share these credentials:</p>
            <p className="text-sm text-green-700 mt-1 font-mono">
              Password: {showPassword ? createdPassword : '••••••••••••'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(createdPassword)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCreatedPassword('')}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No team members yet</p>
          <p className="text-sm mt-1">Add your first user to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, idx) => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'client_admin' ? 'default' : 'secondary'} className="gap-1">
                      {user.role === 'client_admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                      {user.role === 'client_admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === 'client_admin' ? (
                      <span className="text-xs text-muted-foreground">All branches</span>
                    ) : user.branch_ids?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.branch_ids.map((bid) => (
                          <Badge key={bid} variant="outline" className="text-xs">
                            {branchNameMap.get(bid) || bid.slice(0, 8)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-destructive">No branches</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {user.is_active && (
                      <div className="flex justify-end gap-1">
                        {user.role !== 'client_admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBranchUser(user);
                              setSelectedBranchIds(user.branch_ids || []);
                            }}
                          >
                            <GitBranch className="h-4 w-4 mr-1" />
                            Branches
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditRoleUser(user);
                            setNewRole(user.role === 'client_admin' ? 'client' : 'client_admin');
                          }}
                        >
                          Change Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeactivateUser(user)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Create a new user for your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="e.g. john_branch1"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">User</SelectItem>
                    <SelectItem value="client_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
                <Button variant="outline" type="button" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            {form.role === 'client' && branches.length > 0 && (
              <div className="space-y-2">
                <Label>Branch Access</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {branches.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.branch_ids.includes(branch.id)}
                        onCheckedChange={(checked) => {
                          setForm((p) => ({
                            ...p,
                            branch_ids: checked
                              ? [...p.branch_ids, branch.id]
                              : p.branch_ids.filter((id) => id !== branch.id),
                          }));
                        }}
                      />
                      {branch.branch_name}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users can only see data for their assigned branches.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Assignment Dialog */}
      <Dialog open={!!branchUser} onOpenChange={(open) => !open && setBranchUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Branch Access — {branchUser?.username}</DialogTitle>
            <DialogDescription>Select which branches this user can access.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
            {branches.map((branch) => (
              <label key={branch.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedBranchIds.includes(branch.id)}
                  onCheckedChange={(checked) => {
                    setSelectedBranchIds((prev) =>
                      checked ? [...prev, branch.id] : prev.filter((id) => id !== branch.id)
                    );
                  }}
                />
                {branch.branch_name}
                {branch.is_default && <Badge variant="outline" className="text-xs ml-1">Default</Badge>}
              </label>
            ))}
          </div>
          {selectedBranchIds.length === 0 && (
            <p className="text-xs text-destructive">User will have no branch access.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchUser(null)}>Cancel</Button>
            <Button onClick={handleSaveBranches} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <AlertDialog open={!!editRoleUser} onOpenChange={(open) => !open && setEditRoleUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change <strong>{editRoleUser?.username}</strong>'s role from{' '}
              <strong>{editRoleUser?.role === 'client_admin' ? 'Admin' : 'User'}</strong> to{' '}
              <strong>{newRole === 'client_admin' ? 'Admin' : 'User'}</strong>?
              {newRole === 'client_admin' && ' Admins can manage team members and access all branches.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateRole} disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateUser} onOpenChange={(open) => !open && setDeactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{deactivateUser?.username}</strong>? They will no longer be
              able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
