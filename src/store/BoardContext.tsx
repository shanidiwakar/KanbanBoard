import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import uuid from 'react-native-uuid';

import {
  BoardCard,
  BoardState,
  BoardMutation,
  MoveCardMutation,
  MoveCardPayload,
  UpdateCardPayload,
} from '../types/board.types';


import {
  getAuth,
} from '@react-native-firebase/auth';

import {
  subscribeToBoardCards,
} from '../services/board.service';

import {
  applyMoveCard,
  boardReducer,
} from './boardReducer';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { processMutationQueue } from '../services/syncManager.service';
import {
  enqueueMutation,
  getMutationQueue,
} from '../services/mutationQueue.service';
import { getBoardCache, saveBoardCache } from '../services/boardCache.service';

interface BoardContextValue {
  state: BoardState;
  isOnline: boolean | null;

  moveCard: (
    payload: MoveCardPayload,
  ) => Promise<void>;
  createCard: (
    title: string,
    description?: string,
  ) => Promise<void>;
  updateCard: (
    cardId: string,
    title: string,
    description?: string,
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
}

const initialState: BoardState = {
  cards: [],

  loading: true,
  initialized: false,

  syncing: false,
  pendingActions: 0,

  error: null,
};

const BoardContext =
  createContext<BoardContextValue | null>(
    null,
  );

export const BoardProvider = ({
  children,
}: PropsWithChildren) => {

  const isOnline = useNetworkStatus();
  const userId = getAuth().currentUser?.uid;

  const processingQueueRef = useRef(false);

  const [queueVersion, setQueueVersion] = useState(0);

  const hydratedRef = useRef(false);

  const [localHydrated, setLocalHydrated] = useState(false);

  useEffect(() => {
    const hydrateLocalBoard =
      async () => {
        try {
          const [
            cache,
            queue,
          ] = await Promise.all([
            userId
              ? getBoardCache(userId)
              : Promise.resolve(null),
            getMutationQueue(),
          ]);

          if (cache) {
            cardsRef.current =
              cache.cards;

            dispatch({
              type: 'SET_CARDS',
              payload: cache.cards,
            });

            console.log(
              '[BOARD] Loaded from cache:',
              cache.cards.length,
            );
          }

          dispatch({
            type:
              'SET_PENDING_ACTIONS',

            payload:
              queue.length,
          });

        } finally {
          hydratedRef.current =
            true;

          setLocalHydrated(true);
        }
      };

    hydrateLocalBoard();
  }, [userId]);

  useEffect(() => {
    const loadQueue = async () => {
      const queue =
        await getMutationQueue();

      dispatch({
        type:
          'SET_PENDING_ACTIONS',

        payload:
          queue.length,
      });
    };

    loadQueue();
  }, []);

  useEffect(() => {
    if (isOnline !== true) {
      return;
    }

    if (processingQueueRef.current) {
      return;
    }

    const processQueue =
      async () => {
        processingQueueRef.current =
          true;

        try {
          const queue =
            await getMutationQueue();

          dispatch({
            type:
              'SET_PENDING_ACTIONS',
            payload: queue.length,
          });

          if (queue.length === 0) {
            return;
          }

          dispatch({
            type: 'SET_SYNCING',
            payload: true,
          });

          const result =
            await processMutationQueue(
              cardsRef.current,
            );

          if (result.error) {
            dispatch({
              type: 'SET_ERROR',
              payload: result.error,
            });
          }

          if (
            result.pendingActions === 0
          ) {
            await saveBoardCache(
              userId!,
              cardsRef.current,
            );
          }

          dispatch({
            type:
              'SET_PENDING_ACTIONS',
            payload:
              result.pendingActions,
          });

        } finally {
          dispatch({
            type: 'SET_SYNCING',
            payload: false,
          });

          processingQueueRef.current =
            false;
        }
      };

    processQueue();
  }, [isOnline, queueVersion, userId]);

  const [state, dispatch] =
    useReducer(
      boardReducer,
      initialState,
    );

  const cardsRef =
    useRef<BoardCard[]>([]);

  useEffect(() => {
    cardsRef.current =
      state.cards;
  }, [state.cards]);

  useEffect(() => {
    console.log(
      '[BOARD] Starting Firestore listener',
    );
    if (!localHydrated) {
      return;
    }
    const unsubscribe =
      subscribeToBoardCards(
        remoteCards => {
          const handleRemoteSnapshot =
            async () => {
              const queue =
                await getMutationQueue();

              /*
               * Pending local mutations exist.
               *
               * Don't let an older Firestore
               * snapshot overwrite our
               * optimistic board.
               */
              if (queue.length > 0) {
                console.log(
                  '[BOARD] Remote snapshot deferred:',
                  queue.length,
                  'pending mutations',
                );

                return;
              }

              cardsRef.current =
                remoteCards;

              dispatch({
                type: 'SET_CARDS',
                payload: remoteCards,
              });

              await saveBoardCache(
                userId!,
                remoteCards,
              );

              console.log(
                '[BOARD] Remote snapshot applied',
              );
            };

          handleRemoteSnapshot();
        },

        error => {
          dispatch({
            type: 'SET_ERROR',
            payload: error.message,
          });

          dispatch({
            type: 'SET_LOADING',
            payload: false,
          });
        },
      );

    return () => {
      console.log(
        '[BOARD] Removing Firestore listener',
      );

      unsubscribe();
    };
  }, [localHydrated, userId]);

  const moveCard = async (
    payload: MoveCardPayload,
  ) => {
    const previousCards =
      cardsRef.current;

    const nextCards =
      applyMoveCard(
        previousCards,
        payload,
      );

    const movedCard =
      nextCards.find(
        card =>
          card.id === payload.cardId,
      );

    if (!movedCard) {
      return;
    }

    /*
     * 1. Optimistic UI
     */
    cardsRef.current =
      nextCards;

    dispatch({
      type: 'MOVE_CARD',
      payload,
    });
    await saveBoardCache(
      userId!,
      nextCards,
    );
    /*
     * 2. Persist mutation
     */
    const mutation: MoveCardMutation = {
      mutationId:
        payload.mutationId,

      type: 'MOVE_CARD',

      payload,

      cardSnapshot:
        movedCard,

      status: 'pending',

      createdAt:
        Date.now(),

      attempts: 0,
    };

    const queue =
      await enqueueMutation(
        mutation,
      );
    setQueueVersion(value => value + 1);

    dispatch({
      type: 'SET_PENDING_ACTIONS',
      payload: queue.length,
    });
  };

  const queueMutation = async (
    mutation: BoardMutation,
    nextCards: BoardCard[],
  ) => {
    cardsRef.current = nextCards;
    await saveBoardCache(userId!, nextCards);

    const queue = await enqueueMutation(mutation);
    setQueueVersion(value => value + 1);
    dispatch({
      type: 'SET_PENDING_ACTIONS',
      payload: queue.length,
    });
  };

  const createCard = async (
    title: string,
    description = '',
  ) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const card: BoardCard = {
      id: uuid.v4().toString(),
      title: trimmedTitle,
      description: description.trim(),
      columnId: 'todo',
      order: cardsRef.current.filter(
        item => item.columnId === 'todo',
      ).length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch({
      type: 'CREATE_CARD',
      payload: {card},
    });

    const nextCards = [...cardsRef.current, card];

    await queueMutation({
      mutationId: uuid.v4().toString(),
      type: 'CREATE_CARD',
      payload: {card},
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
    }, nextCards);
  };

  const updateCard = async (
    cardId: string,
    title: string,
    description = '',
  ) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const payload: UpdateCardPayload = {
      cardId,
      title: trimmedTitle,
      description: description.trim(),
      timestamp: Date.now(),
    };

    dispatch({
      type: 'UPDATE_CARD',
      payload,
    });

    const nextCards = cardsRef.current.map(card =>
      card.id === cardId
        ? {
            ...card,
            title: payload.title,
            description: payload.description,
            updatedAt: payload.timestamp,
          }
        : card,
    );

    await queueMutation({
      mutationId: uuid.v4().toString(),
      type: 'UPDATE_CARD',
      payload,
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
    }, nextCards);
  };

  const deleteCard = async (cardId: string) => {
    dispatch({
      type: 'DELETE_CARD',
      payload: {cardId},
    });

    const nextCards = cardsRef.current.filter(
      card => card.id !== cardId,
    );

    await queueMutation({
      mutationId: uuid.v4().toString(),
      type: 'DELETE_CARD',
      payload: {cardId},
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
    }, nextCards);
  };

  return (
    <BoardContext.Provider
      value={{
        state,
        moveCard,
        createCard,
        updateCard,
        deleteCard,
        isOnline,
      }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoardStore = () => {
  const context =
    useContext(BoardContext);

  if (!context) {
    throw new Error(
      'useBoardStore must be used inside BoardProvider',
    );
  }

  return context;
};