import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { TMDBService } from '../services/tmdb';
import { SeerrService } from '../services/seerr';
import { LocalStorageService } from '../services/localStorage';
import { MediaRow } from '../components/MediaRow';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { MediaItem } from '../types';

export default function DetailScreen() {
  const { id, mediaType } = useLocalSearchParams();
  const [details, setDetails] = useState<any>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'available' | 'downloading' | 'queued'>('none');
  const [isFavorite, setIsFavorite] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const mt = (mediaType as 'movie' | 'tv') || 'movie';
  const numId = Number(id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, similarData, favStatus, queuedStatus] = await Promise.all([
          TMDBService.getDetails(mt, numId),
          TMDBService.getSimilar(mt, numId),
          LocalStorageService.isFavorite(numId),
          LocalStorageService.isQueued(numId),
        ]);
        setDetails(data);
        setSimilar(similarData);
        setIsFavorite(favStatus);

        if (queuedStatus) {
          setRequestStatus('queued');
        }

        // Consultar a Seerr si el servidor está online
        try {
          const statusRes = await SeerrService.getMediaStatus(numId, mt);
          if (statusRes?.status === 5) {
            setRequestStatus('available');
          } else if (statusRes?.status === 4 || statusRes?.status === 3) {
            setRequestStatus('downloading');
          } else if (statusRes?.status === 2) {
            setRequestStatus('pending');
          }
        } catch (_) {
          // Si Seerr no responde (server apagado), mantenemos queued o none
          if (!queuedStatus) setRequestStatus('none');
        }
      } catch (error) {
        console.error('Error loading details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, mediaType]);

  const toggleFavorite = async () => {
    if (!details) return;
    const title = details.title || details.name || 'Sin título';
    const newStatus = await LocalStorageService.toggleFavorite({
      id: numId,
      title,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      media_type: mt,
      vote_average: details.vote_average || 0,
      addedAt: Date.now(),
    });
    setIsFavorite(newStatus);
    Alert.alert(
      newStatus ? '❤️ Agregado a Favoritos' : 'Eliminado de Favoritos',
      newStatus
        ? 'Tus recomendaciones en la pantalla de inicio ahora tendrán en cuenta este título.'
        : ''
    );
  };

  const handleRequest = async () => {
    if (!details) return;
    const title = details.title || details.name || 'Sin título';
    setRequesting(true);

    try {
      if (mt === 'movie') {
        await SeerrService.requestMovie(numId);
      } else {
        await SeerrService.requestTV(numId);
      }
      setRequestStatus('pending');
      Alert.alert('¡Solicitud enviada!', 'El servidor ya comenzó a procesar la descarga.');
    } catch (err: any) {
      // Si el servidor está apagado o fuera de red, lo guardamos en la cola local
      await LocalStorageService.addToQueue({
        tmdbId: numId,
        title,
        mediaType: mt,
        poster_path: details.poster_path,
      });
      setRequestStatus('queued');
      Alert.alert(
        '💾 Servidor apagado / no alcanzable',
        `Se guardó "${title}" en la Cola de Descargas de tu celular. Se enviará automáticamente cuando el servidor se encienda.`
      );
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSkeleton variant="detail" height={300} />
        <View style={styles.contentPadding}>
          <LoadingSkeleton variant="text" width={200} height={30} />
          <View style={{ height: 20 }} />
          <LoadingSkeleton variant="text" width={350} height={100} />
        </View>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se pudo cargar la información del contenido.</Text>
      </View>
    );
  }

  const getStatusButtonText = () => {
    if (requesting) return 'Procesando...';
    switch (requestStatus) {
      case 'available':
        return '✓ Disponible en Biblioteca';
      case 'downloading':
        return 'Descargando...';
      case 'pending':
        return '⏳ Pendiente en Servidor';
      case 'queued':
        return '🕒 En Cola Offline (Pendiente)';
      default:
        return '⬇ Solicitar Descarga';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={{ uri: `https://image.tmdb.org/t/p/w780${details.backdrop_path}` }}
        style={styles.backdrop}
      >
        <View style={styles.backdropOverlay} />
      </ImageBackground>

      <View style={styles.header}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w342${details.poster_path}` }}
          style={styles.poster}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{details.title || details.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {details.release_date?.substring(0, 4) || details.first_air_date?.substring(0, 4)}
            </Text>
            <Text style={styles.metaText}>⭐ {details.vote_average?.toFixed(1)}</Text>
          </View>
          <View style={styles.genres}>
            {details.genres?.map((g: any) => (
              <View key={g.id} style={styles.genreChip}>
                <Text style={styles.genreText}>{g.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.primaryButton,
            requestStatus !== 'none' && styles.buttonDisabled,
          ]}
          onPress={handleRequest}
          disabled={requestStatus !== 'none' || requesting}
        >
          {requesting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>{getStatusButtonText()}</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={toggleFavorite}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? theme.colors.primary : '#FFF'}
          />
          <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>
            {isFavorite ? 'En Favoritos' : 'Favorito'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sinopsis</Text>
        <Text style={styles.overview}>
          {details.overview || 'Sin descripción disponible para este título.'}
        </Text>
      </View>

      {similar.length > 0 && (
        <MediaRow
          title="Títulos Similares"
          data={similar}
          onItemPress={() => {}}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  contentPadding: {
    padding: theme.spacing.lg,
  },
  backdrop: {
    height: 250,
    width: '100%',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,20,20,0.5)',
  },
  header: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    marginTop: -80,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.lg,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  genreChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  genreText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  favoriteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favoriteButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
  },
  favoriteText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  favoriteTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  overview: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
