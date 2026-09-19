import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  me: ['me'] as const,
  sports: ['sports'] as const,
  categories: ['categories'] as const,
  stores: ['stores'] as const,
  offers: (filters: unknown) => ['offers', filters] as const,
  offer: (slug: string) => ['offer', slug] as const,
  newCount: (filters: unknown) => ['offers-new-count', filters] as const,
  favorites: ['favorites'] as const,
  favoritesBadge: ['favorites', 'badge'] as const,
  redeems: ['redeems'] as const,
};
