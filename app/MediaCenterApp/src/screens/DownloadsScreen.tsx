import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../config/theme';
import { SeerrService } from '../services/seerr';
import { SeerrMediaRequest } from '../types';

export default function DownloadsScreen() {
  const [activeTab, setActiveTab] = useState<'actives' | 'history'>('actives');
  const [requests, setRequests] = useState<SeerrMediaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await SeerrService.getRequests();
      if (data?.results) {
        setRequests(data.results);
      }
    } catch (e) {
      // Fallback if Seerr not configured or error
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // Status mapping:
  // 1: Pending, 2: Approved / Processing, 3: Declined, 4: Available
  const filtered = requests.filter((r) => {
    if (activeTab === 'actives') {
      return r.status === 1 || r.status === 2;
    }
    return r.status === 3 || r.status === 4;
  });

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
            Activas ({requests.filter((r) => r.status === 1 || r.status === 2).length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
          >
            Historial ({requests.filter((r) => r.status === 3 || r.status === 4).length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
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
                    {item.media.mediaType === 'movie' ? '🎬 Película' : '📺 Serie'} #
                    {item.media.tmdbId}
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
                  ? 'No hay descargas activas'
                  : 'No hay historial de solicitudes'}
              </Text>
              <Text style={styles.emptyText}>
                Cuando solicites una película o serie desde Inicio o Búsqueda, aparecerá
                aquí para monitorearla.
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
    paddingHorizontal: theme.spacing.md,
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: theme.colors.text.primary,
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
  },
  info: {
    flex: 1,
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
