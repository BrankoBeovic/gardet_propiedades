import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// LocationPicker desactivado temporalmente (Google Maps stand-by)
import { Upload, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PropertyForm = ({ property, onSave, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        precio_uf: '',
        mt2_construidos: '',
        mt2_terreno: '',
        habitaciones: '',
        banos: '',
        direccion_referencial: '',
        estado: 'borrador',
        tipo_propiedad_id: '',
        operacion_id: '',
        region_id: '',
        comuna_id: '',
        ubicacion: null
    });

    const [dropdownData, setDropdownData] = useState({
        tipos_propiedad: [],
        tipos_operacion: [],
        regiones: [],
        comunas: []
    });

    const [images, setImages] = useState([]);

    // Load dropdown data
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [propiedadesRes, operacionesRes, regionesRes] = await Promise.all([
                    supabase.from('tipos_propiedad').select('*'),
                    supabase.from('tipos_operacion').select('*'),
                    supabase.from('regiones').select('*')
                ]);

                setDropdownData({
                    tipos_propiedad: propiedadesRes.data || [],
                    tipos_operacion: operacionesRes.data || [],
                    regiones: regionesRes.data || [],
                    comunas: []
                });
            } catch (error) {
                console.error('Error loading dropdowns:', error);
            }
        };

        loadDropdowns();
    }, []);

    // Load comunas when region changes
    useEffect(() => {
        const loadComunas = async () => {
            if (formData.region_id) {
                const { data } = await supabase
                    .from('comunas')
                    .select('*')
                    .eq('region_id', formData.region_id)
                    .order('nombre');

                setDropdownData(prev => ({ ...prev, comunas: data || [] }));
            } else {
                setDropdownData(prev => ({ ...prev, comunas: [] }));
            }
        };

        loadComunas();
    }, [formData.region_id]);

    // Load property data if editing
    useEffect(() => {
        const loadPropertyData = async () => {
            if (property) {
                // Get region_id from comuna if comuna_id exists
                let regionId = '';
                if (property.comuna_id) {
                    const { data: comunaData } = await supabase
                        .from('comunas')
                        .select('region_id')
                        .eq('id', property.comuna_id)
                        .single();

                    if (comunaData) {
                        regionId = comunaData.region_id;
                    }
                }

                setFormData({
                    titulo: property.titulo || '',
                    descripcion: property.descripcion || '',
                    precio_uf: property.precio_uf || '',
                    mt2_construidos: property.mt2_construidos || '',
                    mt2_terreno: property.mt2_terreno || '',
                    habitaciones: property.habitaciones || '',
                    banos: property.banos || '',
                    direccion_referencial: property.direccion_referencial || '',
                    estado: property.estado || 'borrador',
                    tipo_propiedad_id: property.tipo_propiedad_id || '',
                    operacion_id: property.operacion_id || '',
                    region_id: regionId,
                    comuna_id: property.comuna_id || '',
                    ubicacion: property.ubicacion_lat && property.ubicacion_lng
                        ? { lat: property.ubicacion_lat, lng: property.ubicacion_lng }
                        : null
                });

                // Load existing images
                if (property.propiedades_imagenes) {
                    setImages(property.propiedades_imagenes);
                }
            }
        };

        loadPropertyData();
    }, [property]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Reset comuna when region changes
        if (name === 'region_id') {
            setFormData(prev => ({ ...prev, region_id: value, comuna_id: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, {
                    url: reader.result,
                    file: file,
                    isNew: true,
                    es_portada: prev.length === 0 // First image is cover
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSetCover = (index) => {
        setImages(prev => prev.map((img, i) => ({
            ...img,
            es_portada: i === index
        })));
    };

    const uploadImages = async (propiedadId) => {
        const uploadedImages = [];

        // If no images, return empty array
        if (images.length === 0) {
            return uploadedImages;
        }

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            if (image.isNew && image.file) {
                try {
                    const fileExt = image.file.name.split('.').pop();
                    const fileName = `${propiedadId}/${uuidv4()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('propiedades')
                        .upload(fileName, image.file);

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        // Skip this image if bucket doesn't exist
                        if (uploadError.message.includes('Bucket not found')) {
                            console.warn('Storage bucket "propiedades" not found. Skipping image upload.');
                            continue;
                        }
                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('propiedades')
                        .getPublicUrl(fileName);

                    uploadedImages.push({
                        propiedad_id: propiedadId,
                        url: publicUrl,
                        orden: i,
                        es_portada: image.es_portada
                    });
                } catch (error) {
                    console.error('Error uploading image:', error);
                    // Continue with other images
                }
            } else if (!image.isNew) {
                // Keep existing images
                uploadedImages.push({
                    propiedad_id: propiedadId,
                    url: image.url,
                    orden: i,
                    es_portada: image.es_portada
                });
            }
        }

        return uploadedImages;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Prepare property data
            const propertyData = {
                ...formData,
                user_id: user.id,
                precio_uf: parseFloat(formData.precio_uf),
                mt2_construidos: parseFloat(formData.mt2_construidos),
                mt2_terreno: parseFloat(formData.mt2_terreno),
                habitaciones: parseInt(formData.habitaciones),
                banos: parseInt(formData.banos)
            };

            // Remove fields that don't exist in propiedades table
            delete propertyData.ubicacion; // Will use RPC for PostGIS
            delete propertyData.region_id; // Region is indirect through comuna

            let propiedadId;

            if (property) {
                // Update existing property
                const { error } = await supabase
                    .from('propiedades')
                    .update(propertyData)
                    .eq('id', property.id);

                if (error) throw error;
                propiedadId = property.id;
            } else {
                // Create new property
                const { data, error } = await supabase
                    .from('propiedades')
                    .insert([propertyData])
                    .select()
                    .single();

                if (error) throw error;
                propiedadId = data.id;
            }

            // Update location using PostGIS if provided
            if (formData.ubicacion) {
                const { error: locationError } = await supabase.rpc('update_property_location', {
                    property_id: propiedadId,
                    lat: formData.ubicacion.lat,
                    lng: formData.ubicacion.lng
                });

                if (locationError) {
                    console.error('Location update error:', locationError);
                }
            }

            // Upload images
            const uploadedImages = await uploadImages(propiedadId);

            // Delete old images
            if (property) {
                await supabase
                    .from('propiedades_imagenes')
                    .delete()
                    .eq('propiedad_id', propiedadId);
            }

            // Insert new image records
            if (uploadedImages.length > 0) {
                const { error: imageError } = await supabase
                    .from('propiedades_imagenes')
                    .insert(uploadedImages);

                if (imageError) throw imageError;
            }

            onSave();
        } catch (error) {
            console.error('Error saving property:', error);
            alert('Error al guardar la propiedad: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const labelClass = "block text-sm font-jakarta font-medium text-ivory/70 mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 card-dark rounded-xl p-6 lg:p-8">
            <h2 className="title-editorial text-2xl text-ivory">
                {property ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </h2>
            <div className="gold-line"></div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Título *</label>
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        className="input-dark"
                    />
                </div>

                <div>
                    <label className={labelClass}>Precio (UF) *</label>
                    <input
                        type="number"
                        name="precio_uf"
                        value={formData.precio_uf}
                        onChange={handleChange}
                        required
                        step="0.01"
                        className="input-dark"
                    />
                </div>

                <div>
                    <label className={labelClass}>Tipo de Propiedad *</label>
                    <select
                        name="tipo_propiedad_id"
                        value={formData.tipo_propiedad_id}
                        onChange={handleChange}
                        required
                        className="select-dark"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.tipos_propiedad.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Tipo de Operación *</label>
                    <select
                        name="operacion_id"
                        value={formData.operacion_id}
                        onChange={handleChange}
                        required
                        className="select-dark"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.tipos_operacion.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>M² Construidos *</label>
                    <input
                        type="number"
                        name="mt2_construidos"
                        value={formData.mt2_construidos}
                        onChange={handleChange}
                        required
                        step="0.01"
                        className="input-dark"
                    />
                </div>

                <div>
                    <label className={labelClass}>M² Terreno</label>
                    <input
                        type="number"
                        name="mt2_terreno"
                        value={formData.mt2_terreno}
                        onChange={handleChange}
                        step="0.01"
                        className="input-dark"
                    />
                </div>

                <div>
                    <label className={labelClass}>Habitaciones *</label>
                    <input
                        type="number"
                        name="habitaciones"
                        value={formData.habitaciones}
                        onChange={handleChange}
                        required
                        className="input-dark"
                    />
                </div>

                <div>
                    <label className={labelClass}>Baños *</label>
                    <input
                        type="number"
                        name="banos"
                        value={formData.banos}
                        onChange={handleChange}
                        required
                        className="input-dark"
                    />
                </div>

                <div>
                    <label className={labelClass}>Estado *</label>
                    <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        required
                        className="select-dark"
                    >
                        <option value="borrador">Borrador</option>
                        <option value="publicada">Publicada</option>
                        <option value="vendida">Vendida</option>
                        <option value="arrendada">Arrendada</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Región *</label>
                    <select
                        name="region_id"
                        value={formData.region_id}
                        onChange={handleChange}
                        required
                        className="select-dark"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.regiones.map(region => (
                            <option key={region.id} value={region.id}>{region.nombre}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Comuna *</label>
                    <select
                        name="comuna_id"
                        value={formData.comuna_id}
                        onChange={handleChange}
                        required
                        disabled={!formData.region_id}
                        className="select-dark disabled:opacity-40"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.comunas.map(comuna => (
                            <option key={comuna.id} value={comuna.id}>{comuna.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className={labelClass}>Dirección Referencial *</label>
                <input
                    type="text"
                    name="direccion_referencial"
                    value={formData.direccion_referencial}
                    onChange={handleChange}
                    required
                    className="input-dark"
                    placeholder="Ingresa la dirección de la propiedad"
                />
            </div>

            <div>
                <label className={labelClass}>Descripción *</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="input-dark resize-none"
                />
            </div>

            {/* Location Picker - Google Maps desactivado temporalmente */}
            <div className="bg-obsidian border border-obsidian-50/10 rounded-lg p-6 text-center">
                <p className="text-ivory/30 text-sm font-jakarta">📍 Mapa de ubicación desactivado temporalmente</p>
                <p className="text-ivory/20 text-xs font-jakarta mt-1">Ingresa la dirección manualmente en el campo de arriba</p>
            </div>

            {/* Image Upload */}
            <div>
                <label className={labelClass}>Imágenes</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-dashed border-obsidian-50/20 rounded-lg hover:border-gold/30 transition-colors cursor-pointer">
                    <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-ivory/20" />
                        <div className="flex text-sm text-ivory/40 font-jakarta">
                            <label className="relative cursor-pointer font-medium text-gold hover:text-gold-light transition-colors">
                                <span>Subir imágenes</span>
                                <input
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden border border-obsidian-50/10">
                                <img
                                    src={image.url}
                                    alt={`Preview ${index}`}
                                    className="h-28 w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1.5 right-1.5 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetCover(index)}
                                    className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 text-xs font-jakarta rounded ${image.es_portada
                                        ? 'bg-gold text-obsidian font-semibold'
                                        : 'bg-obsidian/70 text-ivory/70 hover:bg-gold/20'
                                        } transition-colors`}
                                >
                                    {image.es_portada ? 'Portada' : 'Marcar portada'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-obsidian-50/10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 border border-obsidian-50/20 text-ivory/50 hover:text-ivory hover:border-ivory/30 font-jakarta text-sm font-medium transition-colors rounded-xl cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold px-6 py-2.5 disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin"></span>
                            Guardando...
                        </span>
                    ) : 'Guardar Propiedad'}
                </button>
            </div>
        </form>
    );
};

export default PropertyForm;
