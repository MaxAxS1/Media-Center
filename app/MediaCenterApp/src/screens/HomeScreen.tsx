import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ImageBackground,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { MediaRow } from '../components/MediaRow';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { TMDBService } from '../services/tmdb';
import { getSettings } from '../services/apiClient';
import { LocalStorageService } from '../services/localStorage';
import { MediaItem, FavoriteItem } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missingApiKey, setMissingApiKey] = useState(false);

  const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularTV, setPopularTV] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [personalizedRecs, setPersonalizedRecs] = useState<{ title: string; items: MediaItem[] }[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const loadData = async () => {
    try {
      const settings = await getSettings();
      if (!settings.tmdbApiKey) {
        setMissingApiKey(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setMissingApiKey(false);

      // Cargar listas públicas de TMDB (100% online en la nube, no dependen de tu servidor)
      const [trendingData, tvData, moviesData, topRatedData, favs] = await Promise.all([
        TMDBService.getTrending(),
        TMDBService.getPopularTV(),
        TMDBService.getPopularMovies(),
        TMDBService.getTopRated(),
        LocalStorageService.getFavorites(),
      ]);

      setTrending(trendingData);
      setPopularTV(tvData);
      setPopularMovies(moviesData);
      setTopRated(topRatedData);
      setFavorites(favs);

      if (trendingData.length > 0) {
        setHeroItem(trendingData[0]);
      }

      // Generar recomendaciones personalizadas basadas en tus favoritos guardados en el celular
      if (favs.length > 0) {
        const topFavs = favs.slice(0, 2); // Tomamos los 2 favoritos más recientes
        const recsPromises = topFavs.map(async (fav) => {
          try {
            const recItems = await TMDBService.getRecommendations(fav.media_type, fav.id);
            return {
              title: `✨ Porque te gustó "${fav.title}"`,
              items: recItems,
            };
          } catch (e) {
            return null;
          }
        });

        const recsResults = await Promise.all(recsPromises);
        setPersonalizedRecs(recsResults.filter((r): r is { title: string; items: MediaItem[] } => r !== null && r.items.length > 0));
      } else {
        setPersonalizedRecs([]);
      }
    } catch (error: any) {
      if (error?.message?.includes('TMDB API Key is missing')) {
        setMissingApiKey(true);
      } else {
        console.warn('Error loading home data:', error?.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload data whenever screen is focused (e.g. returning from Settings or Detail)
  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMediaPress = (item: MediaItem) => {
    router.push({
      pathname: '/detail',
      params: { id: item.id, mediaType: item.media_type || 'movie' },
    });
  };

  if (missingApiKey) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Ionicons name="film-outline" size={72} color={theme.colors.primary} />
        <Text style={styles.emptyTitle}>Falta configurar TMDB API Key</Text>
        <Text style={styles.emptySubtitle}>
          Para ver las tendencias, series y películas, ingresa tu clave gratuita de TMDB.
        </Text>
        <Pressable
          style={styles.goToSettingsButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.goToSettingsText}>Ir a Ajustes</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {loading ? (
        <LoadingSkeleton variant="detail" height={500} />
      ) : heroItem ? (
        <ImageBackground
          source={{
            uri: `https://image.tmdb.org/t/p/original${heroItem.backdrop_path}`,
          }}
          style={styles.heroContainer}
        >
          <LinearGradient
            colors={['transparent', 'rgba(15, 16, 20, 0.6)', '#0F1014']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroItem.title || heroItem.name}
            </Text>
            <Text style={styles.heroOverview} numberOfLines={3}>
              {heroItem.overview}
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => handleMediaPress(heroItem)}
              >
                <Text style={styles.primaryButtonText}>Solicitar</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => handleMediaPress(heroItem)}
              >
                <Text style={styles.secondaryButtonText}>Info</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : null}

      <View style={styles.content}>
        {/* Recomendaciones personalizadas independientes del servidor */}
        {personalizedRecs.map((rec, index) => (
          <MediaRow
            key={index}
            title={rec.title}
            data={rec.items}
            isLoading={loading}
            onItemPress={handleMediaPress}
          />
        ))}

        {/* Fila de Favoritos del usuario si existen */}
        {favorites.length > 0 && (
          <MediaRow
            title="❤️ Mi Lista"
            data={favorites.map((f) => ({
              id: f.id,
              title: f.title,
              poster_path: f.poster_path,
              backdrop_path: f.backdrop_path,
              overview: '',
              vote_average: f.vote_average,
              genre_ids: [],
              media_type: f.media_type,
            }))}
            isLoading={loading}
            onItemPress={handleMediaPress}
          />
        )}

        <MediaRow
          title="🔥 Tendencias Hoy"
          data={trending}
          isLoading={loading}
          onItemPress={handleMediaPress}
          onSeeAll={() => router.push({ pathname: '/list', params: { type: 'trending', mediaType: 'movie', title: 'Tendencias Hoy' } })}
        />
        <MediaRow
          title="📺 Series Populares"
          data={popularTV}
          isLoading={loading}
          onItemPress={handleMediaPress}
        />
        <MediaRow
          title="🎬 Películas Populares"
          data={popularMovies}
          isLoading={loading}
          onItemPress={handleMediaPress}
        />
        <MediaRow
          title="⭐ Mejor Valoradas"
          data={topRated}
          isLoading={loading}
          onItemPress={handleMediaPress}
          onSeeAll={() => router.push({ pathname: '/list', params: { type: 'top_rated', mediaType: 'movie', title: 'Mejor Valoradas' } })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  goToSettingsButton: {
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
  heroContainer: {
    height: 450,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: theme.spacing.lg,
    paddingTop: 120,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  heroOverview: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    paddingTop: theme.spacing.lg,
  },
});
