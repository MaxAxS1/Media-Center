import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { MediaCard } from '../components/MediaCard';
import { TMDBService } from '../services/tmdb';
import { LocalStorageService, SearchHistoryItem } from '../services/localStorage';
import { MediaItem, Genre } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Historial
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Tab state for Genres
  const [mediaTab, setMediaTab] = useState<'movie' | 'tv'>('movie');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // Cargar géneros e historial al montar
  useEffect(() => {
    loadGenres(mediaTab);
    loadHistory();
  }, []);

  useEffect(() => {
    loadGenres(mediaTab);
  }, [mediaTab]);

  const loadHistory = async () => {
    const h = await LocalStorageService.getSearchHistory();
    setHistory(h);
  };

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

  // Debounce del input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Buscar cuando cambia el query debounced
  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
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

  // Guardar en historial cuando el usuario confirma la búsqueda
  const handleSubmitSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return;
    await LocalStorageService.addToSearchHistory(query.trim());
    loadHistory();
  }, [query]);

  // Tocar un elemento del historial
  const handleHistoryPress = (item: SearchHistoryItem) => {
    setQuery(item.query);
  };

  // Eliminar una entrada del historial
  const handleRemoveHistory = async (q: string) => {
    await LocalStorageService.removeFromSearchHistory(q);
    loadHistory();
  };

  // Limpiar todo el historial
  const handleClearHistory = async () => {
    await LocalStorageService.clearSearchHistory();
    setHistory([]);
  };

  const handleGenrePress = (genre: Genre) => {
    router.push({
      pathname: '/list',
      params: {
        type: 'genre',
        genreId: genre.id,
        mediaType: mediaTab,
        title: `${genre.name} (${mediaTab === 'movie' ? 'Películas' : 'Series'})`,
      },
    });
  };

  const handleMediaPress = (item: MediaItem) => {
    router.push({
      pathname: '/detail',
      params: { id: item.id, mediaType: item.media_type || 'movie' },
    });
  };

  // Formato de tiempo relativo para el historial
  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `Hace ${days}d`;
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return 'Ahora';
  };

  const showHistory = query.trim() === '' && history.length > 0;
  const showGenres = query.trim() === '' && history.length === 0;
  const showGenresBelow = query.trim() === '' && history.length > 0;

  return (
    <View style={styles.container}>
      {/* Header con buscador */}
      <View style={styles.searchHeader}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar películas, series..."
            placeholderTextColor={theme.colors.text.secondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={theme.colors.text.secondary} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.gridItem}>
              <LoadingSkeleton variant="card" />
            </View>
          ))}
        </View>
      ) : query.trim().length > 1 && results.length > 0 ? (
        // Resultados de búsqueda
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
      ) : query.trim().length > 1 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={48} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Historial de búsqueda */}
          {history.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
                <Pressable onPress={handleClearHistory}>
                  <Text style={styles.clearAllText}>Limpiar</Text>
                </Pressable>
              </View>
              {history.map((item) => (
                <Pressable
                  key={item.query + item.timestamp}
                  style={styles.historyItem}
                  onPress={() => handleHistoryPress(item)}
                >
                  <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyQuery}>{item.query}</Text>
                    <Text style={styles.historyTime}>{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveHistory(item.query)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={16} color={theme.colors.text.secondary} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}

          {/* Explorar por género (siempre visible cuando no hay query) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explorar por Género</Text>
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tabButton, mediaTab === 'movie' && styles.tabButtonActive]}
                onPress={() => setMediaTab('movie')}
              >
                <Text style={[styles.tabText, mediaTab === 'movie' && styles.tabTextActive]}>
                  Películas
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabButton, mediaTab === 'tv' && styles.tabButtonActive]}
                onPress={() => setMediaTab('tv')}
              >
                <Text style={[styles.tabText, mediaTab === 'tv' && styles.tabTextActive]}>
                  Series
                </Text>
              </Pressable>
            </View>

            {genresLoading ? (
              <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.genresGrid}>
                {genres.map((genre) => (
                  <Pressable
                    key={genre.id}
                    style={styles.genreCard}
                    onPress={() => handleGenrePress(genre)}
                  >
                    <Text style={styles.genreName}>{genre.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
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
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  section: {
    padding: theme.spacing.lg,
    paddingBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: theme.spacing.md,
  },
  historyItemContent: {
    flex: 1,
  },
  historyQuery: {
    color: theme.colors.text.primary,
    fontSize: 15,
  },
  historyTime: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
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
    gap: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
});
