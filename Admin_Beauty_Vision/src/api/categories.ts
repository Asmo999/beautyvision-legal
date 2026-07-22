import apiClient from './client';
import type { Category, CategoryBrandDisplay } from '@/types';

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get('/admin/categories');
  return data.categories;
}

export async function listCategoryBrands(
  categoryId: string,
): Promise<{ category: Category; brands: CategoryBrandDisplay[] }> {
  const { data } = await apiClient.get(`/admin/categories/${categoryId}/brands`);
  return data;
}

export async function updateCategoryBrandPriorities(
  categoryId: string,
  priorities: { brand: string; priority: number }[],
): Promise<void> {
  await apiClient.put(`/admin/categories/${categoryId}/brand-priorities`, { priorities });
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
