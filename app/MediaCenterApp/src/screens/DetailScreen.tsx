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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const router = useRouter();
  const [details, setDetails] = useState<any>(null);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'available' | 'downloading' | 'queued'>('none');
  const [isFavorite, setIsFavorite] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<any>(null); // Seerr media object (contains mediaId for deletion)

  const QUALITY_PROFILES = [
    { label: '📺 720p', description: 'HD - Liviano', id: 3 },
    { label: '🎬 1080p', description: 'Full HD — Recomendado', id: 4, recommended: true },
    { label: '💎 4K', description: 'Ultra HD — Requiere más espacio', id: 5 },
  ];

  const mt = (mediaType as 'movie' | 'tv') || 'movie';
  const numId = Number(id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // FASE 1: Cargar TMDB y storage local en paralelo → UI visible al instante
        const [data, similarData, favStatus, queuedStatus] = await Promise.all([
          TMDBService.getDetails(mt, numId),
          TMDBService.getSimilar(mt, numId),
          LocalStorageService.isFavorite(numId),
          LocalStorageService.isQueued(numId),
        ]);
        setDetails(data);
        setSimilar(similarData);
        setIsFavorite(favStatus);
        if (queuedStatus) setRequestStatus('queued');

        // Mostrar contenido YA (no esperar a Seerr)
        setLoading(false);

        // FASE 2: Consultar Seerr en background sin bloquear la UI
        SeerrService.getMediaStatus(numId, mt)
          .then((statusRes) => {
            if (statusRes) setMediaInfo(statusRes);
            if (statusRes?.status === 5) {
              setRequestStatus('available');
            } else if (statusRes?.status === 4 || statusRes?.status === 3) {
              setRequestStatus('downloading');
            } else if (statusRes?.status === 2) {
              setRequestStatus('pending');
            }
          })
          .catch(() => {
            if (!queuedStatus) setRequestStatus('none');
          });

      } catch (error) {
        console.error('Error loading details:', error);
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

  // Opens the quality selection modal instead of requesting immediately
  const handleRequest = () => {
    if (!details) return;
    setShowQualityModal(true);
  };

  // Called once user picks a quality from the modal
  const handleConfirmRequest = async (qualityProfileId: number) => {
    setShowQualityModal(false);
    if (!details) return;
    const title = details.title || details.name || 'Sin título';
    setRequesting(true);

    try {
      if (mt === 'movie') {
        await SeerrService.requestMovie(numId, qualityProfileId);
      } else {
        await SeerrService.requestTV(numId, undefined, qualityProfileId);
      }
      setRequestStatus('pending');
      Alert.alert('¡Solicitud enviada!', 'El servidor ya comenzó a procesar la descarga.');
    } catch (err: any) {
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

  const handleDelete = () => {
    const title = details?.title || details?.name || 'este contenido';
    const isPending = requestStatus === 'pending';
    Alert.alert(
      isPending ? '❌ Cancelar solicitud' : '🗑 Eliminar contenido',
      isPending
        ? `¿Cancelar la solicitud de descarga de "${title}"?`
        : `¿Eliminar "${title}" del servidor y del disco? Esta acción no se puede deshacer.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: isPending ? 'Cancelar solicitud' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (mediaInfo?.id) {
                await SeerrService.deleteMedia(mediaInfo.id);
              } else if (mediaInfo?.requests?.[0]?.id) {
                await SeerrService.cancelRequest(mediaInfo.requests[0].id);
              }
              setRequestStatus('none');
              setMediaInfo(null);
              Alert.alert('Listo', isPending ? 'Solicitud cancelada.' : 'Contenido eliminado del servidor.');
            } catch (e) {
              Alert.alert('Error', 'No se pudo completar la operación. Verificá que el servidor esté encendido.');
            }
          },
        },
      ]
    );
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

        {/* Delete / Cancel button — shown only when there's an active request or content */}
        {(requestStatus === 'pending' || requestStatus === 'available' || requestStatus === 'downloading') && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </Pressable>
        )}
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
          onItemPress={(item) =>
            router.push({
              pathname: '/detail',
              params: { id: item.id, mediaType: item.media_type || mt },
            })
          }
        />
      )}

      {/* Quality Selection Modal */}
      <Modal
        visible={showQualityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowQualityModal(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleccionar Calidad</Text>
            <Text style={styles.modalSubtitle}>
              {details?.title || details?.name}
            </Text>
            {QUALITY_PROFILES.map((profile) => (
              <Pressable
                key={profile.id}
                style={[styles.qualityOption, profile.recommended && styles.qualityOptionRecommended]}
                onPress={() => handleConfirmRequest(profile.id)}
              >
                <View style={styles.qualityOptionLeft}>
                  <Text style={styles.qualityLabel}>{profile.label}</Text>
                  <Text style={styles.qualityDescription}>{profile.description}</Text>
                </View>
                {profile.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recomendado</Text>
                  </View>
                )}
              </Pressable>
            ))}
            <Pressable style={styles.cancelModalButton} onPress={() => setShowQualityModal(false)}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  deleteButton: {
    width: 46,
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#FF444455',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xl + 16,
    gap: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  qualityOptionRecommended: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229,9,20,0.08)',
  },
  qualityOptionLeft: {
    gap: 3,
  },
  qualityLabel: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  qualityDescription: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  recommendedBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  recommendedText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cancelModalButton: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  cancelModalText: {
    color: theme.colors.text.secondary,
    fontSize: 15,
  },
});
