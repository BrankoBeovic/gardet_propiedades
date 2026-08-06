import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { fetchPublishedLocationOptions } from '../lib/propertyHelpers';

const LABEL_CLASS =
    'block text-gold text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1';

// Dark opaque fields for readable ivory text over the frosted panel.
const FIELD_CLASS =
    'w-full bg-[#141416] border border-white/15 rounded-xl px-3 py-2.5 text-ivory font-jakarta text-sm ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ' +
    'focus:outline-none focus:border-gold/55 focus:ring-1 focus:ring-gold/25 ' +
    'hover:border-white/30 transition-all duration-300 ' +
    '[&>option]:bg-[#1C1C1E] [&>option]:text-ivory';

// Frosted glass panel, identical on every device
const PANEL_BG =
    'absolute inset-0 rounded-2xl backdrop-blur-xl bg-[#1C1C1E]/75 border border-white/20';

/** Map route operationType to tipos_operacion id (Arriendo excludes temporada). */
function resolveOperacionId(tiposOperacion, operationType) {
    if (!operationType || tiposOperacion.length === 0) return null;

    if (operationType === 'Arriendo') {
        const match = tiposOperacion.find(
            (op) => op.nombre.toLowerCase() === 'arriendo'
        );
        return match?.id ?? null;
    }

    const match = tiposOperacion.find(
        (op) => op.nombre.toLowerCase() === operationType.toLowerCase()
    );
    return match?.id ?? null;
}

const HeroSearch = ({ className = '', operationType }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Filter state
    const [operacion, setOperacion] = useState('');
    const [tipoPropiedad, setTipoPropiedad] = useState('');
    const [region, setRegion] = useState('');
    const [comuna, setComuna] = useState('');
    const [precioDesde, setPrecioDesde] = useState('');
    const [precioHasta, setPrecioHasta] = useState('');
    const [dormitorios, setDormitorios] = useState('');
    const [banos, setBanos] = useState('');

    // Dropdown data
    const [tiposOperacion, setTiposOperacion] = useState([]);
    const [tiposPropiedad, setTiposPropiedad] = useState([]);
    const [regiones, setRegiones] = useState([]);
    const [comunas, setComunas] = useState([]);
    // regionId → comunas with published properties (from helper)
    const [comunasByRegion, setComunasByRegion] = useState({});

    // Load dropdown data on mount (regiones/comunas only where published properties exist)
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [opRes, tipRes, locOptions] = await Promise.all([
                    supabase.from('tipos_operacion').select('id, nombre'),
                    supabase.from('tipos_propiedad').select('id, nombre'),
                    fetchPublishedLocationOptions(supabase),
                ]);
                setTiposOperacion(opRes.data || []);
                setTiposPropiedad(tipRes.data || []);
                setRegiones(locOptions.regiones || []);
                setComunasByRegion(locOptions.comunasByRegion || {});
            } catch (error) {
                console.error('Error loading search dropdowns:', error);
            }
        };
        loadDropdowns();
    }, []);

    // Pre-select operación from route prop or URL query (?operacion=id)
    useEffect(() => {
        if (tiposOperacion.length === 0) return;

        if (operationType) {
            const id = resolveOperacionId(tiposOperacion, operationType);
            if (id) setOperacion(String(id));
            return;
        }

        const urlOperacion = searchParams.get('operacion');
        if (urlOperacion) setOperacion(urlOperacion);
    }, [operationType, tiposOperacion, searchParams]);

    // Populate comunas from the published-location map when region changes
    useEffect(() => {
        if (region) {
            setComunas(comunasByRegion[region] || []);
        } else {
            setComunas([]);
            setComuna('');
        }
    }, [region, comunasByRegion]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (operacion) params.set('operacion', operacion);
        if (tipoPropiedad) params.set('tipo', tipoPropiedad);
        if (region) params.set('region', region);
        if (comuna) params.set('comuna', comuna);
        if (precioDesde) params.set('precioDesde', precioDesde);
        if (precioHasta) params.set('precioHasta', precioHasta);
        if (dormitorios) params.set('dormitorios', dormitorios);
        if (banos) params.set('banos', banos);

        navigate(`/propiedades?${params.toString()}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div
            className={`w-full max-w-5xl mx-auto mt-8 animate-fade-in-up [animation-fill-mode:both] ${className}`}
            style={{ animationDelay: '0.3s' }}
        >
            {/* CONTAINER 1: Main Search Bar — dark frosted panel */}
            <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_70px_-20px_rgba(0,0,0,0.75)]">
                <div className={PANEL_BG} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                <div className="relative p-3.5 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        {/* Operación */}
                        <div className="relative">
                            <label className={LABEL_CLASS}>Operación</label>
                            <div className="relative">
                                <select
                                    value={operacion}
                                    onChange={(e) => setOperacion(e.target.value)}
                                    className={`${FIELD_CLASS} appearance-none cursor-pointer`}
                                >
                                    <option value="">Todas</option>
                                    {tiposOperacion.map(op => (
                                        <option key={op.id} value={op.id}>{op.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
                            </div>
                        </div>

                        {/* Tipo de Propiedad */}
                        <div className="relative">
                            <label className={LABEL_CLASS}>Tipo</label>
                            <div className="relative">
                                <select
                                    value={tipoPropiedad}
                                    onChange={(e) => setTipoPropiedad(e.target.value)}
                                    className={`${FIELD_CLASS} appearance-none cursor-pointer`}
                                >
                                    <option value="">Todos</option>
                                    {tiposPropiedad.map(tp => (
                                        <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
                            </div>
                        </div>

                        {/* Región */}
                        <div className="relative">
                            <label className={LABEL_CLASS}>Región</label>
                            <div className="relative">
                                <select
                                    value={region}
                                    onChange={(e) => { setRegion(e.target.value); setComuna(''); }}
                                    className={`${FIELD_CLASS} appearance-none cursor-pointer`}
                                >
                                    <option value="">Todas</option>
                                    {regiones.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
                            </div>
                        </div>

                        {/* Comuna */}
                        <div className="relative">
                            <label className={LABEL_CLASS}>Comuna</label>
                            <div className="relative">
                                <select
                                    value={comuna}
                                    onChange={(e) => setComuna(e.target.value)}
                                    disabled={!region}
                                    className={`${FIELD_CLASS} appearance-none cursor-pointer ${!region ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Todas</option>
                                    {comunas.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
                            </div>
                        </div>

                        {/* BUSCAR Button */}
                        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-gradient-to-b from-gold-light to-gold hover:from-gold hover:to-gold-light text-obsidian py-2.5 font-jakarta font-bold text-sm tracking-wider transition-all duration-300 rounded-xl shadow-[0_6px_20px_-6px_rgba(197,162,98,0.7),inset_0_1px_0_rgba(255,255,255,0.45)] flex items-center justify-center gap-2 h-[42px] cursor-pointer"
                            >
                                <Search className="h-4 w-4" />
                                BUSCAR
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Búsqueda Avanzada Button (Outside Container 1, Aligned Right) */}
            <div className="flex justify-end mt-2.5">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="inline-flex items-center gap-2 backdrop-blur-xl bg-[#1C1C1E]/75 border border-white/20 hover:border-gold/40 text-gold hover:text-gold-light px-4 py-2 rounded-xl transition-all duration-300 font-jakarta text-xs font-semibold tracking-wide group cursor-pointer"
                    aria-expanded={showAdvanced}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90 text-gold" />
                    <span>Búsqueda avanzada</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 text-gold ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* CONTAINER 2: Advanced Search Panel — same dark frosted treatment.
                The 0fr → 1fr row animates the panel open, so any container that grows with it
                (the Home hero and its object-cover background video) resizes smoothly instead
                of snapping to a new height. */}
            <div
                className={`grid transition-[grid-template-rows,opacity,visibility] duration-500 ease-out ${
                    showAdvanced ? 'grid-rows-[1fr] opacity-100 visible' : 'grid-rows-[0fr] opacity-0 invisible'
                }`}
            >
                <div className="relative rounded-2xl overflow-hidden min-h-0 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.75)] mt-3">
                    <div className={PANEL_BG} />
                    <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                    <div className="relative p-4 sm:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {/* Precio Desde */}
                            <div>
                                <label className={LABEL_CLASS}>Precio Desde (UF)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 1.000"
                                    value={precioDesde}
                                    onChange={(e) => setPrecioDesde(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`${FIELD_CLASS} placeholder-ivory/40`}
                                />
                            </div>

                            {/* Precio Hasta */}
                            <div>
                                <label className={LABEL_CLASS}>Precio Hasta (UF)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 50.000"
                                    value={precioHasta}
                                    onChange={(e) => setPrecioHasta(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={`${FIELD_CLASS} placeholder-ivory/40`}
                                />
                            </div>

                            {/* Dormitorios */}
                            <div>
                                <label className={LABEL_CLASS}>Dormitorios</label>
                                <div className="relative">
                                    <select
                                        value={dormitorios}
                                        onChange={(e) => setDormitorios(e.target.value)}
                                        className={`${FIELD_CLASS} appearance-none cursor-pointer`}
                                    >
                                        <option value="">Todos</option>
                                        <option value="1">1+</option>
                                        <option value="2">2+</option>
                                        <option value="3">3+</option>
                                        <option value="4">4+</option>
                                        <option value="5">5+</option>
                                        <option value="6">6+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
                                </div>
                            </div>

                            {/* Baños */}
                            <div>
                                <label className={LABEL_CLASS}>Baños</label>
                                <div className="relative">
                                    <select
                                        value={banos}
                                        onChange={(e) => setBanos(e.target.value)}
                                        className={`${FIELD_CLASS} appearance-none cursor-pointer`}
                                    >
                                        <option value="">Todos</option>
                                        <option value="1">1+</option>
                                        <option value="2">2+</option>
                                        <option value="3">3+</option>
                                        <option value="4">4+</option>
                                        <option value="5">5+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSearch;
