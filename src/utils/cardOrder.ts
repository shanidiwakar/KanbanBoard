import {
  BoardCard,
} from '../types/board.types';

const ORDER_GAP = 1000;

export const calculateCardOrder = (
  targetCards: BoardCard[],
  targetIndex: number,
): number => {
  if (targetCards.length === 0) {
    return ORDER_GAP;
  }

  // Insert at beginning
  if (targetIndex <= 0) {
    return (
      targetCards[0].order -
      ORDER_GAP
    );
  }

  // Insert at end
  if (
    targetIndex >=
    targetCards.length
  ) {
    return (
      targetCards[
        targetCards.length - 1
      ].order + ORDER_GAP
    );
  }

  const previous =
    targetCards[targetIndex - 1];

  const next =
    targetCards[targetIndex];

  return (
    previous.order +
    (next.order - previous.order) / 2
  );
};