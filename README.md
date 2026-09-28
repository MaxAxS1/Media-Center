# 🎬 Media Center

Un sistema completo de gestión y descarga de contenido multimedia, compuesto por una **app móvil Android** y una **infraestructura de servidor** basada en Docker.

---

## 📱 App Móvil — Media Center App

App nativa para Android construida con **Expo (React Native)** que permite buscar, solicitar y gestionar películas y series directamente desde tu celular.

### Características
- 🏠 **Home** — Tendencias, Top Rated y populares con scroll infinito
- 🔍 **Búsqueda** — Búsqueda en tiempo real con historial de 7 días + explorar por género
- 🎬 **Detalle** — Sinopsis, géneros, calificación, solicitar descarga con selector de calidad y eliminar contenido
- 📚 **Biblioteca** — Visualiza tu contenido de Plex con posters e ingresa al detalle
- ⬇️ **Descargas** — Cola offline: las solicitudes se guardan y se sincronizan cuando el servidor vuelve a estar online
- ⚙️ **Ajustes** — Configuración de URLs y API Keys de todos los servicios

### Stack Tecnológico
- **Framework:** Expo (Managed Workflow) + Expo Router v3
- **UI:** React Native con estilos propios (sin UI libraries)
- **Build:** EAS Build (cloud, no requiere Android Studio)
- **Almacenamiento local:** AsyncStorage
- **APIs consumidas:** TMDB, Seerr, Radarr, Sonarr, Plex

---

## 🖥️ Infraestructura del Servidor

Todos los servicios corren en **Docker Desktop** sobre Windows. Plex corre de forma nativa.

### Diagrama de Flujo

```
App Móvil
    │
    ├─► TMDB API ──────────────────── Metadatos, posters, búsqueda
    │
    └─► Seerr (5055) ──────────────── Gestión de solicitudes
            │
            ├─► Radarr (7878) ──────── Automatización de películas
            │       └─► qBittorrent (8080) ──── Descarga torrent
            │               └─► /data/media/movies ──► Plex
            │
            ├─► Sonarr (8989) ──────── Automatización de series
            │       └─► qBittorrent (8080) ──── Descarga torrent
            │               └─► /data/media/tv ──────► Plex
            │
            └─► Plex (32400) ──────── Reproducción (nativo en Windows)

Prowlarr (9696) ──── Indexadores torrent → Radarr + Sonarr
Bazarr (6767) ────── Subtítulos automáticos ← Sonarr + Radarr
Flaresolverr (8191) ── Proxy anti-Cloudflare para indexadores
```

### Servicios

| Servicio | Puerto | Descripción |
|---|---|---|
| **Plex** | 32400 | Servidor de medios (nativo Windows) |
| **Seerr** | 5055 | Portal de solicitudes (sucesor de Overseerr) |
| **Radarr** | 7878 | Automatización y gestión de películas |
| **Sonarr** | 8989 | Automatización y gestión de series |
| **qBittorrent** | 8080 | Cliente de descargas torrent |
| **Prowlarr** | 9696 | Gestor centralizado de indexadores |
| **Bazarr** | 6767 | Descarga automática de subtítulos |
| **Flaresolverr** | 8191 | Proxy para bypass de Cloudflare |

---

## 🚀 Instalación del Servidor

### Prerrequisitos
- Windows 10/11
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [Plex Media Server](https://www.plex.tv/media-server-downloads/) instalado nativamente

### 1. Clonar el repositorio

```bash
git clone https://github.com/MaxAxS1/Media-Center.git
cd Media-Center
```

### 2. Configurar variables de entorno

Copiá el archivo de ejemplo y editalo:

```bash
cp docker/.env.example docker/.env
```

Editá `docker/.env`:

```env
# Zona horaria
TZ=America/Argentina/Buenos_Aires

# Usuario/Grupo Linux (en Windows usar 1000)
PUID=1000
PGID=1000

# Rutas absolutas del servidor
CONFIG_PATH=F:/docker/config
DATA_PATH=F:/data
```

### 3. Levantar los contenedores

```bash
cd docker
docker compose up -d
```

### 4. Estructura de carpetas de datos

```
F:\data\
├── torrents\          ← qBittorrent descarga aquí
│   ├── movies\
│   └── tv\
└── media\             ← Plex lee desde aquí
    ├── movies\
    └── tv\
```

---

## 📱 Compilar la App

### Prerrequisitos
- Node.js 18+
- Cuenta gratuita en [expo.dev](https://expo.dev)

### 1. Instalar dependencias

```bash
cd app/MediaCenterApp
npm install
npx eas-cli login
```

### 2. Configurar la app

Editá `src/config/api.ts` con las IPs y API Keys de tus servicios:

```typescript
export const SERVER_CONFIG = {
  SEERR_URL:     'http://TU-IP:5055',
  SEERR_API_KEY: 'tu-api-key-de-seerr',
  RADARR_URL:    'http://TU-IP:7878',
  RADARR_API_KEY:'tu-api-key-de-radarr',
  SONARR_URL:    'http://TU-IP:8989',
  SONARR_API_KEY:'tu-api-key-de-sonarr',
  PLEX_URL:      'http://TU-IP:32400',
  PLEX_TOKEN:    'tu-plex-token',
};

export const TMDB_CONFIG = {
  API_KEY: 'tu-api-key-de-tmdb',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
};
```

> **Consejo:** Si usás ZeroTier o Tailscale para acceder desde fuera de tu casa, usá la IP de VPN como `TU-IP`.

### 3. Generar el APK

```bash
npx eas-cli build -p android --profile preview
```

El build se realiza en la nube (~5-10 minutos). Al terminar te genera un link de descarga del `.apk` para instalar directamente en tu celular.

---

## 🌐 Acceso Remoto

Para acceder a los servicios desde fuera de casa, el proyecto está configurado para funcionar con **ZeroTier** o **Tailscale**.

### Con ZeroTier
1. Instalá ZeroTier en tu PC y en tu celular/TV
2. Uníte a la misma red desde todos los dispositivos
3. Usá la IP de ZeroTier de tu PC (ej: `10.x.x.x`) como `TU-IP` en la configuración de la app

### Con Tailscale
1. Instalá Tailscale en todos los dispositivos
2. Usá la IP de Tailscale de tu PC (ej: `100.x.x.x`) como `TU-IP`
3. En Plex → Configuración → Red → agregar `http://100.x.x.x:32400` en "URLs de acceso personalizado"
4. En Plex → Red → "Lista de IPs sin autenticación": agregar `100.64.0.0/10`

---

## 🎯 Configuración de Calidad de Contenido

### Perfiles de Calidad (Radarr y Sonarr)

| ID | Nombre | Uso recomendado |
|---|---|---|
| 3 | HD-720p | Conexión lenta o poco espacio |
| 4 | HD-1080p | **Recomendado** — Mejor relación calidad/tamaño |
| 5 | Ultra-HD | TV 4K con espacio de sobra |

### Audio en Español Latino
Formato personalizado configurado en Radarr y Sonarr:
- **Regex:** `(?i)\b(latino|lat|dual|multi)\b`
- **Score:** 100 pts
- `minFormatScore = 0` → permite inglés como fallback
- `cutoffFormatScore = 100` → deja de buscar upgrades cuando encuentra latino

---

## 📁 Estructura del Proyecto

```
Media-Center/
├── app/
│   └── MediaCenterApp/          ← App Expo/React Native
│       ├── app/                 ← Rutas (Expo Router)
│       │   ├── (tabs)/          ← Tabs principales
│       │   │   ├── index.tsx    ← Home
│       │   │   ├── search.tsx   ← Búsqueda
│       │   │   ├── library.tsx  ← Biblioteca Plex
│       │   │   ├── downloads.tsx← Cola de descargas
│       │   │   └── settings.tsx ← Ajustes
│       │   ├── detail.tsx       ← Detalle de película/serie
│       │   └── list.tsx         ← Lista con scroll infinito
│       └── src/
│           ├── components/      ← Componentes reutilizables
│           │   ├── MediaCard.tsx
│           │   ├── MediaRow.tsx
│           │   └── LoadingSkeleton.tsx
│           ├── config/
│           │   ├── api.ts       ← URLs y API Keys
│           │   └── theme.ts     ← Paleta de colores y estilos
│           ├── screens/         ← Pantallas principales
│           │   ├── HomeScreen.tsx
│           │   ├── SearchScreen.tsx
│           │   ├── DetailScreen.tsx
│           │   ├── LibraryScreen.tsx
│           │   ├── DownloadsScreen.tsx
│           │   └── SettingsScreen.tsx
│           ├── services/        ← Clientes de API
│           │   ├── tmdb.ts      ← TMDB (metadatos)
│           │   ├── seerr.ts     ← Seerr (solicitudes)
│           │   ├── plex.ts      ← Plex (biblioteca)
│           │   ├── localStorage.ts ← AsyncStorage (favoritos, historial, cola)
│           │   ├── apiClient.ts ← Configuración general
│           │   └── notifications.ts
│           └── types/
│               └── index.ts     ← Tipos TypeScript globales
└── docker/
    ├── docker-compose.yml       ← Stack completo de servicios
    └── .env.example             ← Plantilla de configuración
```

---

## 🔧 Firewall de Windows

Para que los servicios sean accesibles desde otros dispositivos (celular, TV), es necesario abrir los puertos en el Firewall de Windows. Ejecutá en PowerShell como administrador:

```powershell
New-NetFirewallRule -DisplayName "Media Center - Seerr"       -Direction Inbound -Protocol TCP -LocalPort 5055 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Media Center - Radarr"      -Direction Inbound -Protocol TCP -LocalPort 7878 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Media Center - Sonarr"      -Direction Inbound -Protocol TCP -LocalPort 8989 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Media Center - qBittorrent" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Media Center - Prowlarr"    -Direction Inbound -Protocol TCP -LocalPort 9696 -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Media Center - Bazarr"      -Direction Inbound -Protocol TCP -LocalPort 6767 -Action Allow -Profile Any
```

---

## 📝 Obtener API Keys

| Servicio | Dónde obtenerla |
|---|---|
| **TMDB** | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) — Gratuita |
| **Radarr** | Settings → General → API Key |
| **Sonarr** | Settings → General → API Key |
| **Prowlarr** | Settings → General → API Key |
| **Seerr** | Settings → General → API Key |
| **Plex Token** | [Cómo encontrar tu token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/) |

---

## 🛠️ Solución de Problemas Comunes

### La app dice "Servidor apagado"
1. Verificá que Docker Desktop esté corriendo
2. Verificá que los contenedores estén activos: `docker ps`
3. Verificá que el Firewall de Windows tenga los puertos abiertos (ver sección anterior)
4. Si estás fuera de casa, verificá que ZeroTier/Tailscale esté conectado en ambos dispositivos

### Plex aparece offline en la app de Plex
- Agregá tu IP de VPN (ZeroTier/Tailscale) en Plex → Configuración → Red → "URL de acceso personalizado"
- Formato: `http://TU-IP-VPN:32400`

### Sonarr no encuentra series en español latino
- Sonarr busca por título en inglés. Para series con nombre muy diferente al original, usá Prowlarr para buscar manualmente y agregá el torrent a qBittorrent con la categoría `tv-sonarr`

### Seerr tarda en cargar el estado de una película
- Es normal: la app muestra la pantalla inmediatamente con los datos de TMDB y consulta el estado a Seerr en segundo plano (~600ms). El botón se actualiza solo cuando llega la respuesta.

### Error en Sonarr/Radarr: "All indexers are temporarily unavailable"
Este error ocurre cuando Prowlarr y Sonarr/Radarr pierden sincronización (generalmente porque se desactivaron indexadores en Prowlarr y quedaron "huérfanos" en Sonarr).
**Solución:**
1. En Prowlarr (`http://localhost:9696`), andá a **System** -> **Tasks**.
2. Ejecutá la tarea **"Application Indexer Sync"** (ícono de recargar). Esto forzará a Prowlarr a eliminar los indexadores desactivados en Sonarr/Radarr.
3. En Sonarr/Radarr (`Settings` -> `Indexers`), dale al botón **Test All** para limpiar cualquier estado de error temporal de los indexadores activos.

---

## 📄 Licencia

Proyecto personal — Sin licencia definida.
