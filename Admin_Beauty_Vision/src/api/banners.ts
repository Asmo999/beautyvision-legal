import apiClient from './client';
import type { Banner } from '@/types';

export async function listBanners(): Promise<Banner[]> {
  const { data } = await apiClient.get('/admin/banners');
  return data.banners;
}

export async function getBanner(id: string): Promise<Banner> {
  const { data } = await apiClient.get(`/admin/banners/${id}`);
  return data.banner;
}

export async function createBanner(payload: Partial<Banner>): Promise<Banner> {
  const { data } = await apiClient.post('/admin/banners', payload);
  return data.banner;
}

export async function updateBanner(id: string, payload: Partial<Banner>): Promise<Banner> {
  const { data } = await apiClient.patch(`/admin/banners/${id}`, payload);
  return data.banner;
}

export async function deleteBanner(id: string): Promise<void> {
  await apiClient.delete(`/admin/banners/${id}`);
}

export async function uploadBannerImage(id: string, file: File): Promise<Banner> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post(`/admin/banners/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.banner;
}

export async function deleteBannerImage(id: string): Promise<Banner> {
  const { data } = await apiClient.delete(`/admin/banners/${id}/image`);
  return data.banner;
}
