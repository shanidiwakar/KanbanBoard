import React, { useCallback, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    BoardCard as BoardCardType,
    BoardColumn as BoardColumnType,
    CardLayout,
    ColumnId,
    ColumnLayout,
} from '../../types/board.types';

import DraggableCard from './DraggableCard';

interface Props {
    column: BoardColumnType;
    cards: BoardCardType[];

    onDragStart?: (
        card: BoardCardType,
    ) => void;

    onDragEnd?: (
        card: BoardCardType,
        x: number,
        y: number,
    ) => void;

    onDragMove?: (
        card: BoardCardType,
        translationX: number,
        translationY: number,
        x: number,
        y: number,
    ) => void;

    activeCardId?: string | null;
    isDropTarget?: boolean;
    onEditCard?: (card: BoardCardType) => void;
    onDeleteCard?: (card: BoardCardType) => void;
    onAddCard?: () => void;

    onLayoutChange?: (
        columnId: ColumnId,
        layout: ColumnLayout,
    ) => void;
    layoutVersion: number;
    onCardLayoutChange?: (
  cardId: string,
  layout: CardLayout,
) => void;
}

const BoardColumn = ({
    column,
    cards,
    onDragStart,
    onDragEnd,
    onDragMove,
    activeCardId,
    isDropTarget,
    onEditCard,
    onDeleteCard,
    onAddCard,
    onLayoutChange,
    layoutVersion,
    onCardLayoutChange
}: Props) => {

    const columnRef = useRef<View>(null);

    const measureColumn = useCallback(() => {
        columnRef.current?.measureInWindow(
            (x, y, width, height) => {
                onLayoutChange?.(
                    column.id,
                    {
                        x,
                        y,
                        width,
                        height,
                    },
                );
            },
        );
    }, [column.id, onLayoutChange]);

    useEffect(() => {
        measureColumn();
    }, [layoutVersion, measureColumn]);

    return (
        <View
            ref={columnRef}
            style={[styles.column, isDropTarget && styles.dropTarget]}
            onLayout={measureColumn}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {column.title}
                </Text>

                <View style={styles.count}>
                    <Text style={styles.countText}>
                        {cards.length}
                    </Text>
                </View>
            </View>

            <View>
                {cards.map(card => (
                    <DraggableCard
                        key={card.id}
                        card={card}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onDragMove={onDragMove}
                        isDragging={activeCardId === card.id}
                        onEdit={onEditCard}
                        onDelete={onDeleteCard}
                         onLayoutChange={onCardLayoutChange}
                    />
                ))}

                {cards.length === 0 && (
                    <View style={styles.emptyDropArea}>
                        <Text style={styles.empty}>
                            {isDropTarget
                                ? 'Drop card here'
                                : 'No cards yet'}
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.addCard}
                onPress={onAddCard}>
                <Text style={styles.addCardText}>+ Add card</Text>
            </TouchableOpacity>
        </View>
    );
};

export default BoardColumn;

const styles = StyleSheet.create({
    column: {
        width: 290,
        backgroundColor: '#f1f2f4',
        borderRadius: 12,
        padding: 12,
        marginRight: 20,
        minHeight: 220,
    },

    dropTarget: {
        borderWidth: 2,
        borderColor: '#0c66e4',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#172b4d',
    },

    count: {
        marginLeft: 8,
        minWidth: 24,
        height: 24,
        paddingHorizontal: 7,
        borderRadius: 12,
        backgroundColor: '#dcdfe4',
        alignItems: 'center',
        justifyContent: 'center',
    },

    countText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#44546f',
    },

    empty: {
        textAlign: 'center',
        color: '#626f86',
    },

    emptyDropArea: {
        minHeight: 86,
        marginBottom: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#b6bdc9',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    addCard: {
        marginTop: 8,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#dfe1e6',
        alignItems: 'center',
    },

    addCardText: {
        color: '#172b4d',
        fontWeight: '600',
    },
});