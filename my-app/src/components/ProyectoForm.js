import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import { useUfValue } from '../hooks/useUfValue';
import { fetchComunasByRegion } from '../lib/propertyHelpers';
import { storagePathFromPublicUrl, validateImageFile } from '../lib/imageUpload';
import { AMENIDADES, formatUf, parseTipologia } from '../lib/proyectoHelpers';
import ImageGalleryEditor from './ImageGalleryEditor';

const STORAGE_BUCKET = 'propiedades';

/** Empty string / invalid → null. */
function toNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** "26" (percent input) → 0.26. */
function pctToFraction(value) {
    const n = toNumber(value);
    return n === null ? null : n / 100;
}

/** 0.26 → "26" for percent inputs (rounded to avoid float noise). */
function fractionToPct(value) {
    if (value === null || value === undefined) return '';
    return String(Math.round(Number(value) * 100 * 100) / 100);
}

const round2 = (n) => Math.round(n * 100) / 100;

const EMPTY_UNIT = {
    numero: '',
    tipologia: '',
    orientacion: '',
    m2_total: '',
    m2_ponderado: '',
    precio_lista_uf: '',
    dscto: '',
    arriendo_clp: '',
    disponible: true,
};

function unitFromRow(row) {
    return {
        id: row.id,
        clientId: String(row.id),
        numero: row.numero ?? '',
        tipologia: row.tipologia ?? '',
        orientacion: row.orientacion ?? '',
        m2_total: row.m2_total ?? '',
        m2_ponderado: row.m2_ponderado ?? '',
        precio_lista_uf: row.precio_lista_uf ?? '',
        dscto: fractionToPct(row.dscto),
        arriendo_clp: row.arriendo_clp ?? '',
        cap_rate: row.cap_rate,
        disponible: row.disponible !== false,
    };
}

/** Final price after discount. */
function precioFinal(unit) {
    const lista = toNumber(unit.precio_lista_uf);
    if (lista === null) return null;
    return round2(lista * (1 - (pctToFraction(unit.dscto) || 0)));
}

/** Annual rent / price. Needs the UF value in CLP; falls back to the stored cap rate. */
function capRate(unit, ufValor) {
    const final = precioFinal(unit);
    const arriendo = toNumber(unit.arriendo_clp);
    if (final && arriendo && ufValor) return Math.round(((arriendo * 12) / (final * ufValor)) * 10000) / 10000;
    return unit.cap_rate ?? null;
}

function validateProyectoForm(formData, unidades) {
    const errors = {};
    if (!formData.nombre?.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!formData.region_id) errors.region_id = 'Selecciona una región';
    if (!formData.comuna_id) errors.comuna_id = 'Selecciona una comuna';

    const pctFields = ['bono_pie_max', 'cap_rate'];
    pctFields.forEach((field) => {
        if (formData[field] === '') return;
        const n = toNumber(formData[field]);
        if (n === null || n < 0 || n > 100) errors[field] = 'Ingresa un porcentaje entre 0 y 100';
    });

    ['pisos', 'ascensores', 'reserva_clp'].forEach((field) => {
        if (formData[field] === '') return;
        const n = toNumber(formData[field]);
        if (n === null || n < 0 || !Number.isInteger(n)) errors[field] = 'Ingresa un número entero válido';
    });

    ['lat', 'lng'].forEach((field) => {
        if (formData[field] === '') return;
        if (toNumber(formData[field]) === null) errors[field] = 'Coordenada inválida';
    });

    const unitErrors = unidades
        .map((u, i) => {
            if (!u.tipologia.trim()) return `Unidad ${i + 1}: falta la tipología`;
            const lista = toNumber(u.precio_lista_uf);
            if (lista === null || lista <= 0) return `Unidad ${i + 1}: precio lista inválido`;
            const dscto = u.dscto === '' ? 0 : toNumber(u.dscto);
            if (dscto === null || dscto < 0 || dscto >= 100) return `Unidad ${i + 1}: descuento inválido`;
            return null;
        })
        .filter(Boolean);
    if (unitErrors.length) errors.unidades = unitErrors.join(' · ');

    return errors;
}

const ProyectoForm = ({ proyecto, onSave, onCancel }) => {
    const { user } = useAuth();
    const { valor: ufValor } = useUfValue();
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [regiones, setRegiones] = useState([]);
    const [comunas, setComunas] = useState([]);
    const [images, setImages] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [formData, setFormData] = useState(() => ({
        nombre: '',
        inmobiliaria: '',
        estado: 'borrador',
        entrega: '',
        region_id: '',
        comuna_id: '',
        direccion: '',
        lat: '',
        lng: '',
        pisos: '',
        ascensores: '',
        descripcion: '',
        bono_pie_max: '',
        pie_en_cuotas: false,
        reserva_clp: '',
        financiamiento_pie: '',
        arriendo_garantizado: '',
        otros_beneficios: '',
        cap_rate: '',
        puntaje: '',
        ...Object.fromEntries(AMENIDADES.map((a) => [a.key, false])),
    }));

    useEffect(() => {
        supabase
            .from('regiones')
            .select('*')
            .order('orden')
            .then(({ data, error }) => {
                if (error) setFormError('No se pudieron cargar las regiones');
                setRegiones(data || []);
            });
    }, []);

    useEffect(() => {
        fetchComunasByRegion(supabase, formData.region_id)
            .then(setComunas)
            .catch((error) => console.error('Error loading comunas:', error));
    }, [formData.region_id]);

    useEffect(() => {
        if (!proyecto) return;
        const load = async () => {
            let regionId = '';
            if (proyecto.comuna_id) {
                const { data } = await supabase.from('comunas').select('region_id').eq('id', proyecto.comuna_id).single();
                regionId = data?.region_id ?? '';
            }
            setFormData({
                nombre: proyecto.nombre || '',
                inmobiliaria: proyecto.inmobiliaria || '',
                estado: proyecto.estado || 'borrador',
                entrega: proyecto.entrega || '',
                region_id: regionId,
                comuna_id: proyecto.comuna_id || '',
                direccion: proyecto.direccion || '',
                lat: proyecto.lat ?? '',
                lng: proyecto.lng ?? '',
                pisos: proyecto.pisos ?? '',
                ascensores: proyecto.ascensores ?? '',
                descripcion: proyecto.descripcion || '',
                bono_pie_max: fractionToPct(proyecto.bono_pie_max),
                pie_en_cuotas: Boolean(proyecto.pie_en_cuotas),
                reserva_clp: proyecto.reserva_clp ?? '',
                financiamiento_pie: proyecto.financiamiento_pie || '',
                arriendo_garantizado: proyecto.arriendo_garantizado || '',
                otros_beneficios: proyecto.otros_beneficios || '',
                cap_rate: fractionToPct(proyecto.cap_rate),
                puntaje: proyecto.puntaje ?? '',
                ...Object.fromEntries(AMENIDADES.map((a) => [a.key, Boolean(proyecto[a.key])])),
            });
            setImages([...(proyecto.proyectos_imagenes || [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)));
            setUnidades(
                [...(proyecto.proyectos_unidades || [])]
                    .sort((a, b) => Number(a.precio_final_uf) - Number(b.precio_final_uf))
                    .map(unitFromRow)
            );
        };
        load();
    }, [proyecto]);

    const resumenUnidades = useMemo(() => {
        const disponibles = unidades.filter((u) => u.disponible);
        const finales = disponibles.map(precioFinal).filter((n) => n !== null);
        const dsctos = disponibles.map((u) => pctToFraction(u.dscto) || 0);
        return {
            disponibles: disponibles.length,
            desde: finales.length ? Math.min(...finales) : null,
            dsctoMax: dsctos.length ? Math.max(...dsctos) : null,
        };
    }, [unidades]);

    const clearFieldError = (name) =>
        setFieldErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const nextValue = type === 'checkbox' ? checked : value;
        setFormData((prev) =>
            name === 'region_id' ? { ...prev, region_id: value, comuna_id: '' } : { ...prev, [name]: nextValue }
        );
        clearFieldError(name);
    };

    const updateUnit = (index, field, value) => {
        setUnidades((prev) => prev.map((u, i) => (i === index ? { ...u, [field]: value } : u)));
        clearFieldError('unidades');
    };

    const addUnit = () => setUnidades((prev) => [...prev, { ...EMPTY_UNIT, clientId: uuidv4() }]);
    const removeUnit = (index) => setUnidades((prev) => prev.filter((_, i) => i !== index));

    const uploadImages = async (proyectoId) => {
        const rows = [];
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (image.isNew && image.file) {
                const validation = validateImageFile(image.file);
                if (!validation.ok) continue;
                const path = `proyectos/${proyectoId}/${uuidv4()}.${validation.ext}`;
                const { error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(path, image.file, { contentType: image.file.type, upsert: false });
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
                rows.push({ proyecto_id: proyectoId, url: publicUrl, orden: i, es_portada: image.es_portada });
            } else if (!image.isNew) {
                rows.push({ proyecto_id: proyectoId, url: image.url, orden: i, es_portada: image.es_portada });
            }
        }
        return rows;
    };

    const saveUnidades = async (proyectoId) => {
        const toRow = (u) => {
            const { dormitorios, banos } = parseTipologia(u.tipologia);
            return {
                proyecto_id: proyectoId,
                numero: u.numero === '' ? null : String(u.numero).trim(),
                tipologia: u.tipologia.trim(),
                dormitorios,
                banos,
                orientacion: u.orientacion.trim() || null,
                m2_total: toNumber(u.m2_total),
                m2_ponderado: toNumber(u.m2_ponderado),
                precio_lista_uf: toNumber(u.precio_lista_uf),
                dscto: pctToFraction(u.dscto) || 0,
                precio_final_uf: precioFinal(u),
                arriendo_clp: toNumber(u.arriendo_clp),
                cap_rate: capRate(u, ufValor),
                disponible: u.disponible,
            };
        };

        const keptIds = unidades.filter((u) => u.id).map((u) => u.id);
        const removedIds = (proyecto?.proyectos_unidades || []).map((u) => u.id).filter((id) => !keptIds.includes(id));

        if (removedIds.length) {
            const { error } = await supabase.from('proyectos_unidades').delete().in('id', removedIds);
            if (error) throw error;
        }

        const existing = unidades.filter((u) => u.id).map((u) => ({ id: u.id, ...toRow(u) }));
        if (existing.length) {
            const { error } = await supabase.from('proyectos_unidades').upsert(existing);
            if (error) throw error;
        }

        const nuevas = unidades.filter((u) => !u.id).map(toRow);
        if (nuevas.length) {
            const { error } = await supabase.from('proyectos_unidades').insert(nuevas);
            if (error) throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!user?.id) {
            setFormError('Debes iniciar sesión para guardar un proyecto');
            return;
        }

        const errors = validateProyectoForm(formData, unidades);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setFormError('Revisa los campos marcados antes de guardar');
            return;
        }

        setLoading(true);
        try {
            const capRates = unidades
                .filter((u) => u.disponible)
                .map((u) => capRate(u, ufValor))
                .filter((n) => n !== null);
            const capRatePromedio = capRates.length
                ? Math.round((capRates.reduce((a, b) => a + b, 0) / capRates.length) * 10000) / 10000
                : null;

            const proyectoData = {
                nombre: formData.nombre.trim(),
                inmobiliaria: formData.inmobiliaria.trim() || null,
                estado: formData.estado,
                entrega: formData.entrega.trim() || null,
                comuna_id: formData.comuna_id,
                direccion: formData.direccion.trim() || null,
                lat: toNumber(formData.lat),
                lng: toNumber(formData.lng),
                pisos: toNumber(formData.pisos),
                ascensores: toNumber(formData.ascensores),
                descripcion: formData.descripcion.trim() || null,
                bono_pie_max: pctToFraction(formData.bono_pie_max),
                pie_en_cuotas: formData.pie_en_cuotas,
                reserva_clp: toNumber(formData.reserva_clp),
                financiamiento_pie: formData.financiamiento_pie.trim() || null,
                arriendo_garantizado: formData.arriendo_garantizado.trim() || null,
                otros_beneficios: formData.otros_beneficios.trim() || null,
                cap_rate: formData.cap_rate === '' ? capRatePromedio : pctToFraction(formData.cap_rate),
                puntaje: toNumber(formData.puntaje),
                precio_desde_uf: resumenUnidades.desde,
                dscto_max: resumenUnidades.dsctoMax,
                updated_at: new Date().toISOString(),
                ...Object.fromEntries(AMENIDADES.map((a) => [a.key, formData[a.key]])),
            };

            let proyectoId;
            if (proyecto) {
                const { error } = await supabase
                    .from('proyectos')
                    .update(proyectoData)
                    .eq('id', proyecto.id)
                    .eq('user_id', user.id);
                if (error) throw error;
                proyectoId = proyecto.id;
            } else {
                const { data, error } = await supabase
                    .from('proyectos')
                    .insert([{ ...proyectoData, user_id: user.id }])
                    .select()
                    .single();
                if (error) throw error;
                proyectoId = data.id;
            }

            await saveUnidades(proyectoId);

            const imageRows = await uploadImages(proyectoId);
            if (proyecto) {
                const { error } = await supabase.from('proyectos_imagenes').delete().eq('proyecto_id', proyectoId);
                if (error) throw error;

                // Remove files that were dropped from the gallery
                const keptUrls = new Set(imageRows.map((r) => r.url));
                const removedPaths = (proyecto.proyectos_imagenes || [])
                    .filter((img) => !keptUrls.has(img.url))
                    .map((img) => storagePathFromPublicUrl(img.url, STORAGE_BUCKET))
                    .filter(Boolean);
                if (removedPaths.length) {
                    await supabase.storage.from(STORAGE_BUCKET).remove(removedPaths);
                }
            }
            if (imageRows.length) {
                const { error } = await supabase.from('proyectos_imagenes').insert(imageRows);
                if (error) throw error;
            }

            onSave();
        } catch (error) {
            console.error('Error saving proyecto:', error);
            setFormError('Error al guardar el proyecto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const labelClass = 'block text-sm font-jakarta font-medium text-[#2C2C2C] mb-1.5';
    const fieldErrorClass = 'mt-1 text-xs text-red-600 font-jakarta';
    const sectionTitleClass = 'text-[#A1917B] text-[11px] font-jakarta font-semibold tracking-[5px] uppercase mb-4';
    const unitInputClass =
        'w-full bg-white border border-[#2C2C2C]/15 rounded-md px-2 py-1.5 text-sm font-jakarta text-[#2C2C2C] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30';

    const textField = (name, label, props = {}) => (
        <div>
            <label className={labelClass} htmlFor={`proyecto-${name}`}>{label}</label>
            <input
                id={`proyecto-${name}`}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="input-light"
                {...props}
            />
            {fieldErrors[name] && <p className={fieldErrorClass}>{fieldErrors[name]}</p>}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 card-light p-6 lg:p-8" noValidate>
            <div>
                <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[5px] uppercase mb-3">
                    Dashboard
                </p>
                <h2 className="title-editorial text-2xl text-[#2C2C2C] tracking-wide">
                    {proyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </h2>
                <div className="mt-4 h-px w-16 bg-gold/70" />
            </div>

            {formError && (
                <div className="rounded-lg px-4 py-3 text-sm font-jakarta bg-red-50 border border-red-200 text-red-700">
                    {formError}
                </div>
            )}

            {/* General */}
            <section>
                <p className={sectionTitleClass}>Datos del proyecto</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {textField('nombre', 'Nombre *', { type: 'text' })}
                    {textField('inmobiliaria', 'Inmobiliaria', { type: 'text' })}
                    <div>
                        <label className={labelClass} htmlFor="proyecto-estado">Estado *</label>
                        <select id="proyecto-estado" name="estado" value={formData.estado} onChange={handleChange} className="select-light">
                            <option value="borrador">Borrador</option>
                            <option value="publicado">Publicado</option>
                            <option value="agotado">Agotado</option>
                        </select>
                    </div>
                    {textField('entrega', 'Entrega', { type: 'text', placeholder: 'Inmediata, 2027 2do sem…' })}
                    <div>
                        <label className={labelClass} htmlFor="proyecto-region">Región *</label>
                        <select id="proyecto-region" name="region_id" value={formData.region_id} onChange={handleChange} className="select-light">
                            <option value="">Seleccionar...</option>
                            {regiones.map((r) => (
                                <option key={r.id} value={r.id}>{r.nombre}</option>
                            ))}
                        </select>
                        {fieldErrors.region_id && <p className={fieldErrorClass}>{fieldErrors.region_id}</p>}
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="proyecto-comuna">Comuna *</label>
                        <select
                            id="proyecto-comuna"
                            name="comuna_id"
                            value={formData.comuna_id}
                            onChange={handleChange}
                            disabled={!formData.region_id}
                            className="select-light disabled:opacity-40"
                        >
                            <option value="">Seleccionar...</option>
                            {comunas.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        {fieldErrors.comuna_id && <p className={fieldErrorClass}>{fieldErrors.comuna_id}</p>}
                    </div>
                    {textField('direccion', 'Dirección', { type: 'text' })}
                    <div className="grid grid-cols-2 gap-3">
                        {textField('lat', 'Latitud', { type: 'number', step: 'any', placeholder: '-33.45' })}
                        {textField('lng', 'Longitud', { type: 'number', step: 'any', placeholder: '-70.66' })}
                    </div>
                    {textField('pisos', 'Pisos', { type: 'number', min: 0 })}
                    {textField('ascensores', 'Ascensores', { type: 'number', min: 0 })}
                </div>
                <div className="mt-5">
                    <label className={labelClass} htmlFor="proyecto-descripcion">Descripción</label>
                    <textarea
                        id="proyecto-descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={4}
                        className="input-light resize-none"
                    />
                </div>
            </section>

            {/* Commercial conditions */}
            <section>
                <p className={sectionTitleClass}>Condiciones comerciales</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {textField('bono_pie_max', 'Bono pie máx. (%)', { type: 'number', step: '0.1', min: 0, max: 100 })}
                    {textField('reserva_clp', 'Reserva (CLP)', { type: 'number', min: 0 })}
                    {textField('puntaje', 'Puntaje', { type: 'number', step: '0.1' })}
                    {textField('financiamiento_pie', 'Financiamiento del pie', { type: 'text' })}
                    {textField('arriendo_garantizado', 'Arriendo garantizado', { type: 'text' })}
                    {textField('otros_beneficios', 'Otros beneficios', { type: 'text' })}
                    <div>
                        {textField('cap_rate', 'Cap rate promedio (%)', { type: 'number', step: '0.01', placeholder: 'Se calcula si lo dejas vacío' })}
                    </div>
                    <label className="flex items-center gap-2.5 md:pt-7 cursor-pointer">
                        <input
                            type="checkbox"
                            name="pie_en_cuotas"
                            checked={formData.pie_en_cuotas}
                            onChange={handleChange}
                            className="h-4 w-4 accent-[#C5A262]"
                        />
                        <span className="text-sm font-jakarta text-[#2C2C2C]">Pie en cuotas</span>
                    </label>
                </div>
            </section>

            {/* Amenities */}
            <section>
                <p className={sectionTitleClass}>Amenidades</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENIDADES.map(({ key, label, icon: Icon }) => (
                        <label
                            key={key}
                            className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors ${formData[key] ? 'border-gold bg-gold/10' : 'border-[#2C2C2C]/10 bg-white/70 hover:border-gold/50'}`}
                        >
                            <input
                                type="checkbox"
                                name={key}
                                checked={formData[key]}
                                onChange={handleChange}
                                className="h-4 w-4 accent-[#C5A262]"
                            />
                            <Icon className="h-4 w-4 text-[#A1917B]" />
                            <span className="text-sm font-jakarta text-[#2C2C2C]">{label}</span>
                        </label>
                    ))}
                </div>
            </section>

            {/* Units */}
            <section>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                        <p className={`${sectionTitleClass} mb-1`}>Unidades</p>
                        <p className="text-xs font-jakarta text-[#4A4A4A]/70">
                            {resumenUnidades.disponibles} disponibles
                            {resumenUnidades.desde !== null && ` · desde ${formatUf(resumenUnidades.desde, { decimals: true })}`}
                            {' · '}El precio final y el cap rate se calculan solos.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addUnit}
                        className="inline-flex items-center gap-1.5 border border-[#2C2C2C] text-[#2C2C2C] hover:bg-gold hover:text-obsidian hover:border-gold px-4 py-2 text-xs font-jakarta font-bold uppercase tracking-wider rounded-xl transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar unidad
                    </button>
                </div>

                {fieldErrors.unidades && <p className={`${fieldErrorClass} mb-3`}>{fieldErrors.unidades}</p>}

                {unidades.length === 0 ? (
                    <p className="text-sm font-jakarta text-[#4A4A4A]/70 bg-white/60 border border-dashed border-[#2C2C2C]/15 rounded-lg p-6 text-center">
                        Aún no hay unidades. Agrega al menos una para mostrar precios y el resumen de inversión.
                    </p>
                ) : (
                    <div className="overflow-x-auto border border-[#2C2C2C]/10 rounded-lg bg-white/60 max-h-[520px] overflow-y-auto">
                        <table className="min-w-[980px] w-full text-sm font-jakarta">
                            <thead className="sticky top-0 bg-[#F5F2EC] z-10">
                                <tr className="text-[10px] text-[#A1917B] uppercase tracking-[2px]">
                                    {['Depto', 'Tipología', 'Orient.', 'm² total', 'm² pond.', 'Lista UF', 'Dcto %', 'Final UF', 'Arriendo CLP', 'Cap rate', 'Disp.', ''].map((h) => (
                                        <th key={h} className="text-left font-semibold px-2 py-2.5 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {unidades.map((u, i) => {
                                    const final = precioFinal(u);
                                    const cap = capRate(u, ufValor);
                                    return (
                                        <tr key={u.clientId} className={`border-t border-[#2C2C2C]/5 ${u.disponible ? '' : 'opacity-50'}`}>
                                            <td className="px-2 py-1.5 w-20"><input className={unitInputClass} value={u.numero} onChange={(e) => updateUnit(i, 'numero', e.target.value)} aria-label="Número de depto" /></td>
                                            <td className="px-2 py-1.5 w-24"><input className={unitInputClass} value={u.tipologia} placeholder="2D-1B" onChange={(e) => updateUnit(i, 'tipologia', e.target.value)} aria-label="Tipología" /></td>
                                            <td className="px-2 py-1.5 w-20"><input className={unitInputClass} value={u.orientacion} onChange={(e) => updateUnit(i, 'orientacion', e.target.value)} aria-label="Orientación" /></td>
                                            <td className="px-2 py-1.5 w-20"><input type="number" step="0.01" className={unitInputClass} value={u.m2_total} onChange={(e) => updateUnit(i, 'm2_total', e.target.value)} aria-label="m² total" /></td>
                                            <td className="px-2 py-1.5 w-20"><input type="number" step="0.01" className={unitInputClass} value={u.m2_ponderado} onChange={(e) => updateUnit(i, 'm2_ponderado', e.target.value)} aria-label="m² ponderado" /></td>
                                            <td className="px-2 py-1.5 w-24"><input type="number" step="0.01" className={unitInputClass} value={u.precio_lista_uf} onChange={(e) => updateUnit(i, 'precio_lista_uf', e.target.value)} aria-label="Precio lista UF" /></td>
                                            <td className="px-2 py-1.5 w-20"><input type="number" step="0.1" className={unitInputClass} value={u.dscto} onChange={(e) => updateUnit(i, 'dscto', e.target.value)} aria-label="Descuento %" /></td>
                                            <td className="px-2 py-1.5 whitespace-nowrap font-semibold text-[#2C2C2C]">{final !== null ? formatUf(final, { decimals: true }) : '—'}</td>
                                            <td className="px-2 py-1.5 w-28"><input type="number" step="1000" className={unitInputClass} value={u.arriendo_clp} onChange={(e) => updateUnit(i, 'arriendo_clp', e.target.value)} aria-label="Arriendo estimado CLP" /></td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-[#4A4A4A]">{cap !== null ? `${(cap * 100).toFixed(1)}%` : '—'}</td>
                                            <td className="px-2 py-1.5 text-center">
                                                <input type="checkbox" checked={u.disponible} onChange={(e) => updateUnit(i, 'disponible', e.target.checked)} className="h-4 w-4 accent-[#C5A262]" aria-label="Disponible" />
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                <button type="button" onClick={() => removeUnit(i)} className="text-[#4A4A4A]/50 hover:text-red-600 transition-colors" title="Eliminar unidad" aria-label="Eliminar unidad">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <ImageGalleryEditor images={images} onChange={setImages} onError={setFormError} />

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-[#2C2C2C]/10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 border border-[#2C2C2C]/20 text-[#4A4A4A] hover:text-[#2C2C2C] hover:border-[#2C2C2C]/40 font-jakarta text-sm font-medium transition-colors rounded-xl cursor-pointer"
                >
                    Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn-obsidian px-6 py-2.5 disabled:opacity-50">
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin"></span>
                            Guardando...
                        </span>
                    ) : 'Guardar Proyecto'}
                </button>
            </div>
        </form>
    );
};

export default ProyectoForm;
