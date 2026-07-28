import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    MapPin,
    Bed,
    Bath,
    Maximize,
    ArrowLeft,
    Home,
    Tag,
    Map,
    Building2,
    LandPlot,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
// Google Maps desactivado temporalmente

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                // Fetch property with all related data
                const { data, error } = await supabase
                    .from('propiedades')
                    .select(`
                        *,
                        propiedades_imagenes (
                            url,
                            es_portada,
                            orden
                        ),
                        tipos_propiedad (
                            id,
                            nombre
                        ),
                        tipos_operacion (
                            id,
                            nombre
                        ),
                        comunas (
                            id,
                            nombre,
                            regiones (
                                id,
                                nombre
                            )
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                setProperty(data);

                // Ubicación desactivada temporalmente (Google Maps stand-by)

            } catch (error) {
                console.error('Error fetching property:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    const getEstadoBadgeColor = (estado) => {
        switch (estado) {
            case 'publicada':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'vendida':
                return 'bg-gold/20 text-gold border-gold/30';
            case 'arrendada':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'borrador':
                return 'bg-ivory/10 text-ivory/50 border-ivory/20';
            default:
                return 'bg-ivory/10 text-ivory/50 border-ivory/20';
        }
    };

    const nextImage = () => {
        const images = property?.propiedades_imagenes || [];
        setActiveImage((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        const images = property?.propiedades_imagenes || [];
        setActiveImage((prev) => (prev - 1 + images.length) % images.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4"></div>
                    <p className="text-ivory/40 font-jakarta text-sm">Cargando propiedad...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center pt-20">
                <div className="text-center">
                    <h2 className="title-editorial text-3xl text-ivory mb-3">Propiedad no encontrada</h2>
                    <p className="text-ivory/40 font-jakarta mb-6">La propiedad que buscas no existe o fue eliminada.</p>
                    <Link to="/" className="btn-gold-outline text-sm px-6 py-2.5">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    const images = property.propiedades_imagenes?.sort((a, b) => a.orden - b.orden) || [];
    const currentImage = images[activeImage]?.url || null;

    return (
        <div className="min-h-screen bg-obsidian pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-ivory/50 hover:text-gold transition-colors mt-8 mb-6 group font-jakarta text-sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span>Volver</span>
                </button>

                {/* Main Content */}
                <div className="card-dark rounded-2xl overflow-hidden">
                    {/* Header with Operation Badge */}
                    <div className="relative">
                        {/* Image Gallery */}
                        <div className="relative h-[500px] bg-obsidian-light">
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={property.titulo}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Home className="h-24 w-24 text-obsidian-50/20" />
                                </div>
                            )}

                            {/* Dark overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-obsidian/20" />

                            {/* Operation Badge */}
                            {property.tipos_operacion?.nombre && (
                                <div className="absolute top-6 left-6 bg-gold text-obsidian px-5 py-2 font-jakarta font-bold text-sm uppercase tracking-widest">
                                    {property.tipos_operacion.nombre}
                                </div>
                            )}

                            {/* Estado Badge */}
                            <div className={`absolute top-6 right-6 px-4 py-1.5 text-sm font-jakarta font-medium border ${getEstadoBadgeColor(property.estado)}`}>
                                {property.estado?.charAt(0).toUpperCase() + property.estado?.slice(1)}
                            </div>

                            {/* Image Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-obsidian/70 backdrop-blur-sm hover:bg-gold text-ivory hover:text-obsidian p-3 rounded-full transition-all duration-300"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-obsidian/70 backdrop-blur-sm hover:bg-gold text-ivory hover:text-obsidian p-3 rounded-full transition-all duration-300"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter */}
                            {images.length > 1 && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-obsidian/70 backdrop-blur-sm text-ivory/80 px-4 py-1.5 text-sm font-jakarta font-medium">
                                    {activeImage + 1} / {images.length}
                                </div>
                            )}
                        </div>

                        {/* Image Thumbnails */}
                        {images.length > 1 && (
                            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-charcoal border border-obsidian-50/10 rounded-lg">
                                {images.slice(0, 6).map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`relative w-14 h-14 rounded overflow-hidden border-2 transition-all ${activeImage === index
                                            ? 'border-gold scale-105'
                                            : 'border-transparent hover:border-ivory/30 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Imagen ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {index === 5 && images.length > 6 && (
                                            <div className="absolute inset-0 bg-obsidian/70 flex items-center justify-center text-ivory font-jakarta font-bold text-sm">
                                                +{images.length - 6}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className={`p-8 lg:p-10 ${images.length > 1 ? 'pt-24' : ''}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Title & Price */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div>
                                        <h1 className="title-editorial text-3xl lg:text-4xl text-ivory mb-3">
                                            {property.titulo}
                                        </h1>
                                        <div className="flex items-center text-ivory/50">
                                            <MapPin className="h-4 w-4 mr-2 text-gold" />
                                            <span className="font-jakarta text-sm">{property.direccion_referencial}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gold text-obsidian px-6 py-4 flex-shrink-0">
                                        <div className="text-xs font-jakarta font-medium opacity-70 uppercase tracking-wide">Precio</div>
                                        <div className="text-2xl font-cormorant font-semibold">
                                            UF {property.precio_uf?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Property Type & Location */}
                                <div className="flex flex-wrap gap-3">
                                    {property.tipos_propiedad?.nombre && (
                                        <div className="inline-flex items-center bg-obsidian border border-obsidian-50/20 text-ivory/70 px-4 py-2 text-sm font-jakarta">
                                            <Home className="h-4 w-4 mr-2 text-gold" />
                                            {property.tipos_propiedad.nombre}
                                        </div>
                                    )}
                                    {property.comunas?.nombre && (
                                        <div className="inline-flex items-center bg-obsidian border border-obsidian-50/20 text-ivory/70 px-4 py-2 text-sm font-jakarta">
                                            <Building2 className="h-4 w-4 mr-2 text-gold" />
                                            {property.comunas.nombre}
                                            {property.comunas.regiones?.nombre && (
                                                <span className="text-ivory/30 ml-1.5">
                                                    • {property.comunas.regiones.nombre}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Features Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        { icon: Bed, value: property.habitaciones, label: 'Dormitorios' },
                                        { icon: Bath, value: property.banos, label: 'Baños' },
                                        { icon: Maximize, value: property.mt2_construidos, label: 'm² Construidos' },
                                        { icon: LandPlot, value: property.mt2_terreno || '-', label: 'm² Terreno' },
                                    ].map(({ icon: Icon, value, label }, idx) => (
                                        <div key={idx} className="bg-obsidian border border-obsidian-50/10 rounded-lg p-4 text-center hover:border-gold/20 transition-colors">
                                            <Icon className="h-6 w-6 text-gold mx-auto mb-2" />
                                            <div className="text-xl font-jakarta font-bold text-ivory">{value}</div>
                                            <div className="text-xs text-ivory/40 font-jakarta mt-1">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                <div className="border-t border-obsidian-50/10 pt-8">
                                    <h3 className="text-lg font-jakarta font-bold text-ivory mb-4 flex items-center">
                                        <Tag className="h-4 w-4 mr-2 text-gold" />
                                        Descripción
                                    </h3>
                                    <p className="text-ivory/60 whitespace-pre-line leading-relaxed font-jakarta text-sm">
                                        {property.descripcion}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - Map & Contact */}
                            <div className="space-y-6">
                                {/* Location */}
                                <div className="bg-obsidian rounded-xl p-5 border border-obsidian-50/10">
                                    <h3 className="text-lg font-jakarta font-bold text-ivory mb-4 flex items-center">
                                        <Map className="h-4 w-4 mr-2 text-gold" />
                                        Ubicación
                                    </h3>

                                    {/* Google Maps desactivado temporalmente */}
                                    <div className="h-[250px] bg-obsidian-light rounded-lg flex items-center justify-center border border-obsidian-50/10">
                                        <div className="text-center text-ivory/30">
                                            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                            <p className="font-jakarta text-sm font-medium">Mapa no disponible</p>
                                            <p className="text-xs mt-1">Próximamente</p>
                                        </div>
                                    </div>

                                    {/* Address Details */}
                                    <div className="mt-4 p-4 bg-charcoal-dark rounded-lg border border-obsidian-50/10">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-jakarta font-medium text-ivory text-sm">
                                                    {property.direccion_referencial}
                                                </p>
                                                {property.comunas?.nombre && (
                                                    <p className="text-xs text-ivory/40 font-jakarta mt-1">
                                                        {property.comunas.nombre}
                                                        {property.comunas.regiones?.nombre && (
                                                            <>, {property.comunas.regiones.nombre}</>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Card */}
                                <div className="bg-gold rounded-xl p-6">
                                    <h3 className="text-lg font-jakarta font-bold text-obsidian mb-3">¿Te interesa esta propiedad?</h3>
                                    <p className="text-obsidian/70 mb-5 text-sm font-jakarta">
                                        Contáctanos para más información o agendar una visita exclusiva.
                                    </p>
                                    <button className="w-full bg-obsidian text-gold font-jakarta font-bold py-3 px-4 text-sm tracking-wide hover:bg-obsidian-light transition-colors">
                                        Contactar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;
