// ============================================================
// 🎬 Media Center — Configuración de APIs
// ============================================================
// Estos valores son los defaults del código.
// Las claves reales se configuran desde la pantalla de Ajustes
// de la app y se persisten en AsyncStorage.
// ============================================================

export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  // Dejá vacío aquí. Configuralo desde la pantalla de Ajustes.
  API_KEY: '',
};

export const SERVER_CONFIG = {
  // URL de Seerr/Overseerr (ej: http://192.168.1.50:5055)
  SEERR_URL: '',
  SEERR_API_KEY: '',

  // URL de Sonarr (ej: http://192.168.1.50:8989)
  SONARR_URL: '',
  SONARR_API_KEY: '',

  // URL de Radarr (ej: http://192.168.1.50:7878)
  RADARR_URL: '',
  RADARR_API_KEY: '',

  // URL de Plex (ej: http://192.168.1.50:32400)
  PLEX_URL: '',
  PLEX_TOKEN: '',
};
