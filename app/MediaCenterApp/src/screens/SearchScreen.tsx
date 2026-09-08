import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../config/theme';
import { MediaCard } from '../components/MediaCard';
import { TMDBService } from '../services/tmdb';
import { MediaItem } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const GENRES = [
  { id: 28, name: 'Acción', icon: '💥' },
  { id: 35, name: 'Comedia', icon: '😂' },
  { id: 18, name: 'Drama', icon: '🎭' },
  { id: 27, name: 'Terror', icon: '👻' },
  { id: 878, name: 'Ciencia Ficción', icon: '👽' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      setSelectedGenre(null);
      performSearch(debouncedQuery);
    } else if (!selectedGenre) {
      setResults([]);
    }
  }, [debouncedQuery]);

  const performSearch = async (text: string) => {
    setLoading(true);
    try {
      const data = await TMDBService.search(text);
      setResults(data.results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenrePress = async (genreId: number) => {
    setSelectedGenre(genreId);
    setQuery('');
    setLoading(true);
    try {
      const data = await TMDBService.discoverByGenre('movie', genreId);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPress = (item: MediaItem) => {
    router.push({ pathname: '/detail', params: { id: item.id, mediaType: item.media_type || 'movie' } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar películas, series..."
          placeholderTextColor={theme.colors.text.secondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={styles.gridItem}>
              <LoadingSkeleton variant="card" />
            </View>
          ))}
        </View>
      ) : query.trim() === '' ? (
        <View style={styles.genresContainer}>
          <Text style={styles.sectionTitle}>Explorar Géneros</Text>
          <View style={styles.genresGrid}>
            {GENRES.map(genre => (
              <Pressable
                key={genre.id}
                style={[styles.genreCard, selectedGenre === genre.id && styles.genreCardActive]}
                onPress={() => handleGenrePress(genre.id)}
              >
                <Text style={styles.genreIcon}>{genre.icon}</Text>
                <Text style={styles.genreName}>{genre.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : results.length > 0 ? (
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
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchHeader: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20, // safe area approx
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
  },
  genresContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  genreCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '47%',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
  },
  genreIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  genreName: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
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
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
  },
});
