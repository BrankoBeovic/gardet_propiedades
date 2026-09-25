import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ProyectoCard from '../components/ProyectoCard';
import Pagination from '../components/Pagination';
import { useUrlPagination, withParam } from '../hooks/useUrlPagination';
import SectionHeader from '../components/SectionHeader';
import {
    PROYECTO_CARD_SELECT,
    PUBLIC_ESTADOS_PROYECTO,
    availableUnits,
    uniqueTipologias,
} from '../lib/proyectoHelpers';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const LABEL_CLASS =
    'block text-gold text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1';

const FIELD_CLASS =
    'w-full bg-[#141416] border border-white/15 rounded-xl px-3 py-2.5 text-ivory font-jakarta text-sm ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] appearance-none cursor-pointer ' +
    'focus:outline-none focus:border-gold/55 focus:ring-1 focus:ring-gold/25 ' +
    'hover:border-white/30 transition-all duration-300 ' +
    '[&>option]:bg-[#1C1C1E] [&>option]:text-ivory';

const ENTREGA_OPCIONES = [
    { value: '', label: 'Todas' },
    { value: 'inmediata', label: 'Inmediata' },
    { value: 'futura', label: 'Futura' },
];

const PAGE_SIZE = 12;

const ORDEN_OPCIONES = [
    { value: '', label: 'Recomendados' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc', label: 'Precio: mayor a menor' },
    { value: 'descuento', label: 'Mayor descuento' },
    { value: 'unidades', label: 'Más unidades disponibles' },
    { value: 'nombre', label: 'Nombre (A-Z)' },
];

/** Lowest available list price, falling back to the stored "desde". */
const precioDesde = (p) => availableUnits(p.proyectos_unidades)[0]?.precio_lista_uf ?? p.precio_desde_uf ?? Infinity;

/** Ranking order: top 20 first, then per-comuna position, then name. */
const byRanking = (a, b) =>
    (a.ranking ?? Infinity) - (b.ranking ?? Infinity) ||
    (a.ranking_comuna ?? Infinity) - (b.ranking_comuna ?? Infinity) ||
    a.nombre.localeCompare(b.nombre, 'es');

const SORTERS = {
    '': byRanking,
    'precio-asc': (a, b) => precioDesde(a) - precioDesde(b),
    'precio-desc': (a, b) => {
        const pa = precioDesde(a);
        const pb = precioDesde(b);
        // Projects without price go last in both directions
        return (pb === Infinity ? -Infinity : pb) - (pa === Infinity ? -Infinity : pa);
    },
    descuento: (a, b) => (b.dscto_max || 0) - (a.dscto_max || 0) || byRanking(a, b),
    unidades: (a, b) => availableUnits(b.proyectos_unidades).length - availableUnits(a.proyectos_unidades).length,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
};

const FilterSelect = ({ label, value, onChange, children }) => (
    <div className="relative">
        <label className={LABEL_CLASS}>{label}</label>
        <div className="relative">
            <select value={value} onChange={(e) => onChange(e.target.value)} className={FIELD_CLASS}>
                {children}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
        </div>
    </div>
);

const ProyectosPage = () => {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const comunaFiltro = searchParams.get('comuna') || '';
    const entregaFiltro = searchParams.get('entrega') || '';
    const tipologiaFiltro = searchParams.get('tipologia') || '';
    const orden = SORTERS[searchParams.get('orden')] ? searchParams.get('orden') : '';

    useDocumentMeta(
        'Proyectos de inversión',
        'Proyectos inmobiliarios seleccionados para invertir: precios, unidades disponibles, beneficios y condiciones de pago — GARDET Propiedades'
    );

    useEffect(() => {
        const fetchProyectos = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('proyectos')
                    .select(PROYECTO_CARD_SELECT)
                    .in('estado', PUBLIC_ESTADOS_PROYECTO)
                    .order('ranking', { ascending: true, nullsFirst: false })
                    .order('ranking_comuna', { ascending: true, nullsFirst: false })
                    .order('nombre');
                if (fetchError) throw fetchError;
                setProyectos(data || []);
            } catch (err) {
                console.error('Error fetching proyectos:', err.message);
                setProyectos([]);
                setError(err.message || 'No se pudieron cargar los proyectos');
            } finally {
                setLoading(false);
            }
        };

        fetchProyectos();
    }, []);

    const comunas = useMemo(() => {
        const map = new Map();
        proyectos.forEach((p) => p.comunas && map.set(String(p.comunas.id), p.comunas.nombre));
        return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es')
        );
    }, [proyectos]);

    const tipologias = useMemo(
        () => uniqueTipologias(proyectos.flatMap((p) => availableUnits(p.proyectos_unidades))),
        [proyectos]
    );

    const filtered = useMemo(
        () =>
            proyectos.filter((p) => {
                if (comunaFiltro && String(p.comuna_id) !== comunaFiltro) return false;
                const inmediata = /inmediata/i.test(p.entrega || '');
                if (entregaFiltro === 'inmediata' && !inmediata) return false;
                if (entregaFiltro === 'futura' && inmediata) return false;
                if (
                    tipologiaFiltro &&
                    !availableUnits(p.proyectos_unidades).some((u) => u.tipologia === tipologiaFiltro)
                ) {
                    return false;
                }
                return true;
            }),
        [proyectos, comunaFiltro, entregaFiltro, tipologiaFiltro]
    );

    const sorted = useMemo(() => [...filtered].sort(SORTERS[orden]), [filtered, orden]);

    const { page: pagina, totalPages, visible: visibles, goToPage, gridRef, rangeStart, rangeEnd } =
        useUrlPagination(sorted, PAGE_SIZE);

    // Any filter or sort change goes back to page 1
    const setFilter = (key, value) => setSearchParams(withParam(searchParams, key, value), { replace: true });

    const hasFilters = Boolean(comunaFiltro || entregaFiltro || tipologiaFiltro);

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <SectionHeader label="INVERSIÓN" title="Proyectos de inversión" as="h1" />
                    <p className="mt-4 text-ivory/50 font-jakarta text-sm max-w-2xl mx-auto">
                        Proyectos seleccionados por su precio, beneficios y condiciones de pago.
                        Elige una unidad y revisa el detalle del pago.
                    </p>
                </div>

                {/* Filters */}
                <div className="w-full max-w-5xl mx-auto mb-12">
                    <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_70px_-20px_rgba(0,0,0,0.75)]">
                        <div className="absolute inset-0 rounded-2xl backdrop-blur-xl bg-[#1C1C1E]/75 border border-white/20" />
                        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                        <div className="relative p-3.5 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                            <FilterSelect label="Comuna" value={comunaFiltro} onChange={(v) => setFilter('comuna', v)}>
                                <option value="">Todas</option>
                                {comunas.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </FilterSelect>
                            <FilterSelect label="Entrega" value={entregaFiltro} onChange={(v) => setFilter('entrega', v)}>
                                {ENTREGA_OPCIONES.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </FilterSelect>
                            <FilterSelect label="Tipología" value={tipologiaFiltro} onChange={(v) => setFilter('tipologia', v)}>
                                <option value="">Todas</option>
                                {tipologias.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </FilterSelect>
                            <FilterSelect label="Ordenar por" value={orden} onChange={(v) => setFilter('orden', v)}>
                                {ORDEN_OPCIONES.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </FilterSelect>
                        </div>
                    </div>
                    {!loading && sorted.length > 0 && (
                        <p className="mt-4 text-center text-ivory/40 font-jakarta text-sm">
                            {sorted.length > PAGE_SIZE
                                ? `Mostrando ${rangeStart}–${rangeEnd} de ${sorted.length} proyectos`
                                : `${sorted.length} ${sorted.length === 1 ? 'proyecto' : 'proyectos'}`}
                            {hasFilters && (
                                <>
                                    {' · '}
                                    <button
                                        type="button"
                                        onClick={() => setSearchParams(orden ? { orden } : {}, { replace: true })}
                                        className="text-gold/80 hover:text-gold underline underline-offset-2"
                                    >
                                        Limpiar filtros
                                    </button>
                                </>
                            )}
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                        <p className="mt-4 text-ivory/40 font-jakarta text-sm">Cargando proyectos...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 font-jakarta text-sm bg-red-400/10 border border-red-400/20 rounded-lg inline-block px-4 py-3">
                            {error}
                        </p>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-ivory/40 font-jakarta text-lg">
                            No hay proyectos disponibles {hasFilters ? 'con los filtros seleccionados' : ''} por el momento.
                        </p>
                    </div>
                ) : (
                    <>
                        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {visibles.map((proyecto) => (
                                <ProyectoCard key={proyecto.id} proyecto={proyecto} />
                            ))}
                        </div>

                        <Pagination page={pagina} totalPages={totalPages} onChange={goToPage} label="Paginación de proyectos" />
                    </>
                )}
            </div>
        </div>
    );
};

export default ProyectosPage;
