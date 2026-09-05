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

  static async requestMovie(tmdbId: number) {
    return fetchSeerr<any>('/request', {
      method: 'POST',
      body: JSON.stringify({
        mediaId: tmdbId,
        mediaType: 'movie',
      }),
    });
  }

  static async requestTV(tmdbId: number) {
    return fetchSeerr<any>('/request', {
      method: 'POST',
      body: JSON.stringify({
        mediaId: tmdbId,
        mediaType: 'tv',
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
}
