const UF_API_URL = 'https://mindicador.cl/api';

/**
 * Formats a UF value as Chilean pesos (e.g. $40.817,59).
 */
export function formatUfValue(valor) {
    return `$${Number(valor).toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * Formats an amount in CLP (no decimals), e.g. $49.999.999.
 */
export function formatClp(amount) {
    return Number(amount).toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
    });
}

/**
 * Fetches the daily UF value from mindicador.cl.
 * Returns { valor, fecha } or null on network/parse failure.
 */
export async function fetchUfValue() {
    try {
        const response = await fetch(UF_API_URL);
        if (!response.ok) return null;

        const data = await response.json();
        const valor = data?.uf?.valor;
        const fecha = data?.uf?.fecha;

        if (typeof valor !== 'number' || Number.isNaN(valor)) return null;

        return { valor, fecha: fecha || null };
    } catch {
        return null;
    }
}
