import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Home } from 'lucide-react';
import { rememberScrollForReturn } from '../utils/scrollMemory';

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
        <div className="group rounded-xl overflow-hidden card-light shadow-lg shadow-black/20 transition-all duration-300">
            {/* Image Section */}
            <div className="relative h-56 bg-[#EBE7E0] overflow-hidden">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={titulo}
                        draggable={false}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 select-none pointer-events-none [-webkit-user-drag:none]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#EBE7E0]">
                        <Home className="h-12 w-12 text-[#A1917B]/40" />
                    </div>
                )}

                {/* Operation Badge */}
                {tipos_operacion && (
                    <span className="absolute top-4 left-4 bg-[#2C2C2C]/90 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded">
                        {tipos_operacion.nombre}
                    </span>
                )}

                {/* Property Type Badge */}
                {tipos_propiedad && (
                    <span className="absolute bottom-4 left-4 bg-white/90 text-[#7E6649] text-xs font-semibold px-2.5 py-1 rounded border border-[#A1917B]/25 flex items-center gap-1">
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
            <div className="p-5 bg-[#F5F2EC]">
                {/* Title */}
                <h3 className="font-jakarta font-bold text-[#2C2C2C] text-lg mb-2 line-clamp-2 leading-tight group-hover:text-[#7E6649] transition-colors duration-300 break-words">
                    {titulo}
                </h3>

                {/* Address */}
                <div className="flex items-start text-[#4A4A4A] mb-4 text-sm">
                    <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-[#A1917B]" />
                    <span className="line-clamp-2 font-jakarta break-words">{direccion_referencial}</span>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 text-center border border-[#2C2C2C]/10 py-3 mb-4 bg-white/70 rounded-lg">
                    <div className="flex flex-col items-center">
                        <Bed className="h-4 w-4 text-[#A1917B] mb-1" />
                        <span className="text-sm font-semibold text-[#2C2C2C] font-jakarta">{habitaciones}</span>
                        <span className="text-xs text-[#4A4A4A]/70 font-jakarta">Dorm.</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-[#2C2C2C]/10">
                        <Bath className="h-4 w-4 text-[#A1917B] mb-1" />
                        <span className="text-sm font-semibold text-[#2C2C2C] font-jakarta">{banos}</span>
                        <span className="text-xs text-[#4A4A4A]/70 font-jakarta">Baños</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Maximize className="h-4 w-4 text-[#A1917B] mb-1" />
                        <span className="text-sm font-semibold text-[#2C2C2C] font-jakarta">{mt2_construidos}</span>
                        <span className="text-xs text-[#4A4A4A]/70 font-jakarta">m²</span>
                    </div>
                </div>

                {/* Action Button */}
                <Link
                    to={`/propiedad/${id}`}
                    onMouseEnter={onButtonHover}
                    onMouseLeave={onButtonLeave}
                    onClick={rememberScrollForReturn}
                    className="block w-full text-center border border-[#2C2C2C] text-[#2C2C2C] hover:bg-gold hover:text-obsidian hover:border-gold py-2.5 text-xs font-jakarta font-bold uppercase tracking-wider relative z-10 rounded-xl transition-colors duration-300"
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
};

export default PropertyCard;
