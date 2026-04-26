import apiClient from './client';
import type { AuthUser, MeUser } from '@/types';

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function getMe(): Promise<MeUser> {
  const { data } = await apiClient.get('/auth/me');
  return data.user;
}
