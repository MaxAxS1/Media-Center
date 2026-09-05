import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';
import { SERVER_CONFIG, TMDB_CONFIG } from '../config/api';

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const settingsJson = await AsyncStorage.getItem('APP_SETTINGS');
    if (settingsJson) {
      return JSON.parse(settingsJson) as AppSettings;
    }
  } catch (error) {
    console.error('Failed to load settings from AsyncStorage', error);
  }

  // Fallback to config
  return {
    tmdbApiKey: TMDB_CONFIG.API_KEY,
    serverIp: '192.168.1.X',
    seerrUrl: SERVER_CONFIG.SEERR_URL,
    seerrApiKey: SERVER_CONFIG.SEERR_API_KEY,
    sonarrUrl: SERVER_CONFIG.SONARR_URL,
    sonarrApiKey: SERVER_CONFIG.SONARR_API_KEY,
    radarrUrl: SERVER_CONFIG.RADARR_URL,
    radarrApiKey: SERVER_CONFIG.RADARR_API_KEY,
    plexUrl: SERVER_CONFIG.PLEX_URL,
    plexToken: SERVER_CONFIG.PLEX_TOKEN,
  };
};
