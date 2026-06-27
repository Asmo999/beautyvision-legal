import apiClient from './client';

export interface LoyaltyResetStatus {
  currentYear: number;
  lastSweepYear: number;
  /** True once a new year has started and the all-users tier sweep hasn't run for it. */
  resetPending: boolean;
  /** True when the once-a-year gate is bypassed via env (test mode) — button always shown. */
  bypassGate: boolean;
}

export async function getLoyaltyResetStatus(): Promise<LoyaltyResetStatus> {
  const { data } = await apiClient.get<LoyaltyResetStatus>('/admin/loyalty/status');
  return data;
}

export async function runLoyaltyReset(): Promise<{ processed: number; year: number }> {
  const { data } = await apiClient.post<{ processed: number; year: number }>('/admin/loyalty/recompute');
  return data;
}
