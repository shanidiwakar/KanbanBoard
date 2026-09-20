import {
  BoardCard,
  BoardState,
  CreateCardPayload,
  DeleteCardPayload,
  MoveCardPayload,
  UpdateCardPayload,
} from '../types/board.types';
import {
  calculateCardOrder,
} from '../utils/cardOrder';

export type BoardAction =
  | {
      type: 'SET_CARDS';
      payload: BoardCard[];
    }
  | {
      type: 'MOVE_CARD';
      payload: MoveCardPayload;
    }
  | {
      type: 'CREATE_CARD';
      payload: CreateCardPayload;
    }
  | {
      type: 'UPDATE_CARD';
      payload: UpdateCardPayload;
    }
  | {
      type: 'DELETE_CARD';
      payload: DeleteCardPayload;
    }
  | {
      type: 'SET_LOADING';
      payload: boolean;
    }
  | {
      type: 'SET_SYNCING';
      payload: boolean;
    }
  | {
      type: 'SET_PENDING_ACTIONS';
      payload: number;
    }
  | {
      type: 'SET_ERROR';
      payload: string | null;
    };

export const applyMoveCard = (
  cards: BoardCard[],
  payload: MoveCardPayload,
): BoardCard[] => {
  const movingCard =
    cards.find(
      card =>
        card.id === payload.cardId,
    );

  if (!movingCard) {
    return cards;
  }

  const targetCards =
    cards
      .filter(
        card =>
          card.columnId ===
            payload.targetColumnId &&
          card.id !== payload.cardId,
      )
      .sort(
        (a, b) =>
          a.order - b.order,
      );

  const safeIndex = Math.max(
    0,
    Math.min(
      payload.targetIndex,
      targetCards.length,
    ),
  );

  const newOrder =
    calculateCardOrder(
      targetCards,
      safeIndex,
    );

  return cards.map(card => {
    if (
      card.id !== payload.cardId
    ) {
      return card;
    }

    return {
      ...card,

      columnId:
        payload.targetColumnId,

      order:
        newOrder,

      updatedAt:
        payload.timestamp,

      lastMutationId:
        payload.mutationId,
    };
  });
};

export const boardReducer = (
  state: BoardState,
  action: BoardAction,
): BoardState => {
  switch (action.type) {
    case 'SET_CARDS':
      return {
        ...state,
        cards: action.payload,
        loading: false,
        initialized: true,
      };

    case 'MOVE_CARD':
      return {
        ...state,
        cards: applyMoveCard(
          state.cards,
          action.payload,
        ),
      };

    case 'CREATE_CARD':
      return {
        ...state,
        cards: [...state.cards, action.payload.card],
      };

    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.cardId
            ? {
                ...card,
                title: action.payload.title,
                description: action.payload.description,
                updatedAt: action.payload.timestamp,
              }
            : card,
        ),
      };

    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter(
          card => card.id !== action.payload.cardId,
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_SYNCING':
      return {
        ...state,
        syncing: action.payload,
      };

    case 'SET_PENDING_ACTIONS':
      return {
        ...state,
        pendingActions: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};