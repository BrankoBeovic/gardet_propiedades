import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../auth/AuthProvider';
import { fetchComunasByRegion } from '../lib/propertyHelpers';
import { validateImageFile } from '../lib/imageUpload';

const EMPTY_OPTIONAL_NUMBER = '';

/**
 * Parses a required positive number; returns null if invalid/empty.
 */
function parseRequiredNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Parses optional number fields (empty → null, not NaN).
 */
function parseOptionalNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Manual form validation before insert/update.
 */
function validatePropertyForm(formData) {
    const errors = {};

    if (!formData.titulo?.trim()) errors.titulo = 'El título es obligatorio';
    if (!formData.descripcion?.trim()) errors.descripcion = 'La descripción es obligatoria';
    if (!formData.direccion_referencial?.trim()) errors.direccion_referencial = 'La dirección es obligatoria';
    if (!formData.tipo_propiedad_id) errors.tipo_propiedad_id = 'Selecciona un tipo de propiedad';
    if (!formData.operacion_id) errors.operacion_id = 'Selecciona un tipo de operación';
    if (!formData.region_id) errors.region_id = 'Selecciona una región';
    if (!formData.comuna_id) errors.comuna_id = 'Selecciona una comuna';
    if (!formData.estado) errors.estado = 'Selecciona un estado';

    const precio = parseRequiredNumber(formData.precio_uf);
    if (precio === null || precio < 0) errors.precio_uf = 'Ingresa un precio válido en UF';

    const mt2c = parseRequiredNumber(formData.mt2_construidos);
    if (mt2c === null || mt2c <= 0) errors.mt2_construidos = 'Ingresa m² construidos válidos';

    if (formData.mt2_terreno !== EMPTY_OPTIONAL_NUMBER && formData.mt2_terreno !== '') {
        const mt2t = parseOptionalNumber(formData.mt2_terreno);
        if (mt2t === null || mt2t < 0) errors.mt2_terreno = 'Ingresa m² de terreno válidos';
    }

    const hab = parseRequiredNumber(formData.habitaciones);
    if (hab === null || hab < 0 || !Number.isInteger(hab)) errors.habitaciones = 'Ingresa un número válido de habitaciones';

    const banos = parseRequiredNumber(formData.banos);
    if (banos === null || banos < 0 || !Number.isInteger(banos)) errors.banos = 'Ingresa un número válido de baños';

    return errors;
}

const PropertyForm = ({ property, onSave, onCancel }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
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
    const [lightboxUrl, setLightboxUrl] = useState(null);

    useEffect(() => {
        if (!lightboxUrl) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxUrl(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxUrl]);

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
                setFormError('No se pudieron cargar los catálogos del formulario');
            }
        };

        loadDropdowns();
    }, []);

    useEffect(() => {
        const loadComunas = async () => {
            try {
                if (formData.region_id) {
                    const data = await fetchComunasByRegion(supabase, formData.region_id);
                    setDropdownData(prev => ({ ...prev, comunas: data }));
                } else {
                    setDropdownData(prev => ({ ...prev, comunas: [] }));
                }
            } catch (error) {
                console.error('Error loading comunas:', error);
            }
        };

        loadComunas();
    }, [formData.region_id]);

    useEffect(() => {
        const loadPropertyData = async () => {
            if (property) {
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
                    precio_uf: property.precio_uf ?? '',
                    mt2_construidos: property.mt2_construidos ?? '',
                    mt2_terreno: property.mt2_terreno ?? '',
                    habitaciones: property.habitaciones ?? '',
                    banos: property.banos ?? '',
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

                if (property.propiedades_imagenes) {
                    setImages(property.propiedades_imagenes);
                }
            }
        };

        loadPropertyData();
    }, [property]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'region_id') {
            setFormData(prev => ({ ...prev, region_id: value, comuna_id: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setFieldErrors(prev => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';

        const rejected = [];

        files.forEach(file => {
            const result = validateImageFile(file);
            if (!result.ok) {
                rejected.push(`${file.name}: ${result.error}`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, {
                    url: reader.result,
                    file,
                    mimeExt: result.ext,
                    isNew: true,
                    es_portada: prev.length === 0
                }]);
            };
            reader.readAsDataURL(file);
        });

        if (rejected.length > 0) {
            setFormError(rejected.join(' · '));
        }
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

        if (images.length === 0) {
            return uploadedImages;
        }

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            if (image.isNew && image.file) {
                try {
                    const validation = validateImageFile(image.file);
                    if (!validation.ok) {
                        console.warn('Skipping invalid image:', validation.error);
                        continue;
                    }

                    // Extension from MIME, not from untrusted filename
                    const fileName = `${propiedadId}/${uuidv4()}.${validation.ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from('propiedades')
                        .upload(fileName, image.file, {
                            contentType: image.file.type,
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
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
                }
            } else if (!image.isNew) {
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
        setFormError(null);

        if (!user?.id) {
            setFormError('Debes iniciar sesión para guardar una propiedad');
            return;
        }

        const errors = validatePropertyForm(formData);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setFormError('Revisa los campos marcados antes de guardar');
            return;
        }

        setLoading(true);

        try {
            // Never trust client-supplied user_id for takeover; set from auth only
            const propertyData = {
                titulo: formData.titulo.trim(),
                descripcion: formData.descripcion.trim(),
                direccion_referencial: formData.direccion_referencial.trim(),
                estado: formData.estado,
                tipo_propiedad_id: formData.tipo_propiedad_id,
                operacion_id: formData.operacion_id,
                comuna_id: formData.comuna_id,
                precio_uf: parseRequiredNumber(formData.precio_uf),
                mt2_construidos: parseRequiredNumber(formData.mt2_construidos),
                mt2_terreno: parseOptionalNumber(formData.mt2_terreno),
                habitaciones: parseRequiredNumber(formData.habitaciones),
                banos: parseRequiredNumber(formData.banos),
            };

            let propiedadId;

            if (property) {
                const { error } = await supabase
                    .from('propiedades')
                    .update(propertyData)
                    .eq('id', property.id)
                    .eq('user_id', user.id);

                if (error) throw error;
                propiedadId = property.id;
            } else {
                const { data, error } = await supabase
                    .from('propiedades')
                    .insert([{ ...propertyData, user_id: user.id }])
                    .select()
                    .single();

                if (error) throw error;
                propiedadId = data.id;
            }

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

            const uploadedImages = await uploadImages(propiedadId);

            if (property) {
                await supabase
                    .from('propiedades_imagenes')
                    .delete()
                    .eq('propiedad_id', propiedadId);
            }

            if (uploadedImages.length > 0) {
                const { error: imageError } = await supabase
                    .from('propiedades_imagenes')
                    .insert(uploadedImages);

                if (imageError) throw imageError;
            }

            onSave();
        } catch (error) {
            console.error('Error saving property:', error);
            setFormError('Error al guardar la propiedad: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const labelClass = 'block text-sm font-jakarta font-medium text-[#2C2C2C] mb-1.5';
    const fieldErrorClass = 'mt-1 text-xs text-red-600 font-jakarta';

    return (
        <>
        <form
            onSubmit={handleSubmit}
            className="space-y-6 card-light p-6 lg:p-8"
            noValidate
        >
            <div>
                <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[5px] uppercase mb-3">
                    Dashboard
                </p>
                <h2 className="title-editorial text-2xl text-[#2C2C2C] tracking-wide">
                    {property ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h2>
                <div className="mt-4 h-px w-16 bg-gold/70" />
            </div>

            {formError && (
                <div className="rounded-lg px-4 py-3 text-sm font-jakarta bg-red-50 border border-red-200 text-red-700">
                    {formError}
                </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Título *</label>
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        className="input-light"
                    />
                    {fieldErrors.titulo && <p className={fieldErrorClass}>{fieldErrors.titulo}</p>}
                </div>

                <div>
                    <label className={labelClass}>Precio (UF) *</label>
                    <input
                        type="number"
                        name="precio_uf"
                        value={formData.precio_uf}
                        onChange={handleChange}
                        step="0.01"
                        className="input-light"
                    />
                    {fieldErrors.precio_uf && <p className={fieldErrorClass}>{fieldErrors.precio_uf}</p>}
                </div>

                <div>
                    <label className={labelClass}>Tipo de Propiedad *</label>
                    <select
                        name="tipo_propiedad_id"
                        value={formData.tipo_propiedad_id}
                        onChange={handleChange}
                        className="select-light"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.tipos_propiedad.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                        ))}
                    </select>
                    {fieldErrors.tipo_propiedad_id && <p className={fieldErrorClass}>{fieldErrors.tipo_propiedad_id}</p>}
                </div>

                <div>
                    <label className={labelClass}>Tipo de Operación *</label>
                    <select
                        name="operacion_id"
                        value={formData.operacion_id}
                        onChange={handleChange}
                        className="select-light"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.tipos_operacion.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                        ))}
                    </select>
                    {fieldErrors.operacion_id && <p className={fieldErrorClass}>{fieldErrors.operacion_id}</p>}
                </div>

                <div>
                    <label className={labelClass}>M² Construidos *</label>
                    <input
                        type="number"
                        name="mt2_construidos"
                        value={formData.mt2_construidos}
                        onChange={handleChange}
                        step="0.01"
                        className="input-light"
                    />
                    {fieldErrors.mt2_construidos && <p className={fieldErrorClass}>{fieldErrors.mt2_construidos}</p>}
                </div>

                <div>
                    <label className={labelClass}>M² Terreno</label>
                    <input
                        type="number"
                        name="mt2_terreno"
                        value={formData.mt2_terreno}
                        onChange={handleChange}
                        step="0.01"
                        className="input-light"
                    />
                    {fieldErrors.mt2_terreno && <p className={fieldErrorClass}>{fieldErrors.mt2_terreno}</p>}
                </div>

                <div>
                    <label className={labelClass}>Habitaciones *</label>
                    <input
                        type="number"
                        name="habitaciones"
                        value={formData.habitaciones}
                        onChange={handleChange}
                        className="input-light"
                    />
                    {fieldErrors.habitaciones && <p className={fieldErrorClass}>{fieldErrors.habitaciones}</p>}
                </div>

                <div>
                    <label className={labelClass}>Baños *</label>
                    <input
                        type="number"
                        name="banos"
                        value={formData.banos}
                        onChange={handleChange}
                        className="input-light"
                    />
                    {fieldErrors.banos && <p className={fieldErrorClass}>{fieldErrors.banos}</p>}
                </div>

                <div>
                    <label className={labelClass}>Estado *</label>
                    <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="select-light"
                    >
                        <option value="borrador">Borrador</option>
                        <option value="publicada">Publicada</option>
                        <option value="vendida">Vendida</option>
                        <option value="arrendada">Arrendada</option>
                    </select>
                    {fieldErrors.estado && <p className={fieldErrorClass}>{fieldErrors.estado}</p>}
                </div>

                <div>
                    <label className={labelClass}>Región *</label>
                    <select
                        name="region_id"
                        value={formData.region_id}
                        onChange={handleChange}
                        className="select-light"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.regiones.map(region => (
                            <option key={region.id} value={region.id}>{region.nombre}</option>
                        ))}
                    </select>
                    {fieldErrors.region_id && <p className={fieldErrorClass}>{fieldErrors.region_id}</p>}
                </div>

                <div>
                    <label className={labelClass}>Comuna *</label>
                    <select
                        name="comuna_id"
                        value={formData.comuna_id}
                        onChange={handleChange}
                        disabled={!formData.region_id}
                        className="select-light disabled:opacity-40"
                    >
                        <option value="">Seleccionar...</option>
                        {dropdownData.comunas.map(comuna => (
                            <option key={comuna.id} value={comuna.id}>{comuna.nombre}</option>
                        ))}
                    </select>
                    {fieldErrors.comuna_id && <p className={fieldErrorClass}>{fieldErrors.comuna_id}</p>}
                </div>
            </div>

            <div>
                <label className={labelClass}>Dirección Referencial *</label>
                <input
                    type="text"
                    name="direccion_referencial"
                    value={formData.direccion_referencial}
                    onChange={handleChange}
                    className="input-light"
                    placeholder="Ingresa la dirección de la propiedad"
                />
                {fieldErrors.direccion_referencial && <p className={fieldErrorClass}>{fieldErrors.direccion_referencial}</p>}
            </div>

            <div>
                <label className={labelClass}>Descripción *</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={4}
                    className="input-light resize-none"
                />
                {fieldErrors.descripcion && <p className={fieldErrorClass}>{fieldErrors.descripcion}</p>}
            </div>

            {/* Location Picker - Google Maps desactivado temporalmente */}
            <div className="bg-white/70 border border-[#2C2C2C]/12 rounded-lg p-6 text-center">
                <p className="text-[#4A4A4A] text-sm font-jakarta">Mapa de ubicación desactivado temporalmente</p>
                <p className="text-[#4A4A4A]/60 text-xs font-jakarta mt-1">Ingresa la dirección manualmente en el campo de arriba</p>
            </div>

            {/* Image Upload */}
            <div>
                <label className={labelClass}>Imágenes (JPEG, PNG o WebP · máx. 5 MB)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-dashed border-[#2C2C2C]/20 rounded-lg hover:border-gold/50 bg-white/50 transition-colors cursor-pointer">
                    <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-[#A1917B]/50" />
                        <div className="flex text-sm text-[#4A4A4A] font-jakarta">
                            <label className="relative cursor-pointer font-medium text-[#A1917B] hover:text-[#7E6649] transition-colors">
                                <span>Subir imágenes</span>
                                <input
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageSelect}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden border border-[#2C2C2C]/10 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setLightboxUrl(image.url)}
                                    className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                                    aria-label={`Ver imagen ${index + 1} en grande`}
                                >
                                    <img
                                        src={image.url}
                                        alt={`Preview ${index}`}
                                        className="h-28 w-full object-cover"
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage(index);
                                    }}
                                    className="absolute top-1.5 right-1.5 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    aria-label="Eliminar imagen"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetCover(index);
                                    }}
                                    className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 text-xs font-jakarta rounded z-10 ${image.es_portada
                                        ? 'bg-gold text-obsidian font-semibold'
                                        : 'bg-[#2C2C2C]/70 text-white hover:bg-gold/80'
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
            <div className="flex justify-end space-x-3 pt-4 border-t border-[#2C2C2C]/10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 border border-[#2C2C2C]/20 text-[#4A4A4A] hover:text-[#2C2C2C] hover:border-[#2C2C2C]/40 font-jakarta text-sm font-medium transition-colors rounded-xl cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-obsidian px-6 py-2.5 disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin"></span>
                            Guardando...
                        </span>
                    ) : 'Guardar Propiedad'}
                </button>
            </div>
        </form>

        {lightboxUrl && (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8"
                onClick={() => setLightboxUrl(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Vista ampliada de imagen"
            >
                <button
                    type="button"
                    onClick={() => setLightboxUrl(null)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="h-6 w-6" />
                </button>
                <img
                    src={lightboxUrl}
                    alt="Vista ampliada"
                    className="max-h-full max-w-full object-contain rounded-sm shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        )}
        </>
    );
};

export default PropertyForm;
