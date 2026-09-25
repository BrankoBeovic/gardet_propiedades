import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

const MIN_VISIBLE_MS = 900;   // Let the brand animation play even when data is instant
const MAX_VISIBLE_MS = 3000;  // Never block the page longer than this; the page spinner takes over
const FADE_OUT_MS = 450;

// Tiny store: pages report "still loading data" so the splash can stay until they're ready.
let pendingLoads = 0;
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const getPendingLoads = () => pendingLoads;

/** Keep the route splash up while `loading` is true (bounded by MAX_VISIBLE_MS). */
export function useSplashWhileLoading(loading) {
    useEffect(() => {
        if (!loading) return undefined;
        pendingLoads += 1;
        emit();
        return () => {
            pendingLoads -= 1;
            emit();
        };
    }, [loading]);
}

/**
 * Full-screen brand overlay shown on every pathname change (link clicks, back/forward).
 * Query-only changes (filters, sort, pagination, selected unit) don't trigger it.
 */
const RouteSplash = () => {
    const { pathname } = useLocation();
    const pending = useSyncExternalStore(subscribe, getPendingLoads);
    const [phase, setPhase] = useState('hidden'); // 'visible' | 'leaving' | 'hidden'
    const [runId, setRunId] = useState(0);
    const [minElapsed, setMinElapsed] = useState(false);
    const [forced, setForced] = useState(false);
    const firstRenderRef = useRef(true);

    // Layout effect so the overlay covers the new page before it paints
    useLayoutEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return undefined;
        }
        setPhase('visible');
        setRunId((id) => id + 1);
        setMinElapsed(false);
        setForced(false);
        const minTimer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
        const maxTimer = setTimeout(() => setForced(true), MAX_VISIBLE_MS);
        return () => {
            clearTimeout(minTimer);
            clearTimeout(maxTimer);
        };
    }, [pathname]);

    // Pause the new page's CSS entrance animations while covered; release them as the
    // splash starts fading so they play in view. Layout effect = applied before first paint.
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('route-splash-active', phase === 'visible');
        return () => root.classList.remove('route-splash-active');
    }, [phase]);

    useEffect(() => {
        if (phase === 'visible' && minElapsed && (pending === 0 || forced)) {
            setPhase('leaving');
        }
        if (phase === 'leaving') {
            const t = setTimeout(() => setPhase('hidden'), FADE_OUT_MS);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [phase, minElapsed, pending, forced]);

    if (phase === 'hidden') return null;

    return (
        <div
            className={`fixed inset-0 z-[200] bg-obsidian flex flex-col items-center justify-center transition-opacity ease-out ${
                phase === 'leaving' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">Cargando</span>
            <div key={runId} className="flex flex-col items-center" aria-hidden="true">
                <span className="route-splash-word text-ivory font-extrabold text-2xl sm:text-3xl tracking-[0.3em] uppercase pl-[0.3em]">
                    GARDET
                </span>
                <span className="route-splash-word route-splash-word-2 text-gold font-jakarta text-[11px] sm:text-xs tracking-[0.5em] uppercase mt-2 pl-[0.5em]">
                    PROPIEDADES
                </span>
                <span className="route-splash-line mt-4" />
            </div>
        </div>
    );
};

export default RouteSplash;
