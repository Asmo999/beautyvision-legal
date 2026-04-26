import apiClient from './client';
import type { Brand } from '@/types';

export async function listBrands(): Promise<Brand[]> {
  const { data } = await apiClient.get('/admin/brands');
  return data.brands;
}

export async function createBrand(payload: Partial<Brand>): Promise<Brand> {
  const { data } = await apiClient.post('/admin/brands', payload);
  return data.brand;
}

export async function updateBrand(id: string, payload: Partial<Brand>): Promise<Brand> {
  const { data } = await apiClient.patch(`/admin/brands/${id}`, payload);
  return data.brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await apiClient.delete(`/admin/brands/${id}`);
}

export async function uploadBrandImage(id: string, file: File): Promise<Brand> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post(`/admin/brands/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.brand;
}
