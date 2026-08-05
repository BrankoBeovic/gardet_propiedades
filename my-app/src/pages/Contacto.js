import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitContacto } from '../services/contactService';
import SectionHeader from '../components/SectionHeader';

const emptyForm = {
    nombre: '',
    apellido: '',
    email: '',
    numero: '',
    mensaje: '',
};

const Contacto = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const mensajeFromQuery = searchParams.get('mensaje') || '';

    const [form, setForm] = useState({
        ...emptyForm,
        mensaje: mensajeFromQuery,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Prefill mensaje when arriving with ?mensaje=
    useEffect(() => {
        if (mensajeFromQuery) {
            setForm((prev) => ({ ...prev, mensaje: mensajeFromQuery }));
        }
    }, [mensajeFromQuery]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (error) setError(null);
        if (success) setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await submitContacto(form);
            setSuccess(true);
            // Clear ?mensaje= so prefill is not re-applied after reset
            if (mensajeFromQuery) {
                setSearchParams({}, { replace: true });
            }
            setForm({ ...emptyForm });
        } catch (insertError) {
            setError('No pudimos enviar tu mensaje. Inténtalo nuevamente.');
            console.error('Error submitting contacto:', insertError.message || insertError);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 pb-20">
            <div className="max-w-lg w-full">
                <SectionHeader
                    label="ESCRÍBENOS"
                    title="Contacto"
                    as="h1"
                    className="text-center mb-4"
                />
                <p
                    className="text-center text-ivory/40 font-jakarta text-sm mb-10 sn-rise"
                    style={{ '--sn-delay': 280 }}
                >
                    Completa el formulario y te responderemos a la brevedad
                </p>

                <div
                    className="card-light rounded-xl p-8 sn-rise"
                    style={{ '--sn-delay': 400 }}
                >
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                    Nombre
                                </label>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    required
                                    autoComplete="given-name"
                                    className="input-light"
                                    placeholder="Tu nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="apellido" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                    Apellido
                                </label>
                                <input
                                    id="apellido"
                                    name="apellido"
                                    type="text"
                                    required
                                    autoComplete="family-name"
                                    className="input-light"
                                    placeholder="Tu apellido"
                                    value={form.apellido}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="input-light"
                                placeholder="correo@ejemplo.com"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="numero" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                Teléfono
                            </label>
                            <input
                                id="numero"
                                name="numero"
                                type="tel"
                                required
                                autoComplete="tel"
                                className="input-light"
                                placeholder="+56 9 1234 5678"
                                value={form.numero}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="mensaje" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                Mensaje
                            </label>
                            <textarea
                                id="mensaje"
                                name="mensaje"
                                required
                                rows={5}
                                className="input-light resize-y min-h-[120px]"
                                placeholder="Cuéntanos en qué podemos ayudarte..."
                                value={form.mensaje}
                                onChange={handleChange}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg px-4 py-3 text-sm text-center font-jakarta bg-red-50 border border-red-200 text-red-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-lg px-4 py-3 text-sm text-center font-jakarta bg-green-50 border border-green-200 text-green-700">
                                Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="block w-full text-center px-6 sm:px-8 border border-[#2C2C2C] text-[#2C2C2C] hover:bg-gold hover:text-obsidian hover:border-gold py-2.5 text-xs font-jakarta font-bold uppercase tracking-wider rounded-xl transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-[#2C2C2C]/30 border-t-[#2C2C2C] rounded-full animate-spin"></span>
                                    Enviando...
                                </span>
                            ) : 'Enviar mensaje'}
                        </button>
                    </form>
                </div>

                <div className="flex justify-center mt-8">
                    <div
                        className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent sn-line"
                        style={{ '--sn-delay': 560 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Contacto;
