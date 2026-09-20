import {
  BoardCard,
  BoardColumn,
} from '../../types/board.types';

export const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: 'todo',
    title: 'Todo',
    order: 0,
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    order: 1,
  },
  {
    id: 'review',
    title: 'Review',
    order: 2,
  },
  {
    id: 'done',
    title: 'Done',
    order: 3,
  },
];

export const INITIAL_CARDS: BoardCard[] = [
  {
    id: 'task-1',
    title: 'Product catalog launch',
    description: 'Finalize the homepage collection, pricing, and variant data for the summer drop.',
    columnId: 'todo',
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task-2',
    title: 'Checkout flow cleanup',
    description: 'Improve delivery options, discount code validation, and payment error states.',
    columnId: 'todo',
    order: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task-3',
    title: 'Customer account updates',
    description: 'Implement profile editing, order history, and saved address management.',
    columnId: 'in-progress',
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task-4',
    title: 'Payment gateway review',
    description: 'Validate Stripe checkout flow, retry logic, and refund handling for test cards.',
    columnId: 'review',
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task-5',
    title: 'Order tracking dashboard',
    description: 'Ship tracking status, ETA updates, and customer notification templates are live.',
    columnId: 'done',
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];