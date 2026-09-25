import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, LayoutGrid, Maximize, KeyRound } from 'lucide-react';
import { rememberScrollForReturn } from '../utils/scrollMemory';
import {
    availableUnits,
    formatEntrega,
    formatPct,
    formatUf,
    getCoverImage,
    m2Range,
    uniqueTipologias,
} from '../lib/proyectoHelpers';

const ProyectoCard = ({ proyecto, onButtonHover, onButtonLeave }) => {
    const {
        id,
        nombre,
        inmobiliaria,
        direccion,
        comunas,
        entrega,
        precio_desde_uf,
        dscto_max,
        estado,
        proyectos_imagenes,
        proyectos_unidades,
    } = proyecto;

    const coverImage = getCoverImage(proyectos_imagenes);
    const unidades = availableUnits(proyectos_unidades);
    const tipologias = uniqueTipologias(unidades);
    const desde = unidades[0]?.precio_lista_uf ?? precio_desde_uf;
    const superficie = m2Range(unidades);
    const agotado = estado === 'agotado' || unidades.length === 0;

    return (
        <div className="group flex flex-col h-full rounded-xl overflow-hidden card-light shadow-lg shadow-black/20 transition-all duration-300">
            {/* Image Section */}
            <div className="relative h-56 flex-shrink-0 bg-[#EBE7E0] overflow-hidden">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={nombre}
                        draggable={false}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 select-none pointer-events-none [-webkit-user-drag:none]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#EBE7E0]">
                        <Building2 className="h-12 w-12 text-[#A1917B]/40" />
                    </div>
                )}

                {/* Delivery Badge */}
                <span className="absolute top-4 left-4 bg-[#2C2C2C]/90 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded">
                    {formatEntrega(entrega)}
                </span>

                {/* Price Badge */}
                {desde != null && !agotado && (
                    <span className="absolute top-4 right-4 bg-gold text-obsidian text-xs font-bold px-3 py-1 tracking-wider rounded shadow-md">
                        Desde {formatUf(desde)}
                    </span>
                )}

                {/* Developer Badge */}
                {inmobiliaria && (
                    <span className="absolute bottom-4 left-4 bg-white/90 text-[#7E6649] text-xs font-semibold px-2.5 py-1 rounded border border-[#A1917B]/25 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {inmobiliaria}
                    </span>
                )}

                {/* Discount / sold-out badge */}
                {agotado ? (
                    <span className="absolute bottom-4 right-4 text-xs font-jakarta font-medium px-2.5 py-1 border rounded-full shadow-sm bg-gold/15 text-[#7E6649] border-gold/40">
                        Agotado
                    </span>
                ) : dscto_max > 0 && (
                    <span className="absolute bottom-4 right-4 text-xs font-jakarta font-bold px-2.5 py-1 rounded-full shadow-sm bg-green-50 text-green-700 border border-green-200">
                        Hasta {formatPct(dscto_max)} dcto.
                    </span>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-5 bg-[#F5F2EC]">
                <h3 className="font-jakarta font-bold text-[#2C2C2C] text-lg mb-2 line-clamp-2 min-h-[2.75rem] leading-tight group-hover:text-[#7E6649] transition-colors duration-300 break-words">
                    {nombre}
                </h3>

                <div className="flex items-start text-[#4A4A4A] mb-4 text-sm min-h-[2.5rem]">
                    <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-[#A1917B]" />
                    <span className="line-clamp-2 font-jakarta break-words">
                        {[direccion, comunas?.nombre].filter(Boolean).join(', ')}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center border border-[#2C2C2C]/10 py-3 mb-4 bg-white/70 rounded-lg">
                    <div className="flex flex-col items-center px-1">
                        <LayoutGrid className="h-4 w-4 text-[#A1917B] mb-1" />
                        <span className="text-sm font-semibold text-[#2C2C2C] font-jakarta leading-tight">
                            {tipologias.length ? `${tipologias.length}` : '—'}
                        </span>
                        <span className="text-xs text-[#4A4A4A]/70 font-jakarta">Tipologías</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-[#2C2C2C]/10 px-1">
                        <KeyRound className="h-4 w-4 text-[#A1917B] mb-1" />
                        <span className="text-sm font-semibold text-[#2C2C2C] font-jakarta">{unidades.length}</span>
                        <span className="text-xs text-[#4A4A4A]/70 font-jakarta">Unidades</span>
                    </div>
                    <div className="flex flex-col items-center px-1">
                        <Maximize className="h-4 w-4 text-[#A1917B] mb-1" />
                        <span className="text-sm font-semibold text-[#2C2C2C] font-jakarta whitespace-nowrap">{superficie || '—'}</span>
                        <span className="text-xs text-[#4A4A4A]/70 font-jakarta">m²</span>
                    </div>
                </div>

                {tipologias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {tipologias.map((t) => (
                            <span
                                key={t}
                                className="text-[11px] font-jakarta font-semibold text-[#7E6649] bg-gold/10 border border-gold/30 px-2 py-0.5 rounded"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                <Link
                    to={`/proyecto/${id}`}
                    onMouseEnter={onButtonHover}
                    onMouseLeave={onButtonLeave}
                    onClick={rememberScrollForReturn}
                    className="block w-full mt-auto text-center border border-[#2C2C2C] text-[#2C2C2C] hover:bg-gold hover:text-obsidian hover:border-gold py-2.5 text-xs font-jakarta font-bold uppercase tracking-wider relative z-10 rounded-xl transition-colors duration-300"
                >
                    Ver Proyecto
                </Link>
            </div>
        </div>
    );
};

export default ProyectoCard;
