import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/config/theme';
import { MediaCard } from '../src/components/MediaCard';
import { TMDBService } from '../src/services/tmdb';
import { MediaItem } from '../src/types';
import { LoadingSkeleton } from '../src/components/LoadingSkeleton';

export default function ListScreen() {
  const router = useRouter();
  const { title, type, mediaType, genreId } = useLocalSearchParams<{
    title: string;
    type: 'trending' | 'top_rated' | 'genre' | 'search';
    mediaType: 'movie' | 'tv';
    genreId?: string;
  }>();

  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [type, mediaType, genreId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let data: MediaItem[] = [];
      if (type === 'trending') {
        data = await TMDBService.getTrending(mediaType || 'movie');
      } else if (type === 'genre' && genreId) {
        data = await TMDBService.discoverByGenre(mediaType || 'movie', parseInt(genreId));
      }
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPress = (item: MediaItem) => {
    router.push({ pathname: '/detail', params: { id: item.id, mediaType: item.media_type || mediaType || 'movie' } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title || 'Resultados'}</Text>
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <View key={i} style={styles.gridItem}>
              <LoadingSkeleton variant="card" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <MediaCard
                title={item.title || item.name || ''}
                posterPath={item.poster_path}
                year={item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}
                rating={item.vote_average}
                onPress={() => handleMediaPress(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    padding: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.sm,
  },
  gridItem: {
    width: '33.33%',
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
});
