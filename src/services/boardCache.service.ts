import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BoardCard,
} from '../types/board.types';

const getBoardCacheKey = (
  userId: string,
) =>
  `@trello_board_cache_${userId}`;

export interface BoardCache {
  cards: BoardCard[];
  savedAt: number;
}

export const saveBoardCache = async (
  userId: string,
  cards: BoardCard[],
) => {
  const cache: BoardCache = {
    cards,
    savedAt: Date.now(),
  };

  await AsyncStorage.setItem(
    getBoardCacheKey(userId),
    JSON.stringify(cache),
  );
};

export const getBoardCache = async (
  userId: string,
): Promise<BoardCache | null> => {
  const value =
    await AsyncStorage.getItem(
      getBoardCacheKey(userId),
    );

  if (!value) {
    return null;
  }

  return JSON.parse(value);
};

export const clearBoardCache =
  async (userId: string) => {
    await AsyncStorage.removeItem(
      getBoardCacheKey(userId),
    );
  };