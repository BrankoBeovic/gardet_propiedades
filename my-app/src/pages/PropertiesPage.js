import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';

const PropertiesPage = ({ operationType }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                // First get the operation ID
                const { data: opData, error: opError } = await supabase
                    .from('tipos_operacion')
                    .select('id, nombre')
                    .ilike('nombre', operationType) // Case insensitive match
                    .single();

                if (opError) throw opError;
                if (!opData) throw new Error('Operation type not found');

                setTitle(opData.nombre);

                // Then fetch properties with that operation ID
                const { data, error } = await supabase
                    .from('propiedades')
                    .select(`
                        *,
                        propiedades_imagenes (
                            url,
                            es_portada
                        ),
                        tipos_propiedad (
                            id,
                            nombre
                        ),
                        tipos_operacion (
                            id,
                            nombre
                        )
                    `)
                    .eq('estado', 'publicada')
                    .eq('operacion_id', opData.id);

                if (error) throw error;
                setProperties(data);
            } catch (error) {
                console.error('Error fetching properties:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [operationType]);

    return (
        <div className="min-h-screen bg-obsidian pt-20">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-gold text-xs font-jakarta font-semibold tracking-descriptor uppercase mb-3">
                        CATÁLOGO
                    </p>
                    <h1 className="title-editorial text-3xl sm:text-4xl lg:text-5xl text-ivory">
                        Propiedades en {title || operationType}
                    </h1>
                    <div className="flex justify-center mt-4">
                        <div className="gold-line"></div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                        <p className="mt-4 text-ivory/40 font-jakarta text-sm">Cargando propiedades...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-ivory/40 font-jakarta text-lg">
                            No hay propiedades disponibles en esta categoría por el momento.
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
