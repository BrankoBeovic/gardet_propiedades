import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Home } from 'lucide-react';

const PropertyCard = ({ property, onButtonHover, onButtonLeave }) => {
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
        <div className="group rounded-xl overflow-hidden hover:glow-gold bg-[#1C1C1E] border border-gold/25 shadow-xl shadow-black/70 transition-all duration-300 relative z-[1]">
            {/* Image Section */}
            <div className="relative h-56 bg-[#141416] overflow-hidden">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={titulo}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1C1C1E]">
                        <Home className="h-12 w-12 text-gold/30" />
                    </div>
                )}

                {/* Operation Badge */}
                {tipos_operacion && (
                    <span className="absolute top-4 left-4 bg-obsidian/90 text-ivory text-xs font-bold px-3 py-1 uppercase tracking-wider border border-gold/30 rounded">
                        {tipos_operacion.nombre}
                    </span>
                )}

                {/* Property Type Badge */}
                {tipos_propiedad && (
                    <span className="absolute bottom-4 left-4 bg-obsidian/80 text-gold text-xs font-semibold px-2.5 py-1 rounded border border-gold/20 flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {tipos_propiedad.nombre}
                    </span>
                )}

                {/* Price Badge */}
                {precio_uf && (
                    <span className="absolute top-4 right-4 bg-gold text-obsidian text-xs font-bold px-3 py-1 tracking-wider rounded shadow-md">
                        UF {precio_uf.toLocaleString('es-CL')}
                    </span>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5 bg-[#1C1C1E]">
                {/* Title */}
                <h3 className="font-jakarta font-bold text-ivory text-lg mb-2 line-clamp-2 leading-tight group-hover:text-gold transition-colors duration-300 break-words">
                    {titulo}
                </h3>

                {/* Address */}
                <div className="flex items-start text-slate-300 mb-4 text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-gold" />
                    <span className="line-clamp-2 font-jakarta break-words">{direccion_referencial}</span>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 text-center border border-gold/20 py-3 mb-4 bg-[rgba(20,20,22,0.65)] rounded-lg">
                    <div className="flex flex-col items-center">
                        <Bed className="h-4 w-4 text-gold mb-1" />
                        <span className="text-sm font-semibold text-ivory font-jakarta">{habitaciones}</span>
                        <span className="text-xs text-slate-400 font-jakarta">Dorm.</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-gold/20">
                        <Bath className="h-4 w-4 text-gold mb-1" />
                        <span className="text-sm font-semibold text-ivory font-jakarta">{banos}</span>
                        <span className="text-xs text-slate-400 font-jakarta">Baños</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Maximize className="h-4 w-4 text-gold mb-1" />
                        <span className="text-sm font-semibold text-ivory font-jakarta">{mt2_construidos}</span>
                        <span className="text-xs text-slate-400 font-jakarta">m²</span>
                    </div>
                </div>

                {/* Action Button */}
                <Link
                    to={`/propiedad/${id}`}
                    onMouseEnter={onButtonHover}
                    onMouseLeave={onButtonLeave}
                    className="block w-full text-center btn-gold-outline py-2.5 text-xs font-bold uppercase tracking-wider relative z-10 rounded-xl"
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
};

export default PropertyCard;
