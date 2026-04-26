import apiClient from './client';
import type { AdminUser, BonusTransaction } from '@/types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listUsers(params: ListParams = {}): Promise<ListResponse> {
  const { data } = await apiClient.get('/admin/users', { params });
  return data;
}

export async function getUser(id: string): Promise<{ user: AdminUser & { cashbackRate: number }; transactions: BonusTransaction[] }> {
  const { data } = await apiClient.get(`/admin/users/${id}`);
  return data;
}

export async function updateUser(id: string, payload: Record<string, unknown>): Promise<AdminUser> {
  const { data } = await apiClient.patch(`/admin/users/${id}`, payload);
  return data.user;
}

export async function changeRole(id: string, role: string): Promise<AdminUser> {
  const { data } = await apiClient.patch(`/admin/users/${id}/role`, { role });
  return data.user;
}

export async function adjustBonus(id: string, points: number, description: string): Promise<{ user: AdminUser; bonusPoints: number }> {
  const { data } = await apiClient.post(`/admin/users/${id}/bonus`, { points, description });
  return data;
}

export async function toggleVerification(id: string): Promise<{ user: AdminUser; isVerified: boolean }> {
  const { data } = await apiClient.patch(`/admin/users/${id}/verify`);
  return data;
}
