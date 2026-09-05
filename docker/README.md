# 🎬 Media Center — Guía de Setup

## Requisitos previos

- **Docker Desktop** instalado en el servidor ([Descargar](https://www.docker.com/products/docker-desktop/))
  - Durante la instalación, activar **WSL 2 backend**
- **Plex Media Server** ya instalado y funcionando
- Un disco con espacio suficiente para almacenar media

---

## 1. Configurar rutas

Editá el archivo `.env` con las rutas de tu servidor:

```ini
# Disco donde guardar descargas y media
DATA_PATH=D:/data

# Carpeta para configs de servicios (idealmente en SSD)
CONFIG_PATH=C:/docker/config

# Tu zona horaria
TZ=America/Argentina/Buenos_Aires
```

> **💡 Tip**: Si tu disco de almacenamiento es `E:\`, cambiá `DATA_PATH=E:/data`.

---

## 2. Crear directorios

Abrí una terminal (PowerShell o Git Bash) en la carpeta `docker/` y ejecutá:

```bash
# En Git Bash / WSL:
bash setup.sh

# O manualmente en PowerShell:
# Crear estructura de datos
mkdir -Force D:\data\torrents\movies
mkdir -Force D:\data\torrents\tv
mkdir -Force D:\data\media\movies
mkdir -Force D:\data\media\tv

# Crear estructura de configuración
mkdir -Force C:\docker\config\prowlarr
mkdir -Force C:\docker\config\radarr
mkdir -Force C:\docker\config\sonarr
mkdir -Force C:\docker\config\qbittorrent
mkdir -Force C:\docker\config\bazarr
mkdir -Force C:\docker\config\seerr
```

---

## 3. Levantar los servicios

```bash
docker compose up -d
```

Esperá ~2 minutos para que todos los servicios inicialicen. Verificá que estén corriendo:

```bash
docker compose ps
```

---

## 4. Configuración de cada servicio

### 4.1 Prowlarr (Indexadores) — `http://localhost:9696`

1. Abrí Prowlarr en el navegador
2. Creá una contraseña de administrador
3. Andá a **Indexers > Add (+)**
4. Agregá tus indexadores torrent (ej: 1337x, RARBG, TorrentGalaxy, etc.)
5. Andá a **Settings > Apps > Add (+)**:
   - **Radarr**:
     - Prowlarr Server: `http://prowlarr:9696`
     - Radarr Server: `http://radarr:7878`
     - API Key: (la copiás de Radarr > Settings > General)
   - **Sonarr**: igual pero con `http://sonarr:8989`

### 4.2 qBittorrent (Descargas) — `http://localhost:8080`

**Credenciales iniciales**: usuario `admin`, contraseña aparece en los logs:
```bash
docker logs qbittorrent
```

Configuración importante:
1. **Options > Downloads**:
   - Default Save Path: `/data/torrents`
   - ✅ Keep incomplete torrents in: `/data/torrents/incomplete`
2. **Crear categorías** (click derecho en panel izquierdo > Add Category):
   - `radarr` → Save Path: `/data/torrents/movies`
   - `tv-sonarr` → Save Path: `/data/torrents/tv`
3. **Options > BitTorrent**:
   - Seeding Limits: Ratio = `1.0` (o lo que prefieras)
   - When ratio is reached: **Pause torrent**

### 4.3 Radarr (Películas) — `http://localhost:7878`

1. **Settings > Media Management**:
   - Root Folder: `/data/media/movies`
   - ✅ Rename Movies
   - Movie Naming Format: `{Movie Title} ({Release Year}) - {Quality Full}`
2. **Settings > Quality > Profiles**:
   - Editar el perfil "HD - 1080p":
     - Activar: WEB-DL 1080p, WEB-DL 2160p, Bluray-1080p
     - **Desactivar Remux** (archivos muy pesados para streaming)
   - Upgrade Until: WEB-DL 2160p
3. **Settings > Download Clients > Add (+) > qBittorrent**:
   - Host: `qbittorrent`
   - Port: `8080`
   - Username: `admin`
   - Password: (la de qBittorrent)
   - Category: `radarr`
   - ✅ Remove Completed

### 4.4 Sonarr (Series) — `http://localhost:8989`

1. **Settings > Media Management**:
   - Root Folder: `/data/media/tv`
   - ✅ Rename Episodes
   - Season Folder Format: `Season {season:00}`
2. **Settings > Quality > Profiles**:
   - Igual que Radarr: WEB-DL 1080p, WEB-DL 2160p
   - **Desactivar Remux**
3. **Settings > Download Clients > Add (+) > qBittorrent**:
   - Igual que Radarr pero Category: `tv-sonarr`

### 4.5 Bazarr (Subtítulos) — `http://localhost:6767`

1. **Settings > Languages**:
   - Languages Filter: `Spanish (Latin America)`
   - Default: **Enabled**
   - Hearing Impaired: No
2. **Settings > Providers**:
   - Activar: **OpenSubtitles.com** (crear cuenta gratis), **Subdl**, **Podnapisi**
3. **Settings > Sonarr**:
   - Address: `sonarr`
   - Port: `8989`
   - API Key: (de Sonarr > Settings > General)
4. **Settings > Radarr**:
   - Address: `radarr`
   - Port: `7878`
   - API Key: (de Radarr > Settings > General)

### 4.6 Seerr (Descubrimiento) — `http://localhost:5055`

1. En el setup inicial, seleccioná **Plex**
2. Conectá tu cuenta de Plex
3. Configurá los servidores:
   - **Radarr**:
     - Hostname: `radarr`
     - Port: `7878`
     - API Key: (de Radarr)
     - Root Folder: `/data/media/movies`
     - Quality Profile: el que configuraste
   - **Sonarr**: igual con `sonarr:8989`
4. **Settings > Notifications > Add Agent**:
   - Agregá **Pushover** o **ntfy** para recibir notificaciones al celular

---

## 5. Verificar el flujo completo

1. Abrí Seerr (`localhost:5055`)
2. Buscá una película (ej: "Dune Part Two")
3. Hacé click en **Request**
4. Verificá que aparece en Radarr (`localhost:7878`) como monitoreada
5. Radarr debería buscar automáticamente → enviar a qBittorrent → descargar
6. Una vez descargada, Radarr importa y renombra → aparece en Plex
7. Bazarr descarga subtítulos en Español Latino

---

## Puertos de acceso rápido

| Servicio | URL | Función |
|:---|:---|:---|
| Prowlarr | `http://localhost:9696` | Gestionar indexadores |
| Radarr | `http://localhost:7878` | Gestionar películas |
| Sonarr | `http://localhost:8989` | Gestionar series |
| qBittorrent | `http://localhost:8080` | Ver descargas |
| Bazarr | `http://localhost:6767` | Gestionar subtítulos |
| Seerr | `http://localhost:5055` | Descubrir y solicitar |
| Plex | `http://localhost:32400/web` | Ver contenido |

---

## Comandos útiles

```bash
# Iniciar todos los servicios
docker compose up -d

# Ver estado de los servicios
docker compose ps

# Ver logs de un servicio específico
docker compose logs -f radarr

# Reiniciar un servicio
docker compose restart sonarr

# Detener todo
docker compose down

# Actualizar imágenes
docker compose pull && docker compose up -d
```
