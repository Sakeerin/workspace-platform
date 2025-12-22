import { Favorite } from '@prisma/client';

export type FavoriteModel = Favorite;

export interface FavoriteCreateInput {
  userId: bigint;
  pageId: bigint;
  position?: number;
}

export interface FavoriteUpdateInput {
  position?: number;
}

