import apiClient from './client';
import type { Product } from '@/types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  tag?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listProducts(params: ListParams = {}): Promise<ListResponse> {
  const { data } = await apiClient.get('/admin/products', { params });
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get(`/admin/products/${id}`);
  return data.product;
}

export async function createProduct(payload: Record<string, unknown>): Promise<Product> {
  const { data } = await apiClient.post('/admin/products', payload);
  return data.product;
}

export async function updateProduct(id: string, payload: Record<string, unknown>): Promise<Product> {
  const { data } = await apiClient.patch(`/admin/products/${id}`, payload);
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/admin/products/${id}`);
}

export async function uploadProductImages(id: string, files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  const { data } = await apiClient.post(`/admin/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.images;
}

export async function deleteProductImage(id: string, url: string): Promise<string[]> {
  const { data } = await apiClient.delete(`/admin/products/${id}/images`, { data: { url } });
  return data.images;
}
