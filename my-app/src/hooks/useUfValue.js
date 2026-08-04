import { useEffect, useState } from 'react';
import { fetchUfValue, formatUfValue } from '../services/ufService';

const CACHE_KEY = 'gardet:uf';
const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours (within 6–12h)

/** Shared in-flight fetch so many PropertyCards don't hit the API at once. */
let inflightPromise = null;

/**
 * Reads a valid UF cache entry from sessionStorage, or null if missing/expired.
 */
function readCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;

        const cached = JSON.parse(raw);
        if (
            typeof cached?.valor !== 'number' ||
            Number.isNaN(cached.valor) ||
            !cached?.valorFormatted ||
            !cached?.fetchedAt
        ) {
            return null;
        }
        if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;

        return cached;
    } catch {
        return null;
    }
}

/**
 * Persists UF value to sessionStorage with a timestamp.
 */
function writeCache(valor, valorFormatted, fecha) {
    try {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                valor,
                valorFormatted,
                fecha,
                fetchedAt: Date.now(),
            })
        );
    } catch {
        // Ignore quota / private-mode errors
    }
}

/**
 * Loads the daily UF value once on mount, with sessionStorage cache (TTL ~8h).
 * Returns { valor, valorFormatted, loading, error }.
 */
export function useUfValue() {
    const [valor, setValor] = useState(null);
    const [valorFormatted, setValorFormatted] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const cached = readCache();
        if (cached) {
            setValor(cached.valor);
            setValorFormatted(cached.valorFormatted);
            setLoading(false);
            setError(false);
            return undefined;
        }

        async function loadUf() {
            setLoading(true);
            setError(false);

            if (!inflightPromise) {
                inflightPromise = fetchUfValue().finally(() => {
                    inflightPromise = null;
                });
            }

            const result = await inflightPromise;
            if (cancelled) return;

            if (!result) {
                setValor(null);
                setValorFormatted(null);
                setError(true);
                setLoading(false);
                return;
            }

            const formatted = formatUfValue(result.valor);
            writeCache(result.valor, formatted, result.fecha);
            setValor(result.valor);
            setValorFormatted(formatted);
            setLoading(false);
        }

        loadUf();

        return () => {
            cancelled = true;
        };
    }, []);

    return { valor, valorFormatted, loading, error };
}
