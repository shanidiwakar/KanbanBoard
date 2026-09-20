import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {BoardCard as BoardCardType} from '../../types/board.types';

interface Props {
  card: BoardCardType;
  onEdit?: () => void;
  onDelete?: () => void;
}

const BoardCard = ({card, onEdit, onDelete}: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {card.title}
      </Text>

      {card.description ? (
        <Text style={styles.description}>
          {card.description}
        </Text>
      ) : null}

      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit}>
              <Text style={styles.action}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete}>
              <Text style={[styles.action, styles.delete]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default BoardCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,

    shadowColor: '#172b4d',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#172b4d',
  },

  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#626f86',
  },

  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },

  action: {
    color: '#0c66e4',
    fontSize: 12,
    fontWeight: '600',
  },

  delete: {
    color: '#c9372c',
  },
});