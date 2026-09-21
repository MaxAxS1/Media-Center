/**
 * @file tmdb.ts
 * @description Cliente para The Movie Database (TMDB) API v3.
 * Provee metadatos, búsqueda, géneros, trending, y paginación.
 *
 * Todas las funciones de listado aceptan `page` y retornan `{ results, total_pages }`
 * para soportar scroll infinito (TMDB permite hasta 500 páginas).
 *
 * Documentación oficial: https://developer.themoviedb.org/docs
 */
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
  static async getTrending(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'day',
    page: number = 1
  ): Promise<{ results: MediaItem[]; total_pages: number }> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(
      `/trending/${mediaType}/${timeWindow}`,
      { page: page.toString() }
    );
    return { results: result.results, total_pages: result.total_pages };
  }

  static async getPopular(mediaType: 'movie' | 'tv', page: number = 1): Promise<{ results: MediaItem[]; total_pages: number }> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(
      `/${mediaType}/popular`,
      { page: page.toString() }
    );
    return { results: result.results, total_pages: result.total_pages };
  }

  static async getPopularTV(): Promise<MediaItem[]> {
    const res = await TMDBService.getPopular('tv', 1);
    return res.results;
  }

  static async getPopularMovies(): Promise<MediaItem[]> {
    const res = await TMDBService.getPopular('movie', 1);
    return res.results;
  }

  static async getNowPlaying(): Promise<MediaItem[]> {
    const result = await fetchTMDB<TMDBSearchResult<TMDBMovie>>(`/movie/now_playing`);
    return result.results as MediaItem[];
  }

  static async getTopRated(
    mediaType: 'movie' | 'tv' = 'movie',
    page: number = 1
  ): Promise<{ results: MediaItem[]; total_pages: number }> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(
      `/${mediaType}/top_rated`,
      { page: page.toString(), sort_by: 'vote_average.desc', 'vote_count.gte': '200' }
    );
    return { results: result.results, total_pages: result.total_pages };
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

  static async discoverByGenre(
    mediaType: 'movie' | 'tv',
    genreId: number,
    page: number = 1
  ): Promise<{ results: MediaItem[]; total_pages: number }> {
    const result = await fetchTMDB<TMDBSearchResult<MediaItem>>(`/discover/${mediaType}`, {
      with_genres: genreId.toString(),
      page: page.toString(),
      sort_by: 'popularity.desc',
      'vote_count.gte': '20',
    });
    return { results: result.results, total_pages: result.total_pages };
  }

  static getImageUrl(path: string | null, size: string = 'original') {
    if (!path) return null;
    return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
  }
}

