import apiClient from './client';
import type { Order } from '@/types';

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listOrders(params: ListParams = {}): Promise<ListResponse> {
  const { data } = await apiClient.get('/admin/orders', { params });
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get(`/admin/orders/${id}`);
  return data.order;
}

export async function updateOrderStatus(id: string, status: string, note?: string): Promise<Order> {
  const { data } = await apiClient.patch(`/admin/orders/${id}/status`, { status, note });
  return data.order;
}

export async function refundOrder(id: string, note?: string): Promise<Order> {
  const { data } = await apiClient.post(`/admin/orders/${id}/refund`, { note });
  return data.order;
}
