#!/bin/bash
# ============================================================
# 🎬 Media Center — Script de inicialización
# ============================================================
# Crea la estructura de directorios necesaria en tu servidor.
# Uso: bash setup.sh
# ============================================================

set -e

# Cargar variables del .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Copiá .env.example a .env y editá las rutas."
    exit 1
fi

echo "🎬 Media Center — Inicialización"
echo "================================"
echo "📂 DATA_PATH:   $DATA_PATH"
echo "📂 CONFIG_PATH: $CONFIG_PATH"
echo "🕐 TZ:          $TZ"
echo ""

# Crear estructura de datos (descargas + media)
echo "📁 Creando estructura de datos..."
mkdir -p "$DATA_PATH/torrents/movies"
mkdir -p "$DATA_PATH/torrents/tv"
mkdir -p "$DATA_PATH/media/movies"
mkdir -p "$DATA_PATH/media/tv"

# Crear estructura de configuración
echo "📁 Creando estructura de configuración..."
mkdir -p "$CONFIG_PATH/prowlarr"
mkdir -p "$CONFIG_PATH/radarr"
mkdir -p "$CONFIG_PATH/sonarr"
mkdir -p "$CONFIG_PATH/qbittorrent"
mkdir -p "$CONFIG_PATH/bazarr"
mkdir -p "$CONFIG_PATH/seerr"

echo ""
echo "✅ Estructura creada correctamente!"
echo ""
echo "📂 Estructura de datos:"
echo "   $DATA_PATH/"
echo "   ├── torrents/"
echo "   │   ├── movies/    ← Descargas de películas"
echo "   │   └── tv/        ← Descargas de series"
echo "   └── media/"
echo "       ├── movies/    ← Películas importadas"
echo "       └── tv/        ← Series importadas"
echo ""
echo "📂 Estructura de configuración:"
echo "   $CONFIG_PATH/"
echo "   ├── prowlarr/"
echo "   ├── radarr/"
echo "   ├── sonarr/"
echo "   ├── qbittorrent/"
echo "   ├── bazarr/"
echo "   └── seerr/"
echo ""
echo "🚀 Siguiente paso: docker compose up -d"
