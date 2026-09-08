import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { theme } from '../config/theme';
import { MediaCard } from '../components/MediaCard';
import { PlexService } from '../services/plex';
import { getSettings } from '../services/apiClient';
import { useRouter } from 'expo-router';

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<any[]>([]);
  const [tvShows, setTvShows] = useState<any[]>([]);

  useEffect(() => {
    checkPlexAndLoad();
  }, []);

  const checkPlexAndLoad = async () => {
    try {
      const settings = await getSettings();
      if (!settings.plexUrl || !settings.plexToken) {
        setConfigured(false);
        return;
      }
      setConfigured(true);

      // Cargar bibliotecas de Plex
      const libraries = await PlexService.getLibraries();
      const movieLib = libraries.find((l: any) => l.type === 'movie');
      const tvLib = libraries.find((l: any) => l.type === 'show');

      if (movieLib) {
        const moviesData = await PlexService.getLibraryContents(movieLib.key);
        setMovies(moviesData);
      }
      if (tvLib) {
        const tvData = await PlexService.getLibraryContents(tvLib.key);
        setTvShows(tvData);
      }
    } catch (e) {
      // Si Plex no responde, seguimos mostrando la UI pero vacía
      console.warn('Error loading Plex library:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <MediaCard
              title={item.title}
              posterPath={null}
              year={item.year?.toString()}
              onPress={() => {}}
            />
          </View>
        )}
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
