export const THEMES = [
  {
    id: 'dark-purple',
    name: 'Dunkel Lila',
    colors: ['#06060e', '#9b5bff'],
  },
  {
    id: 'black-pink',
    name: 'Schwarz-Pink',
    colors: ['#0a0008', '#ff2d78'],
  },
  {
    id: 'white-blue',
    name: 'Weiß-Hellblau',
    colors: ['#eef6ff', '#0ea5e9'],
    light: true,
  },
  {
    id: 'black-green',
    name: 'Schwarz-Neongrün',
    colors: ['#010a04', '#00e664'],
  },
  {
    id: 'white-red',
    name: 'Weiß-Hellrot',
    colors: ['#fff5f5', '#ef4444'],
    light: true,
  },
  {
    id: 'purple-mix',
    name: 'Lila · Rot · Türkis',
    colors: ['#080514', '#7c3aed', '#f43f5e', '#06b6d4'],
  },
]

const KEY = 'fittrack-theme'
const WALLPAPER_KEY = 'fittrack-wallpaper'

export function getTheme() {
  return localStorage.getItem(KEY) || 'dark-purple'
}

export function setTheme(id) {
  localStorage.setItem(KEY, id)
  document.documentElement.setAttribute('data-theme', id)
  window.dispatchEvent(new Event('themechange'))
}

export function getWallpaper() {
  return localStorage.getItem(WALLPAPER_KEY) || 'none'
}

export function setWallpaper(id) {
  localStorage.setItem(WALLPAPER_KEY, id)
  document.documentElement.setAttribute('data-wallpaper', id)
}

export function initTheme() {
  document.documentElement.setAttribute('data-theme', getTheme())
  document.documentElement.setAttribute('data-wallpaper', getWallpaper())
}

export const WALLPAPERS = [
  { id: 'none',     name: 'Keins',    preview: null },
  { id: 'ornament', name: 'Ornament', preview: '/wallpaper-ornament.jpg' },
]
