import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Building2,
  Plus,
  Check,
  X,
  Pencil,
  Star,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { branchApi, Branch, CreateBranchRequest, UpdateBranchRequest } from '@/api/branchApi';

const BranchManagement: React.FC = () => {
  const { branches, refreshBranches } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmBranch, setDeleteConfirmBranch] = useState<Branch | null>(null);

  const activeBranches = branches.filter(b => b.is_active);

  // ── Add branch ──
  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Branch name is required');
      return;
    }
    setIsSaving(true);
    try {
      const data: CreateBranchRequest = {
        branch_name: name,
        is_default: activeBranches.length === 0,
      };
      await branchApi.createBranch(data);
      toast.success(`${name} added`);
      setNewName('');
      setIsAdding(false);
      await refreshBranches();
    } catch (error: any) {
      toast.error('Failed to create branch', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Rename branch ──
  const startEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditName(branch.branch_name);
  };

  const handleRename = async (branch: Branch) => {
    const name = editName.trim();
    if (!name) {
      toast.error('Branch name is required');
      return;
    }
    if (name === branch.branch_name) {
      setEditingId(null);
      return;
    }
    setIsSaving(true);
    try {
      const data: UpdateBranchRequest = { branch_name: name };
      await branchApi.updateBranch(branch.id, data);
      toast.success('Branch renamed');
      setEditingId(null);
      await refreshBranches();
    } catch (error: any) {
      toast.error('Failed to rename', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Set default ──
  const handleSetDefault = async (branch: Branch) => {
    try {
      await branchApi.setDefaultBranch(branch.id);
      toast.success(`${branch.branch_name} is now default`);
      await refreshBranches();
    } catch (error: any) {
      toast.error('Failed to set default', {
        description: error.response?.data?.error || error.message,
      });
    }
  };

  // ── Delete ──
  const handleDelete = async (branch: Branch) => {
    try {
      await branchApi.deleteBranch(branch.id);
      toast.success(`${branch.branch_name} deleted`);
      setDeleteConfirmBranch(null);
      await refreshBranches();
    } catch (error: any) {
      toast.error('Failed to delete branch', {
        description: error.response?.data?.error || error.message,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold font-playfair text-foreground">Branches</h1>
            <p className="text-xs text-muted-foreground font-rubik">
              {activeBranches.length} branch{activeBranches.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Branch
          </Button>
        )}
      </div>

      {/* Add branch inline */}
      {isAdding && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
            }}
            placeholder="Branch name"
            className="h-9 flex-1"
            autoFocus
            disabled={isSaving}
          />
          <Button size="sm" onClick={handleAdd} disabled={isSaving || !newName.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setIsAdding(false); setNewName(''); }}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Table */}
      {activeBranches.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">#</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeBranches.map((branch, idx) => (
                <tr key={branch.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    {editingId === branch.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(branch);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="h-8 max-w-[240px]"
                          autoFocus
                          disabled={isSaving}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-green-600"
                          onClick={() => handleRename(branch)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditingId(null)}
                          disabled={isSaving}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{branch.branch_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {branch.is_default ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {editingId !== branch.id && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => startEdit(branch)}
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!branch.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleSetDefault(branch)}
                            title="Set as default"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!branch.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmBranch(branch)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !isAdding ? (
        <div className="text-center py-12 text-sm text-muted-foreground border rounded-lg">
          No branches yet. Click "Add Branch" to create your first one.
        </div>
      ) : null}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmBranch}
        onOpenChange={(open) => { if (!open) setDeleteConfirmBranch(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmBranch?.branch_name}"? This action
              cannot be undone. Orders linked to this branch will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmBranch && handleDelete(deleteConfirmBranch)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BranchManagement;
