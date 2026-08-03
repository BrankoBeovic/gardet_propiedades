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
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();
    }, []);

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

    const handleBack = () => {
        const referrer = document.referrer || '';
        // If there's internal history stack within this tab
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else if (referrer.includes('/dashboard') || user) {
            navigate('/dashboard');
        } else if (referrer.includes('/arriendo')) {
            navigate('/arriendo');
        } else if (referrer.includes('/venta')) {
            navigate('/venta');
        } else {
            navigate('/');
        }
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
                    <button onClick={handleBack} className="btn-gold-outline text-sm px-6 py-2.5">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const images = property.propiedades_imagenes?.sort((a, b) => a.orden - b.orden) || [];
    const currentImage = images[activeImage]?.url || null;

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Navigation */}
                <button
                    onClick={handleBack}
                    className="inline-flex items-center text-ivory/50 hover:text-gold transition-colors mt-8 mb-6 group font-jakarta text-sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span>Volver</span>
                </button>

                {/* Main Content */}
                <div className="bg-[#1C1C1E] border border-gold/25 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 relative z-[1]">
                    {/* Header with Operation Badge */}
                    <div className="relative">
                        {/* Image Gallery */}
                        <div className="relative bg-[#141416]">
                            <div className="relative h-[450px] sm:h-[500px] bg-[#141416]">
                                {currentImage ? (
                                    <img
                                        src={currentImage}
                                        alt={property.titulo}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Home className="h-24 w-24 text-gold/30" />
                                    </div>
                                )}

                                {/* Dark overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-black/30 pointer-events-none" />

                                {/* Operation Badge */}
                                {property.tipos_operacion?.nombre && (
                                    <div className="absolute top-6 left-6 bg-gold text-obsidian px-5 py-2 font-jakarta font-bold text-sm uppercase tracking-widest shadow-lg z-10">
                                        {property.tipos_operacion.nombre}
                                    </div>
                                )}

                                {/* Estado Badge */}
                                <div className={`absolute top-6 right-6 px-4 py-1.5 text-sm font-jakarta font-medium border shadow-lg z-10 ${getEstadoBadgeColor(property.estado)}`}>
                                    {property.estado?.charAt(0).toUpperCase() + property.estado?.slice(1)}
                                </div>

                                {/* Image Navigation */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#141416]/80 hover:bg-gold text-ivory hover:text-obsidian p-3 rounded-full transition-all duration-300 shadow-md z-10"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#141416]/80 hover:bg-gold text-ivory hover:text-obsidian p-3 rounded-full transition-all duration-300 shadow-md z-10"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}

                                {/* Image Counter Badge */}
                                {images.length > 1 && (
                                    <div className="absolute bottom-4 right-6 bg-[#141416]/90 border border-gold/30 text-gold px-3.5 py-1 text-xs font-jakarta font-bold rounded shadow-md z-10">
                                        {activeImage + 1} / {images.length}
                                    </div>
                                )}
                            </div>

                            {/* Image Thumbnails Strip - In-Flow Container */}
                            {images.length > 1 && (
                                <div className="bg-[#141416] border-t border-gold/20 p-3 px-6 flex items-center justify-center gap-3 overflow-x-auto">
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImage(index)}
                                            className={`relative w-16 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-all duration-200 ${activeImage === index
                                                ? 'border-gold scale-105 shadow-md shadow-gold/20'
                                                : 'border-transparent hover:border-ivory/40 opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Miniatura ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 lg:p-10 bg-[#1C1C1E]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Title & Price */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div>
                                        <h1 className="title-editorial text-3xl lg:text-4xl text-ivory mb-3 break-words">
                                            {property.titulo}
                                        </h1>
                                        <div className="flex items-center text-slate-300">
                                            <MapPin className="h-4 w-4 mr-2 text-gold flex-shrink-0" />
                                            <span className="font-jakarta text-sm break-words">{property.direccion_referencial}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gold text-obsidian px-6 py-4 flex-shrink-0 shadow-lg">
                                        <div className="text-xs font-jakarta font-bold uppercase tracking-wider text-obsidian/80">Precio</div>
                                        <div className="text-2xl font-ysabeau font-bold">
                                            UF {property.precio_uf?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Property Type & Location */}
                                <div className="flex flex-wrap gap-3">
                                    {property.tipos_propiedad?.nombre && (
                                        <div className="inline-flex items-center bg-[rgba(20,20,22,0.65)] border border-gold/20 text-ivory px-4 py-2 text-sm font-jakarta rounded">
                                            <Home className="h-4 w-4 mr-2 text-gold" />
                                            {property.tipos_propiedad.nombre}
                                        </div>
                                    )}
                                    {property.comunas?.nombre && (
                                        <div className="inline-flex items-center bg-[rgba(20,20,22,0.65)] border border-gold/20 text-ivory px-4 py-2 text-sm font-jakarta rounded">
                                            <Building2 className="h-4 w-4 mr-2 text-gold" />
                                            {property.comunas.nombre}
                                            {property.comunas.regiones?.nombre && (
                                                <span className="text-slate-400 ml-1.5">
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
                                        <div key={idx} className="bg-[rgba(20,20,22,0.65)] border border-gold/20 rounded-lg p-4 text-center hover:border-gold/40 transition-colors shadow-md">
                                            <Icon className="h-6 w-6 text-gold mx-auto mb-2" />
                                            <div className="text-xl font-jakarta font-bold text-ivory">{value}</div>
                                            <div className="text-xs text-slate-400 font-jakarta mt-1">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                 <div className="border-t border-gold/20 pt-8">
                                     <h3 className="text-lg font-jakarta font-bold text-ivory mb-4 flex items-center">
                                         <Tag className="h-4 w-4 mr-2 text-gold" />
                                         Descripción
                                     </h3>
                                     <p className="text-slate-200 whitespace-pre-line leading-relaxed font-jakarta text-sm bg-[rgba(20,20,22,0.65)] p-6 rounded-xl border border-gold/15 break-words overflow-hidden">
                                         {property.descripcion}
                                     </p>
                                 </div>
                            </div>

                            {/* Right Column - Map & Contact */}
                            <div className="space-y-6">
                                {/* Location */}
                                <div className="bg-[rgba(20,20,22,0.65)] rounded-xl p-5 border border-gold/20 shadow-md">
                                    <h3 className="text-lg font-jakarta font-bold text-ivory mb-4 flex items-center">
                                        <Map className="h-4 w-4 mr-2 text-gold" />
                                        Ubicación
                                    </h3>

                                    {/* Google Maps desactivado temporalmente */}
                                    <div className="h-[250px] bg-[#1C1C1E] rounded-lg flex items-center justify-center border border-gold/15">
                                        <div className="text-center text-slate-400">
                                            <MapPin className="h-10 w-10 mx-auto mb-2 text-gold/60" />
                                            <p className="font-jakarta text-sm font-medium text-ivory">Mapa no disponible</p>
                                            <p className="text-xs mt-1 text-slate-400">Próximamente</p>
                                        </div>
                                    </div>

                                    {/* Address Details */}
                                    <div className="mt-4 p-4 bg-[#1C1C1E] rounded-lg border border-gold/15">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-jakarta font-medium text-ivory text-sm">
                                                    {property.direccion_referencial}
                                                </p>
                                                {property.comunas?.nombre && (
                                                    <p className="text-xs text-slate-400 font-jakarta mt-1">
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
                                <div className="bg-gold rounded-xl p-6 shadow-xl">
                                    <h3 className="text-lg font-jakarta font-bold text-obsidian mb-3">¿Te interesa esta propiedad?</h3>
                                    <p className="text-obsidian/90 mb-5 text-sm font-jakarta font-medium">
                                        Contáctanos para más información o agendar una visita exclusiva.
                                    </p>
                                    <button className="w-full bg-obsidian text-gold font-jakarta font-bold py-3 px-4 text-sm tracking-wider uppercase hover:bg-obsidian-light transition-colors shadow-md rounded-xl cursor-pointer">
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
