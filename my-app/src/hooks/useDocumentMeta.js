import { useEffect } from 'react';

const DEFAULT_TITLE = 'GARDET Propiedades — Alta Gama';
const DEFAULT_DESCRIPTION =
  'GARDET Propiedades — Corredora inmobiliaria de ultra lujo. Residencias de autor, penthouses y propiedades de inversión prime.';

/**
 * Sets document.title and meta description for the current route.
 */
export function useDocumentMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | GARDET Propiedades` : DEFAULT_TITLE;

    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content') || '';
    if (meta && description) {
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle || DEFAULT_TITLE;
      if (meta && description) {
        meta.setAttribute('content', prevDescription || DEFAULT_DESCRIPTION);
      }
    };
  }, [title, description]);
}
