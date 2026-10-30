import { useState, useEffect } from 'react';

/**
 * Hook pour temporiser une valeur réactive (ex: recherche en temps réel).
 * Évite d'exécuter des filtres lourds ou des calculs à chaque frappe au clavier.
 */
export function useDebounce<T>(value: T, delayMs: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
