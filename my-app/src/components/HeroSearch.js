import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { fetchComunasByRegion } from '../lib/propertyHelpers';

const HeroSearch = () => {
    const navigate = useNavigate();
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

    // Load dropdown data on mount
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [opRes, tipRes, regRes] = await Promise.all([
                    supabase.from('tipos_operacion').select('id, nombre'),
                    supabase.from('tipos_propiedad').select('id, nombre'),
                    supabase.from('regiones').select('id, nombre')
                ]);
                setTiposOperacion(opRes.data || []);
                setTiposPropiedad(tipRes.data || []);
                setRegiones(regRes.data || []);
            } catch (error) {
                console.error('Error loading search dropdowns:', error);
            }
        };
        loadDropdowns();
    }, []);

    // Load comunas when region changes
    useEffect(() => {
        const loadComunas = async () => {
            if (region) {
                try {
                    const data = await fetchComunasByRegion(supabase, region);
                    setComunas(data);
                } catch (error) {
                    console.error('Error loading comunas:', error);
                    setComunas([]);
                }
            } else {
                setComunas([]);
                setComuna('');
            }
        };
        loadComunas();
    }, [region]);

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
        <div className="w-full max-w-5xl mx-auto mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {/* CONTAINER 1: Main Search Bar (Sleek Horizontal Strip) */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Glass background */}
                <div className="absolute inset-0 backdrop-blur-xl bg-[#141414]/80 border border-gold/20 rounded-xl" />

                <div className="relative p-3.5 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        {/* Operación */}
                        <div className="relative">
                            <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                Operación
                            </label>
                            <div className="relative">
                                <select
                                    value={operacion}
                                    onChange={(e) => setOperacion(e.target.value)}
                                    className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none cursor-pointer hover:border-gold/30"
                                >
                                    <option value="">Todas</option>
                                    {tiposOperacion.map(op => (
                                        <option key={op.id} value={op.id}>{op.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* Tipo de Propiedad */}
                        <div className="relative">
                            <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                Tipo
                            </label>
                            <div className="relative">
                                <select
                                    value={tipoPropiedad}
                                    onChange={(e) => setTipoPropiedad(e.target.value)}
                                    className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none cursor-pointer hover:border-gold/30"
                                >
                                    <option value="">Todos</option>
                                    {tiposPropiedad.map(tp => (
                                        <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* Región */}
                        <div className="relative">
                            <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                Región
                            </label>
                            <div className="relative">
                                <select
                                    value={region}
                                    onChange={(e) => { setRegion(e.target.value); setComuna(''); }}
                                    className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none cursor-pointer hover:border-gold/30"
                                >
                                    <option value="">Todas</option>
                                    {regiones.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* Comuna */}
                        <div className="relative">
                            <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                Comuna
                            </label>
                            <div className="relative">
                                <select
                                    value={comuna}
                                    onChange={(e) => setComuna(e.target.value)}
                                    disabled={!region}
                                    className={`w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none cursor-pointer hover:border-gold/30 ${!region ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Todas</option>
                                    {comunas.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* BUSCAR Button */}
                        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-gold hover:bg-gold-light text-obsidian py-2.5 font-jakarta font-bold text-sm tracking-wider transition-all duration-300 rounded-xl shadow-lg shadow-gold/15 hover:shadow-gold/25 flex items-center justify-center gap-2 h-[42px] cursor-pointer"
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
                    className="inline-flex items-center gap-2 bg-[#141414]/80 backdrop-blur-md border border-gold/25 hover:border-gold/50 text-gold hover:text-gold-light px-4 py-2 rounded-xl transition-all duration-300 font-jakarta text-xs font-semibold tracking-wide shadow-lg group cursor-pointer"
                >
                    <SlidersHorizontal className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90 text-gold" />
                    <span>Búsqueda Avanzada</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 text-gold ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* CONTAINER 2: Advanced Search Panel (Separate Container) */}
            {showAdvanced && (
                <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 mt-3 animate-fade-in">
                    <div className="absolute inset-0 backdrop-blur-xl bg-[#141414]/85 border border-gold/20 rounded-xl" />

                    <div className="relative p-4 sm:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {/* Precio Desde */}
                            <div>
                                <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                    Precio Desde (UF)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Ej: 1.000"
                                    value={precioDesde}
                                    onChange={(e) => setPrecioDesde(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory placeholder-ivory/30 font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 hover:border-gold/30"
                                />
                            </div>

                            {/* Precio Hasta */}
                            <div>
                                <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                    Precio Hasta (UF)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Ej: 50.000"
                                    value={precioHasta}
                                    onChange={(e) => setPrecioHasta(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory placeholder-ivory/30 font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 hover:border-gold/30"
                                />
                            </div>

                            {/* Dormitorios */}
                            <div>
                                <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                    Dormitorios
                                </label>
                                <div className="relative">
                                    <select
                                        value={dormitorios}
                                        onChange={(e) => setDormitorios(e.target.value)}
                                        className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none cursor-pointer hover:border-gold/30"
                                    >
                                        <option value="">Todos</option>
                                        <option value="1">1+</option>
                                        <option value="2">2+</option>
                                        <option value="3">3+</option>
                                        <option value="4">4+</option>
                                        <option value="5">5+</option>
                                        <option value="6">6+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/40 pointer-events-none" />
                                </div>
                            </div>

                            {/* Baños */}
                            <div>
                                <label className="block text-gold/70 text-[10px] font-jakarta font-semibold uppercase tracking-widest mb-1.5 pl-1">
                                    Baños
                                </label>
                                <div className="relative">
                                    <select
                                        value={banos}
                                        onChange={(e) => setBanos(e.target.value)}
                                        className="w-full bg-[#1C1C1E]/90 border border-gold/15 rounded-lg px-3 py-2.5 text-ivory font-jakarta text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none cursor-pointer hover:border-gold/30"
                                    >
                                        <option value="">Todos</option>
                                        <option value="1">1+</option>
                                        <option value="2">2+</option>
                                        <option value="3">3+</option>
                                        <option value="4">4+</option>
                                        <option value="5">5+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/40 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroSearch;
