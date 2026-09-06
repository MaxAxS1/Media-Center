import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoriteItem, OfflineQueueItem } from '../types';
import { SeerrService } from './seerr';

const FAVORITES_KEY = 'LOCAL_FAVORITES';
const QUEUE_KEY = 'OFFLINE_DOWNLOAD_QUEUE';

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
}
