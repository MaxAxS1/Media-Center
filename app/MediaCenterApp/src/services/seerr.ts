/**
 * @file seerr.ts
 * @description Cliente HTTP para la API de Seerr (sucesor de Overseerr).
 * Gestiona solicitudes de descarga de películas y series, consulta de estado
 * de contenido, y eliminación de contenido del servidor.
 *
 * Endpoints base: /api/v1/
 * Autenticación: Header X-Api-Key
 */
import { getSettings } from './apiClient';
import { SeerrMediaRequest } from '../types';

const fetchSeerr = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const settings = await getSettings();
  const baseUrl = settings.seerrUrl;
  const apiKey = settings.seerrApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error('Seerr configuration is missing');
  }

  const url = `${baseUrl}/api/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Seerr API error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

export class SeerrService {
  static async searchMedia(query: string) {
    return fetchSeerr<any>(`/search?query=${encodeURIComponent(query)}`);
  }

  static async requestMovie(tmdbId: number, qualityProfileId?: number) {
    return fetchSeerr<any>('/request', {
      method: 'POST',
      body: JSON.stringify({
        mediaId: tmdbId,
        mediaType: 'movie',
        ...(qualityProfileId ? { profileId: qualityProfileId } : {}),
      }),
    });
  }

  static async requestTV(tmdbId: number, seasons?: number[], qualityProfileId?: number) {
    return fetchSeerr<any>('/request', {
      method: 'POST',
      body: JSON.stringify({
        mediaId: tmdbId,
        mediaType: 'tv',
        ...(seasons && seasons.length > 0 ? { seasons } : {}),
        ...(qualityProfileId ? { profileId: qualityProfileId } : {}),
      }),
    });
  }

  static async getRequests(page: number = 1) {
    return fetchSeerr<{ results: SeerrMediaRequest[], pageInfo: any }>(`/request?take=20&skip=${(page - 1) * 20}`);
  }

  static async getRequestStatus(requestId: number) {
    return fetchSeerr<SeerrMediaRequest>(`/request/${requestId}`);
  }

  static async getMediaStatus(tmdbId: number, mediaType: 'movie' | 'tv') {
    return fetchSeerr<any>(`/${mediaType}/${tmdbId}`);
  }

  static async cancelRequest(requestId: number) {
    return fetchSeerr<any>(`/request/${requestId}`, {
      method: 'DELETE',
    });
  }

  // Deletes media from Radarr/Sonarr AND disk via Seerr
  static async deleteMedia(mediaId: number) {
    return fetchSeerr<any>(`/media/${mediaId}`, {
      method: 'DELETE',
    });
  }
}
