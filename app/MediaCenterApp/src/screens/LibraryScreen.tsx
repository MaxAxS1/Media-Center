import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { theme } from '../config/theme';
import { PlexService } from '../services/plex';
import { getSettings } from '../services/apiClient';
import { useRouter } from 'expo-router';
import { TMDBService } from '../services/tmdb';

// Extrae el TMDB ID de los Guids de un ítem de Plex
const getTmdbIdFromGuids = (item: any): number | null => {
  const guids: any[] = item.Guid || [];
  for (const g of guids) {
    const id = g.id || '';
    if (id.startsWith('tmdb://')) {
      const parsed = parseInt(id.replace('tmdb://', ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  // Fallback: guid string (e.g. "com.plexapp.agents.themoviedb://12345?...")
  const guid: string = item.guid || '';
  const match = guid.match(/themoviedb:\/\/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
};

// Tipo inferido del tipo de biblioteca de Plex
const getMediaType = (item: any): 'movie' | 'tv' => {
  return item.type === 'show' ? 'tv' : 'movie';
};

interface PlexItem {
  ratingKey: string;
  key: string;
  title: string;
  year?: number;
  thumb?: string;
  art?: string;
  type: string;
  Guid?: { id: string }[];
  guid?: string;
}

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<PlexItem[]>([]);
  const [tvShows, setTvShows] = useState<PlexItem[]>([]);
  const [plexBaseUrl, setPlexBaseUrl] = useState('');
  const [plexToken, setPlexToken] = useState('');

  useEffect(() => {
    checkPlexAndLoad();
  }, []);

  const checkPlexAndLoad = async () => {
    try {
      const settings = await getSettings();
      if (!settings.plexUrl || !settings.plexToken) {
        setConfigured(false);
        setLoading(false);
        return;
      }
      setConfigured(true);
      setPlexBaseUrl(settings.plexUrl);
      setPlexToken(settings.plexToken);

      const libraries = await PlexService.getLibraries();
      const movieLib = libraries.find((l: any) => l.type === 'movie');
      const tvLib = libraries.find((l: any) => l.type === 'show');

      const [moviesData, tvData] = await Promise.all([
        movieLib ? PlexService.getLibraryContents(movieLib.key) : Promise.resolve([]),
        tvLib ? PlexService.getLibraryContents(tvLib.key) : Promise.resolve([]),
      ]);

      setMovies(moviesData);
      setTvShows(tvData);
    } catch (e) {
      console.warn('Error loading Plex library:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = async (item: PlexItem) => {
    const mediaType = getMediaType(item);

    // Intentar obtener el TMDB ID directo desde los Guids de Plex
    let tmdbId = getTmdbIdFromGuids(item);

    // Si no tiene Guid en la lista, buscar metadata detallada del ítem
    if (!tmdbId) {
      try {
        const meta = await PlexService.getMediaMetadata(item.ratingKey);
        if (meta) tmdbId = getTmdbIdFromGuids(meta);
      } catch (_) {}
    }

    // Último fallback: buscar por título en TMDB
    if (!tmdbId) {
      try {
        const searchRes = await TMDBService.search(item.title);
        const found = searchRes.results?.find(
          (r: any) =>
            (r.title || r.name)?.toLowerCase() === item.title.toLowerCase()
        );
        if (found) tmdbId = found.id;
      } catch (_) {}
    }

    if (tmdbId) {
      router.push({
        pathname: '/detail',
        params: { id: tmdbId, mediaType },
      });
    } else {
      // Si no encontramos TMDB ID, navegar igual con el título como fallback
      router.push({
        pathname: '/detail',
        params: { id: item.ratingKey, mediaType, plexFallback: '1' },
      });
    }
  };

  const getPosterUrl = (item: PlexItem): string | null => {
    if (!item.thumb || !plexBaseUrl || !plexToken) return null;
    return `${plexBaseUrl}${item.thumb}?X-Plex-Token=${plexToken}`;
  };

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.emptyText, { marginTop: theme.spacing.md }]}>
          Cargando biblioteca de Plex...
        </Text>
      </View>
    );
  }

  if (!configured) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Plex no configurado</Text>
        <Text style={styles.emptyText}>Ve a Ajustes para conectar tu servidor Plex.</Text>
        <Pressable
          style={styles.goToSettingsButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.goToSettingsText}>Ir a Ajustes</Text>
        </Pressable>
      </View>
    );
  }

  const currentData = activeTab === 'movies' ? movies : tvShows;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
          onPress={() => setActiveTab('movies')}
        >
          <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>
            Películas ({movies.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'tv' && styles.activeTab]}
          onPress={() => setActiveTab('tv')}
        >
          <Text style={[styles.tabText, activeTab === 'tv' && styles.activeTabText]}>
            Series ({tvShows.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={currentData}
        numColumns={3}
        keyExtractor={(item) => item.ratingKey || item.key}
        renderItem={({ item }) => {
          const posterUrl = getPosterUrl(item);
          return (
            <Pressable
              style={styles.gridItem}
              onPress={() => handleItemPress(item)}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <View style={styles.card}>
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    style={styles.poster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.posterPlaceholder}>
                    <Text style={styles.placeholderText}>🎬</Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.year && (
                    <Text style={styles.cardYear}>{item.year}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'movies'
                ? 'No hay películas en tu biblioteca de Plex.'
                : 'No hay series en tu biblioteca de Plex.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  gridItem: {
    width: '33.33%',
    padding: theme.spacing.xs,
  },
  card: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  posterPlaceholder: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  cardInfo: {
    padding: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardYear: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },
  goToSettingsButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  goToSettingsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
