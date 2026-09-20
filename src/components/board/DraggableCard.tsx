import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

import Animated, { runOnJS } from 'react-native-reanimated';

import { BoardCard as BoardCardType, CardLayout } from '../../types/board.types';
import BoardCard from './BoardCard';

interface Props {
    card: BoardCardType;

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

    isDragging?: boolean;

    onEdit?: (card: BoardCardType) => void;
    onDelete?: (card: BoardCardType) => void;

    onLayoutChange?: (
        cardId: string,
        layout: CardLayout,
    ) => void;
}

const DraggableCard = ({
    card,
    onDragStart,
    onDragEnd,
    onDragMove,
    isDragging: active,
    onEdit,
    onDelete,
    onLayoutChange
}: Props) => {

    const cardRef = useRef<View>(null);

    const panGesture = Gesture.Pan()
        .activateAfterLongPress(250)

        .onStart(() => {
            if (onDragStart) {
                runOnJS(onDragStart)(card);
            }
        })

        .onUpdate(event => {
            if (onDragMove) {
                runOnJS(onDragMove)(
                    card,
                    event.translationX,
                    event.translationY,
                    event.absoluteX,
                    event.absoluteY,
                );
            }
        })

        .onEnd(event => {
            if (onDragEnd) {
                runOnJS(onDragEnd)(
                    card,
                    event.absoluteX,
                    event.absoluteY,
                );
            }

        });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                ref={cardRef}
                onLayout={() => {
                    cardRef.current?.measureInWindow(
                        (x, y, width, height) => {
                            onLayoutChange?.(card.id, {
                                x,
                                y,
                                width,
                                height,
                            });
                        },
                    );
                }}
                style={[
                    styles.container,
                ]}>
                {active ? (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>
                            Moving card
                        </Text>
                    </View>
                ) : (
                    <BoardCard
                        card={card}
                        onEdit={() => onEdit?.(card)}
                        onDelete={() => onDelete?.(card)}
                    />
                )}
            </Animated.View>
        </GestureDetector>
    );
};

export default DraggableCard;

const styles = StyleSheet.create({
    container: {
        zIndex: 1,
    },

    placeholder: {
        minHeight: 64,
        marginBottom: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#0c66e4',
        borderRadius: 10,
        backgroundColor: '#deebff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    placeholderText: {
        color: '#0c66e4',
        fontSize: 12,
        fontWeight: '600',
    },
});