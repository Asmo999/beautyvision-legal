import apiClient from './client';
import type { Category } from '@/types';

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get('/admin/categories');
  return data.categories;
}

export async function createCategory(payload: Partial<Category>): Promise<Category> {
  const { data } = await apiClient.post('/admin/categories', payload);
  return data.category;
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const { data } = await apiClient.patch(`/admin/categories/${id}`, payload);
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/admin/categories/${id}`);
}

export async function uploadCategoryImage(id: string, file: File): Promise<Category> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post(`/admin/categories/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.category;
}
