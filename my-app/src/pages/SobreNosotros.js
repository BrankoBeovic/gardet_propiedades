import React, { useEffect, useRef, useState } from 'react';
import { submitContacto } from '../services/contactService';
import SectionHeader from '../components/SectionHeader';
import sobreNosotrosImg from '../assets/Sobrenosotros.webp';
import sobreNosotrosImg2 from '../assets/sobrenosotros2.webp';

const VALUES = [
    {
        title: 'Orientación al Cliente',
        body: 'Nuestros clientes son el centro de cada decisión. Escuchamos activamente, actuamos con el máximo profesionalismo y trabajamos de manera incansable para superar cualquier expectativa.',
    },
    {
        title: 'Calidad Impecable',
        body: 'La excelencia no es una opción, es nuestro estándar base. Cuidamos cada detalle desde el primer contacto hasta la firma final, elevando constantemente la vara de la industria.',
    },
    {
        title: 'Relaciones Basadas en la Confianza',
        body: 'La honestidad, la transparencia y la empatía guían nuestro actuar. Más allá de concretar transacciones, construimos vínculos sólidos y duraderos con nuestros clientes y la comunidad.',
    },
    {
        title: 'Ideas Frescas y Audaces',
        body: 'Nos mueve la innovación. Combinamos una visión global con un profundo dominio del mercado local para transformar la manera de hacer negocios en el segmento de alto estándar.',
    },
    {
        title: 'Empoderamiento de las Personas',
        body: 'Creemos en el potencial de nuestro equipo. Invertimos en el desarrollo, la creatividad y la colaboración continua para cultivar una cultura tan dinámica como el mercado que lideramos.',
    },
];

const emptyForm = {
    nombre: '',
    apellido: '',
    email: '',
    numero: '',
    mensaje: '',
};

const useInView = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(node);
                }
            },
            { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
};

const SobreNosotros = () => {
    const [introRef, introVisible] = useInView();
    const [essenceRef, essenceVisible] = useInView();
    const [missionRef, missionVisible] = useInView();
    const [valuesRef, valuesVisible] = useInView();
    const [formRef, formVisible] = useInView();

    const [form, setForm] = useState(emptyForm);
    const [acceptLegal, setAcceptLegal] = useState(false);
    const [newsletter, setNewsletter] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (error) setError(null);
        if (success) setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!acceptLegal) {
            setError('Debes aceptar el Aviso Legal y la Política de Privacidad.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await submitContacto(form);
            setSuccess(true);
            setForm({ ...emptyForm });
            setAcceptLegal(false);
            setNewsletter(false);
        } catch (insertError) {
            setError('No pudimos enviar tu mensaje. Inténtalo nuevamente.');
            console.error('Error submitting contacto:', insertError.message || insertError);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-obsidian">
            {/* Page Header */}
            <SectionHeader
                label="Pasión"
                title="Sobre Nosotros"
                as="h1"  
                className="text-center pt-24 lg:pt-32 pb-10 lg:pb-14 px-4 relative z-10"
            />


            {/* Intro — Quiénes Somos */}
            <section ref={introRef} className="relative z-10 w-full bg-[#F5F2EC] overflow-hidden">
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div className={`relative aspect-[4/5] lg:aspect-auto lg:h-[560px] overflow-hidden ${introVisible ? 'sn-image' : 'opacity-0'}`} style={{ '--sn-delay': 80 }}>
                            <img
                                src={sobreNosotrosImg}
                                alt="Gardet Propiedades - Sobre Nosotros"
                                className="w-full h-full object-cover object-center"
                            />
                        </div>

                        <div className="space-y-6">
                            <p className={`text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase ${introVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 60 }}>
                                Quiénes Somos
                            </p>
                            <h2 className={`title-editorial text-2xl sm:text-3xl lg:text-[34px] text-[#2C2C2C] leading-[1.25] tracking-wide ${introVisible ? 'sn-clip-up' : 'opacity-0'}`} style={{ '--sn-delay': 140 }}>
                                Redefinimos la experiencia inmobiliaria de alto estándar
                            </h2>
                            <div className={`h-px w-16 bg-gold/70 ${introVisible ? 'sn-line' : 'opacity-0'}`} style={{ '--sn-delay': 240 }} />
                            <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.85] font-light ${introVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 280 }}>
                                En Gardet Propiedades, redefinimos la experiencia inmobiliaria de alto estándar. Somos una corredora y consultora especializada en la comercialización de viviendas en los sectores más exclusivos de cada región de nuestro país.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Nuestra Esencia */}
            <section ref={essenceRef} className="relative z-10 w-full bg-white overflow-hidden">
                <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
                    <p className={`text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4 ${essenceVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 40 }}>
                        Nuestra Esencia
                    </p>
                    <h2 className={`title-editorial text-2xl sm:text-3xl text-[#2C2C2C] tracking-wide mb-6 ${essenceVisible ? 'sn-clip-up' : 'opacity-0'}`} style={{ '--sn-delay': 120 }}>
                        Un servicio a la altura de cada propiedad
                    </h2>
                    <div className={`mx-auto h-px w-16 bg-gold/70 mb-8 ${essenceVisible ? 'sn-line' : 'opacity-0'}`} style={{ '--sn-delay': 200 }} />
                    <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.85] font-light mb-6 ${essenceVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 260 }}>
                        Disponemos de una cuidada y rigurosa cartera de propiedades, respaldada por un equipo comercial altamente cualificado y con una sólida trayectoria en el sector inmobiliario.
                    </p>
                    <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.85] font-light ${essenceVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 360 }}>
                        Creemos que una propiedad extraordinaria requiere un servicio a su misma altura. Por ello, ofrecemos una atención cercana, personalizada y de máxima calidad: cada cliente cuenta con el acompañamiento constante de un consultor especializado que le asesorará con discreción, rigor y dedicación en cada etapa del proceso.
                    </p>
                </div>
            </section>

            {/* Nuestra Misión */}
            <section ref={missionRef} className="relative z-10 w-full bg-[#EBE7E0] overflow-hidden">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                        <div className="lg:col-span-4">
                            <p className={`text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4 ${missionVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 40 }}>
                                Nuestra Misión
                            </p>
                            <h2 className={`title-editorial text-2xl sm:text-3xl text-[#2C2C2C] tracking-wide leading-[1.25] ${missionVisible ? 'sn-clip-up' : 'opacity-0'}`} style={{ '--sn-delay': 120 }}>
                                Experiencia, confianza y relaciones duraderas
                            </h2>
                            <div className={`mt-6 h-px w-16 bg-gold/70 ${missionVisible ? 'sn-line' : 'opacity-0'}`} style={{ '--sn-delay': 220 }} />
                        </div>
                        <div className="lg:col-span-8">
                            <p className={`font-jakarta text-[15px] sm:text-base lg:text-[17px] text-[#4A4A4A] leading-[1.9] font-light ${missionVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 200 }}>
                                El verdadero éxito en el sector inmobiliario boutique se basa en la experiencia, la confianza y las relaciones duraderas. Nuestra idea es impulsar la innovación constante y entregar un servicio de clase mundial, manteniéndonos siempre fieles a nuestro compromiso con la excelencia, la integridad y el trabajo en equipo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Nuestros Valores */}
            <section ref={valuesRef} className="relative z-10 w-full bg-[#F8F6F0] overflow-hidden">
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="text-center mb-12 lg:mb-16">
                        <p className={`text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4 ${valuesVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 40 }}>
                            Nuestros Valores
                        </p>
                        <h2 className={`title-editorial text-2xl sm:text-3xl text-[#2C2C2C] tracking-wide ${valuesVisible ? 'sn-clip-up' : 'opacity-0'}`} style={{ '--sn-delay': 120 }}>
                            Lo que guía cada decisión
                        </h2>
                        <div className={`mx-auto mt-6 h-px w-16 bg-gold/70 ${valuesVisible ? 'sn-line' : 'opacity-0'}`} style={{ '--sn-delay': 220 }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                        {VALUES.map((value, index) => (
                            <article
                                key={value.title}
                                className={`border border-[#2C2C2C]/10 bg-white/50 backdrop-blur-[2px] p-7 lg:p-8 ${valuesVisible ? 'sn-card' : 'opacity-0'} ${index === 4 ? 'md:col-span-2 xl:col-span-1 xl:col-start-2' : ''}`}
                                style={{ '--sn-delay': 160 + index * 90 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-mono text-[11px] tracking-widest text-gold">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="h-px flex-1 bg-gold/30" />
                                </div>
                                <h3 className="title-editorial text-[#1C1C1C] text-lg mb-3 tracking-wide">
                                    {value.title}
                                </h3>
                                <p className="font-jakarta text-[14px] sm:text-[15px] text-[#4A4A4A] leading-[1.75] font-light">
                                    {value.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact form — camouflaged light layout */}
            <section ref={formRef} className="relative z-10 w-full bg-white overflow-hidden">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                        <div className={`${formVisible ? 'sn-rise' : 'opacity-0'}`} style={{ '--sn-delay': 60 }}>
                            <h2 className="title-editorial text-[#1C1C1C] text-2xl sm:text-[28px] leading-[1.35] tracking-wide mb-5">
                                Contacta con nosotros para saber más sobre nuestros productos y servicios
                            </h2>
                            <p className="font-jakarta text-[15px] text-[#4A4A4A] leading-[1.75] font-light max-w-md mb-8">
                                Completa este formulario y uno de nuestros agentes se pondrá en contacto contigo lo antes posible
                            </p>
                            <div className="w-full aspect-[4/5] max-w-md overflow-hidden">
                                <img
                                    src={sobreNosotrosImg2}
                                    alt="Gardet Propiedades"
                                    className="w-full h-full object-cover object-center"
                                />
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className={`space-y-5 ${formVisible ? 'sn-rise' : 'opacity-0'}`}
                            style={{ '--sn-delay': 180 }}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="sn-nombre" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        id="sn-nombre"
                                        name="nombre"
                                        type="text"
                                        required
                                        autoComplete="given-name"
                                        className="input-light"
                                        value={form.nombre}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="sn-apellido" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                        Apellido
                                    </label>
                                    <input
                                        id="sn-apellido"
                                        name="apellido"
                                        type="text"
                                        required
                                        autoComplete="family-name"
                                        className="input-light"
                                        value={form.apellido}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="sn-email" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                    Email
                                </label>
                                <input
                                    id="sn-email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="input-light"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="sn-numero" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                    Teléfono
                                </label>
                                <input
                                    id="sn-numero"
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
                                <label htmlFor="sn-mensaje" className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-2">
                                    Sus comentarios
                                </label>
                                <textarea
                                    id="sn-mensaje"
                                    name="mensaje"
                                    required
                                    rows={5}
                                    className="input-light resize-y min-h-[120px]"
                                    value={form.mensaje}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-3 pt-1">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newsletter}
                                        onChange={(e) => setNewsletter(e.target.checked)}
                                        className="mt-1 h-4 w-4 accent-[#C5A262] border-[#2C2C2C]/30 rounded-sm"
                                    />
                                    <span className="font-jakarta text-sm text-[#4A4A4A] leading-snug">
                                        Sí, quiero recibir la newsletter de Gardet Propiedades.
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptLegal}
                                        onChange={(e) => setAcceptLegal(e.target.checked)}
                                        required
                                        className="mt-1 h-4 w-4 accent-[#C5A262] border-[#2C2C2C]/30 rounded-sm"
                                    />
                                    <span className="font-jakarta text-sm text-[#4A4A4A] leading-snug">
                                        He leído y acepto el{' '}
                                        <span className="text-gold">Aviso Legal</span>
                                        {' '}y la{' '}
                                        <span className="text-gold">Política de Privacidad</span>
                                        {' '}incluyendo el envío de comunicaciones sobre la búsqueda de propiedades.
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm text-center font-jakarta bg-red-50 border border-red-200 rounded-md py-2 px-3">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-emerald-700 text-sm text-center font-jakarta bg-emerald-50 border border-emerald-200 rounded-md py-2 px-3">
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
                                        <span className="inline-block w-4 h-4 border-2 border-[#2C2C2C]/30 border-t-[#2C2C2C] rounded-full animate-spin" />
                                        Enviando...
                                    </span>
                                ) : (
                                    'Enviar mis detalles'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SobreNosotros;
