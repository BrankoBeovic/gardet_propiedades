
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
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-primary text-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl font-extrabold sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Encuentra tu hogar ideal
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-blue-100">
                        Explora nuestras propiedades en venta y arriendo en las mejores ubicaciones.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link to="/venta" className="bg-white text-primary px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition">
                            Ver Propiedades en Venta
                        </Link>
                        <Link to="/arriendo" className="bg-secondary text-white px-6 py-3 rounded-md font-bold hover:bg-yellow-600 transition">
                            Ver Propiedades en Arriendo
                        </Link>
                    </div>
                </div>
            </div>

            {/* Featured Properties */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Propiedades Destacadas</h2>

                {loading ? (
                    <div className="text-center py-12">Cargando propiedades...</div>
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
