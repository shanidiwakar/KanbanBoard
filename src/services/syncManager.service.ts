import {
    getAuth,
} from '@react-native-firebase/auth';

import {
    BoardCard,
} from '../types/board.types';

import {
    getMutationQueue,
    removeMutation,
    updateMutation,
} from './mutationQueue.service';

import {
    syncBoardMutation,
} from './board.service';

export interface SyncResult {
    cards: BoardCard[];
    pendingActions: number;
    error?: string;
}

const MAX_RETRIES = 3;

const isRetryableError = (error: any) => {
    const code = error?.code ?? '';

    return [
        'firestore/unavailable',
        'firestore/deadline-exceeded',
        'firestore/aborted',
        'firestore/resource-exhausted',
    ].includes(code);
};

const wait = (milliseconds: number) =>
    new Promise<void>(resolve => {
      setTimeout(() => resolve(), milliseconds);
    });

export const processMutationQueue =
    async (
        currentCards: BoardCard[],
    ): Promise<SyncResult> => {
        const user =
            getAuth().currentUser;

        if (!user) {
                return {
                cards: currentCards,
                pendingActions: 0,
            };
        }

        const queue =
            await getMutationQueue();
        let syncError: string | undefined;

        for (const mutation of queue) {
            try {
                if (
                    mutation.status === 'failed' &&
                    mutation.attempts >= MAX_RETRIES
                ) {
                    syncError ??= mutation.error;
                    continue;
                }

                let lastError: any;

                for (
                    let attempt = mutation.attempts;
                    attempt < MAX_RETRIES;
                    attempt += 1
                ) {
                    try {
                        await updateMutation(mutation.mutationId, {
                            status: 'processing',
                            attempts: attempt + 1,
                            error: undefined,
                        });

                        await syncBoardMutation(
                            mutation,
                            user.uid,
                            currentCards,
                        );
                        await removeMutation(mutation.mutationId);
                        lastError = undefined;
                        break;
                    } catch (error) {
                        lastError = error;

                        if (!isRetryableError(error)) {
                            break;
                        }

                        await wait(250 * 2 ** attempt);
                    }
                }

                if (lastError) {
                    const message =
                        lastError?.message ?? 'Unable to sync board change';

                    await updateMutation(mutation.mutationId, {
                        status: 'failed',
                        attempts: MAX_RETRIES,
                        error: message,
                    });

                    console.log(
                        '[SYNC] Failed:',
                        mutation.mutationId,
                        lastError,
                    );
                    syncError ??= message;

                    continue;
                }

                console.log('[SYNC] Completed:', mutation.mutationId);

            } catch (error) {
                console.log(
                    '[SYNC] Unexpected failure:',
                    mutation.mutationId,
                    error,
                );
            }
        }

        const remainingQueue =
            await getMutationQueue();

        return {
            cards: currentCards,

            pendingActions:
                remainingQueue.length,
            error: syncError,
        };
    };