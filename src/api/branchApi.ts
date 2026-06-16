import api from './authApi';

// Types
export interface Branch {
  id: string;
  client_id: string;
  branch_name: string;
  branch_code?: string;
  address_id?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  address?: {
    id: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
}

export interface CreateBranchRequest {
  branch_name: string;
  branch_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  is_default?: boolean;
  address?: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
}

export interface UpdateBranchRequest {
  branch_name?: string;
  branch_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  is_default?: boolean;
  is_active?: boolean;
  address?: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
}

// Client Branch API (uses /b2bclients/my/branches endpoints)
export const branchApi = {
  // List all branches for the current client
  listBranches: async (): Promise<Branch[]> => {
    try {
      const response = await api.get('/b2bclients/my/branches');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      return [];
    }
  },

  // Create a new branch
  createBranch: async (data: CreateBranchRequest): Promise<Branch | null> => {
    try {
      const response = await api.post('/b2bclients/my/branches', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create branch:', error);
      throw error;
    }
  },

  // Update a branch
  updateBranch: async (branchId: string, data: UpdateBranchRequest): Promise<Branch | null> => {
    try {
      const response = await api.put(`/b2bclients/my/branches/${branchId}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update branch:', error);
      throw error;
    }
  },

  // Delete a branch
  deleteBranch: async (branchId: string): Promise<boolean> => {
    try {
      await api.delete(`/b2bclients/my/branches/${branchId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete branch:', error);
      throw error;
    }
  },

  // Set a branch as default
  setDefaultBranch: async (branchId: string): Promise<boolean> => {
    try {
      await api.put(`/b2bclients/my/branches/${branchId}/default`);
      return true;
    } catch (error) {
      console.error('Failed to set default branch:', error);
      throw error;
    }
  },

  // Reorder branches (pass branch IDs in desired order)
  reorderBranches: async (branchIds: string[]): Promise<Branch[]> => {
    try {
      const response = await api.put('/b2bclients/my/branches/reorder', { branch_ids: branchIds });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to reorder branches:', error);
      throw error;
    }
  },
};
