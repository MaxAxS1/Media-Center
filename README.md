# 🎬 Media Center & Mobile App

Proyecto completo para automatizar la descarga, gestión y streaming de películas y series en un servidor personal, junto con una aplicación móvil Android personalizada construida en React Native + Expo.

---

## 📂 Estructura del Repositorio

- **`docker/`**: Pila de contenedores Docker Compose lista para producción:
  - **Prowlarr**: Gestor e indexador central de torrents.
  - **Sonarr**: Seguimiento y descarga automática de series de TV.
  - **Radarr**: Búsqueda y descarga automática de películas.
  - **qBittorrent**: Cliente torrent rápido y ligero con categorías dedicadas.
  - **Bazarr**: Descarga y sincronización automática de subtítulos en Español Latino.
  - **Seerr**: Interfaz web moderna (sucesor de Overseerr/Jellyseerr) para descubrir contenido y recibir solicitudes.
- **`app/MediaCenterApp/`**: Aplicación móvil para Android (Expo + React Native + TypeScript):
  - Integración con TMDB API para recomendaciones y tendencias.
  - Interfaz estilo cine / Netflix en modo oscuro.
  - Solicitudes directas de descarga a Seerr con un solo botón.
  - Monitoreo en vivo de descargas activas e historial.
  - Exploración de la biblioteca local de Plex.

---

## 🚀 Despliegue en el Servidor (Docker)

1. Ve a la carpeta `docker`:
   ```bash
   cd docker
   ```
2. Crea tu archivo `.env` a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` con las rutas de disco de tu servidor (`DATA_PATH` y `CONFIG_PATH`).
4. Inicia los servicios:
   ```bash
   docker compose up -d
   ```
5. Sigue las instrucciones paso a paso en [docker/README.md](docker/README.md).

---

## 📱 Ejecución de la App Móvil (Android)

1. Instala las dependencias (si lo clonas en una máquina nueva):
   ```bash
   cd app/MediaCenterApp
   npm install
   ```
2. Inicia Expo:
   ```bash
   npx expo start
   ```
3. Escanea el código QR con **Expo Go** en tu dispositivo Android.
4. Consulta [app/MediaCenterApp/README.md](app/MediaCenterApp/README.md) para más detalles.
