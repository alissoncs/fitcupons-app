export type AuthProvider = 'google' | 'apple' | 'email';
export type UserRole = 'user' | 'admin';
export type OfferStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'expired'
  | 'archived';
export type OfferSource =
  | 'manual'
  | 'amazon'
  | 'mercado_livre'
  | 'aliexpress'
  | 'telegram'
  | 'whatsapp';
export type DiscountType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_shipping'
  | 'none';
export type RedeemAction = 'view' | 'copy_code' | 'open_link';
export type TokenPurpose = 'email_verification' | 'password_reset';
export type IngestionStatus = 'running' | 'success' | 'failed';
export type MessageChannel = 'telegram' | 'whatsapp';
export type OfferSort = 'recent' | 'discount' | 'popular';
export type AppliedSportFilter = 'preferences' | 'explicit' | 'none';
