import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { theme } from '../config/theme';
import { MediaCard } from './MediaCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { MediaItem } from '../types';

interface Props {
  title: string;
  data: MediaItem[];
  onItemPress: (item: MediaItem) => void;
  isLoading?: boolean;
  onSeeAll?: () => void;
}

export const MediaRow: React.FC<Props> = ({ title, data, onItemPress, isLoading, onSeeAll }) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={{ marginRight: theme.spacing.md }}>
              <LoadingSkeleton variant="card" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.moreText}>Ver más {'>'}</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MediaCard
            title={item.title || item.name || 'Sin título'}
            posterPath={item.poster_path}
            year={item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}
            rating={item.vote_average}
            mediaType={item.media_type}
            onPress={() => onItemPress(item)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  moreText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  skeletonContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
  },
});
