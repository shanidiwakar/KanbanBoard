export type ColumnId =
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'done';

export interface BoardColumn {
  id: ColumnId;
  title: string;
  order: number;
}

export interface BoardCard {
  id: string;
  title: string;
  description?: string;

  columnId: ColumnId;

  /**
   * Determines the card's position inside its column.
   * Lower number = higher position.
   */
  order: number;

  createdAt: number;
  updatedAt: number;
}

export interface ColumnLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardState {
  cards: BoardCard[];
  loading: boolean;
  initialized: boolean;
  syncing: boolean;
  pendingActions: number;
  error: string | null;
}

export interface MoveCardPayload {
  mutationId: string;

  cardId: string;

  targetColumnId: ColumnId;

  targetIndex: number;

  timestamp: number;
}

export interface CreateCardPayload {
  card: BoardCard;
}

export interface UpdateCardPayload {
  cardId: string;
  title: string;
  description?: string;
  timestamp: number;
}

export interface DeleteCardPayload {
  cardId: string;
}

export type MutationStatus =
  | 'pending'
  | 'processing'
  | 'failed';

export interface MoveCardMutation {
  mutationId: string;

  type: 'MOVE_CARD';

  payload: MoveCardPayload;

  cardSnapshot: BoardCard;

  status: MutationStatus;

  createdAt: number;

  attempts: number;

  error?: string;
}

export type BoardMutation = {
  mutationId: string;
  type: 'CREATE_CARD';
  payload: CreateCardPayload;
  status: MutationStatus;
  createdAt: number;
  attempts: number;
  error?: string;
} | {
  mutationId: string;
  type: 'UPDATE_CARD';
  payload: UpdateCardPayload;
  status: MutationStatus;
  createdAt: number;
  attempts: number;
  error?: string;
} | {
  mutationId: string;
  type: 'DELETE_CARD';
  payload: DeleteCardPayload;
  status: MutationStatus;
  createdAt: number;
  attempts: number;
  error?: string;
} | MoveCardMutation;