import {
    availableUnits,
    calcDetallePago,
    formatEntrega,
    formatPct,
    formatTipologia,
    formatUf,
    getCoverImage,
    m2Range,
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

    test('availableUnits drops unavailable units and sorts by list price', () => {
        const unidades = [
            { id: 1, precio_lista_uf: 3000, disponible: true },
            { id: 2, precio_lista_uf: 2000, disponible: false },
            { id: 3, precio_lista_uf: 2500, disponible: true },
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

    test('m2Range returns a rounded min–max range', () => {
        expect(m2Range([{ m2_total: 37.88 }, { m2_total: 70.7 }])).toBe('37–71');
        expect(m2Range([{ m2_total: 54.7 }])).toBe('54–55');
        expect(m2Range([])).toBeNull();
    });

    test('calcDetallePago reproduces the reference payment breakdown', () => {
        const proyecto = {
            pie_pct: 0.2,
            bono_pie_max: 0.1,
            abono_pct: 0.01,
            pie_antes_pct: 0.05,
            pie_antes_cuotas: 25,
            pie_despues_cuotas: 24,
        };
        const d = calcDetallePago({ precio_lista_uf: 2494 }, proyecto);
        expect(d.pie.uf).toBeCloseTo(498.8, 2);
        expect(d.aporte.uf).toBeCloseTo(249.4, 2);
        expect(d.saldo.uf).toBeCloseTo(249.4, 2);
        expect(d.abono.uf).toBeCloseTo(24.94, 2);
        expect(d.antes.uf).toBeCloseTo(124.7, 2);
        expect(d.despues.uf).toBeCloseTo(99.76, 2);
        expect(d.despues.pct).toBeCloseTo(0.04, 6);
        expect(d.credito.uf).toBeCloseTo(1995.2, 2);
        expect(d.total.uf).toBe(2494);
        expect(d.saldoTotal.uf).toBeCloseTo(2244.6, 2);
    });

    test('calcDetallePago caps the plan when the bono covers most of the pie', () => {
        const d = calcDetallePago({ precio_lista_uf: 1000 }, { pie_pct: 0.2, bono_pie_max: 0.15 });
        expect(d.saldo.pct).toBeCloseTo(0.05, 6);
        expect(d.abono.pct).toBeCloseTo(0.01, 6);
        expect(d.antes.pct).toBeCloseTo(0.04, 6);
        expect(d.despues.pct).toBe(0);

        const full = calcDetallePago({ precio_lista_uf: 1000 }, { pie_pct: 0.2, bono_pie_max: 0.2 });
        expect(full.saldo.pct).toBe(0);
        expect(full.abono.pct).toBe(0);
        expect(full.antes.pct).toBe(0);
    });
});
