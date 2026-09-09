// ============================================================
// Media Center - Tema visual (estilo cine oscuro premium)
// ============================================================

export const theme = {
  colors: {
    // Fondo principal oscuro profundo
    background: '#0F1014',
    // Superficies de cards, modales, inputs
    surface: '#1A1C23',
    // Superficies sutiles
    surfaceLight: '#262933',
    // Rojo principal de la marca vibrante
    primary: '#F00A17',
    // Detalles
    glass: 'rgba(26, 28, 35, 0.75)',

    text: {
      primary: '#FFFFFF',
      secondary: '#9BA1B0',
    },

    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
};

export type Theme = typeof theme;
