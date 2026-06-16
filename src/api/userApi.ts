import api from './authApi';

export interface ClientUser {
  id: string;
  username: string;
  role: 'client' | 'client_admin';
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  branch_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  branch_ids?: string[];
}

export interface CreateUserResponse {
  id: string;
  username: string;
  password: string;
  role: string;
}

export const userApi = {
  listMyOrgUsers: () =>
    api.get<ClientUser[]>('/b2bclients/my/users').then((res) => res.data),

  createUser: (data: CreateUserRequest) =>
    api.post<CreateUserResponse>('/b2bclients/my/users', data).then((res) => res.data),

  updateRole: (userId: string, role: string) =>
    api.put(`/b2bclients/my/users/${userId}`, { role }).then((res) => res.data),

  deactivateUser: (userId: string) =>
    api.delete(`/b2bclients/my/users/${userId}`).then((res) => res.data),

  setBranches: (userId: string, branchIds: string[]) =>
    api.put(`/b2bclients/my/users/${userId}/branches`, { branch_ids: branchIds }).then((res) => res.data),
};
