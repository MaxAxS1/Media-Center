/**
 * @file localStorage.ts
 * @description Servicio de persistencia local usando AsyncStorage.
 *
 * Gestiona:
 * - **Favoritos**: lista de títulos marcados por el usuario.
 * - **Cola offline**: solicitudes pendientes que se sincronizan cuando el servidor vuelve online.
 * - **Historial de búsqueda**: últimas 20 búsquedas, con expiración automática a los 7 días.
 * - **Notificaciones**: estado del último ID notificado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FavoriteItem, OfflineQueueItem } from '../types';
import { SeerrService } from './seerr';

const FAVORITES_KEY = 'LOCAL_FAVORITES';
const QUEUE_KEY = 'OFFLINE_DOWNLOAD_QUEUE';
const SEARCH_HISTORY_KEY = 'SEARCH_HISTORY';
const SEARCH_HISTORY_MAX = 20;
const SEARCH_HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

export interface SearchHistoryItem {
  query: string;
  timestamp: number; // Date.now()
}

export class LocalStorageService {
  // ================= FAVORITOS / RECOMENDACIONES =================
  static async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching favorites', e);
      return [];
    }
  }

  static async isFavorite(id: number): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some((f) => f.id === id);
  }

  static async addFavorite(item: FavoriteItem): Promise<void> {
    const favorites = await this.getFavorites();
    if (!favorites.some((f) => f.id === item.id)) {
      favorites.unshift(item);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }

  static async removeFavorite(id: number): Promise<void> {
    const favorites = await this.getFavorites();
    const updated = favorites.filter((f) => f.id !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  }

  static async toggleFavorite(item: FavoriteItem): Promise<boolean> {
    const isFav = await this.isFavorite(item.id);
    if (isFav) {
      await this.removeFavorite(item.id);
      return false;
    } else {
      await this.addFavorite(item);
      return true;
    }
  }

  // ================= COLA OFFLINE DE DESCARGAS =================
  static async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching queue', e);
      return [];
    }
  }

  static async isQueued(tmdbId: number): Promise<boolean> {
    const queue = await this.getQueue();
    return queue.some((q) => q.tmdbId === tmdbId);
  }

  static async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'addedAt' | 'status'>): Promise<OfflineQueueItem> {
    const queue = await this.getQueue();
    const newItem: OfflineQueueItem = {
      ...item,
      id: Date.now(),
      addedAt: Date.now(),
      status: 'queued',
    };
    queue.unshift(newItem);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newItem;
  }

  static async removeFromQueue(tmdbId: number): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.filter((q) => q.tmdbId !== tmdbId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  }

  // Sincronizar solicitudes pendientes con el servidor cuando vuelva a estar online
  static async syncPendingQueue(): Promise<{ synced: number; remaining: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { synced: 0, remaining: 0 };

    const remainingQueue: OfflineQueueItem[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        if (item.mediaType === 'movie') {
          await SeerrService.requestMovie(item.tmdbId);
        } else {
          await SeerrService.requestTV(item.tmdbId);
        }
        syncedCount++;
      } catch (err) {
        // Servidor sigue sin responder para este item
        remainingQueue.push({ ...item, status: 'failed' });
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    return { synced: syncedCount, remaining: remainingQueue.length };
  }

  // ================= NOTIFICACIONES =================
  static async isPushEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem('PUSH_ENABLED');
      return val !== 'false';
    } catch {
      return true;
    }
  }

  static async getLastNotifiedId(): Promise<number | null> {
    try {
      const val = await AsyncStorage.getItem('LAST_NOTIFIED_ID');
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  static async setLastNotifiedId(id: number): Promise<void> {
    try {
      await AsyncStorage.setItem('LAST_NOTIFIED_ID', id.toString());
    } catch (error) {
      console.error(error);
    }
  }

  // ================= HISTORIAL DE BÚSQUEDA =================

  /** Devuelve el historial, filtrando entradas más viejas que 7 días */
  static async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      const all: SearchHistoryItem[] = data ? JSON.parse(data) : [];
      const cutoff = Date.now() - SEARCH_HISTORY_TTL_MS;
      return all.filter((item) => item.timestamp >= cutoff);
    } catch (e) {
      console.error('Error fetching search history', e);
      return [];
    }
  }

  /** Agrega una búsqueda al historial (evita duplicados, mantiene máx 20 entradas) */
  static async addToSearchHistory(query: string): Promise<void> {
    if (!query.trim()) return;
    try {
      const history = await this.getSearchHistory();
      // Eliminar entrada duplicada si ya existe (para moverla al tope)
      const filtered = history.filter(
        (h) => h.query.toLowerCase() !== query.toLowerCase()
      );
      const updated: SearchHistoryItem[] = [
        { query: query.trim(), timestamp: Date.now() },
        ...filtered,
      ].slice(0, SEARCH_HISTORY_MAX);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving search history', e);
    }
  }

  /** Elimina una entrada específica del historial */
  static async removeFromSearchHistory(query: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const updated = history.filter(
        (h) => h.query.toLowerCase() !== query.toLowerCase()
      );
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error removing search history item', e);
    }
  }

  /** Borra todo el historial */
  static async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.error('Error clearing search history', e);
    }
  }
}
