import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/config/theme';
import { MediaCard } from '../src/components/MediaCard';
import { TMDBService } from '../src/services/tmdb';
import { MediaItem } from '../src/types';
import { LoadingSkeleton } from '../src/components/LoadingSkeleton';

type ListType = 'trending' | 'top_rated' | 'popular' | 'genre';

export default function ListScreen() {
  const router = useRouter();
  const { title, type, mediaType, genreId } = useLocalSearchParams<{
    title: string;
    type: ListType;
    mediaType: 'movie' | 'tv';
    genreId?: string;
  }>();

  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFetching = useRef(false);

  useEffect(() => {
    // Reset and load fresh when params change
    setResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    loadPage(1, true);
  }, [type, mediaType, genreId]);

  const loadPage = useCallback(
    async (page: number, isFirstLoad = false) => {
      if (isFetching.current) return;
      isFetching.current = true;

      if (isFirstLoad) setLoading(true);
      else setLoadingMore(true);

      try {
        let data: { results: MediaItem[]; total_pages: number };

        const mt = mediaType || 'movie';

        if (type === 'trending') {
          data = await TMDBService.getTrending(mt, 'week', page);
        } else if (type === 'genre' && genreId) {
          data = await TMDBService.discoverByGenre(mt, parseInt(genreId), page);
        } else if (type === 'popular') {
          data = await TMDBService.getPopular(mt, page);
        } else if (type === 'top_rated') {
          data = await TMDBService.getTopRated(mt, page);
        } else {
          data = { results: [], total_pages: 1 };
        }

        setResults((prev) => (isFirstLoad ? data.results : [...prev, ...data.results]));
        setTotalPages(data.total_pages);
        setCurrentPage(page);
      } catch (error) {
        console.error('ListScreen error:', error);
      } finally {
        if (isFirstLoad) setLoading(false);
        else setLoadingMore(false);
        isFetching.current = false;
      }
    },
    [type, mediaType, genreId]
  );

  const handleEndReached = () => {
    if (!loadingMore && !loading && currentPage < totalPages) {
      loadPage(currentPage + 1);
    }
  };

  const handleMediaPress = (item: MediaItem) => {
    router.push({
      pathname: '/detail',
      params: { id: item.id, mediaType: item.media_type || mediaType || 'movie' },
    });
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <Text style={styles.footerText}>Cargando más...</Text>
      </View>
    );
  };

  const renderSkeletons = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <View key={i} style={styles.gridItem}>
          <LoadingSkeleton variant="card" />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Resultados'}
          </Text>
          {!loading && results.length > 0 && (
            <Text style={styles.subtitle}>
              Página {currentPage} de {totalPages}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        renderSkeletons()
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={60} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>Sin resultados</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={3}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <MediaCard
                title={item.title || item.name || ''}
                posterPath={item.poster_path}
                year={
                  item.release_date?.substring(0, 4) ||
                  item.first_air_date?.substring(0, 4)
                }
                rating={item.vote_average}
                onPress={() => handleMediaPress(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.sm,
  },
  gridItem: {
    width: '33.33%',
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  footerText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
  },
});
