import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../config/theme';
import { MediaCard } from '../components/MediaCard';
import { TMDBService } from '../services/tmdb';
import { MediaItem, Genre } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Tab state for Genres
  const [mediaTab, setMediaTab] = useState<'movie' | 'tv'>('movie');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  useEffect(() => {
    loadGenres(mediaTab);
  }, [mediaTab]);

  const loadGenres = async (type: 'movie' | 'tv') => {
    setGenresLoading(true);
    try {
      const data = await TMDBService.getGenres(type);
      setGenres(data || []);
    } catch (e) {
      console.error('Error loading genres:', e);
    } finally {
      setGenresLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery);
    } else {
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

  const handleGenrePress = (genre: Genre) => {
    router.push({
      pathname: '/list',
      params: { 
        type: 'genre', 
        genreId: genre.id, 
        mediaType: mediaTab, 
        title: `${genre.name} (${mediaTab === 'movie' ? 'Películas' : 'Series'})`
      }
    });
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
          <Text style={styles.sectionTitle}>Explorar por Género</Text>
          
          <View style={styles.tabContainer}>
            <Pressable 
              style={[styles.tabButton, mediaTab === 'movie' && styles.tabButtonActive]}
              onPress={() => setMediaTab('movie')}
            >
              <Text style={[styles.tabText, mediaTab === 'movie' && styles.tabTextActive]}>Películas</Text>
            </Pressable>
            <Pressable 
              style={[styles.tabButton, mediaTab === 'tv' && styles.tabButtonActive]}
              onPress={() => setMediaTab('tv')}
            >
              <Text style={[styles.tabText, mediaTab === 'tv' && styles.tabTextActive]}>Series</Text>
            </Pressable>
          </View>

          {genresLoading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" style={{marginTop: 40}} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.genresGrid}>
                {genres.map(genre => (
                  <Pressable
                    key={genre.id}
                    style={styles.genreCard}
                    onPress={() => handleGenrePress(genre)}
                  >
                    <Text style={styles.genreName}>{genre.name}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{height: 100}} />
            </ScrollView>
          )}
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

import { ActivityIndicator } from 'react-native';

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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  genresContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFF',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  genreCard: {
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  genreName: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
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
