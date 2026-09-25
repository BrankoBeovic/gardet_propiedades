import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, List, ArrowLeft, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { PROPERTY_DASHBOARD_SELECT } from '../lib/propertyHelpers';
import { storagePathFromPublicUrl } from '../lib/imageUpload';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import PropertyList from '../components/PropertyList';
import PropertyForm from '../components/PropertyForm';
import ProyectoList from '../components/ProyectoList';
import ProyectoForm from '../components/ProyectoForm';

const PROYECTO_DASHBOARD_SELECT = `
  *,
  proyectos_imagenes (url, es_portada, orden),
  proyectos_unidades (*)
`;

const Dashboard = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [properties, setProperties] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [proyectos, setProyectos] = useState([]);
    const [proyectosLoading, setProyectosLoading] = useState(true);
    const [proyectosError, setProyectosError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    // 'list' | 'create' | 'edit' | 'proyectos' | 'proyecto-create' | 'proyecto-edit'
    const [activeView, setActiveView] = useState('list');
    const [editingProperty, setEditingProperty] = useState(null);
    const [editingProyecto, setEditingProyecto] = useState(null);
    const navigate = useNavigate();

    useDocumentMeta('Dashboard', 'Panel de administración de propiedades GARDET.');

    useEffect(() => {
        if (!authLoading && user) {
            loadProperties(user.id);
            loadProyectos(user.id);
        }
    }, [authLoading, user]);

    const loadProyectos = async (userId) => {
        setProyectosLoading(true);
        setProyectosError(null);
        try {
            const { data, error } = await supabase
                .from('proyectos')
                .select(PROYECTO_DASHBOARD_SELECT)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProyectos(data || []);
        } catch (error) {
            console.error('Error loading proyectos:', error);
            setProyectosError(error.message || 'No se pudieron cargar los proyectos');
        } finally {
            setProyectosLoading(false);
        }
    };

    const loadProperties = async (userId) => {
        setListLoading(true);
        setListError(null);
        try {
            const { data, error } = await supabase
                .from('propiedades')
                .select(PROPERTY_DASHBOARD_SELECT)
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
            setListError(error.message || 'No se pudieron cargar las propiedades');
        } finally {
            setListLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleEdit = (property) => {
        setEditingProperty(property);
        setActiveView('edit');
        setFeedback(null);
    };

    const handleDelete = async (propertyId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
            return;
        }

        setFeedback(null);
        try {
            // Delete images from storage first
            const { data: images } = await supabase
                .from('propiedades_imagenes')
                .select('url')
                .eq('propiedad_id', propertyId);

            if (images) {
                for (const image of images) {
                    const urlParts = image.url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const folderName = urlParts[urlParts.length - 2];

                    await supabase.storage
                        .from('propiedades')
                        .remove([`${folderName}/${fileName}`]);
                }
            }

            await supabase
                .from('propiedades_imagenes')
                .delete()
                .eq('propiedad_id', propertyId);

            // Scope delete to current owner — do not trust id alone
            const { error } = await supabase
                .from('propiedades')
                .delete()
                .eq('id', propertyId)
                .eq('user_id', user.id);

            if (error) throw error;

            loadProperties(user.id);
            setFeedback({ type: 'success', message: 'Propiedad eliminada exitosamente' });
        } catch (error) {
            console.error('Error deleting property:', error);
            setFeedback({ type: 'error', message: 'Error al eliminar la propiedad: ' + error.message });
        }
    };

    const handleSave = () => {
        loadProperties(user.id);
        setActiveView('list');
        setEditingProperty(null);
        setFeedback({ type: 'success', message: 'Propiedad guardada correctamente' });
    };

    const handleCancel = () => {
        setActiveView('list');
        setEditingProperty(null);
    };

    const handleNewProperty = () => {
        setEditingProperty(null);
        setActiveView('create');
        setFeedback(null);
    };

    const handleBackToList = () => {
        setActiveView('list');
        setEditingProperty(null);
    };

    const showProyectos = () => {
        setActiveView('proyectos');
        setEditingProyecto(null);
    };

    const handleNewProyecto = () => {
        setEditingProyecto(null);
        setActiveView('proyecto-create');
        setFeedback(null);
    };

    const handleEditProyecto = (proyecto) => {
        setEditingProyecto(proyecto);
        setActiveView('proyecto-edit');
        setFeedback(null);
    };

    const handleSaveProyecto = () => {
        loadProyectos(user.id);
        showProyectos();
        setFeedback({ type: 'success', message: 'Proyecto guardado correctamente' });
    };

    const handleDeleteProyecto = async (proyecto) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el proyecto "${proyecto.nombre}" y todas sus unidades?`)) {
            return;
        }

        setFeedback(null);
        try {
            const paths = (proyecto.proyectos_imagenes || [])
                .map((img) => storagePathFromPublicUrl(img.url, 'propiedades'))
                .filter(Boolean);
            if (paths.length) {
                await supabase.storage.from('propiedades').remove(paths);
            }

            // Units and image rows are removed by ON DELETE CASCADE
            const { error } = await supabase
                .from('proyectos')
                .delete()
                .eq('id', proyecto.id)
                .eq('user_id', user.id);
            if (error) throw error;

            loadProyectos(user.id);
            setFeedback({ type: 'success', message: 'Proyecto eliminado exitosamente' });
        } catch (error) {
            console.error('Error deleting proyecto:', error);
            setFeedback({ type: 'error', message: 'Error al eliminar el proyecto: ' + error.message });
        }
    };

    const isEditing = activeView === 'edit' || activeView === 'proyecto-edit';
    const tabClass = (active) =>
        `${active
            ? 'border-gold text-gold'
            : 'border-transparent text-ivory/40 hover:text-ivory/70 hover:border-ivory/20'
        } whitespace-nowrap py-4 px-1 border-b-2 font-jakarta font-medium text-sm flex items-center transition-colors`;

    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                <p className="mt-4 text-ivory/40 font-jakarta text-sm">Cargando...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="title-editorial text-3xl text-ivory">Dashboard</h1>
                        <div className="gold-line mt-2"></div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 text-ivory/40 hover:text-red-400 transition-colors font-jakarta text-sm border border-obsidian-50/20 hover:border-red-400/30 px-4 py-2 rounded-xl cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                    </button>
                </div>

                {/* User Info Card */}
                <div className="card-dark rounded-lg p-5 mb-6">
                    <h3 className="text-sm font-jakarta font-semibold text-gold uppercase tracking-wider mb-2">Información de Usuario</h3>
                    <p className="text-sm text-ivory/60 font-jakarta">{user?.email}</p>
                </div>

                {feedback && (
                    <div
                        className={`mb-6 rounded-lg px-4 py-3 text-sm font-jakarta border ${
                            feedback.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                    >
                        {feedback.message}
                    </div>
                )}

                {/* Navigation */}
                {isEditing ? (
                    <div className="mb-6">
                        <button
                            onClick={activeView === 'edit' ? handleBackToList : showProyectos}
                            className="inline-flex items-center text-ivory/50 hover:text-gold transition-colors mb-4 font-jakarta text-sm"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {activeView === 'edit' ? 'Volver a Mis Propiedades' : 'Volver a Proyectos'}
                        </button>
                        <div className="bg-gold/10 border-l-2 border-gold p-4 mb-4">
                            <h2 className="text-base font-jakarta font-semibold text-ivory">
                                Editando: {activeView === 'edit' ? editingProperty?.titulo : editingProyecto?.nombre}
                            </h2>
                            <p className="text-xs text-ivory/40 font-jakarta mt-1">
                                Modifica los campos que necesites y guarda los cambios
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <div className="border-b border-obsidian-50/10 overflow-x-auto">
                            <nav className="-mb-px flex space-x-8">
                                <button onClick={handleBackToList} className={tabClass(activeView === 'list')}>
                                    <List className="h-4 w-4 mr-2" />
                                    Mis Propiedades
                                </button>
                                <button onClick={handleNewProperty} className={tabClass(activeView === 'create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Propiedad
                                </button>
                                <button onClick={showProyectos} className={tabClass(activeView === 'proyectos')}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Proyectos
                                </button>
                                <button onClick={handleNewProyecto} className={tabClass(activeView === 'proyecto-create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Proyecto
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Content */}
                {activeView === 'proyectos' ? (
                    <div className="card-light overflow-hidden rounded-lg">
                        {proyectosError && (
                            <div className="m-4 rounded-lg px-4 py-3 text-sm font-jakarta bg-red-50 border border-red-200 text-red-700">
                                {proyectosError}
                            </div>
                        )}
                        <ProyectoList
                            proyectos={proyectos}
                            onEdit={handleEditProyecto}
                            onDelete={handleDeleteProyecto}
                            loading={proyectosLoading}
                        />
                    </div>
                ) : activeView === 'proyecto-create' || activeView === 'proyecto-edit' ? (
                    <ProyectoForm
                        key={editingProyecto?.id ?? 'new'}
                        proyecto={editingProyecto}
                        onSave={handleSaveProyecto}
                        onCancel={showProyectos}
                    />
                ) : activeView === 'list' ? (
                    <div className="card-light overflow-hidden rounded-lg">
                        {listError && (
                            <div className="m-4 rounded-lg px-4 py-3 text-sm font-jakarta bg-red-50 border border-red-200 text-red-700">
                                {listError}
                            </div>
                        )}
                        <PropertyList
                            properties={properties}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            loading={listLoading}
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
        </div>
    );
};

export default Dashboard;
