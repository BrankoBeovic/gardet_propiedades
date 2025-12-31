import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, List, ArrowLeft } from 'lucide-react';
import PropertyList from '../components/PropertyList';
import PropertyForm from '../components/PropertyForm';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState([]);
    const [activeView, setActiveView] = useState('list'); // 'list', 'create', or 'edit'
    const [editingProperty, setEditingProperty] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
                loadProperties(session.user.id);
            }
            setLoading(false);
        };

        checkUser();
    }, [navigate]);

    const loadProperties = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('propiedades')
                .select(`
          *,
          propiedades_imagenes (
            url,
            es_portada,
            orden
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Enrich properties with lat/lng from ubicacion
            const enrichedProperties = await Promise.all(
                (data || []).map(async (property) => {
                    if (property.ubicacion) {
                        try {
                            const { data: locationData } = await supabase
                                .rpc('get_property_with_location', { property_id: property.id });

                            if (locationData && locationData.length > 0) {
                                return {
                                    ...property,
                                    ubicacion_lat: locationData[0].ubicacion_lat,
                                    ubicacion_lng: locationData[0].ubicacion_lng
                                };
                            }
                        } catch (err) {
                            console.error('Error loading location for property', property.id, err);
                        }
                    }
                    return property;
                })
            );

            setProperties(enrichedProperties);
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleEdit = (property) => {
        setEditingProperty(property);
        setActiveView('edit');
    };

    const handleDelete = async (propertyId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
            return;
        }

        try {
            // Delete images from storage first
            const { data: images } = await supabase
                .from('propiedades_imagenes')
                .select('url')
                .eq('propiedad_id', propertyId);

            if (images) {
                for (const image of images) {
                    // Extract file path from URL
                    const urlParts = image.url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const folderName = urlParts[urlParts.length - 2];

                    await supabase.storage
                        .from('propiedades')
                        .remove([`${folderName}/${fileName}`]);
                }
            }

            // Delete image records
            await supabase
                .from('propiedades_imagenes')
                .delete()
                .eq('propiedad_id', propertyId);

            // Delete property
            const { error } = await supabase
                .from('propiedades')
                .delete()
                .eq('id', propertyId);

            if (error) throw error;

            // Reload properties
            loadProperties(user.id);
            alert('Propiedad eliminada exitosamente');
        } catch (error) {
            console.error('Error deleting property:', error);
            alert('Error al eliminar la propiedad: ' + error.message);
        }
    };

    const handleSave = () => {
        loadProperties(user.id);
        setActiveView('list');
        setEditingProperty(null);
    };

    const handleCancel = () => {
        setActiveView('list');
        setEditingProperty(null);
    };

    const handleNewProperty = () => {
        setEditingProperty(null);
        setActiveView('create');
    };

    const handleBackToList = () => {
        setActiveView('list');
        setEditingProperty(null);
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard de Propiedades</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Cerrar Sesión
                </button>
            </div>

            {/* User Info Card */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Información de Usuario</h3>
                <p className="text-sm text-gray-600">Email: {user?.email}</p>
            </div>

            {/* Navigation */}
            {activeView === 'edit' ? (
                // Edit Mode Header - Not a tab, just a header with back button
                <div className="mb-6">
                    <button
                        onClick={handleBackToList}
                        className="inline-flex items-center text-primary hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Volver a Mis Propiedades
                    </button>
                    <div className="bg-blue-50 border-l-4 border-primary p-4 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Editando: {editingProperty?.titulo}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Modifica los campos que necesites y guarda los cambios
                        </p>
                    </div>
                </div>
            ) : (
                // Tabs for List and Create
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={handleBackToList}
                                className={`${activeView === 'list'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <List className="h-5 w-5 mr-2" />
                                Mis Propiedades
                            </button>
                            <button
                                onClick={handleNewProperty}
                                className={`${activeView === 'create'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Nueva Propiedad
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Content */}
            {activeView === 'list' ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <PropertyList
                        properties={properties}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        loading={false}
                    />
                </div>
            ) : (
                <PropertyForm
                    property={editingProperty}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default Dashboard;
