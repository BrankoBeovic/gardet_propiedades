import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import HeroSearch from '../components/HeroSearch';
import SectionHeader from '../components/SectionHeader';
import { PROPERTY_LIST_SELECT } from '../lib/propertyHelpers';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const PropertiesPage = ({ operationType }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState('');
    const [searchParams] = useSearchParams();

    const pageTitle = title || (operationType ? `Propiedades en ${operationType}` : 'Resultados de Búsqueda');
    useDocumentMeta(pageTitle, `Catálogo de propiedades ${operationType || 'en venta y arriendo'} — GARDET Propiedades`);

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            setError(null);
            try {
                // Read filters from query params
                const qOperacion = searchParams.get('operacion');
                const qTipo = searchParams.get('tipo');
                const qRegion = searchParams.get('region');
                const qComuna = searchParams.get('comuna');
                const qPrecioDesde = searchParams.get('precioDesde');
                const qPrecioHasta = searchParams.get('precioHasta');
                const qDormitorios = searchParams.get('dormitorios');
                const qBanos = searchParams.get('banos');

                // If coming from legacy route with operationType prop
                let operacionId = qOperacion || null;
                let operacionIds = null;

                if (operationType && !operacionId) {
                    // /arriendo includes all operation types whose name contains "Arriendo"
                    // (e.g. "Arriendo" and "Arriendo de temporada")
                    if (operationType === 'Arriendo') {
                        const { data: opData, error: opError } = await supabase
                            .from('tipos_operacion')
                            .select('id, nombre')
                            .ilike('nombre', '%Arriendo%');

                        if (opError) throw opError;
                        if (!opData || opData.length === 0) throw new Error('Operation type not found');

                        setTitle('Propiedades en Arriendo');
                        operacionIds = opData.map((op) => op.id);
                    } else {
                        const { data: opData, error: opError } = await supabase
                            .from('tipos_operacion')
                            .select('id, nombre')
                            .ilike('nombre', operationType)
                            .single();

                        if (opError) throw opError;
                        if (!opData) throw new Error('Operation type not found');

                        setTitle(`Propiedades en ${opData.nombre}`);
                        operacionId = opData.id;
                    }
                }

                // --- Resolve region filter ---
                // The 'propiedades' table does NOT have region_id.
                // Region is implicit through the 'comunas' table (comunas.region_id).
                // So to filter by region, we first fetch all comunas belonging to that region,
                // then filter properties by those comunas using .in('comuna_id', [...]).
                let comunaIdsForRegion = null;
                if (qRegion && !qComuna) {
                    // Only resolve region → comunas if no specific comuna is chosen
                    const { data: comunasData, error: comunasError } = await supabase
                        .from('comunas')
                        .select('id')
                        .eq('region_id', qRegion);

                    if (comunasError) {
                        console.error('Error fetching comunas for region:', comunasError);
                    } else if (comunasData && comunasData.length > 0) {
                        comunaIdsForRegion = comunasData.map(c => c.id);
                    } else {
                        // Region has no comunas or no properties — return empty result
                        setProperties([]);
                        setTitle('Resultados de Búsqueda');
                        setLoading(false);
                        return;
                    }
                }

                // Build query
                let query = supabase
                    .from('propiedades')
                    .select(PROPERTY_LIST_SELECT)
                    .eq('estado', 'publicada');

                // Apply filters
                if (operacionIds) {
                    query = query.in('operacion_id', operacionIds);
                } else if (operacionId) {
                    query = query.eq('operacion_id', operacionId);
                }
                if (qTipo) {
                    query = query.eq('tipo_propiedad_id', qTipo);
                }
                // Region filter: use IN clause with all comunas of that region
                if (comunaIdsForRegion) {
                    query = query.in('comuna_id', comunaIdsForRegion);
                }
                // Specific comuna filter (overrides region-only filter)
                if (qComuna) {
                    query = query.eq('comuna_id', qComuna);
                }
                if (qPrecioDesde) {
                    query = query.gte('precio_uf', parseFloat(qPrecioDesde));
                }
                if (qPrecioHasta) {
                    query = query.lte('precio_uf', parseFloat(qPrecioHasta));
                }
                if (qDormitorios) {
                    query = query.gte('habitaciones', parseInt(qDormitorios));
                }
                if (qBanos) {
                    query = query.gte('banos', parseInt(qBanos));
                }

                const { data, error } = await query;
                if (error) throw error;
                setProperties(data || []);

                // Build dynamic title if not from legacy route
                if (!operationType) {
                    const parts = [];

                    if (operacionId && data?.[0]?.tipos_operacion?.nombre) {
                        parts.push(`en ${data[0].tipos_operacion.nombre}`);
                    }

                    setTitle(parts.length > 0
                        ? `Propiedades ${parts.join(' ')}`
                        : 'Resultados de Búsqueda'
                    );
                }
            } catch (error) {
                console.error('Error fetching properties:', error.message);
                setProperties([]);
                setError(error.message || 'No se pudieron cargar las propiedades');
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [operationType, searchParams]);

    // Count active filters for display
    const activeFilterCount = [
        searchParams.get('operacion'),
        searchParams.get('tipo'),
        searchParams.get('region'),
        searchParams.get('comuna'),
        searchParams.get('precioDesde'),
        searchParams.get('precioHasta'),
        searchParams.get('dormitorios'),
        searchParams.get('banos'),
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <SectionHeader
                        label="CATÁLOGO"
                        title={title || (operationType ? `Propiedades en ${operationType}` : 'Resultados de Búsqueda')}
                        as="h1"
                    />
                    {activeFilterCount > 0 && !operationType && (
                        <p className="mt-4 text-ivory/40 font-jakarta text-sm">
                            {properties.length} {properties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'} · {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
                        </p>
                    )}
                </div>

                {/* Filter search bar */}
                <div className="mb-12">
                    <HeroSearch className="mt-0" operationType={operationType} />
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                        <p className="mt-4 text-ivory/40 font-jakarta text-sm">Cargando propiedades...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 font-jakarta text-sm bg-red-400/10 border border-red-400/20 rounded-lg inline-block px-4 py-3">
                            {error}
                        </p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-ivory/40 font-jakarta text-lg">
                            No hay propiedades disponibles {operationType ? 'en esta categoría' : 'con los filtros seleccionados'} por el momento.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertiesPage;
