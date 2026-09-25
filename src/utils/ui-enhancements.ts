// Recently Used Tools Management
const RECENTLY_USED_KEY = 'recently-used-tools';
const MAX_RECENT_TOOLS = 10;

export function getRecentlyUsedTools(): string[] {
  const stored = localStorage.getItem(RECENTLY_USED_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addRecentlyUsedTool(toolId: string): void {
  const recent = getRecentlyUsedTools();
  const filtered = recent.filter(id => id !== toolId);
  const updated = [toolId, ...filtered].slice(0, MAX_RECENT_TOOLS);
  localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
}

export function clearRecentlyUsedTools(): void {
  localStorage.removeItem(RECENTLY_USED_KEY);
}

// Favorites Management
const FAVORITES_KEY = 'favorite-tools';

export function getFavoriteTools(): string[] {
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addFavoriteTool(toolId: string): void {
  const favorites = getFavoriteTools();
  if (!favorites.includes(toolId)) {
    favorites.push(toolId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavoriteTool(toolId: string): void {
  const favorites = getFavoriteTools();
  const filtered = favorites.filter(id => id !== toolId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export function toggleFavoriteTool(toolId: string): void {
  const favorites = getFavoriteTools();
  if (favorites.includes(toolId)) {
    removeFavoriteTool(toolId);
  } else {
    addFavoriteTool(toolId);
  }
}

export function isFavoriteTool(toolId: string): boolean {
  return getFavoriteTools().includes(toolId);
}

// Dark Mode Auto-Detection
export function getSystemThemePreference(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function setupThemeChangeListener(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }
  return () => {};
}
