import { API_URL } from './config';
import { probeApi } from './errors';
import { adminFetch } from './auth';
import {
  mockCategories,
  mockIngestionRuns,
  mockOffers,
  mockSports,
  mockStats,
  mockStores,
  mockUsers,
  type AdminOffer,
  type AdminStore,
  type AdminUser,
} from './mocks';
import type { Category, IngestionRun, Sport } from '@fitcupons/shared';

export async function isLiveApi(): Promise<boolean> {
  return probeApi(API_URL);
}

export async function listOffers(): Promise<AdminOffer[]> {
  if (!(await isLiveApi())) return mockOffers;
  const data = await adminFetch<{ items: AdminOffer[] }>('/admin/offers?limit=50');
  return data.items;
}

export async function getOffer(id: string): Promise<AdminOffer | null> {
  if (!(await isLiveApi())) {
    return mockOffers.find((o) => o.id === id) ?? null;
  }
  try {
    return await adminFetch<AdminOffer>(`/admin/offers/${id}`);
  } catch {
    return null;
  }
}

export async function listStores(): Promise<AdminStore[]> {
  if (!(await isLiveApi())) return mockStores;
  return adminFetch<AdminStore[]>('/admin/stores');
}

export async function listSports(): Promise<Sport[]> {
  if (!(await isLiveApi())) return mockSports;
  return adminFetch<Sport[]>('/admin/sports');
}

export async function listCategories(): Promise<Category[]> {
  if (!(await isLiveApi())) return mockCategories;
  return adminFetch<Category[]>('/admin/categories');
}

export async function listModeration(): Promise<AdminOffer[]> {
  if (!(await isLiveApi())) {
    return mockOffers.filter((o) => o.status === 'pending_review');
  }
  const data = await adminFetch<{ items: AdminOffer[] }>('/admin/moderation');
  return data.items;
}

export async function listUsers(): Promise<AdminUser[]> {
  if (!(await isLiveApi())) return mockUsers;
  const data = await adminFetch<{ items: AdminUser[] }>('/admin/users');
  return data.items;
}

export async function listIngestion(): Promise<IngestionRun[]> {
  if (!(await isLiveApi())) return mockIngestionRuns;
  const data = await adminFetch<{ items: IngestionRun[] }>('/admin/ingestion-runs');
  return data.items;
}

export async function getStats() {
  if (!(await isLiveApi())) return mockStats;
  return adminFetch<typeof mockStats>('/admin/stats');
}

export async function dataSourceLabel(): Promise<'api' | 'mock'> {
  return (await isLiveApi()) ? 'api' : 'mock';
}
