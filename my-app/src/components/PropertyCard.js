import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Home } from 'lucide-react';

const PropertyCard = ({ property }) => {
    const {
        id,
        titulo,
        precio_uf,
        mt2_construidos,
        habitaciones,
        banos,
        direccion_referencial,
        propiedades_imagenes,
        tipos_propiedad,
        tipos_operacion
    } = property;

    // Get the cover image or a placeholder
    const coverImage = propiedades_imagenes?.find(img => img.es_portada)?.url ||
        propiedades_imagenes?.[0]?.url ||
        'https://via.placeholder.com/400x300?text=Sin+Imagen';

    const getOperacionBadgeColor = (operacion) => {
        if (operacion?.toLowerCase().includes('venta')) {
            return 'bg-orange-500';
        } else if (operacion?.toLowerCase().includes('arriendo')) {
            return 'bg-indigo-500';
        }
        return 'bg-primary';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Image Section */}
            <div className="relative h-52">
                <img
                    src={coverImage}
                    alt={titulo}
                    className="w-full h-full object-cover"
                />

                {/* Price Badge */}
                <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                    UF {precio_uf?.toLocaleString()}
                </div>

                {/* Operation Type Badge */}
                {tipos_operacion?.nombre && (
                    <div className={`absolute top-3 left-3 ${getOperacionBadgeColor(tipos_operacion.nombre)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg`}>
                        {tipos_operacion.nombre}
                    </div>
                )}

                {/* Property Type Badge */}
                {tipos_propiedad?.nombre && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {tipos_propiedad.nombre}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {titulo}
                </h3>

                {/* Address */}
                <div className="flex items-start text-gray-500 mb-4 text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-primary" />
                    <span className="line-clamp-2">{direccion_referencial}</span>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-gray-100 py-3 mb-4">
                    <div className="flex flex-col items-center">
                        <Bed className="h-5 w-5 text-primary mb-1" />
                        <span className="text-sm font-semibold text-gray-900">{habitaciones}</span>
                        <span className="text-xs text-gray-500">Dorm.</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-gray-100">
                        <Bath className="h-5 w-5 text-primary mb-1" />
                        <span className="text-sm font-semibold text-gray-900">{banos}</span>
                        <span className="text-xs text-gray-500">Baños</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Maximize className="h-5 w-5 text-primary mb-1" />
                        <span className="text-sm font-semibold text-gray-900">{mt2_construidos}</span>
                        <span className="text-xs text-gray-500">m²</span>
                    </div>
                </div>

                {/* Action Button */}
                <Link
                    to={`/propiedad/${id}`}
                    className="block w-full text-center bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
};

export default PropertyCard;
