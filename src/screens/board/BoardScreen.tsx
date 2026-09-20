import React, { useMemo, useState, useRef, useEffect } from 'react';
import uuid from 'react-native-uuid';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { logout } from '../../services/auth.service';

import { BOARD_COLUMNS, } from './board.mock';

import {
  BoardCard as BoardCardType, ColumnId, CardLayout,
  ColumnLayout,
} from '../../types/board.types';

import BoardColumn from '../../components/board/BoardColumn';
import BoardCard from '../../components/board/BoardCard';
import { useBoardStore } from '../../store/BoardContext';

const BoardScreen = () => {

  const cardLayouts = useRef<Record<string, CardLayout>>({});

  const {
    state,
    moveCard,
    createCard,
    updateCard,
    deleteCard,
    isOnline,
  } = useBoardStore();

  const {
    cards,
    syncing,
    loading,
    pendingActions
  } = state;

  const [layoutVersion, setLayoutVersion,] = useState(0);
  const columnLayouts = useRef<Partial<Record<ColumnId, ColumnLayout>>>({});
  const [draggedCard, setDraggedCard] = useState<BoardCardType | null>(null);
  const [dragPosition, setDragPosition] = useState<CardLayout | null>(null);
  const [dropColumn, setDropColumn] = useState<ColumnId | null>(null);
  const [editingCard, setEditingCard] = useState<BoardCardType | null>(null);
  const [cardEditorVisible, setCardEditorVisible] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const dragOrigin = useRef<CardLayout | null>(null);
  const scrollOffset = useRef(0);
  const boardViewport = useRef({x: 0, width: 0});
  const contentWidth = useRef(0);
  const autoScrollDirection = useRef(0);
  const autoScrollFrame = useRef<number | null>(null);
  const boardScrollRef = useRef<{
    scrollTo: (options: {x: number; animated: boolean}) => void;
  } | null>(null);

  const columns = useMemo(
    () =>
      [...BOARD_COLUMNS].sort(
        (a, b) => a.order - b.order,
      ),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLayoutVersion(
        current => current + 1,
      );
    }, 50);

    return () => clearTimeout(timer);
  }, [cards]);
  const handleCardLayout = (
    cardId: string,
    layout: CardLayout,
  ) => {
    cardLayouts.current[cardId] = layout;
  };

  const stopAutoScroll = () => {
    autoScrollDirection.current = 0;

    if (autoScrollFrame.current !== null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
  };

  useEffect(() => {
    return stopAutoScroll;
  }, []);

  const autoScroll = () => {
    const direction = autoScrollDirection.current;

    if (!direction) {
      autoScrollFrame.current = null;
      return;
    }

    const maxOffset = Math.max(
      0,
      contentWidth.current - boardViewport.current.width,
    );
    const nextOffset = Math.max(
      0,
      Math.min(
        maxOffset,
        scrollOffset.current + direction * 8,
      ),
    );

    boardScrollRef.current?.scrollTo({
      x: nextOffset,
      animated: false,
    });

    autoScrollFrame.current = requestAnimationFrame(autoScroll);
  };

  const updateAutoScroll = (x: number) => {
    const {x: viewportX, width} = boardViewport.current;
    const edgeDistance = 56;
    const leftEdge = viewportX + edgeDistance;
    const rightEdge = viewportX + width - edgeDistance;
    const direction =
      x < leftEdge ? -1 : x > rightEdge ? 1 : 0;

    autoScrollDirection.current = direction;

    if (direction && autoScrollFrame.current === null) {
      autoScrollFrame.current = requestAnimationFrame(autoScroll);
    }
  };

  const handleBoardScroll = (offset: number) => {
    const delta = offset - scrollOffset.current;

    if (delta === 0) {
      return;
    }

    Object.values(cardLayouts.current).forEach(layout => {
      layout.x -= delta;
    });

    Object.values(columnLayouts.current).forEach(layout => {
      if (layout) {
        layout.x -= delta;
      }
    });

    scrollOffset.current = offset;
  };

  const findTargetColumn = (
    x: number,
    y: number,
  ): ColumnId | null => {
    const entries =
      Object.entries(columnLayouts.current);

    for (const [columnId, layout] of entries) {
      if (!layout) {
        continue;
      }

      const insideX =
        x >= layout.x &&
        x <= layout.x + layout.width;

      const insideY =
        y >= layout.y &&
        y <= layout.y + layout.height;

      if (insideX && insideY) {
        return columnId as ColumnId;
      }
    }

    return null;
  };

  const handleColumnLayout = (
    columnId: ColumnId,
    layout: ColumnLayout,
  ) => {
    columnLayouts.current[columnId] =
      layout;

    console.log(
      'COLUMN:',
      columnId,
      layout,
    );
  };

  const getColumnCards = (
    columnId: string,
  ) => {
    return cards
      .filter(
        card => card.columnId === columnId,
      )
      .sort(
        (a, b) => a.order - b.order,
      );
  };

  const openCreateCard = () => {
    setCardEditorVisible(true);
    setEditingCard(null);
    setCardTitle('');
    setCardDescription('');
  };

  const openEditCard = (card: BoardCardType) => {
    setCardEditorVisible(true);
    setEditingCard(card);
    setCardTitle(card.title);
    setCardDescription(card.description ?? '');
  };

  const closeCardEditor = () => {
    setCardEditorVisible(false);
    setEditingCard(null);
    setCardTitle('');
    setCardDescription('');
  };

  const saveCard = async () => {
    if (!cardTitle.trim()) {
      return;
    }

    setSavingCard(true);
    Keyboard.dismiss();

    try {
      if (editingCard) {
        await updateCard(
          editingCard.id,
          cardTitle,
          cardDescription,
        );
      } else {
        await createCard(cardTitle, cardDescription);
      }

      closeCardEditor();
    } finally {
      setSavingCard(false);
    }
  };

  const confirmDelete = (card: BoardCardType) => {
    Alert.alert(
      'Delete card?',
      card.title,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCard(card.id),
        },
      ],
    );
  };

  const handleDragStart = (
    card: BoardCardType,
  ) => {
    const layout = cardLayouts.current[card.id];

    if (!layout) {
      return;
    }

    setDraggedCard(card);
    setDragPosition(layout);
    setDropColumn(card.columnId);
    dragOrigin.current = {...layout};
  };

  const handleDragMove = (
    card: BoardCardType,
    translationX: number,
    translationY: number,
    x: number,
    y: number,
  ) => {
    const layout = dragOrigin.current;

    if (!layout) {
      return;
    }

    setDragPosition({
      ...layout,
      x: layout.x + translationX,
      y: layout.y + translationY,
    });
    setDropColumn(findTargetColumn(x, y));
    updateAutoScroll(x);
  };

  const handleDragEnd = (
    card: BoardCardType,
    x: number,
    y: number,
  ) => {
    const targetColumn =
      findTargetColumn(x, y);

    setDraggedCard(null);
    setDragPosition(null);
    setDropColumn(null);
    dragOrigin.current = null;
    stopAutoScroll();

    if (!targetColumn) {
      return;
    }

    const targetIndex =
      findTargetIndex(
        targetColumn,
        y,
        card.id,
      );

    moveCard({
      mutationId: uuid.v4().toString(),

      cardId: card.id,

      targetColumnId: targetColumn,

      targetIndex,

      timestamp: Date.now(),
    });

  };

  const findTargetIndex = (
    targetColumnId: ColumnId,
    dropY: number,
    draggedCardId: string,
  ) => {
    const targetCards = cards
      .filter(
        card =>
          card.columnId === targetColumnId &&
          card.id !== draggedCardId,
      )
      .sort(
        (a, b) => a.order - b.order,
      );

    for (let index = 0; index < targetCards.length; index++) {
      const card = targetCards[index];

      const layout =
        cardLayouts.current[card.id];

      if (!layout) {
        continue;
      }

      const middleY =
        layout.y + layout.height / 2;

      if (dropY < middleY) {
        return index;
      }
    }

    return targetCards.length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonBoard}>
          {[0, 1, 2].map(column => (
            <View key={column} style={styles.skeletonColumn}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonCard} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>
            Project Board
          </Text>

          <Text style={styles.subtitle}>
            <Text style={styles.syncText}>
              {isOnline === false
                ? `Offline • ${pendingActions} pending`
                : syncing
                  ? 'Syncing...'
                  : pendingActions > 0
                    ? `${pendingActions} pending`
                    : 'Synced'}
            </Text>{' '}
            {cards.length} tasks
          </Text>
        </View>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>
            Logout
          </Text>
        </TouchableOpacity>

      </View>

      {cards.length === 0 && (
        <View style={styles.emptyBoard}>
          <Text style={styles.emptyBoardTitle}>Your board is empty</Text>
          <Text style={styles.emptyBoardText}>
            Add a card to start organizing your work.
          </Text>
        </View>
      )}

      <ScrollView
        ref={instance => {
          boardScrollRef.current = instance as unknown as {
            scrollTo: (options: {x: number; animated: boolean}) => void;
          };
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.board}
        scrollEventThrottle={16}
        onLayout={event => {
          boardViewport.current = {
            x: event.nativeEvent.layout.x,
            width: event.nativeEvent.layout.width,
          };
        }}
        onContentSizeChange={width => {
          contentWidth.current = width;
        }}
        onScroll={event => {
          handleBoardScroll(
            event.nativeEvent.contentOffset.x,
          );
        }}
        onMomentumScrollEnd={() => {
          setLayoutVersion(
            current => current + 1,
          );
        }}>

        {columns.map(column => (
          <BoardColumn
            key={column.id}
            column={column}
            cards={getColumnCards(column.id)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragMove={handleDragMove}
            activeCardId={draggedCard?.id}
            isDropTarget={dropColumn === column.id}
            onEditCard={openEditCard}
            onDeleteCard={confirmDelete}
            onAddCard={openCreateCard}
            onLayoutChange={handleColumnLayout}
            onCardLayoutChange={handleCardLayout}
            layoutVersion={layoutVersion}
          />
        ))}

      </ScrollView>

      {draggedCard && dragPosition && (
        <View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              left: dragPosition.x,
              top: dragPosition.y,
              width: dragPosition.width,
            },
          ]}>
          <BoardCard card={draggedCard} />
        </View>
      )}

      <Modal
        visible={cardEditorVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCardEditor}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingCard ? 'Edit card' : 'New card'}
            </Text>

            <TextInput
              autoFocus
              value={cardTitle}
              onChangeText={setCardTitle}
              placeholder="Card title"
              style={styles.input}
            />

            <TextInput
              value={cardDescription}
              onChangeText={setCardDescription}
              placeholder="Description (optional)"
              multiline
              style={[styles.input, styles.descriptionInput]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeCardEditor}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={savingCard || !cardTitle.trim()}
                style={[
                  styles.saveButton,
                  (!cardTitle.trim() || savingCard) &&
                    styles.disabledButton,
                ]}
                onPress={saveCard}>
                {savingCard ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default BoardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#172b4d',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#626f86',
  },

  logout: {
    color: '#0c66e4',
    fontSize: 15,
    fontWeight: '600',
  },

  board: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  syncText: {
    marginTop: 3,
    fontSize: 12,
    color: '#626f86',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#626f86',
  },

  skeletonHeader: {
    width: '42%',
    height: 28,
    marginBottom: 28,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },

  skeletonBoard: {
    flexDirection: 'row',
    gap: 16,
  },

  skeletonColumn: {
    width: 180,
    height: 220,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f2f4',
  },

  skeletonTitle: {
    width: '55%',
    height: 16,
    marginBottom: 20,
    borderRadius: 6,
    backgroundColor: '#dcdfe4',
  },

  skeletonCard: {
    height: 56,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },

  emptyBoard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  emptyBoardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172b4d',
  },

  emptyBoardText: {
    marginTop: 4,
    color: '#626f86',
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  modalCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },

  modalTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#172b4d',
  },

  input: {
    minHeight: 44,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dcdfe4',
    borderRadius: 8,
    color: '#172b4d',
  },

  descriptionInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },

  cancelText: {
    color: '#626f86',
    fontWeight: '600',
  },

  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0c66e4',
  },

  disabledButton: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  dragOverlay: {
    position: 'absolute',
    zIndex: 1000,
    opacity: 0.94,
    transform: [{scale: 1.04}],
  },
});