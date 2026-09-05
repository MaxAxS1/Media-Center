import { TMDB_CONFIG } from '../config/api';
import { TMDBSearchResult, TMDBMovie, Genre, MediaItem } from '../types';
import { getSettings } from './apiClient';

const fetchTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const settings = await getSettings();
  const apiKey = settings.tmdbApiKey;
  
  if (!apiKey) {
    throw new Error('TMDB API Key is missing');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: 'es-MX',
    ...params,
  });

  const url = `${TMDB_CONFIG.BASE_URL}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

export class TMDBService {
  static async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'day'): Promise<MediaItem[]> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/trending/${mediaType}/${timeWindow}`);
    return result.results;
  }

  static async getPopular(mediaType: 'movie' | 'tv'): Promise<MediaItem[]> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/${mediaType}/popular`);
    return result.results;
  }

  static async getPopularTV(): Promise<MediaItem[]> {
    return TMDBService.getPopular('tv');
  }

  static async getPopularMovies(): Promise<MediaItem[]> {
    return TMDBService.getPopular('movie');
  }

  static async getNowPlaying(): Promise<MediaItem[]> {
    const result = await fetchTMDB<TMDBSearchResult<TMDBMovie>>(`/movie/now_playing`);
    return result.results as MediaItem[];
  }

  static async getTopRated(mediaType: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/${mediaType}/top_rated`);
    return result.results;
  }

  static async search(query: string, page: number = 1) {
    return fetchTMDB<TMDBSearchResult<MediaItem>>(`/search/multi`, { query, page: page.toString() });
  }

  static async getDetails(mediaType: 'movie' | 'tv', id: number) {
    return fetchTMDB<any>(`/${mediaType}/${id}`, { append_to_response: 'videos,credits' });
  }

  static async getRecommendations(mediaType: 'movie' | 'tv', id: number) {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/${mediaType}/${id}/recommendations`);
    return result.results;
  }

  static async getSimilar(mediaType: 'movie' | 'tv', id: number) {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/${mediaType}/${id}/similar`);
    return result.results;
  }

  static async getGenres(mediaType: 'movie' | 'tv') {
    const response = await fetchTMDB<{ genres: Genre[] }>(`/genre/${mediaType}/list`);
    return response.genres;
  }

  static async discoverByGenre(mediaType: 'movie' | 'tv', genreId: number) {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/discover/${mediaType}`, { with_genres: genreId.toString() });
    return result.results;
  }

  static getImageUrl(path: string | null, size: string = 'original') {
    if (!path) return null;
    return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
  }
}

