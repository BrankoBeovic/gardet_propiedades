import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    MapPin,
    ArrowLeft,
    Building2,
    Map,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    X,
    CalendarCheck,
    KeyRound,
    Gift,
    Layers,
    LayoutGrid,
    ArrowUpDown,
    Tag,
    Sparkles,
    Receipt,
    Info,
} from 'lucide-react';
import { queueReturnScroll } from '../utils/scrollMemory';
import {
    AMENIDADES,
    PROYECTO_DETAIL_SELECT,
    PUBLIC_ESTADOS_PROYECTO,
    availableUnits,
    calcDetallePago,
    formatEntrega,
    formatPct,
    formatTipologia,
    formatUf,
    uniqueTipologias,
} from '../lib/proyectoHelpers';
import { projectInquiryWhatsApp } from '../constants/contact';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useUfValue } from '../hooks/useUfValue';
import { formatClp } from '../services/ufService';
import LocationMap from '../components/LocationMap';

const UNIDADES_VISIBLES = 8;

const SectionTitle = ({ icon: Icon, children }) => (
    <h3 className="text-lg font-jakarta font-bold text-[#2C2C2C] mb-4 flex items-center">
        <Icon className="h-4 w-4 mr-2 text-[#A1917B]" />
        {children}
    </h3>
);

const SummaryRow = ({ label, value, sub, strong }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#2C2C2C]/10 last:border-b-0">
        <span className={`font-jakarta text-sm ${strong ? 'text-[#2C2C2C] font-semibold' : 'text-[#4A4A4A]'}`}>{label}</span>
        <span className="text-right">
            <span className={`block font-jakarta text-sm ${strong ? 'font-bold' : 'font-semibold'} text-[#2C2C2C]`}>{value}</span>
            {sub && <span className="block text-[11px] text-[#4A4A4A]/70 font-jakarta">{sub}</span>}
        </span>
    </div>
);

const InfoHint = ({ text }) => (
    <span className="inline-flex align-middle ml-1 text-[#A1917B] cursor-help" title={text}>
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">{text}</span>
    </span>
);

/** "Detalle del pago" table for the selected unit. */
const DetallePago = ({ detalle, proyecto, toClp }) => {
    const clp = (uf) => toClp(uf) || '—';
    const cuotaClp = (uf, cuotas) => {
        const total = toClp(uf / cuotas);
        return total ? `${cuotas} ${cuotas === 1 ? 'cuota' : 'cuotas'} de ${total}` : `${cuotas} ${cuotas === 1 ? 'cuota' : 'cuotas'}`;
    };

    const darkRow = 'bg-[#2C2C2C] text-ivory';
    const lightRow = 'bg-white/80 text-[#2C2C2C] border-b border-[#2C2C2C]/10';
    const numCell = 'px-3 py-3 text-right whitespace-nowrap';

    const rows = [
        { key: 'pie', item: 'Pie total', dark: true, ...detalle.pie },
        detalle.aporte.pct > 0 && {
            key: 'aporte',
            item: 'Aporte inmobiliaria',
            indent: true,
            forma: (
                <>
                    <span className="font-semibold">Aporte inmobiliaria</span>
                    <span className="block text-[11px] text-[#4A4A4A]/70">(Aplica al total de la inversión)</span>
                </>
            ),
            ...detalle.aporte,
        },
        { key: 'saldo', item: 'Saldo pie a pagar', ...detalle.saldo },
        detalle.abono.pct > 0 && {
            key: 'abono',
            item: 'Abono',
            indent: true,
            forma: (
                <>
                    <span className="font-semibold">{proyecto.abono_forma}</span> / {cuotaClp(detalle.abono.uf, 1)}
                </>
            ),
            ...detalle.abono,
        },
        detalle.antes.pct > 0 && {
            key: 'antes',
            item: (
                <>
                    Pie antes de entrega
                    <InfoHint text="Cuotas que pagarás antes de firmar la escritura." />
                </>
            ),
            indent: true,
            forma: (
                <>
                    <span className="font-semibold">{proyecto.pie_antes_forma}</span> / {cuotaClp(detalle.antes.uf, detalle.antes.cuotas)}
                </>
            ),
            ...detalle.antes,
        },
        detalle.despues.pct > 0 && {
            key: 'despues',
            item: (
                <>
                    Pie después de entrega
                    <InfoHint text="Cuotas que pagarás luego de firmar la escritura." />
                </>
            ),
            indent: true,
            forma: (
                <>
                    <span className="font-semibold">{proyecto.pie_despues_forma}</span> / {cuotaClp(detalle.despues.uf, detalle.despues.cuotas)}
                </>
            ),
            ...detalle.despues,
        },
        { key: 'credito', item: 'Crédito hipotecario / Pago al contado', dark: true, ...detalle.credito },
        { key: 'total', item: 'Total', dark: true, ...detalle.total },
        { key: 'saldoTotal', item: 'Saldo total + reserva', dark: true, indent: true, pct: null, uf: detalle.saldoTotal.uf },
    ].filter(Boolean);

    return (
        <div>
            <div className="overflow-x-auto rounded-xl border border-[#2C2C2C]/10">
                <table className="w-full min-w-[620px] text-sm font-jakarta">
                    <thead>
                        <tr className="bg-[#1C1C1E] text-gold text-xs uppercase tracking-[2px]">
                            <th className="text-left font-semibold px-4 py-3">Ítem</th>
                            <th className="text-left font-semibold px-3 py-3">Forma de pago</th>
                            <th className="text-right font-semibold px-3 py-3">%</th>
                            <th className="text-right font-semibold px-3 py-3">UF</th>
                            <th className="text-right font-semibold px-4 py-3">CLP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.key} className={row.dark ? `${darkRow} border-b border-white/10` : lightRow}>
                                <td className={`py-3 pr-3 ${row.indent ? 'pl-8' : 'pl-4'} ${row.dark ? 'font-semibold' : ''}`}>{row.item}</td>
                                <td className={`px-3 py-3 text-xs leading-snug ${row.dark ? '' : 'text-[#2C2C2C]'}`}>{row.forma || ''}</td>
                                <td className={numCell}>{row.pct != null ? formatPct(row.pct, 2) : ''}</td>
                                <td className={numCell}>{formatUf(row.uf, { decimals: true })}</td>
                                <td className={`${numCell} pr-4 font-semibold`}>{clp(row.uf)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-right text-[11px] text-[#4A4A4A]/60 font-jakarta">
                Los valores en UF se ajustan a diario. Cálculo referencial sobre el precio de lista.
            </p>
        </div>
    );
};

const ProyectoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { valor: ufValor } = useUfValue();
    const [proyecto, setProyecto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [tipologiaFiltro, setTipologiaFiltro] = useState('');
    const [showAllUnits, setShowAllUnits] = useState(false);

    useDocumentMeta(
        proyecto?.nombre,
        proyecto
            ? `Proyecto ${proyecto.nombre}${proyecto.inmobiliaria ? ` de ${proyecto.inmobiliaria}` : ''}${proyecto.comunas?.nombre ? ` en ${proyecto.comunas.nombre}` : ''}. Precios, unidades disponibles y detalle del pago.`
            : 'Proyecto de inversión — GARDET Propiedades'
    );

    useEffect(() => {
        const fetchProyecto = async () => {
            setFetchError(null);
            try {
                const { data, error } = await supabase
                    .from('proyectos')
                    .select(PROYECTO_DETAIL_SELECT)
                    .eq('id', id)
                    .in('estado', PUBLIC_ESTADOS_PROYECTO)
                    .single();
                if (error) throw error;
                setProyecto(data);
            } catch (error) {
                console.error('Error fetching proyecto:', error.message);
                setProyecto(null);
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProyecto();
    }, [id]);

    const images = useMemo(
        () => [...(proyecto?.proyectos_imagenes || [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
        [proyecto]
    );
    const unidades = useMemo(() => availableUnits(proyecto?.proyectos_unidades), [proyecto]);
    const tipologias = useMemo(() => uniqueTipologias(unidades), [unidades]);
    const unidadesFiltradas = useMemo(
        () => (tipologiaFiltro ? unidades.filter((u) => u.tipologia === tipologiaFiltro) : unidades),
        [unidades, tipologiaFiltro]
    );

    const unidadParam = searchParams.get('unidad');
    const selectedUnit =
        unidades.find((u) => String(u.id) === unidadParam) || unidadesFiltradas[0] || unidades[0] || null;

    const selectUnit = (unidad) => {
        const next = new URLSearchParams(searchParams);
        next.set('unidad', String(unidad.id));
        setSearchParams(next, { replace: true, preventScrollReset: true });
    };

    const changeTipologia = (tipologia) => {
        setTipologiaFiltro(tipologia);
        setShowAllUnits(false);
        const first = tipologia ? unidades.find((u) => u.tipologia === tipologia) : unidades[0];
        if (first) selectUnit(first);
    };

    const nextImage = () => setActiveImage((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveImage((prev) => (prev - 1 + images.length) % images.length);

    useEffect(() => {
        if (!lightboxOpen) return undefined;
        const imageCount = images.length;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (imageCount <= 1) return;
            if (e.key === 'ArrowLeft') setActiveImage((prev) => (prev - 1 + imageCount) % imageCount);
            if (e.key === 'ArrowRight') setActiveImage((prev) => (prev + 1) % imageCount);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxOpen, images.length]);

    const handleBack = () => {
        const saved = queueReturnScroll();
        if (saved?.path) {
            navigate(saved.path);
            return;
        }
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
            return;
        }
        navigate('/proyectos');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4"></div>
                    <p className="text-ivory/40 font-jakarta text-sm">Cargando proyecto...</p>
                </div>
            </div>
        );
    }

    if (!proyecto) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center pt-20 px-4">
                <div className="text-center">
                    <h2 className="title-editorial text-3xl text-ivory mb-3">Proyecto no encontrado</h2>
                    <p className="text-ivory/40 font-jakarta mb-6">
                        El proyecto que buscas no existe, no está disponible públicamente o fue eliminado.
                    </p>
                    {fetchError && <p className="text-red-400/80 font-jakarta text-xs mb-4">{fetchError}</p>}
                    <button onClick={handleBack} className="btn-gold-outline text-sm px-6 py-2.5">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const currentImage = images[activeImage]?.url || null;
    const ubicacionTexto = [proyecto.direccion, proyecto.comunas?.nombre].filter(Boolean).join(', ');
    const toClp = (uf) =>
        typeof ufValor === 'number' && !Number.isNaN(ufValor) && uf ? formatClp(Math.round(uf * ufValor)) : null;

    const detalle = selectedUnit ? calcDetallePago(selectedUnit, proyecto) : null;
    const desde = unidades[0]?.precio_lista_uf ?? proyecto.precio_desde_uf;
    const amenidades = AMENIDADES.filter((a) => proyecto[a.key]);
    const beneficios = [
        proyecto.bono_pie_max > 0 && { label: 'Bono pie', value: `Hasta ${formatPct(proyecto.bono_pie_max)}` },
        proyecto.reserva_clp > 0 && { label: 'Reserva', value: formatClp(proyecto.reserva_clp) },
        proyecto.plan_pago && { label: 'Pie y plan de pago', value: proyecto.plan_pago, wide: true },
        proyecto.financiamiento_pie && { label: 'Financiamiento', value: proyecto.financiamiento_pie, wide: true },
        proyecto.arriendo_garantizado && { label: 'Arriendo garantizado', value: proyecto.arriendo_garantizado },
        proyecto.renta_corta && { label: 'Renta corta (Airbnb)', value: 'Permitida' },
        proyecto.secundarios && { label: 'Estacionamiento y bodega', value: proyecto.secundarios },
        proyecto.otros_beneficios && { label: 'Otros beneficios', value: proyecto.otros_beneficios },
    ].filter(Boolean);

    const unidadLabel = selectedUnit ? `${selectedUnit.numero ? `depto ${selectedUnit.numero}` : ''} ${selectedUnit.tipologia}`.trim() : '';
    const whatsappHref = projectInquiryWhatsApp(proyecto.nombre, unidadLabel);
    const proyectoUrl = `${window.location.origin}/proyecto/${proyecto.id}${selectedUnit ? `?unidad=${selectedUnit.id}` : ''}`;
    const contactMessage = `Hola, me interesa el proyecto "${proyecto.nombre}"${unidadLabel ? ` (${unidadLabel})` : ''}.\nLink: ${proyectoUrl}`;
    const contactoPath = `/contacto?mensaje=${encodeURIComponent(contactMessage)}`;

    const visibleUnits = showAllUnits ? unidadesFiltradas : unidadesFiltradas.slice(0, UNIDADES_VISIBLES);
    const m2 = (value) => (value != null ? Number(value).toLocaleString('es-CL') : '—');

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center text-ivory/50 hover:text-gold transition-colors mt-8 mb-6 group font-jakarta text-sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span>Volver</span>
                </button>

                {/* No overflow-hidden here: it would break the sticky summary column */}
                <div className="card-light rounded-2xl shadow-lg shadow-black/20">
                    {/* Image Gallery */}
                    <div className="relative bg-[#EBE7E0] rounded-t-2xl overflow-hidden">
                        <div className="relative h-[300px] sm:h-[500px] bg-[#EBE7E0]">
                            {currentImage ? (
                                <button
                                    type="button"
                                    onClick={() => setLightboxOpen(true)}
                                    className="block w-full h-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
                                    aria-label="Ver imagen en grande"
                                >
                                    <img src={currentImage} alt={proyecto.nombre} className="w-full h-full object-cover pointer-events-none" />
                                </button>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                    <Building2 className="h-24 w-24 text-[#A1917B]/40" />
                                    <p className="text-[#A1917B] text-xs font-jakarta tracking-[5px] uppercase">Imágenes próximamente</p>
                                </div>
                            )}

                            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-gold text-obsidian px-4 sm:px-5 py-2 font-jakarta font-bold text-xs sm:text-sm uppercase tracking-widest shadow-lg z-10 rounded">
                                {formatEntrega(proyecto.entrega)}
                            </div>

                            {proyecto.estado === 'agotado' && (
                                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-4 py-1.5 text-sm font-jakarta font-medium border shadow-lg z-10 rounded-full bg-gold/15 text-[#7E6649] border-gold/40">
                                    Agotado
                                </div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-gold text-[#2C2C2C] hover:text-obsidian p-3 rounded-full transition-all duration-300 shadow-md z-10"
                                        aria-label="Imagen anterior"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-gold text-[#2C2C2C] hover:text-obsidian p-3 rounded-full transition-all duration-300 shadow-md z-10"
                                        aria-label="Imagen siguiente"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                    <div className="absolute bottom-4 right-6 bg-[#2C2C2C]/85 text-white px-3.5 py-1 text-xs font-jakarta font-bold rounded shadow-md z-10">
                                        {activeImage + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="bg-[#F5F2EC] border-t border-[#2C2C2C]/10 p-3 px-6 flex items-center justify-start sm:justify-center gap-3 overflow-x-auto">
                                {images.map((img, index) => (
                                    <button
                                        key={img.url}
                                        onClick={() => setActiveImage(index)}
                                        className={`relative w-16 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-all duration-200 ${activeImage === index
                                            ? 'border-gold scale-105 shadow-md shadow-gold/20'
                                            : 'border-transparent hover:border-[#A1917B]/50 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img.url} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-8 lg:p-10 bg-[#F5F2EC] rounded-b-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                            {/* Header, units and payment detail (before the summary on mobile) */}
                            <div className="lg:col-span-2 lg:row-start-1 space-y-8 min-w-0">
                                <div>
                                    {proyecto.inmobiliaria && (
                                        <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[5px] uppercase mb-3">
                                            {proyecto.inmobiliaria}
                                        </p>
                                    )}
                                    <h1 className="title-editorial text-3xl lg:text-4xl text-[#2C2C2C] mb-3 break-words tracking-wide">
                                        {proyecto.nombre}
                                    </h1>
                                    {ubicacionTexto && (
                                        <div className="flex items-center text-[#4A4A4A]">
                                            <MapPin className="h-4 w-4 mr-2 text-[#A1917B] flex-shrink-0" />
                                            <span className="font-jakarta text-sm break-words">{ubicacionTexto}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-3 mt-5">
                                        {proyecto.comunas?.nombre && (
                                            <div className="inline-flex items-center bg-white/80 border border-[#2C2C2C]/10 text-[#2C2C2C] px-4 py-2 text-sm font-jakarta rounded">
                                                <Building2 className="h-4 w-4 mr-2 text-[#A1917B]" />
                                                {proyecto.comunas.nombre}
                                                {proyecto.comunas.regiones?.nombre && (
                                                    <span className="text-[#4A4A4A]/70 ml-1.5 hidden sm:inline">• {proyecto.comunas.regiones.nombre}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="inline-flex items-center bg-white/80 border border-[#2C2C2C]/10 text-[#2C2C2C] px-4 py-2 text-sm font-jakarta rounded">
                                            <CalendarCheck className="h-4 w-4 mr-2 text-[#A1917B]" />
                                            {formatEntrega(proyecto.entrega)}
                                        </div>
                                    </div>
                                </div>

                                {/* Key figures */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    {[
                                        { icon: Tag, value: desde != null ? formatUf(desde) : '—', label: 'Precio desde' },
                                        { icon: Gift, value: proyecto.bono_pie_max > 0 ? formatPct(proyecto.bono_pie_max) : '—', label: 'Bono pie hasta' },
                                        { icon: LayoutGrid, value: tipologias.length || '—', label: 'Tipologías' },
                                        { icon: KeyRound, value: unidades.length, label: 'Unidades disp.' },
                                    ].map(({ icon: Icon, value, label }) => (
                                        <div key={label} className="bg-white/80 border border-[#2C2C2C]/10 rounded-lg p-4 text-center hover:border-[#A1917B]/40 transition-colors">
                                            <Icon className="h-6 w-6 text-[#A1917B] mx-auto mb-2" />
                                            <div className="text-lg sm:text-xl font-jakarta font-bold text-[#2C2C2C] whitespace-nowrap">{value}</div>
                                            <div className="text-xs text-[#4A4A4A]/70 font-jakarta mt-1">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Units */}
                                <div className="border-t border-[#2C2C2C]/10 pt-8">
                                    <SectionTitle icon={Layers}>Unidades disponibles</SectionTitle>

                                    {unidades.length === 0 ? (
                                        <p className="text-[#4A4A4A] font-jakarta text-sm bg-white/70 p-6 rounded-xl border border-[#2C2C2C]/10">
                                            No quedan unidades disponibles en este proyecto. Contáctanos para conocer alternativas similares.
                                        </p>
                                    ) : (
                                        <>
                                            {tipologias.length > 1 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {['', ...tipologias].map((t) => {
                                                        const active = tipologiaFiltro === t;
                                                        const count = t ? unidades.filter((u) => u.tipologia === t).length : unidades.length;
                                                        return (
                                                            <button
                                                                key={t || 'todas'}
                                                                type="button"
                                                                onClick={() => changeTipologia(t)}
                                                                className={`px-3.5 py-1.5 rounded-full text-xs font-jakarta font-bold tracking-wide border transition-colors ${active
                                                                    ? 'bg-[#2C2C2C] text-gold border-[#2C2C2C]'
                                                                    : 'bg-white/80 text-[#2C2C2C] border-[#2C2C2C]/15 hover:border-gold'
                                                                    }`}
                                                            >
                                                                {t || 'Todas'} <span className="opacity-60 font-medium">({count})</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Desktop table */}
                                            <div className="hidden sm:block bg-white/80 border border-[#2C2C2C]/10 rounded-xl overflow-hidden">
                                                <table className="w-full text-sm font-jakarta">
                                                    <thead>
                                                        <tr className="text-[10px] text-[#A1917B] uppercase tracking-[3px] border-b border-[#2C2C2C]/10">
                                                            <th className="text-left font-semibold px-4 py-3">Depto</th>
                                                            <th className="text-left font-semibold px-2 py-3">Tipología</th>
                                                            <th className="text-left font-semibold px-2 py-3">Orient.</th>
                                                            <th className="text-right font-semibold px-2 py-3">m² total</th>
                                                            <th className="text-right font-semibold px-2 py-3 hidden md:table-cell">m² pond.</th>
                                                            <th className="text-right font-semibold px-4 py-3">Precio lista</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visibleUnits.map((u) => {
                                                            const active = selectedUnit?.id === u.id;
                                                            return (
                                                                <tr
                                                                    key={u.id}
                                                                    onClick={() => selectUnit(u)}
                                                                    className={`cursor-pointer border-b border-[#2C2C2C]/5 last:border-b-0 transition-colors ${active ? 'bg-gold/20' : 'hover:bg-gold/10'}`}
                                                                    aria-selected={active}
                                                                >
                                                                    <td className="px-4 py-3 font-semibold text-[#2C2C2C]">
                                                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${active ? 'bg-gold' : 'bg-transparent'}`} />
                                                                        {u.numero || '—'}
                                                                    </td>
                                                                    <td className="px-2 py-3 text-[#2C2C2C]">{u.tipologia}</td>
                                                                    <td className="px-2 py-3 text-[#4A4A4A]">{u.orientacion || '—'}</td>
                                                                    <td className="px-2 py-3 text-right text-[#4A4A4A]">{m2(u.m2_total)}</td>
                                                                    <td className="px-2 py-3 text-right text-[#4A4A4A] hidden md:table-cell">{m2(u.m2_ponderado)}</td>
                                                                    <td className="px-4 py-3 text-right font-bold text-[#2C2C2C] whitespace-nowrap">{formatUf(u.precio_lista_uf)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile cards */}
                                            <div className="sm:hidden space-y-2">
                                                {visibleUnits.map((u) => {
                                                    const active = selectedUnit?.id === u.id;
                                                    return (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => selectUnit(u)}
                                                            className={`w-full text-left rounded-xl border p-3.5 transition-colors ${active ? 'bg-gold/20 border-gold' : 'bg-white/80 border-[#2C2C2C]/10'}`}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="font-jakarta font-bold text-[#2C2C2C] text-sm">
                                                                    Depto {u.numero || '—'} · {u.tipologia}
                                                                </span>
                                                                <span className="font-jakarta font-bold text-[#2C2C2C] text-sm whitespace-nowrap">
                                                                    {formatUf(u.precio_lista_uf)}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 text-xs font-jakarta text-[#4A4A4A]/80">
                                                                {u.m2_total != null ? `${m2(u.m2_total)} m²` : ''}
                                                                {u.orientacion ? ` · ${u.orientacion}` : ''}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {unidadesFiltradas.length > UNIDADES_VISIBLES && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAllUnits((v) => !v)}
                                                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#2C2C2C] text-[#2C2C2C] hover:bg-gold hover:text-obsidian hover:border-gold px-5 py-2.5 text-xs font-jakarta font-bold uppercase tracking-wider rounded-xl transition-colors"
                                                >
                                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                                    {showAllUnits ? 'Ver menos' : `Ver las ${unidadesFiltradas.length} unidades`}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Payment detail */}
                                {detalle && (
                                    <div className="border-t border-[#2C2C2C]/10 pt-8" id="detalle-pago">
                                        <SectionTitle icon={Receipt}>Detalle del pago</SectionTitle>
                                        <p className="-mt-2 mb-4 text-sm font-jakarta text-[#4A4A4A]">
                                            {selectedUnit.numero ? `Depto ${selectedUnit.numero}` : 'Unidad'} · {formatTipologia(selectedUnit.tipologia)} · precio de lista {formatUf(selectedUnit.precio_lista_uf, { decimals: true })}
                                        </p>
                                        <DetallePago detalle={detalle} proyecto={proyecto} toClp={toClp} />
                                    </div>
                                )}
                            </div>

                            {/* Unit summary (sticky on desktop) */}
                            <aside className="lg:col-start-3 lg:row-start-1 lg:row-span-2 min-w-0">
                                <div className="lg:sticky lg:top-20 space-y-5">
                                    {detalle && (
                                        <div className="bg-white/80 rounded-xl border border-[#2C2C2C]/10 overflow-hidden">
                                            <div className="p-5 border-b border-[#2C2C2C]/10">
                                                <p className="text-[#A1917B] text-[10px] font-jakarta font-semibold tracking-[4px] uppercase mb-2">
                                                    Unidad seleccionada
                                                </p>
                                                <p className="font-jakarta font-bold text-[#2C2C2C]">
                                                    {selectedUnit.numero ? `Depto ${selectedUnit.numero}` : 'Unidad'} · {formatTipologia(selectedUnit.tipologia)}
                                                </p>
                                                <p className="text-xs text-[#4A4A4A]/70 font-jakarta mt-0.5">
                                                    {[
                                                        selectedUnit.m2_total != null && `${m2(selectedUnit.m2_total)} m² totales`,
                                                        selectedUnit.m2_ponderado != null && `${m2(selectedUnit.m2_ponderado)} m² pond.`,
                                                        selectedUnit.orientacion && `Orient. ${selectedUnit.orientacion}`,
                                                    ].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>

                                            <div className="bg-gold text-obsidian px-5 py-4">
                                                <div className="text-xs font-jakarta font-bold uppercase tracking-wider text-obsidian/80">Precio de lista</div>
                                                <div className="text-2xl font-ysabeau font-bold">{formatUf(detalle.precio, { decimals: true })}</div>
                                                <div className="text-xs font-jakarta text-obsidian/75 mt-1">{toClp(detalle.precio) || ' '}</div>
                                            </div>

                                            <div className="p-5">
                                                <SummaryRow label={`Pie total (${formatPct(detalle.pie.pct)})`} value={formatUf(detalle.pie.uf)} sub={toClp(detalle.pie.uf)} />
                                                {detalle.aporte.pct > 0 && (
                                                    <SummaryRow label={`Aporte inmobiliaria (${formatPct(detalle.aporte.pct)})`} value={formatUf(detalle.aporte.uf)} sub={toClp(detalle.aporte.uf)} />
                                                )}
                                                <SummaryRow label="Saldo pie a pagar" value={formatUf(detalle.saldo.uf)} sub={toClp(detalle.saldo.uf)} strong />
                                                <SummaryRow label={`Crédito hipotecario (${formatPct(detalle.credito.pct)})`} value={formatUf(detalle.credito.uf)} sub={toClp(detalle.credito.uf)} />
                                                {selectedUnit.arriendo_clp > 0 && (
                                                    <SummaryRow label="Arriendo estimado" value={`${formatClp(selectedUnit.arriendo_clp)}/mes`} />
                                                )}
                                                {proyecto.reserva_clp > 0 && (
                                                    <SummaryRow label="Reserva" value={formatClp(proyecto.reserva_clp)} />
                                                )}
                                                <a
                                                    href="#detalle-pago"
                                                    className="mt-3 inline-block text-xs font-jakarta font-semibold text-[#7E6649] hover:text-[#2C2C2C] underline underline-offset-2"
                                                >
                                                    Ver detalle del pago
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gold rounded-xl p-5 shadow-xl">
                                        <h3 className="text-lg font-jakarta font-bold text-obsidian mb-2">¿Te interesa este proyecto?</h3>
                                        <p className="text-obsidian/90 mb-4 text-sm font-jakarta font-medium">
                                            Te asesoramos en la elección de la unidad, el financiamiento y la reserva.
                                        </p>
                                        {/* Side by side so the sticky column fits typical laptop heights */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Link
                                                to={contactoPath}
                                                className="w-full bg-obsidian text-gold font-jakarta font-bold py-3 px-3 text-xs sm:text-sm tracking-wider uppercase hover:bg-obsidian-light transition-colors shadow-md rounded-xl cursor-pointer text-center"
                                            >
                                                Contactar
                                            </Link>
                                            <a
                                                href={whatsappHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-obsidian/90 text-gold font-jakarta font-bold py-3 px-3 text-xs sm:text-sm tracking-wider uppercase hover:bg-obsidian-light transition-colors shadow-md rounded-xl cursor-pointer text-center inline-flex items-center justify-center gap-2"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Benefits, amenities, description, location */}
                            <div className="lg:col-span-2 lg:row-start-2 space-y-8 min-w-0">
                                {beneficios.length > 0 && (
                                    <div className="border-t border-[#2C2C2C]/10 pt-8">
                                        <SectionTitle icon={Gift}>Condiciones comerciales</SectionTitle>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {beneficios.map((b) => (
                                                <div key={b.label} className={`bg-white/80 border border-[#2C2C2C]/10 rounded-lg p-4 ${b.wide ? 'sm:col-span-2' : ''}`}>
                                                    <div className="text-[10px] text-[#A1917B] font-jakarta font-semibold uppercase tracking-[3px] mb-1">{b.label}</div>
                                                    <div className={`text-sm font-jakarta text-[#2C2C2C] break-words ${b.wide ? 'leading-relaxed' : 'font-semibold'}`}>{b.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(amenidades.length > 0 || proyecto.pisos || proyecto.ascensores) && (
                                    <div className="border-t border-[#2C2C2C]/10 pt-8">
                                        <SectionTitle icon={Sparkles}>Características y amenidades</SectionTitle>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {proyecto.pisos > 0 && (
                                                <div className="flex items-center gap-3 bg-white/80 border border-[#2C2C2C]/10 rounded-lg p-3.5">
                                                    <Building2 className="h-5 w-5 text-[#A1917B] flex-shrink-0" />
                                                    <span className="text-sm font-jakarta text-[#2C2C2C]">{proyecto.pisos} pisos</span>
                                                </div>
                                            )}
                                            {proyecto.ascensores > 0 && (
                                                <div className="flex items-center gap-3 bg-white/80 border border-[#2C2C2C]/10 rounded-lg p-3.5">
                                                    <ArrowUpDown className="h-5 w-5 text-[#A1917B] flex-shrink-0" />
                                                    <span className="text-sm font-jakarta text-[#2C2C2C]">
                                                        {proyecto.ascensores} {proyecto.ascensores === 1 ? 'ascensor' : 'ascensores'}
                                                    </span>
                                                </div>
                                            )}
                                            {amenidades.map(({ key, label, icon: Icon }) => (
                                                <div key={key} className="flex items-center gap-3 bg-white/80 border border-[#2C2C2C]/10 rounded-lg p-3.5">
                                                    <Icon className="h-5 w-5 text-[#A1917B] flex-shrink-0" />
                                                    <span className="text-sm font-jakarta text-[#2C2C2C]">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {proyecto.descripcion && (
                                    <div className="border-t border-[#2C2C2C]/10 pt-8">
                                        <SectionTitle icon={Tag}>Descripción</SectionTitle>
                                        <p className="text-[#4A4A4A] whitespace-pre-line leading-relaxed font-jakarta text-sm bg-white/70 p-6 rounded-xl border border-[#2C2C2C]/10 break-words overflow-hidden">
                                            {proyecto.descripcion}
                                        </p>
                                    </div>
                                )}

                                <div className="border-t border-[#2C2C2C]/10 pt-8">
                                    <SectionTitle icon={Map}>Ubicación</SectionTitle>
                                    <div className="bg-white/80 rounded-xl p-3 border border-[#2C2C2C]/10">
                                        <LocationMap
                                            lat={proyecto.lat}
                                            lng={proyecto.lng}
                                            address={proyecto.direccion}
                                            comuna={proyecto.comunas?.nombre}
                                            title={`Mapa de ${proyecto.nombre}`}
                                        />
                                        {ubicacionTexto && (
                                            <div className="flex items-start gap-3 p-3 pt-4">
                                                <MapPin className="h-4 w-4 text-[#A1917B] mt-0.5 flex-shrink-0" />
                                                <p className="font-jakarta font-medium text-[#2C2C2C] text-sm">
                                                    {ubicacionTexto}
                                                    {proyecto.comunas?.regiones?.nombre && (
                                                        <span className="text-[#4A4A4A]/70 font-normal">, {proyecto.comunas.regiones.nombre}</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {lightboxOpen && currentImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
                    onClick={() => setLightboxOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Galería ampliada"
                >
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10"
                        aria-label="Cerrar"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-gold text-white hover:text-obsidian p-3 rounded-full transition-colors z-10"
                                aria-label="Imagen anterior"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-gold text-white hover:text-obsidian p-3 rounded-full transition-colors z-10"
                                aria-label="Imagen siguiente"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-jakarta bg-black/50 px-3 py-1 rounded-full z-10">
                                {activeImage + 1} / {images.length}
                            </div>
                        </>
                    )}

                    <img
                        src={currentImage}
                        alt={proyecto.nombre}
                        className="max-h-full max-w-full object-contain rounded-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ProyectoDetail;
