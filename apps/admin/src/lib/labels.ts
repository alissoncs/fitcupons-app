import type { OfferSource, OfferStatus } from '@fitcupons/shared';

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Em revisão',
  published: 'Publicada',
  expired: 'Expirada',
  archived: 'Arquivada',
};

export const OFFER_SOURCE_LABEL: Record<OfferSource, string> = {
  manual: 'Manual',
  amazon: 'Amazon',
  mercado_livre: 'Mercado Livre',
  aliexpress: 'AliExpress',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};
