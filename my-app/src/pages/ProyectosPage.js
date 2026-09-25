import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ProyectoCard from '../components/ProyectoCard';
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

    useDocumentMeta(
        'Proyectos de inversión',
        'Proyectos inmobiliarios seleccionados para invertir: precios, descuentos, cap rate y beneficios — GARDET Propiedades'
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

    const setFilter = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next, { replace: true });
    };

    const hasFilters = Boolean(comunaFiltro || entregaFiltro || tipologiaFiltro);

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <SectionHeader label="INVERSIÓN" title="Proyectos de inversión" as="h1" />
                    <p className="mt-4 text-ivory/50 font-jakarta text-sm max-w-2xl mx-auto">
                        Proyectos seleccionados por su precio, descuentos y rentabilidad estimada.
                        Elige una unidad y revisa el pie, el dividendo y el arriendo estimado.
                    </p>
                </div>

                {/* Filters */}
                <div className="w-full max-w-4xl mx-auto mb-12">
                    <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_70px_-20px_rgba(0,0,0,0.75)]">
                        <div className="absolute inset-0 rounded-2xl backdrop-blur-xl bg-[#1C1C1E]/75 border border-white/20" />
                        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                        <div className="relative p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
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
                        </div>
                    </div>
                    {hasFilters && !loading && (
                        <p className="mt-4 text-center text-ivory/40 font-jakarta text-sm">
                            {filtered.length} {filtered.length === 1 ? 'proyecto encontrado' : 'proyectos encontrados'} ·{' '}
                            <button
                                type="button"
                                onClick={() => setSearchParams({}, { replace: true })}
                                className="text-gold/80 hover:text-gold underline underline-offset-2"
                            >
                                Limpiar filtros
                            </button>
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
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-ivory/40 font-jakarta text-lg">
                            No hay proyectos disponibles {hasFilters ? 'con los filtros seleccionados' : ''} por el momento.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((proyecto) => (
                            <ProyectoCard key={proyecto.id} proyecto={proyecto} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProyectosPage;
