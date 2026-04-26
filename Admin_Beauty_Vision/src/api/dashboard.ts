import apiClient from './client';
import type { DashboardStats } from '@/types';

export async function getStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get('/admin/dashboard/stats');
  return data;
}
