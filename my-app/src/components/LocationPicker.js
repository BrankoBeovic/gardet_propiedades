import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search } from 'lucide-react';
import { useGoogleMaps } from './GoogleMapsProvider';

const mapContainerStyle = {
    width: '100%',
    height: '400px'
};

const defaultCenter = {
    lat: -33.4489, // Santiago, Chile
    lng: -70.6693
};

const LocationPicker = ({ value, onChange, addressValue, onAddressChange }) => {
    const { isLoaded, loadError } = useGoogleMaps();
    const [markerPosition, setMarkerPosition] = useState(
        value ? { lat: value.lat, lng: value.lng } : null
    );
    const [searchAddress, setSearchAddress] = useState('');
    const autocompleteRef = useRef(null);

    // Sync marker with external value
    useEffect(() => {
        if (value && (value.lat !== markerPosition?.lat || value.lng !== markerPosition?.lng)) {
            setMarkerPosition({ lat: value.lat, lng: value.lng });
        }
    }, [value, markerPosition]);

    // Sync search address with external addressValue
    useEffect(() => {
        if (addressValue && addressValue !== searchAddress) {
            setSearchAddress(addressValue);
        }
    }, [addressValue, searchAddress]);

    const onMapClick = useCallback((e) => {
        const newPosition = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        setMarkerPosition(newPosition);
        onChange(newPosition);

        // Reverse geocoding to get address from coordinates
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPosition }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                setSearchAddress(address);
                if (onAddressChange) {
                    onAddressChange(address);
                }
            }
        });
    }, [onChange, onAddressChange]);

    const onLoad = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();

            if (place.geometry && place.geometry.location) {
                const newPosition = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };

                setMarkerPosition(newPosition);
                onChange(newPosition);
                setSearchAddress(place.formatted_address || '');

                if (onAddressChange && place.formatted_address) {
                    onAddressChange(place.formatted_address);
                }
            }
        }
    };

    if (loadError) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error al cargar Google Maps
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Ubicación en el Mapa
                </label>
                <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Cargando mapa...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                <MapPin className="inline h-4 w-4 mr-1" />
                Ubicación en el Mapa
            </label>

            <div className="space-y-2">
                {/* Address Search Box */}
                <Autocomplete
                    onLoad={onLoad}
                    onPlaceChanged={onPlaceChanged}
                    options={{
                        componentRestrictions: { country: 'cl' }, // Restrict to Chile
                        fields: ['formatted_address', 'geometry']
                    }}
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar dirección..."
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                    </div>
                </Autocomplete>

                <p className="text-sm text-gray-500">
                    Busca una dirección o haz clic en el mapa para seleccionar la ubicación
                </p>

                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={markerPosition || defaultCenter}
                    zoom={markerPosition ? 15 : 12}
                    onClick={onMapClick}
                >
                    {markerPosition && (
                        <Marker position={markerPosition} />
                    )}
                </GoogleMap>
            </div>

            {markerPosition && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    Coordenadas: Lat {markerPosition.lat.toFixed(6)}, Lng {markerPosition.lng.toFixed(6)}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
