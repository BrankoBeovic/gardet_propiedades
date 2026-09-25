import {
    availableUnits,
    calcDividendoUf,
    calcResumenInversion,
    formatEntrega,
    formatPct,
    formatTipologia,
    formatUf,
    getCoverImage,
    parseTipologia,
    uniqueTipologias,
} from './proyectoHelpers';

describe('proyectoHelpers', () => {
    test('parseTipologia reads dorms/baths and treats Estudio as 0D-1B', () => {
        expect(parseTipologia('3D-2B')).toEqual({ dormitorios: 3, banos: 2 });
        expect(parseTipologia('Estudio')).toEqual({ dormitorios: 0, banos: 1 });
        expect(formatTipologia('2D-1B')).toBe('2 dorm · 1 baño');
        expect(formatTipologia('Estudio')).toBe('Estudio');
    });

    test('uniqueTipologias sorts Estudio first, then by dorms and baths', () => {
        const unidades = ['3D-2B', '2D-1B', 'Estudio', '2D-2B', '2D-1B'].map((tipologia) => ({ tipologia }));
        expect(uniqueTipologias(unidades)).toEqual(['Estudio', '2D-1B', '2D-2B', '3D-2B']);
    });

    test('availableUnits drops unavailable units and sorts by final price', () => {
        const unidades = [
            { id: 1, precio_final_uf: 3000, disponible: true },
            { id: 2, precio_final_uf: 2000, disponible: false },
            { id: 3, precio_final_uf: 2500, disponible: true },
        ];
        expect(availableUnits(unidades).map((u) => u.id)).toEqual([3, 1]);
    });

    test('formatters use Chilean formatting', () => {
        expect(formatUf(2210.38)).toBe('UF 2.210');
        expect(formatUf(2694.34, { decimals: true })).toBe('UF 2.694,34');
        expect(formatUf(null)).toBe('—');
        expect(formatPct(0.26)).toBe('26%');
        expect(formatPct(0.0583, 1)).toBe('5,8%');
        expect(formatEntrega('Inmediata')).toBe('Entrega inmediata');
        expect(formatEntrega('2027 2do sem')).toBe('Entrega 2027 2do sem');
    });

    test('getCoverImage prefers es_portada, then lowest orden', () => {
        expect(getCoverImage([{ url: 'b', orden: 1 }, { url: 'a', orden: 0 }])).toBe('a');
        expect(getCoverImage([{ url: 'a', orden: 0 }, { url: 'c', orden: 2, es_portada: true }])).toBe('c');
        expect(getCoverImage([])).toBeNull();
    });

    test('calcDividendoUf uses French amortization (4.5% / 25 years by default)', () => {
        expect(calcDividendoUf(0)).toBe(0);
        expect(calcDividendoUf(2155.472)).toBeCloseTo(11.98, 1);
    });

    test('calcResumenInversion applies bono pie up to the chosen pie', () => {
        const unidad = { precio_final_uf: 2694.34 };
        const r = calcResumenInversion(unidad, 0.2, 0.15);
        expect(r.pieTotalUf).toBeCloseTo(538.868, 3);
        expect(r.bonoPieUf).toBeCloseTo(404.151, 3);
        expect(r.pieAPagarUf).toBeCloseTo(134.717, 3);
        expect(r.creditoUf).toBeCloseTo(2155.472, 3);

        // Bono larger than the chosen pie is capped at the pie
        const capped = calcResumenInversion(unidad, 0.1, 0.15);
        expect(capped.pieAPagarUf).toBe(0);
    });
});
