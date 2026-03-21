export const FELT_THEMES = [
  {
    id: 'classic-green',
    name: 'Classic Green',
    felt: '#1a5c2e',
    feltDark: '#0f3d1e',
    feltLight: '#2a7a42',
    rail: '#5c3a1e',
    railLight: '#8b6914',
    accent: '#d4af37',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    felt: '#065f46',
    feltDark: '#064e3b',
    feltLight: '#059669',
    rail: '#4a3728',
    railLight: '#78562c',
    accent: '#34d399',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    felt: '#1e3a5f',
    feltDark: '#0f2744',
    feltLight: '#2d5a8a',
    rail: '#2d2d3d',
    railLight: '#4a4a6a',
    accent: '#60a5fa',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    felt: '#3b1f5e',
    feltDark: '#2a1545',
    feltLight: '#5b3a8a',
    rail: '#2d1f3d',
    railLight: '#5a3d7a',
    accent: '#c084fc',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    felt: '#6b1c1c',
    feltDark: '#4a1212',
    feltLight: '#8b2c2c',
    rail: '#3d2020',
    railLight: '#6a3030',
    accent: '#fca5a5',
  },
  {
    id: 'black-velvet',
    name: 'Black Velvet',
    felt: '#1a1a2e',
    feltDark: '#0f0f1a',
    feltLight: '#2a2a44',
    rail: '#1f1f1f',
    railLight: '#3a3a3a',
    accent: '#e2e8f0',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    felt: '#0c4a6e',
    feltDark: '#082f49',
    feltLight: '#0e7490',
    rail: '#1e3a4a',
    railLight: '#2d5a6a',
    accent: '#22d3ee',
  },
  {
    id: 'forest',
    name: 'Forest',
    felt: '#14532d',
    feltDark: '#0a3019',
    feltLight: '#166534',
    rail: '#3d2b1a',
    railLight: '#6b4c2a',
    accent: '#86efac',
  },
];

export function applyFeltTheme(themeId) {
  const theme = FELT_THEMES.find(t => t.id === themeId) || FELT_THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--felt', theme.felt);
  root.style.setProperty('--felt-dark', theme.feltDark);
  root.style.setProperty('--felt-light', theme.feltLight);
  root.style.setProperty('--rail', theme.rail);
  root.style.setProperty('--rail-light', theme.railLight);
  root.style.setProperty('--felt-accent', theme.accent);
  localStorage.setItem('poker_felt', themeId);
  return theme;
}

export function getStoredFelt() {
  return localStorage.getItem('poker_felt') || 'classic-green';
}
