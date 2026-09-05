import { getSettings } from './apiClient';

const fetchPlex = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const settings = await getSettings();
  const baseUrl = settings.plexUrl;
  const token = settings.plexToken;

  if (!baseUrl || !token) {
    throw new Error('Plex configuration is missing');
  }

  const queryParams = new URLSearchParams({
    'X-Plex-Token': token,
    ...params,
  });

  const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Plex API error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

export class PlexService {
  static async getLibraries() {
    const data = await fetchPlex<any>('/library/sections');
    return data.MediaContainer.Directory || [];
  }

  static async getLibraryContents(libraryKey: string) {
    const data = await fetchPlex<any>(`/library/sections/${libraryKey}/all`);
    return data.MediaContainer.Metadata || [];
  }

  static async getRecentlyAdded() {
    const data = await fetchPlex<any>('/library/recentlyAdded');
    return data.MediaContainer.Metadata || [];
  }

  static async getOnDeck() {
    const data = await fetchPlex<any>('/library/onDeck');
    return data.MediaContainer.Metadata || [];
  }

  static async searchLibrary(query: string) {
    const data = await fetchPlex<any>('/search', { query });
    return data.MediaContainer.Metadata || [];
  }

  static async getMediaMetadata(ratingKey: string) {
    const data = await fetchPlex<any>(`/library/metadata/${ratingKey}`);
    return data.MediaContainer.Metadata?.[0] || null;
  }

  static async getImageUrl(thumbPath: string): Promise<string> {
    const settings = await getSettings();
    if (!settings.plexUrl || !settings.plexToken || !thumbPath) {
      return '';
    }
    return `${settings.plexUrl}${thumbPath}?X-Plex-Token=${settings.plexToken}`;
  }
}
