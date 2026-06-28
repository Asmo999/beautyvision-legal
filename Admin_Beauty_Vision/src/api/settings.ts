import apiClient from './client';

export interface AdminSettings {
  deliveryFee: number;
  freeDeliveryDays: number;
  orderNotificationRecipients: string[];
  minIosVersion: string;
  minAndroidVersion: string;
  iosStoreUrl: string;
  androidStoreUrl: string;
  updatedAt: string | null;
}

export async function getSettings(): Promise<AdminSettings> {
  const { data } = await apiClient.get<{ settings: AdminSettings }>('/admin/settings');
  return data.settings;
}

export async function updateSettings(payload: Partial<Omit<AdminSettings, 'updatedAt'>>): Promise<AdminSettings> {
  const { data } = await apiClient.patch<{ settings: AdminSettings }>('/admin/settings', payload);
  return data.settings;
}
