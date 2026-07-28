import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import { Link } from 'react-router-dom';

const Home = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
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
                    .limit(6);

                if (error) throw error;
                setProperties(data);
            } catch (error) {
                console.error('Error fetching properties:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    return (
        <div className="min-h-screen bg-obsidian">
            {/* Hero Section */}
            <div className="relative pt-20 overflow-hidden">
                {/* Radial ambient gold glow in the center */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,162,98,0.18)_0%,transparent_65%)] pointer-events-none" />

                {/* Gradient overlays to blend top and bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-obsidian/90 via-transparent to-obsidian pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
                    {/* Gold accent line */}
                    <div className="flex justify-center mb-8">
                        <div className="gold-line"></div>
                    </div>

                    {/* Editorial Title */}
                    <h1 className="title-editorial text-5xl sm:text-6xl lg:text-7xl text-ivory leading-tight animate-fade-in-up">
                        Encuentra tu
                        <br />
                        <span className="text-gold">residencia ideal</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-6 max-w-2xl mx-auto text-ivory/50 font-jakarta text-lg sm:text-xl font-light tracking-wide">
                        Propiedades de Alta Gama en las ubicaciones más exclusivas
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/venta"
                            className="btn-gold text-sm px-8 py-3.5"
                        >
                            Propiedades en Venta
                        </Link>
                        <Link
                            to="/arriendo"
                            className="btn-gold-outline text-sm px-8 py-3.5"
                        >
                            Propiedades en Arriendo
                        </Link>
                    </div>

                    {/* Bottom gold line */}
                    <div className="flex justify-center mt-16">
                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Featured Properties */}
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-gold text-xs font-jakarta font-semibold tracking-descriptor uppercase mb-3">
                        SELECCIÓN
                    </p>
                    <h2 className="title-editorial text-3xl sm:text-4xl text-ivory">
                        Propiedades Destacadas
                    </h2>
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
                        <p className="text-ivory/40 font-jakarta">No hay propiedades disponibles por el momento.</p>
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

export default Home;
