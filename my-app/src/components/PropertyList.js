import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye } from 'lucide-react';
import { getEstadoBadgeClasses } from '../lib/propertyHelpers';

const PropertyList = ({ properties, onEdit, onDelete, loading }) => {
    if (loading) {
        return (
            <div className="text-center py-12 bg-[#F5F2EC]">
                <div className="inline-block w-6 h-6 border-2 border-[#A1917B]/40 border-t-[#A1917B] rounded-full animate-spin"></div>
                <p className="mt-3 text-[#4A4A4A]/60 font-jakarta text-sm">Cargando propiedades...</p>
            </div>
        );
    }

    if (!properties || properties.length === 0) {
        return (
            <div className="text-center py-12 text-[#4A4A4A]/70 font-jakarta bg-[#F5F2EC]">
                No tienes propiedades creadas aún. ¡Crea tu primera propiedad!
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-[#F5F2EC]">
            <table className="min-w-full divide-y divide-[#2C2C2C]/10">
                <thead className="bg-white/80">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-[#A1917B] uppercase tracking-[5px]">
                            Título
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-[#A1917B] uppercase tracking-[5px]">
                            Precio (UF)
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-[#A1917B] uppercase tracking-[5px]">
                            Estado
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-[#A1917B] uppercase tracking-[5px]">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C2C]/10 bg-[#F5F2EC]">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-white/60 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-jakarta font-medium text-[#2C2C2C]">{property.titulo}</div>
                                <div className="text-xs font-jakarta text-[#4A4A4A]/70 mt-0.5">{property.direccion_referencial}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-jakarta text-[#7E6649] font-semibold">UF {property.precio_uf?.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs font-jakarta font-medium border rounded-full ${getEstadoBadgeClasses(property.estado)}`}>
                                    {property.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                {property.estado === 'publicada' && (
                                    <Link
                                        to={`/propiedad/${property.id}`}
                                        className="text-[#4A4A4A]/50 hover:text-[#7E6649] transition-colors inline-block"
                                        title="Ver"
                                    >
                                        <Eye className="h-4 w-4 inline" />
                                    </Link>
                                )}
                                <button
                                    onClick={() => onEdit(property)}
                                    className="text-[#4A4A4A]/50 hover:text-[#7E6649] transition-colors"
                                    title="Editar"
                                >
                                    <Edit className="h-4 w-4 inline" />
                                </button>
                                <button
                                    onClick={() => onDelete(property.id)}
                                    className="text-[#4A4A4A]/50 hover:text-red-600 transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4 inline" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PropertyList;
