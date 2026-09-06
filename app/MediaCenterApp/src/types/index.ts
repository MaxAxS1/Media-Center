export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  media_type?: 'movie';
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  media_type?: 'tv';
}

export type TMDBMedia = TMDBMovie | TMDBTVShow;

// Unified type used by screens — contains all possible fields from movie/tv
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
}

export interface TMDBSearchResult<T = TMDBMedia> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export enum SeerrRequestStatus {
  PENDING = 1,
  APPROVED = 2,
  DECLINED = 3,
  AVAILABLE = 4,
}

export interface SeerrMediaRequest {
  id: number;
  status: SeerrRequestStatus;
  media: {
    id: number;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    status: number;
  };
  requestedBy: {
    id: number;
    email: string;
    displayName: string;
  };
  createdAt: string;
}

export interface DownloadProgress {
  id: string;
  title: string;
  progressPercentage: number;
  eta: string;
  status: string;
  quality: string;
}

export interface PlexLibraryItem {
  key: string;
  title: string;
  year: number;
  thumb: string;
  art: string;
  addedAt: number;
  viewCount?: number;
  lastViewedAt?: number;
  rating?: number;
  type: 'movie' | 'show' | 'season' | 'episode';
}

export interface Genre {
  id: number;
  name: string;
}

export interface AppSettings {
  tmdbApiKey: string;
  serverIp: string;
  seerrUrl: string;
  seerrApiKey: string;
  sonarrUrl: string;
  sonarrApiKey: string;
  radarrUrl: string;
  radarrApiKey: string;
  plexUrl: string;
  plexToken: string;
  serverMacAddress?: string;
}

export interface FavoriteItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
  vote_average: number;
  addedAt: number;
}

export interface OfflineQueueItem {
  id: number;
  tmdbId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  poster_path: string | null;
  addedAt: number;
  status: 'queued' | 'syncing' | 'failed';
}

