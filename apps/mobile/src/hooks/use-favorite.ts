import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { FavoriteListResponse, OfferDetail, OfferFeedResponse, OfferListItem } from '@fitcupons/shared';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { showToast } from '@/store/toast';

function patchList(items: OfferListItem[] | undefined, id: string, isFavorite: boolean) {
  return items?.map((item) => (item.id === id ? { ...item, isFavorite } : item));
}

export function useFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (next) await api.favorite(id);
      else await api.unfavorite(id);
    },
    onMutate: async ({ id, next }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await queryClient.cancelQueries({ queryKey: ['offers'] });
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites });
      await queryClient.cancelQueries({ queryKey: ['offer'] });

      const previousOffers = queryClient.getQueriesData({ queryKey: ['offers'] });
      const previousFavorites = queryClient.getQueryData(queryKeys.favorites);
      const previousDetails = queryClient.getQueriesData({ queryKey: ['offer'] });

      queryClient.setQueriesData({ queryKey: ['offers'] }, (current: unknown) => {
        if (!current || typeof current !== 'object' || !('pages' in current)) return current;
        const infinite = current as { pages: OfferFeedResponse[]; pageParams: unknown[] };
        return {
          ...infinite,
          pages: infinite.pages.map((page) => ({
            ...page,
            items: patchList(page.items, id, next) ?? page.items,
          })),
        };
      });

      queryClient.setQueriesData({ queryKey: ['offer'] }, (current: unknown) => {
        if (!current || typeof current !== 'object' || !('id' in current)) return current;
        const detail = current as OfferDetail;
        return detail.id === id ? { ...detail, isFavorite: next } : current;
      });

      queryClient.setQueryData(queryKeys.favorites, (current: unknown) => current);

      return { previousOffers, previousFavorites, previousDetails };
    },
    onError: (_error, _vars, context) => {
      context?.previousOffers.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousDetails.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousFavorites) queryClient.setQueryData(queryKeys.favorites, context.previousFavorites);
      showToast('Não deu para salvar. Tente de novo.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      void queryClient.invalidateQueries({ queryKey: queryKeys.favoritesBadge });
    },
  });
}

export function favoriteTotal(data: FavoriteListResponse | undefined): number {
  return data?.total ?? 0;
}
