import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Client-side pagination kept in the URL (`?pagina=N`), so returning from a detail
 * page or sharing the link keeps the same page.
 * Attach `gridRef` to the list container: changing page scrolls to its top.
 */
export function useUrlPagination(items, pageSize = 12) {
    const [searchParams, setSearchParams] = useSearchParams();
    const gridRef = useRef(null);
    const scrollPendingRef = useRef(false);

    const requested = Math.max(1, parseInt(searchParams.get('pagina'), 10) || 1);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const page = Math.min(requested, totalPages);
    const start = (page - 1) * pageSize;
    const visible = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

    const goToPage = (n) => {
        const next = new URLSearchParams(searchParams);
        if (n > 1) next.set('pagina', String(n));
        else next.delete('pagina');
        scrollPendingRef.current = true;
        setSearchParams(next);
    };

    // Runs after App's ScrollToTop effect (which resets to 0 on navigation changes),
    // so the user lands at the top of the list instead of the top of the page.
    useEffect(() => {
        if (!scrollPendingRef.current || !gridRef.current) return;
        scrollPendingRef.current = false;
        const y = gridRef.current.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo(0, Math.max(0, y));
    }, [page]);

    return {
        page,
        totalPages,
        visible,
        goToPage,
        gridRef,
        rangeStart: items.length ? start + 1 : 0,
        rangeEnd: Math.min(start + pageSize, items.length),
    };
}

/**
 * Sets (or clears) a query param and drops `pagina`, so any filter/sort change starts at page 1.
 */
export function withParam(searchParams, key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('pagina');
    return next;
}
