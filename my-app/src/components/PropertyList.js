import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye } from 'lucide-react';

const PropertyList = ({ properties, onEdit, onDelete, loading }) => {
    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                <p className="mt-3 text-ivory/40 font-jakarta text-sm">Cargando propiedades...</p>
            </div>
        );
    }

    if (!properties || properties.length === 0) {
        return (
            <div className="text-center py-12 text-ivory/40 font-jakarta">
                No tienes propiedades creadas aún. ¡Crea tu primera propiedad!
            </div>
        );
    }

    const getEstadoBadge = (estado) => {
        const colors = {
            borrador: 'bg-ivory/10 text-ivory/60 border-ivory/20',
            publicada: 'bg-green-500/15 text-green-400 border-green-500/20',
            vendida: 'bg-gold/15 text-gold border-gold/20',
            arrendada: 'bg-purple-500/15 text-purple-400 border-purple-500/20'
        };
        return colors[estado] || 'bg-ivory/10 text-ivory/60 border-ivory/20';
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-obsidian-50/10">
                <thead className="bg-obsidian-light">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-gold uppercase tracking-wider">
                            Título
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-gold uppercase tracking-wider">
                            Precio (UF)
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-gold uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-jakarta font-semibold text-gold uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-obsidian-50/10">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-charcoal/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-jakarta font-medium text-ivory">{property.titulo}</div>
                                <div className="text-xs font-jakarta text-ivory/40 mt-0.5">{property.direccion_referencial}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-jakarta text-gold font-semibold">UF {property.precio_uf?.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs font-jakarta font-medium border ${getEstadoBadge(property.estado)}`}>
                                    {property.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                <Link
                                    to={`/propiedad/${property.id}`}
                                    className="text-ivory/40 hover:text-gold transition-colors inline-block"
                                    title="Ver"
                                >
                                    <Eye className="h-4 w-4 inline" />
                                </Link>
                                <button
                                    onClick={() => onEdit(property)}
                                    className="text-ivory/40 hover:text-gold transition-colors"
                                    title="Editar"
                                >
                                    <Edit className="h-4 w-4 inline" />
                                </button>
                                <button
                                    onClick={() => onDelete(property.id)}
                                    className="text-ivory/40 hover:text-red-400 transition-colors"
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
