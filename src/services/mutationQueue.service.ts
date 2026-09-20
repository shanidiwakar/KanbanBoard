import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BoardMutation,
  MutationStatus,
} from '../types/board.types';

const QUEUE_KEY =
  '@trello_board_mutation_queue';

export const getMutationQueue =
  async (): Promise<BoardMutation[]> => {
    try {
      const value =
        await AsyncStorage.getItem(
          QUEUE_KEY,
        );

      if (!value) {
        return [];
      }

      return JSON.parse(value);
    } catch (error) {
      console.log(
        '[QUEUE] Read error:',
        error,
      );

      return [];
    }
  };

export const saveMutationQueue =
  async (
    queue: BoardMutation[],
  ) => {
    await AsyncStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(queue),
    );
  };

export const enqueueMutation =
  async (
    mutation: BoardMutation,
  ) => {
    const queue =
      await getMutationQueue();

    queue.push(mutation);

    await saveMutationQueue(queue);

    console.log(
      '[QUEUE] Added:',
      mutation.mutationId,
    );

    return queue;
  };

export const removeMutation =
  async (
    mutationId: string,
  ) => {
    const queue =
      await getMutationQueue();

    const nextQueue =
      queue.filter(
        item =>
          item.mutationId !==
          mutationId,
      );

    await saveMutationQueue(
      nextQueue,
    );

    console.log(
      '[QUEUE] Removed:',
      mutationId,
    );

    return nextQueue;
  };

export const updateMutation =
  async (
    mutationId: string,
    updates: {
      status?: MutationStatus;
      attempts?: number;
      error?: string;
    },
  ) => {
    const queue = await getMutationQueue();
    const nextQueue = queue.map(mutation =>
      mutation.mutationId === mutationId
        ? {...mutation, ...updates}
        : mutation,
    );

    await saveMutationQueue(nextQueue);
    return nextQueue;
  };