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
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../components/GoogleMapsProvider';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoaded: mapsLoaded } = useGoogleMaps();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [location, setLocation] = useState(null);
    const [showInfoWindow, setShowInfoWindow] = useState(true);
    const [needsGeocoding, setNeedsGeocoding] = useState(false);
    const [geocodingDone, setGeocodingDone] = useState(false);

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

                // Try to get location - first try RPC, then fallback to geocoding
                let locationFound = false;

                // Method 1: Try RPC if available
                try {
                    const { data: locationData, error: locError } = await supabase
                        .rpc('get_property_with_location', { property_id: parseInt(id) });

                    if (!locError && locationData && locationData.length > 0 &&
                        locationData[0].ubicacion_lat && locationData[0].ubicacion_lng) {
                        setLocation({
                            lat: locationData[0].ubicacion_lat,
                            lng: locationData[0].ubicacion_lng
                        });
                        locationFound = true;
                        console.log('Location obtained from RPC');
                    }
                } catch (rpcError) {
                    console.log('RPC not available, will try geocoding');
                }

                // Method 2: Mark that we need geocoding when maps loads
                if (!locationFound && data.direccion_referencial) {
                    setNeedsGeocoding(true);
                }

            } catch (error) {
                console.error('Error fetching property:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    // Geocoding effect - runs when maps is loaded and we need geocoding
    useEffect(() => {
        if (mapsLoaded && needsGeocoding && !location && !geocodingDone && property?.direccion_referencial) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
                { address: property.direccion_referencial },
                (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const loc = results[0].geometry.location;
                        setLocation({
                            lat: loc.lat(),
                            lng: loc.lng()
                        });
                        console.log('Location obtained from Geocoding');
                    }
                    setGeocodingDone(true);
                }
            );
        }
    }, [mapsLoaded, needsGeocoding, location, geocodingDone, property]);

    const getEstadoBadgeColor = (estado) => {
        switch (estado) {
            case 'publicada':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'vendida':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'arrendada':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'borrador':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getOperacionBadgeColor = (operacion) => {
        if (operacion?.toLowerCase().includes('venta')) {
            return 'bg-orange-500 text-white';
        } else if (operacion?.toLowerCase().includes('arriendo')) {
            return 'bg-indigo-500 text-white';
        }
        return 'bg-primary text-white';
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando propiedad...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
                    <p className="text-gray-600 mb-4">La propiedad que buscas no existe o fue eliminada.</p>
                    <Link to="/" className="text-primary hover:text-blue-700 font-medium">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    const images = property.propiedades_imagenes?.sort((a, b) => a.orden - b.orden) || [];
    const currentImage = images[activeImage]?.url || 'https://via.placeholder.com/800x600?text=Sin+Imagen';

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-gray-600 hover:text-primary transition-colors mb-6 group"
                >
                    <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Volver</span>
                </button>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header with Operation Badge */}
                    <div className="relative">
                        {/* Image Gallery */}
                        <div className="relative h-[500px] bg-gray-900">
                            <img
                                src={currentImage}
                                alt={property.titulo}
                                className="w-full h-full object-cover"
                            />

                            {/* Operation Badge */}
                            {property.tipos_operacion?.nombre && (
                                <div className={`absolute top-4 left-4 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide shadow-lg ${getOperacionBadgeColor(property.tipos_operacion.nombre)}`}>
                                    {property.tipos_operacion.nombre}
                                </div>
                            )}

                            {/* Estado Badge */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium border ${getEstadoBadgeColor(property.estado)}`}>
                                {property.estado?.charAt(0).toUpperCase() + property.estado?.slice(1)}
                            </div>

                            {/* Image Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                                    {activeImage + 1} / {images.length}
                                </div>
                            )}
                        </div>

                        {/* Image Thumbnails */}
                        {images.length > 1 && (
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white rounded-xl shadow-lg">
                                {images.slice(0, 6).map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === index
                                            ? 'border-primary scale-105'
                                            : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Imagen ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {index === 5 && images.length > 6 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">
                                                +{images.length - 6}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className={`p-8 ${images.length > 1 ? 'pt-24' : ''}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Title & Price */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                            {property.titulo}
                                        </h1>
                                        <div className="flex items-center text-gray-500">
                                            <MapPin className="h-5 w-5 mr-2 text-primary" />
                                            <span>{property.direccion_referencial}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
                                        <div className="text-sm opacity-90">Precio</div>
                                        <div className="text-2xl font-bold">
                                            UF {property.precio_uf?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Property Type & Location */}
                                <div className="flex flex-wrap gap-3">
                                    {property.tipos_propiedad?.nombre && (
                                        <div className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-full">
                                            <Home className="h-4 w-4 mr-2" />
                                            <span className="font-medium">{property.tipos_propiedad.nombre}</span>
                                        </div>
                                    )}
                                    {property.comunas?.nombre && (
                                        <div className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-full">
                                            <Building2 className="h-4 w-4 mr-2" />
                                            <span className="font-medium">{property.comunas.nombre}</span>
                                            {property.comunas.regiones?.nombre && (
                                                <span className="text-gray-400 ml-1">
                                                    • {property.comunas.regiones.nombre}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Features Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                                        <Bed className="h-8 w-8 text-primary mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-gray-900">{property.habitaciones}</div>
                                        <div className="text-sm text-gray-500">Dormitorios</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                                        <Bath className="h-8 w-8 text-primary mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-gray-900">{property.banos}</div>
                                        <div className="text-sm text-gray-500">Baños</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                                        <Maximize className="h-8 w-8 text-primary mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-gray-900">{property.mt2_construidos}</div>
                                        <div className="text-sm text-gray-500">m² Construidos</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                                        <LandPlot className="h-8 w-8 text-primary mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-gray-900">
                                            {property.mt2_terreno || '-'}
                                        </div>
                                        <div className="text-sm text-gray-500">m² Terreno</div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="border-t pt-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <Tag className="h-5 w-5 mr-2 text-primary" />
                                        Descripción
                                    </h3>
                                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                        {property.descripcion}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - Map & Contact */}
                            <div className="space-y-6">
                                {/* Location Map */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <Map className="h-5 w-5 mr-2 text-primary" />
                                        Ubicación
                                    </h3>

                                    {!mapsLoaded ? (
                                        <div className="h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                                <p>Cargando mapa...</p>
                                            </div>
                                        </div>
                                    ) : location ? (
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={location}
                                            zoom={15}
                                            options={{
                                                disableDefaultUI: false,
                                                zoomControl: true,
                                                mapTypeControl: false,
                                                streetViewControl: true,
                                                fullscreenControl: true,
                                            }}
                                        >
                                            <Marker
                                                position={location}
                                                onClick={() => setShowInfoWindow(true)}
                                            />
                                            {showInfoWindow && (
                                                <InfoWindow
                                                    position={location}
                                                    onCloseClick={() => setShowInfoWindow(false)}
                                                >
                                                    <div className="p-2">
                                                        <h4 className="font-bold text-gray-900">{property.titulo}</h4>
                                                        <p className="text-sm text-gray-600">{property.direccion_referencial}</p>
                                                    </div>
                                                </InfoWindow>
                                            )}
                                        </GoogleMap>
                                    ) : (
                                        <div className="h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>{geocodingDone ? 'Ubicación no disponible' : 'Obteniendo ubicación...'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Address Details */}
                                    <div className="mt-4 p-4 bg-white rounded-lg border">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {property.direccion_referencial}
                                                </p>
                                                {property.comunas?.nombre && (
                                                    <p className="text-sm text-gray-500">
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
                                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-6 text-white">
                                    <h3 className="text-lg font-bold mb-4">¿Te interesa esta propiedad?</h3>
                                    <p className="text-blue-100 mb-4 text-sm">
                                        Contáctanos para más información o agendar una visita.
                                    </p>
                                    <button className="w-full bg-white text-primary font-bold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors">
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
