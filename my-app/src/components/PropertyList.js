import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

const PropertyList = ({ properties, onEdit, onDelete, loading }) => {
    if (loading) {
        return <div className="text-center py-8">Cargando propiedades...</div>;
    }

    if (!properties || properties.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No tienes propiedades creadas aún. ¡Crea tu primera propiedad!
            </div>
        );
    }

    const getEstadoBadge = (estado) => {
        const colors = {
            borrador: 'bg-gray-200 text-gray-800',
            publicada: 'bg-green-200 text-green-800',
            vendida: 'bg-blue-200 text-blue-800',
            arrendada: 'bg-purple-200 text-purple-800'
        };
        return colors[estado] || 'bg-gray-200 text-gray-800';
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio (UF)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{property.titulo}</div>
                                <div className="text-sm text-gray-500">{property.direccion_referencial}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">UF {property.precio_uf?.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(property.estado)}`}>
                                    {property.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                    onClick={() => window.open(`/propiedad/${property.id}`, '_blank')}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Ver"
                                >
                                    <Eye className="h-5 w-5 inline" />
                                </button>
                                <button
                                    onClick={() => onEdit(property)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Editar"
                                >
                                    <Edit className="h-5 w-5 inline" />
                                </button>
                                <button
                                    onClick={() => onDelete(property.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-5 w-5 inline" />
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
