import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import {
  BoardMutation,
  BoardCard,
  MoveCardPayload,
} from '../types/board.types';

import { INITIAL_CARDS } from '../screens/board/board.mock';

const db = getFirestore();

export const BOARD_ID = 'demo-board';

const getBoardRef = () => {
  return doc(
    db,
    'boards',
    BOARD_ID,
  );
};

const getCardsRef = () => {
  return collection(
    getBoardRef(),
    'cards',
  );
};

export const createBoardIfNeeded =
  async (userId: string) => {
    const boardRef = getBoardRef();

    await setDoc(
      boardRef,
      {
        name: 'Project Board',
        updatedBy: userId,
      },
      {
        merge: true,
      },
    );
  };

export const seedBoardCards = async (
  userId: string,
) => {
  const boardRef = doc(
    db,
    'boards',
    BOARD_ID,
  );

  const cardsRef = collection(
    boardRef,
    'cards',
  );

  const batch = writeBatch(db);

  INITIAL_CARDS.forEach(card => {
    const cardRef = doc(
      cardsRef,
      card.id,
    );

    batch.set(cardRef, {
      ...card,

      updatedBy: userId,

      lastMutationId: 'initial-seed',
    });
  });

  await batch.commit();

  console.log(
    '[FIRESTORE] Cards seeded successfully',
  );
};

export const subscribeToBoardCards = (
  onCardsChanged: (
    cards: BoardCard[],
  ) => void,

  onError?: (
    error: Error,
  ) => void,
) => {
  const cardsRef = getCardsRef();

  const unsubscribe = onSnapshot(
    cardsRef,

    snapshot => {
      const cards: BoardCard[] =
        snapshot.docs.map(item => {
          const data = item.data();

          return {
            id: item.id,

            title: data.title,

            description:
              data.description,

            columnId:
              data.columnId,

            order:
              data.order ?? 0,

            createdAt:
              data.createdAt ?? 0,

            updatedAt:
              data.updatedAt ?? 0,

            updatedBy:
              data.updatedBy,

            lastMutationId:
              data.lastMutationId,
          } as BoardCard;
        });

      console.log(
        '[FIRESTORE SNAPSHOT]',
        cards.length,
      );

      onCardsChanged(cards);
    },

    error => {
      console.log(
        '[FIRESTORE SNAPSHOT ERROR]',
        error,
      );

      onError?.(error);
    },
  );

  return unsubscribe;
};

export const syncMovedCards = async (
  cards: BoardCard[],
  mutation: MoveCardPayload,
  userId: string,
) => {
  const batch = writeBatch(db);

  cards.forEach(card => {
    const cardRef = doc(
      getCardsRef(),
      card.id,
    );

    batch.set(
      cardRef,
      {
        title: card.title,
        description:
          card.description ?? null,

        columnId: card.columnId,
        order: card.order,

        createdAt: card.createdAt,

        updatedAt:
          card.id === mutation.cardId
            ? mutation.timestamp
            : card.updatedAt,

        updatedBy: userId,

        lastMutationId:
          mutation.mutationId,
      },
      {
        merge: true,
      },
    );
  });

  await batch.commit();
};

export const syncMovedCard =
  async (
    card: BoardCard,
    mutation: MoveCardPayload,
    userId: string,
  ) => {
    const cardRef = doc(
      getCardsRef(),
      card.id,
    );

    await setDoc(
      cardRef,
      {
        columnId:
          card.columnId,

        order:
          card.order,

        updatedAt:
          mutation.timestamp,

        updatedBy:
          userId,

        lastMutationId:
          mutation.mutationId,
      },
      {
        merge: true,
      },
    );
  };

export const syncBoardMutation = async (
  mutation: BoardMutation,
  userId: string,
  currentCards: BoardCard[],
) => {
  switch (mutation.type) {
    case 'CREATE_CARD':
      await setDoc(
        doc(getCardsRef(), mutation.payload.card.id),
        {
          ...mutation.payload.card,
          updatedBy: userId,
          lastMutationId: mutation.mutationId,
        },
      );
      return;

    case 'UPDATE_CARD':
      await setDoc(
        doc(getCardsRef(), mutation.payload.cardId),
        {
          title: mutation.payload.title,
          description: mutation.payload.description ?? null,
          updatedAt: mutation.payload.timestamp,
          updatedBy: userId,
          lastMutationId: mutation.mutationId,
        },
        {merge: true},
      );
      return;

    case 'DELETE_CARD':
      await deleteDoc(
        doc(getCardsRef(), mutation.payload.cardId),
      );
      return;

    case 'MOVE_CARD': {
      const card = currentCards.find(
        item => item.id === mutation.payload.cardId,
      );

      if (!card) {
        throw new Error(
          `Card ${mutation.payload.cardId} not found`,
        );
      }

      await syncMovedCard(
        card,
        mutation.payload,
        userId,
      );
    }
  }
};