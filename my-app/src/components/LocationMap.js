import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

/** "Las Fresas 5055, Vitacura" + "Vitacura" → no duplicate comuna. */
function buildAddress(address, comuna) {
    const base = String(address || '').trim();
    const c = String(comuna || '').trim();
    if (!c || base.toLowerCase().includes(c.toLowerCase())) return base;
    return [base, c].filter(Boolean).join(', ');
}

/**
 * Embedded Google Map (no API key needed). Uses coordinates when available,
 * otherwise geocodes address + comuna. Falls back to a placeholder when neither exists.
 */
const LocationMap = ({ lat, lng, address, comuna, title, className = 'h-[280px] sm:h-[340px]', debounceMs = 0 }) => {
    const hasCoords = lat != null && lng != null && lat !== '' && lng !== '';
    const fullAddress = buildAddress(address, comuna);
    const liveQuery = hasCoords ? `${lat},${lng}` : fullAddress ? `${fullAddress}, Chile` : null;

    // While typing (forms), wait before reloading the iframe on every keystroke
    const [query, setQuery] = useState(liveQuery);
    useEffect(() => {
        if (!debounceMs) {
            setQuery(liveQuery);
            return undefined;
        }
        const t = setTimeout(() => setQuery(liveQuery), debounceMs);
        return () => clearTimeout(t);
    }, [liveQuery, debounceMs]);

    if (!query) {
        return (
            <div className={`${className} bg-[#EBE7E0] rounded-lg flex items-center justify-center border border-[#2C2C2C]/10`}>
                <div className="text-center text-[#4A4A4A]/70">
                    <MapPin className="h-10 w-10 mx-auto mb-2 text-[#A1917B]/60" />
                    <p className="font-jakarta text-sm font-medium text-[#2C2C2C]">Mapa no disponible</p>
                </div>
            </div>
        );
    }

    return (
        <iframe
            title={title || 'Mapa de ubicación'}
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
            className={`w-full ${className} rounded-lg border-0`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
        />
    );
};

export default LocationMap;
