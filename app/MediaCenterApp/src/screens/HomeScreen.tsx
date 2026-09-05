import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ImageBackground, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../config/theme';
import { MediaRow } from '../components/MediaRow';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { TMDBService } from '../services/tmdb';
import { MediaItem } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularTV, setPopularTV] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);

  const loadData = async () => {
    try {
      const [trendingData, tvData, moviesData, topRatedData] = await Promise.all([
        TMDBService.getTrending(),
        TMDBService.getPopularTV(),
        TMDBService.getPopularMovies(),
        TMDBService.getTopRated(),
      ]);

      setTrending(trendingData);
      setPopularTV(tvData);
      setPopularMovies(moviesData);
      setTopRated(topRatedData);
      
      if (trendingData.length > 0) {
        setHeroItem(trendingData[0]);
      }
    } catch (error) {
      console.error('Error loading home data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMediaPress = (item: MediaItem) => {
    router.push({ pathname: '/detail', params: { id: item.id, mediaType: item.media_type || 'movie' } });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {loading ? (
        <LoadingSkeleton variant="detail" height={450} />
      ) : heroItem ? (
        <ImageBackground
          source={{ uri: `https://image.tmdb.org/t/p/original${heroItem.backdrop_path}` }}
          style={styles.heroContainer}
        >
          <LinearGradient
            colors={['transparent', 'rgba(20,20,20,0.8)', '#141414']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroItem.title || heroItem.name}
            </Text>
            <Text style={styles.heroOverview} numberOfLines={3}>
              {heroItem.overview}
            </Text>
            <View style={styles.heroActions}>
              <Pressable style={styles.primaryButton} onPress={() => handleMediaPress(heroItem)}>
                <Text style={styles.primaryButtonText}>Solicitar</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => handleMediaPress(heroItem)}>
                <Text style={styles.secondaryButtonText}>Ver Detalles</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : null}

      <View style={styles.content}>
        <MediaRow
          title="🔥 Tendencias Hoy"
          data={trending}
          isLoading={loading}
          onItemPress={handleMediaPress}
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
