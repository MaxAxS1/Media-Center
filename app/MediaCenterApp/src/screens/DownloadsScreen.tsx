import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../config/theme';
import { SeerrService } from '../services/seerr';
import { LocalStorageService } from '../services/localStorage';
import { SeerrMediaRequest, OfflineQueueItem } from '../types';

export default function DownloadsScreen() {
  const [activeTab, setActiveTab] = useState<'actives' | 'offline_queue' | 'history'>('actives');
  const [requests, setRequests] = useState<SeerrMediaRequest[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      const [seerrData, queueData] = await Promise.all([
        SeerrService.getRequests().catch(() => ({ results: [] })),
        LocalStorageService.getQueue(),
      ]);

      if (seerrData?.results) {
        setRequests(seerrData.results);
      }
      setOfflineQueue(queueData);
    } catch (e) {
      setRequests([]);
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

  const syncQueue = async () => {
    if (offlineQueue.length === 0) return;
    setSyncing(true);
    const res = await LocalStorageService.syncPendingQueue();
    setSyncing(false);
    await loadData();

    if (res.synced > 0) {
      Alert.alert(
        '🚀 Sincronización exitosa',
        `Se enviaron ${res.synced} solicitudes pendientes a tu servidor.`
      );
    } else {
      Alert.alert(
        'Servidor aún inaccesible',
        'Tu servidor sigue apagado o no responde. Las solicitudes se mantienen seguras en la cola.'
      );
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return { label: 'Pendiente', color: theme.colors.warning };
      case 2:
        return { label: 'Descargando / Procesando', color: theme.colors.primary };
      case 3:
        return { label: 'Rechazado', color: theme.colors.error };
      case 4:
        return { label: 'Disponible', color: theme.colors.success };
      default:
        return { label: 'Desconocido', color: theme.colors.text.secondary };
    }
  };

  const activeRequests = requests.filter((r) => r.status === 1 || r.status === 2);
  const historyRequests = requests.filter((r) => r.status === 3 || r.status === 4);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'actives' && styles.activeTab]}
          onPress={() => setActiveTab('actives')}
        >
          <Text
            style={[styles.tabText, activeTab === 'actives' && styles.activeTabText]}
          >
            Activas ({activeRequests.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'offline_queue' && styles.activeTab]}
          onPress={() => setActiveTab('offline_queue')}
        >
          <Text
            style={[styles.tabText, activeTab === 'offline_queue' && styles.activeTabText]}
          >
            Cola Offline ({offlineQueue.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
          >
            Historial ({historyRequests.length})
          </Text>
        </Pressable>
      </View>

      {/* Botón de sincronizar cuando estamos en la pestaña Cola Offline */}
      {activeTab === 'offline_queue' && offlineQueue.length > 0 && (
        <Pressable
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={syncQueue}
          disabled={syncing}
        >
          <Text style={styles.syncButtonText}>
            {syncing ? 'Conectando con el servidor...' : '⚡ Sincronizar Cola con Servidor'}
          </Text>
        </Pressable>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'offline_queue' ? (
        <FlatList
          data={offlineQueue}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.title}>
                  {item.mediaType === 'movie' ? '🎬' : '📺'} {item.title}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.warning }]}>
                  ● Guardado localmente (Servidor en reposo)
                </Text>
                <Text style={styles.requestedBy}>
                  Fecha: {new Date(item.addedAt).toLocaleString()}
                </Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={async () => {
                  await LocalStorageService.removeFromQueue(item.tmdbId);
                  await loadData();
                }}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Cola offline vacía</Text>
              <Text style={styles.emptyText}>
                Si pides una película o serie mientras tu servidor está apagado, se guardará
                aquí para sincronizarse apenas vuelvas a encenderlo.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeTab === 'actives' ? activeRequests : historyRequests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusLabel(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.info}>
                  <Text style={styles.title}>
                    {item.media.mediaType === 'movie' ? '🎬' : '📺'}{' '}
                    {(item as any).media?.title ||
                      (item as any).media?.name ||
                      `${item.media.mediaType === 'movie' ? 'Película' : 'Serie'} TMDB #${item.media.tmdbId}`}
                  </Text>
                  <Text style={[styles.meta, { color: statusInfo.color }]}>
                    ● {statusInfo.label}
                  </Text>
                  <Text style={styles.requestedBy}>
                    Solicitado por: {item.requestedBy?.displayName || 'Tú'}
                  </Text>
                  <Text style={styles.eta}>
                    Fecha: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {activeTab === 'actives'
                  ? 'No hay descargas activas en el servidor'
                  : 'No hay historial en el servidor'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'actives'
                  ? 'Si el servidor está apagado, revisa la pestaña "Cola Offline".'
                  : 'Las descargas completadas aparecerán aquí.'}
              </Text>
            </View>
          }
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  syncButton: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  list: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  deleteButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  requestedBy: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 2,
  },
  eta: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  empty: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
