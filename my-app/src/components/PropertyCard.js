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
        null;

    return (
        <div className="group card-dark rounded-xl overflow-hidden hover:glow-gold">
            {/* Image Section */}
            <div className="relative h-56 bg-obsidian-light overflow-hidden">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={titulo}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-16 w-16 text-obsidian-50/30" />
                    </div>
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent" />

                {/* Price Badge */}
                <div className="absolute top-4 right-4 bg-gold text-obsidian px-4 py-1.5 font-jakarta font-bold text-sm tracking-wide">
                    UF {precio_uf?.toLocaleString()}
                </div>

                {/* Operation Type Badge */}
                {tipos_operacion?.nombre && (
                    <div className="absolute top-4 left-4 border border-ivory/40 text-ivory bg-obsidian/60 backdrop-blur-sm px-3 py-1 text-xs font-jakarta font-semibold uppercase tracking-widest">
                        {tipos_operacion.nombre}
                    </div>
                )}

                {/* Property Type Badge - bottom */}
                {tipos_propiedad?.nombre && (
                    <div className="absolute bottom-4 left-4 text-ivory/80 text-xs font-jakarta font-medium flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-gold" />
                        {tipos_propiedad.nombre}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title */}
                <h3 className="font-jakarta font-bold text-ivory text-lg mb-2 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300">
                    {titulo}
                </h3>

                {/* Address */}
                <div className="flex items-start text-ivory/50 mb-4 text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-gold/60" />
                    <span className="line-clamp-2 font-jakarta">{direccion_referencial}</span>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-obsidian-50/10 py-3 mb-4">
                    <div className="flex flex-col items-center">
                        <Bed className="h-4 w-4 text-gold mb-1" />
                        <span className="text-sm font-semibold text-ivory font-jakarta">{habitaciones}</span>
                        <span className="text-xs text-ivory/40 font-jakarta">Dorm.</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-obsidian-50/10">
                        <Bath className="h-4 w-4 text-gold mb-1" />
                        <span className="text-sm font-semibold text-ivory font-jakarta">{banos}</span>
                        <span className="text-xs text-ivory/40 font-jakarta">Baños</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Maximize className="h-4 w-4 text-gold mb-1" />
                        <span className="text-sm font-semibold text-ivory font-jakarta">{mt2_construidos}</span>
                        <span className="text-xs text-ivory/40 font-jakarta">m²</span>
                    </div>
                </div>

                {/* Action Button */}
                <Link
                    to={`/propiedad/${id}`}
                    className="block w-full text-center btn-gold-outline py-2.5 text-xs"
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
};

export default PropertyCard;
