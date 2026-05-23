export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;
const INLINE_URL_PATTERN = /^(?:data|blob):/i;

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (ABSOLUTE_URL_PATTERN.test(url) || INLINE_URL_PATTERN.test(url)) return url;

  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function adminUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/admin/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cleanBase}${cleanPath}`;
}
