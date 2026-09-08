// ============================================================
// 🎨 Media Center — Tema visual (estilo cine oscuro)
// ============================================================

export const theme = {
  colors: {
    // Fondo principal oscuro (inspirado en Netflix)
    background: '#141414',
    // Superficies de cards, modales, inputs
    surface: '#1F1F1F',
    // Rojo principal de la marca
    primary: '#E50914',

    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A0',
    },

    // Estados
    success: '#2ECC71',
    warning: '#F39C12',
    error: '#E74C3C',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
    full: 999,
  },
};

export type Theme = typeof theme;
