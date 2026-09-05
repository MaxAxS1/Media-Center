# 📱 Media Center App — Manual de Uso y Ejecución

Esta aplicación móvil (desarrollada con **React Native + Expo**) te permite descubrir tendencias, ver recomendaciones y solicitar descargas automáticas a tu servidor local de películas y series en la mejor calidad disponible sin saturar el sistema (formatos WEB-DL 1080p y 4K).

---

## 🚀 Cómo Ejecutar la App en tu Teléfono Android

1. **Instala Expo Go** en tu celular desde [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. Asegúrate de que tu celular y tu PC estén conectados a la **misma red Wi-Fi**.
3. En tu PC, abre una terminal en la carpeta:
   ```bash
   cd C:\Users\maxis\.gemini\antigravity\scratch\media-center\app\MediaCenterApp
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npx expo start
   ```
5. Escanea con la app **Expo Go** (o con la cámara de tu teléfono) el código QR que aparecerá en pantalla.

---

## ⚙️ Configuración Inicial en la App

Una vez abierta la app en tu celular, ve a la pestaña **Ajustes** (ícono de engranaje abajo a la derecha):

1. **TMDB API Key**:
   - Crea una cuenta gratuita en [themoviedb.org](https://www.themoviedb.org/).
   - Obtén tu clave en *Ajustes > API*. Pégala en el campo correspondiente.
   - Presiona **Probar** para verificar que responda.
2. **Seerr / Overseerr**:
   - Ingresa la URL de tu servidor (ej: `http://192.168.1.50:5055`).
   - Copia tu API Key desde la interfaz web de Seerr (*Settings > General > API Key*).
   - Presiona **Probar**.
3. **Plex Media Server**:
   - Ingresa la URL local de Plex (ej: `http://192.168.1.50:32400`).
   - Puedes colocar tu `X-Plex-Token` si tu servidor requiere autenticación para bibliotecas.
4. Presiona **Guardar Configuración**.

---

## 🧭 Flujo de Navegación

- **🏠 Inicio**:
  - Banner interactivo con las películas o series en tendencia hoy.
  - Carruseles horizontales categorizados (*Tendencias*, *Series Populares*, *Películas Populares*, *Mejor Valoradas*).
- **🔍 Buscar**:
  - Buscador predictivo en tiempo real por título.
  - Filtros directos por género (Acción, Comedia, Drama, Terror, Ciencia Ficción).
- **📺 Detalle de Título**:
  - Información completa, posters, sinopsis y calificación.
  - Botón interactivo **"Solicitar Descarga"**: al presionarlo, se conecta a Seerr para que Radarr o Sonarr localicen el contenido y comiencen la descarga en qBittorrent automáticamente.
  - Carrusel de recomendaciones similares.
- **📥 Descargas**:
  - Pestaña **Activas**: Solicitudes pendientes de aprobación o en proceso de descarga.
  - Pestaña **Historial**: Contenido disponible en la biblioteca o completado.
- **📚 Biblioteca**:
  - Vista del catálogo almacenado en tu servidor Plex local.
