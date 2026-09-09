# 🎬 Media Center - Guía de Instalación y Configuración

Este documento detalla toda la arquitectura, programas utilizados y las configuraciones exactas necesarias para desplegar este servidor multimedia automatizado desde cero.

## 🏗️ Arquitectura de Carpetas (Hardlinks)
Para que el sistema mueva los archivos instantáneamente sin duplicar espacio en el disco, usamos un único volumen principal en Docker llamado `/data`.

**En el host (Windows):**
- `F:\data\torrents\` -> Para descargas en bruto.
- `F:\data\media\movies\` -> Para las películas finales renombradas.
- `F:\data\media\tv\` -> Para las series finales renombradas.
- `F:\docker\config\` -> Para guardar la configuración de todos los contenedores.

---

## 🐳 Contenedores Docker (El Stack)
Todos los servicios se despliegan utilizando `docker-compose.yml`. Los programas incluidos son:

1. **qBittorrent (8080):** Cliente de descargas Torrent.
2. **Prowlarr (9696):** Gestor centralizado de indexadores (buscadores de torrents).
3. **Flaresolverr (8191):** Proxy invisible para saltar la protección Cloudflare de los trackers.
4. **Radarr (7878):** Automatización de búsqueda y gestión de Películas.
5. **Sonarr (8989):** Automatización de búsqueda y gestión de Series.
6. **Bazarr (6767):** Descarga automática de subtítulos (sincronizado con Radarr/Sonarr).
7. **Seerr (5055):** Portal web para que los usuarios soliciten películas/series (sucesor de Overseerr).

---

## ⚙️ Configuraciones Críticas de cada Programa

### 1. qBittorrent
- **Ruta de descarga:** Por defecto viene en `/downloads/`. Se modificó internamente a `/data/torrents/` para que coincida con el mapa de volúmenes de Radarr/Sonarr.
- **Auto-eliminación (Límite de Seedeo):** 
  - *Opciones > BitTorrent > Share Ratio Limiting.*
  - Activar "Seed torrents until their ratio reaches `0`".
  - Acción: **Pause torrent** (Pausar). Radarr/Sonarr se encargarán de borrarlo luego.

### 2. Prowlarr & Flaresolverr
- **Sincronización:** En *Settings > Apps*, se conectó Radarr y Sonarr usando sus respectivas API Keys (`Full Sync`).
- **Indexadores:** Se agregaron buscadores globales como `1337x`, `TorrentGalaxy` y `BT4G`.
- **Anti-Cloudflare:** Se agregó `FlareSolverr` en *Settings > Indexers > Indexers Proxies*. A los indexadores con protección (como 1337x) se les asignó el tag `cloudflare` para enrutar el tráfico automáticamente a través del proxy.

### 3. Radarr y Sonarr
- **Carpetas Raíz (Root Folders):** 
  - Radarr: `/data/media/movies/`
  - Sonarr: `/data/media/tv/`
- **Limpieza Automática:** En *Settings > Download Clients > qBittorrent*, se activó la opción **Remove Completed** (Eliminar completados) para mantener el disco limpio tras la importación.
- **Filtro Exclusivo "Español Latino":**
  - Se creó un *Custom Format* llamado `Español Latino` en Settings.
  - Regex: `(?i)\b(latino|lat|dual)\b`
  - En *Profiles*, se le asignó un valor de `100` y un *Minimum Custom Format Score* de `100`. Esto obliga al sistema a rechazar cualquier versión que no sea Latino.

### 4. Seerr
- **Conexión:** En *Settings > Services*, se conectaron las API de Radarr y Sonarr.
- Al agregar los servicios, se seleccionó el perfil de calidad y las carpetas raíz (`/data/media/...`) configuradas en el paso anterior para que Seerr pueda despachar los Requests de forma autónoma.

---

## 📱 Media Center App (React Native / Expo)
La aplicación móvil independiente permite ver colas y gestionar el servidor incluso estando fuera de casa (con descargas en caché y colas offline).

### Flujo de Trabajo (Managed Workflow)
El proyecto ha sido despojado de carpetas nativas (`/android` y `/ios`) para evitar conflictos de Gradle, Java y NDK. Se utiliza un flujo 100% Expo.

**Comandos útiles para la app (Ubicado en `/app/MediaCenterApp`):**
- Iniciar servidor de desarrollo en Expo Go:
  ```bash
  npx expo start
  ```
- Compilar el APK instalable en la nube (EAS Build) sin depender de Android Studio:
  ```bash
  npx eas-cli build -p android --profile preview
  ```
- *Nota:* Archivos clave como `src/config/api.ts` y `src/config/theme.ts` contienen las variables de configuración de la app y deben persistir en Git.
