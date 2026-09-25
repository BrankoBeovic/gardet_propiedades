import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye } from 'lucide-react';
import { availableUnits, formatUf, getProyectoEstadoBadgeClasses } from '../lib/proyectoHelpers';

const thClass = 'px-6 py-4 text-left text-xs font-jakarta font-semibold text-[#A1917B] uppercase tracking-[5px]';

const ProyectoList = ({ proyectos, onEdit, onDelete, loading }) => {
    if (loading) {
        return (
            <div className="text-center py-12 bg-[#F5F2EC]">
                <div className="inline-block w-6 h-6 border-2 border-[#A1917B]/40 border-t-[#A1917B] rounded-full animate-spin"></div>
                <p className="mt-3 text-[#4A4A4A]/60 font-jakarta text-sm">Cargando proyectos...</p>
            </div>
        );
    }

    if (!proyectos || proyectos.length === 0) {
        return (
            <div className="text-center py-12 text-[#4A4A4A]/70 font-jakarta bg-[#F5F2EC]">
                No tienes proyectos creados aún. ¡Crea tu primer proyecto!
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-[#F5F2EC]">
            <table className="min-w-full divide-y divide-[#2C2C2C]/10">
                <thead className="bg-white/80">
                    <tr>
                        <th className={thClass}>Proyecto</th>
                        <th className={thClass}>Desde</th>
                        <th className={thClass}>Unidades</th>
                        <th className={thClass}>Estado</th>
                        <th className={thClass}>Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C2C]/10 bg-[#F5F2EC]">
                    {proyectos.map((proyecto) => {
                        const disponibles = availableUnits(proyecto.proyectos_unidades);
                        const total = proyecto.proyectos_unidades?.length || 0;
                        return (
                            <tr key={proyecto.id} className="hover:bg-white/60 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-jakarta font-medium text-[#2C2C2C]">{proyecto.nombre}</div>
                                    <div className="text-xs font-jakarta text-[#4A4A4A]/70 mt-0.5">
                                        {[proyecto.inmobiliaria, proyecto.direccion].filter(Boolean).join(' · ')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-jakarta text-[#7E6649] font-semibold">
                                        {formatUf(disponibles[0]?.precio_final_uf ?? proyecto.precio_desde_uf)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-jakarta text-[#2C2C2C]">
                                    {disponibles.length} <span className="text-[#4A4A4A]/60">/ {total}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs font-jakarta font-medium border rounded-full ${getProyectoEstadoBadgeClasses(proyecto.estado)}`}>
                                        {proyecto.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                    {proyecto.estado !== 'borrador' && (
                                        <Link
                                            to={`/proyecto/${proyecto.id}`}
                                            className="text-[#4A4A4A]/50 hover:text-[#7E6649] transition-colors inline-block"
                                            title="Ver"
                                        >
                                            <Eye className="h-4 w-4 inline" />
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => onEdit(proyecto)}
                                        className="text-[#4A4A4A]/50 hover:text-[#7E6649] transition-colors"
                                        title="Editar"
                                    >
                                        <Edit className="h-4 w-4 inline" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(proyecto)}
                                        className="text-[#4A4A4A]/50 hover:text-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4 inline" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ProyectoList;
