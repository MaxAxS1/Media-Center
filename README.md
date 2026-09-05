# 🎬 Media Center & Mobile App

Sistema integral y automatizado para descubrimiento, solicitud, descarga y reproducción de películas y series en red local, acompañado de una **aplicación móvil Android personalizada (React Native + Expo)** inspirada en Netflix.

---

## 📌 Tabla de Contenidos

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Guía Rápida: Despliegue del Servidor (Docker)](#-guía-rápida-despliegue-del-servidor-docker)
4. [Configuración Inicial de los Servicios](#-configuración-inicial-de-los-servicios)
5. [Guía Rápida: Aplicación Móvil Android](#-guía-rápida-aplicación-móvil-android)
6. [Cómo Obtener las API Keys](#-cómo-obtener-las-api-keys)
7. [Preguntas Frecuentes y Solución de Problemas](#-preguntas-frecuentes-y-solución-de-problemas)

---

## 🏗 Arquitectura del Sistema

```text
📱 App Android (React Native + Expo)
   │
   ├──► TMDB API ──────────────► Tendencias, carátulas y recomendaciones
   ├──► Seerr API (/api/v1) ────► Envío de solicitudes y monitoreo en vivo
   └──► Plex API ──────────────► Exploración del catálogo personal
          │
          ▼
⚙️ Servidor Local (Docker Stack en Windows/Linux)
   ├── [Seerr:5055] ──► Centraliza las peticiones de la app móvil
   │        │
   │        ├──► [Radarr:7878]  ──► Monitoreo de Películas (WEB-DL 1080p / 4K)
   │        └──► [Sonarr:8989]  ──► Monitoreo de Series y nuevos episodios
   │                  │
   ├── [Prowlarr:9696]◄┘ (Sincroniza rastreadores e indexadores de torrents)
   │        │
   ├── [qBittorrent:8080] ◄── Descarga con carpetas dedicadas (radarr / tv-sonarr)
   │        │
   ├── [Bazarr:6767] ──────► Descarga automática de subtítulos en Español Latino
   │        │
   └── [Plex Media Server] ─► Servidor de streaming y reproducción final
```

---

## 📂 Estructura del Proyecto

```text
Media-Center/
├── docker/
│   ├── docker-compose.yml       # Definición de los 6 servicios (Prowlarr, Radarr, Sonarr, qBittorrent, Bazarr, Seerr)
│   ├── .env.example             # Plantilla de variables y rutas de almacenamiento
│   ├── setup.sh                 # Script de creación de carpetas para Linux/WSL/Git Bash
│   └── README.md                # Guía avanzada de configuración paso a paso
├── app/
│   └── MediaCenterApp/          # Código fuente de la app Android (Expo Router + TypeScript)
│       ├── app/                 # Rutas de navegación (Tabs: Inicio, Buscar, Descargas, Biblioteca, Ajustes)
│       ├── src/
│       │   ├── screens/         # Pantallas principales
│       │   ├── components/      # Componentes reutilizables (MediaCard, MediaRow, LoadingSkeleton)
│       │   ├── services/        # Clientes de API (TMDB, Seerr, Plex, cliente común con AsyncStorage)
│       │   ├── config/          # Paleta de colores (tema cine oscuro) y constantes
│       │   └── types/           # Tipado TypeScript estricto
│       ├── app.json             # Configuración de paquete Android y Expo
│       └── README.md            # Manual de ejecución en teléfono móvil
└── README.md                    # Documentación principal del repositorio
```

---

## 🚀 Guía Rápida: Despliegue del Servidor (Docker)

### Requisitos
- PC con Windows 10/11 (o Linux) que funcione como servidor local.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado con motor **WSL 2**.
- [Plex Media Server](https://www.plex.tv/media-server-downloads/) instalado en el equipo.

### Pasos de Despliegue

1. **Clona o copia este repositorio en tu servidor**:
   ```bash
   git clone https://github.com/MaxAxS1/Media-Center.git
   cd Media-Center/docker
   ```

2. **Crea y ajusta el archivo de entorno**:
   Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre `.env` con un editor de texto y define el disco donde guardarás tus descargas y series/películas:
   ```ini
   DATA_PATH=D:/data
   CONFIG_PATH=C:/docker/config
   TZ=America/Argentina/Buenos_Aires
   PUID=1000
   PGID=1000
   ```

3. **Crea las carpetas de datos**:
   En PowerShell ejecuta:
   ```powershell
   mkdir -Force D:\data\torrents\movies
   mkdir -Force D:\data\torrents\tv
   mkdir -Force D:\data\media\movies
   mkdir -Force D:\data\media\tv
   ```

4. **Inicia el stack completo**:
   ```bash
   docker compose up -d
   ```
   Para comprobar que todos los contenedores arrancaron correctamente:
   ```bash
   docker compose ps
   ```

---

## 🌐 Configuración Inicial de los Servicios

Una vez levantados, ingresa a las interfaces web desde tu navegador:

| Servicio | URL Local | Configuración Clave |
| :--- | :--- | :--- |
| **Prowlarr** | `http://localhost:9696` | Agrega tus indexadores torrent y vincúlalo en *Settings > Apps* con Sonarr (`http://sonarr:8989`) y Radarr (`http://radarr:7878`). |
| **qBittorrent** | `http://localhost:8080` | Usuario `admin`. Crea 2 categorías en descargas: `radarr` (ruta `/data/torrents/movies`) y `tv-sonarr` (ruta `/data/torrents/tv`). |
| **Radarr** | `http://localhost:7878` | En *Media Management* ruta raíz: `/data/media/movies`. En *Download Clients* agrega qBittorrent (categoría `radarr`). Calidad recomendada: **WEB-DL 1080p y 4K** (desactivar Remux para streaming liviano). |
| **Sonarr** | `http://localhost:8989` | En *Media Management* ruta raíz: `/data/media/tv`. En *Download Clients* agrega qBittorrent (categoría `tv-sonarr`). Mismo perfil de calidad. |
| **Bazarr** | `http://localhost:6767` | En *Languages* selecciona **Spanish (Latin America)** como idioma preferido. Conecta proveedores como OpenSubtitles.com y Subdl. |
| **Seerr** | `http://localhost:5055` | Asistente inicial: conecta con tu Plex y con tus instancias de Radarr y Sonarr. En *Settings > General* obtén tu **API Key**. |

---

## 📱 Guía Rápida: Aplicación Móvil Android

### Cómo Probarla en tu Celular (Modo Desarrollo)

1. Instala **Expo Go** desde [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. Asegúrate de que tu celular y tu PC estén en la misma red Wi-Fi.
3. En la PC, abre una terminal en la carpeta de la app:
   ```bash
   cd app/MediaCenterApp
   npm install
   npx expo start
   ```
4. Selecciona `Proceed anonymously` y escanea el código QR desde la app **Expo Go**.

### Funcionalidades de la App
- **Inicio**: Carruseles interactivos con novedades mundiales de TMDB y títulos en cartelera.
- **Búsqueda**: Buscador predictivo en tiempo real y filtrado instantáneo por género.
- **Ficha Técnica**: Sinopsis, valoraciones, títulos similares y el botón **"Solicitar Descarga"**.
- **Descargas**: Monitor en vivo que consulta a Seerr para ver solicitudes activas, en proceso y completadas.
- **Biblioteca**: Visualización de los títulos almacenados en tu servidor local.
- **Ajustes**: Configuración persistente con botones para comprobar en directo la conexión con TMDB, Seerr y Plex.

---

## 🔑 Cómo Obtener las API Keys

1. **TMDB API Key (Gratuita)**:
   - Ingresa en [themoviedb.org](https://www.themoviedb.org/) y crea tu cuenta.
   - Ve a **Ajustes > API > Crear > Developer**.
   - Completa el breve formulario y copia tu **API Key (v3 auth)**.
   - Pégala en la pestaña **Ajustes** de tu app móvil.

2. **Seerr API Key**:
   - Abre Seerr en tu servidor (`http://localhost:5055` o `http://IP_DEL_SERVER:5055`).
   - Ve a **Settings > General** y copia la **API Key**.

3. **Plex Token (Opcional)**:
   - Entra a Plex Web en cualquier navegador.
   - En cualquier película, haz clic en `...` > **Obtener Información** > **Ver XML**.
   - Al final de la URL en la barra de direcciones copia el código posterior a `X-Plex-Token=`.

---

## ❓ Preguntas Frecuentes y Solución de Problemas

#### 1. ¿Por qué mi app no conecta con el servidor Docker?
Asegúrate de usar la **dirección IP local** de tu servidor (ejemplo: `http://192.168.1.50:5055`) y no `localhost`, ya que para tu teléfono `localhost` representa al mismo celular. Verifica además que el Firewall de Windows en la PC permita tráfico en los puertos correspondientes.

#### 2. ¿Por qué se configuraron perfiles WEB-DL en vez de Remux?
Los formatos *Remux* conservan el disco Blu-ray original sin comprimir (40 a 80 GB por archivo) y suelen requerir transcodificación intensiva si el reproductor no soporta el códec de audio/video. El perfil **WEB-DL 1080p / 4K** ofrece calidad visual nítida en archivos mucho más livianos (2 a 8 GB) que reproducen instantáneamente por streaming directo.

#### 3. ¿Cómo sincronizo cambios en el repositorio de GitHub?
Desde la carpeta raíz del proyecto puedes sincronizar con:
```bash
git add .
git commit -m "update: resumen de cambios"
git push origin main
```
