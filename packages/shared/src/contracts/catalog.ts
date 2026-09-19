import type { SportSummary } from './auth';

export type Sport = SportSummary & {
  sortOrder: number;
  active: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  iconName: string | null;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  children: Category[];
};

export type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  active: boolean;
};
