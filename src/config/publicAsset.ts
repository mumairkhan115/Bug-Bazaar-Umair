/**
 * Turns a public-folder path into a URL for this deployment.
 *
 * Why: GitHub Pages serves the app from a subpath. The catalog stores a
 * relative path because the mock is built before Vite knows that base.
 */
export function publicAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}
