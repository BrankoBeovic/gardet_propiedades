import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import HeroSearch from '../components/HeroSearch';
import heroVideo from '../assets/video_home_gardet.mp4';
import quienessomosImg from '../assets/Quienessomos_home.webp';
import quieresVenderImg from '../assets/imagen_quieres_vender.webp';
import louisImg from '../assets/Louis_home.webp';
import { PROPERTY_CARD_SELECT } from '../lib/propertyHelpers';
import { VALORACION_MAILTO } from '../constants/contact';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const Home = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);

    useDocumentMeta(null, 'GARDET Propiedades — Corredora inmobiliaria de ultra lujo en Santiago.');

    // Scroll visibility state for Quiénes Somos section
    const aboutRef = useRef(null);
    const [isAboutVisible, setIsAboutVisible] = useState(false);

    // Scroll visibility state for Quieres Vender section
    const sellRef = useRef(null);
    const [isSellVisible, setIsSellVisible] = useState(false);

    // Marquee animation state managed via refs for smooth RAF loop
    const trackRef = useRef(null);
    const offsetRef = useRef(0);
    const targetSpeedRef = useRef(0.35);  // Normal slow speed (px per frame)
    const currentSpeedRef = useRef(0.35);
    const rafRef = useRef(null);

    const SPEED_NORMAL = 0.35;
    const SPEED_FAST = 1.8;
    const SPEED_PAUSED = 0;
    const LERP_FACTOR = 0.04; // Smooth interpolation factor (lower = smoother transition)

    // Always scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Fetch properties
    useEffect(() => {
        const fetchProperties = async () => {
            setListError(null);
            try {
                const { data, error } = await supabase
                    .from('propiedades')
                    .select(PROPERTY_CARD_SELECT)
                    .eq('estado', 'publicada')
                    .limit(12);

                if (error) throw error;
                setProperties(data || []);
            } catch (error) {
                console.error('Error fetching properties:', error.message);
                setListError(error.message || 'No se pudieron cargar las propiedades destacadas');
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    // Direction-aware scroll handler for Quiénes Somos entrance animation:
    // Triggers animation ONLY when scrolling DOWN into the section.
    // When scrolling UP from below, content remains fully loaded/visible.
    // Resets to hidden state only when user scrolls back above the section.
    useEffect(() => {
        let lastY = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;
            const isScrollingDown = currentY > lastY;
            lastY = currentY;

            const viewportHeight = window.innerHeight;

            // About Section logic
            if (aboutRef.current) {
                const rect = aboutRef.current.getBoundingClientRect();

                // Section enters viewport from the top while scrolling down
                const isEnteringFromTop = rect.top < viewportHeight * 0.85 && rect.bottom > 0;

                if (isEnteringFromTop && isScrollingDown) {
                    setIsAboutVisible(true);
                } else if (rect.top > viewportHeight * 0.95) {
                    // Reset to hidden state ONLY when user scrolls back above the section (Hero)
                    setIsAboutVisible(false);
                }
            }

            // Sell Section logic
            if (sellRef.current) {
                const rect = sellRef.current.getBoundingClientRect();
                const isEnteringFromTop = rect.top < viewportHeight * 0.85 && rect.bottom > 0;

                if (isEnteringFromTop && isScrollingDown) {
                    setIsSellVisible(true);
                } else if (rect.top > viewportHeight * 0.95) {
                    setIsSellVisible(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Smooth RAF animation loop
    const animate = useCallback(() => {
        // Smoothly interpolate current speed toward target speed
        currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * LERP_FACTOR;

        // Round to avoid floating point drift when paused
        if (Math.abs(currentSpeedRef.current) < 0.001) {
            currentSpeedRef.current = 0;
        }

        offsetRef.current += currentSpeedRef.current;

        // Reset offset when 1/3 of the track has scrolled (seamless loop)
        if (trackRef.current) {
            const halfWidth = trackRef.current.scrollWidth / 3;
            if (offsetRef.current >= halfWidth) {
                offsetRef.current -= halfWidth;
            }
        }

        if (trackRef.current) {
            trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
        }

        rafRef.current = requestAnimationFrame(animate);
    }, []);

    // Start/stop animation loop
    useEffect(() => {
        if (!loading && properties.length > 0) {
            rafRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [loading, properties.length, animate]);

    // Duplicate properties array to create a seamless infinite perpetual loop
    const displayProperties = properties.length > 0
        ? [...properties, ...properties, ...properties]
        : [];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-20 overflow-hidden min-h-[88vh] sm:min-h-[820px] flex flex-col items-center justify-start bg-[#141414] z-10">
                {/* Background Loop Video - 100% original colors */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none z-0"
                >
                    <source src={heroVideo} type="video/mp4" />
                </video>

                {/* Top fade gradient for smooth navbar transition */}
                <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#141414] via-[#141414]/70 to-transparent pointer-events-none z-10" />

                {/* Bottom fade gradient for smooth transition to next section */}
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-transparent pointer-events-none z-10" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-10 sm:pb-20 text-center z-20 w-full">
                    {/* Gold accent line */}
                    <div className="flex justify-center mb-8">
                        <div className="gold-line"></div>
                    </div>

                    {/* Editorial Title */}
                    <h1 className="title-editorial text-5xl sm:text-6xl lg:text-7xl text-ivory leading-tight animate-fade-in-up drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                        Encuentra tu
                        <br />
                        <span className="text-gold">residencia ideal</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-6 max-w-2xl mx-auto text-ivory/90 font-jakarta text-lg sm:text-xl font-light tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                        Propiedades de Alta Gama en las ubicaciones más exclusivas
                    </p>

                    {/* Search Bar */}
                    <HeroSearch />

                    {/* Bottom gold line */}
                    <div className="flex justify-center mt-16">
                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Quiénes Somos Header (Dark Background) */}
            <div className="text-center pt-16 lg:pt-24 pb-8 lg:pb-12 px-4 relative z-10">
                <p className="text-gold text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                    NOSOTROS
                </p>
                <h2 className="title-editorial text-3xl sm:text-4xl lg:text-[42px] text-ivory tracking-wide">
                    Quiénes Somos
                </h2>
                <div className="flex justify-center mt-6">
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"></div>
                </div>
            </div>

            {/* Quiénes Somos Content */}
            <section ref={aboutRef} className="w-full relative z-10 overflow-hidden lg:bg-transparent flex flex-col mb-16 lg:mb-24">
                {/* Desktop Background layers */}
                <div className="hidden lg:flex absolute inset-0 z-0 flex-col">
                    <div className="h-1/2 w-full bg-white"></div>
                    <div className="h-1/2 w-full bg-[#EBE7E0]"></div>
                </div>

                {/* Mobile White Section */}
                <div className="lg:hidden w-full bg-white pt-12 pb-8 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-end transition-none ${isAboutVisible ? 'animate-slide-from-top' : 'opacity-0'}`}>
                        <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                            NUESTRA ESENCIA
                        </p>
                        <h3 className="title-editorial text-2xl sm:text-3xl text-[#2C2C2C] uppercase leading-[1.25] tracking-wide">
                            GARDET PROPIEDADES ES UNA CORREDORA ESPECIALIZADA EN LA COMERCIALIZACIÓN DE VIVIENDAS EXCLUSIVAS.
                        </h3>
                    </div>
                </div>

                {/* Mobile Beige Section */}
                <div className="lg:hidden w-full bg-[#EBE7E0] pt-8 pb-12 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-start transition-none ${isAboutVisible ? 'animate-slide-from-bottom' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                        <div className="flex flex-col space-y-6">
                            <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.8] font-light ${isAboutVisible ? 'animate-paragraph' : 'opacity-0'}`} style={{ '--p-index': 1 }}>
                                <strong className="font-semibold text-[#1C1C1C]">Gardet Propiedades</strong> es una corredora especializada en la comercialización de <strong className="font-semibold text-[#1C1C1C]">viviendas exclusivas</strong> en las mejores zonas de Lo Barnechea, Las Condes, Vitacura y Providencia.
                            </p>
                            <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.8] font-light ${isAboutVisible ? 'animate-paragraph' : 'opacity-0'}`} style={{ '--p-index': 2 }}>
                                Ofrecemos un servicio cercano y de máxima calidad, donde los clientes están siempre acompañados de un consultor especializado que asesorará durante todo el proceso.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Image */}
                <div className="lg:hidden w-full bg-[#EBE7E0] px-4 sm:px-6 pb-16">
                    <div className={`w-full aspect-[4/5] max-w-7xl mx-auto transition-none ${isAboutVisible ? 'animate-slide-from-left' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                        <img
                            src={louisImg}
                            alt="Gardet Propiedades - Quiénes Somos"
                            className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                        />
                    </div>
                </div>

                {/* Desktop Content (Hidden on Mobile) */}
                <div className="hidden lg:block max-w-[1300px] mx-auto px-8 w-full relative z-10 py-16">
                    <div className="grid grid-cols-2 gap-16 items-stretch h-full">

                        {/* Image Side (Left) */}
                        <div className={`relative h-[550px] xl:h-[600px] w-full transition-none ${isAboutVisible ? 'animate-slide-from-left' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                            <img
                                src={louisImg}
                                alt="Gardet Propiedades - Quiénes Somos"
                                className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                            />
                        </div>

                        {/* Text Side (Right) */}
                        <div className="flex flex-col h-[550px] xl:h-[600px]">
                            {/* White bg area content */}
                            <div className={`flex flex-col justify-end pb-12 pl-8 flex-1 transition-none ${isAboutVisible ? 'animate-slide-from-top' : 'opacity-0'}`}>
                                <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                                    NUESTRA ESENCIA
                                </p>
                                <h3 className="title-editorial text-2xl xl:text-3xl text-[#2C2C2C] uppercase leading-[1.35] tracking-wide">
                                    {isAboutVisible
                                        ? 'GARDET PROPIEDADES ES UNA CORREDORA ESPECIALIZADA EN LA COMERCIALIZACIÓN DE VIVIENDAS EXCLUSIVAS EN LAS MEJORES ZONAS DE SANTIAGO.'.split(' ').map((word, i) => (
                                            <span
                                                key={i}
                                                className="inline-block animate-split-word mr-[0.25em]"
                                                style={{ '--word-index': i }}
                                            >
                                                {word}
                                            </span>
                                        ))
                                        : <span className="opacity-0">GARDET PROPIEDADES ES UNA CORREDORA ESPECIALIZADA EN LA COMERCIALIZACIÓN DE VIVIENDAS EXCLUSIVAS EN LAS MEJORES ZONAS DE SANTIAGO.</span>
                                    }
                                </h3>
                            </div>

                            {/* Beige bg area content */}
                            <div className={`flex flex-col justify-start pt-12 pl-8 flex-1 transition-none ${isAboutVisible ? 'animate-slide-from-bottom' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                                <div className="flex flex-col space-y-6">
                                    <p className={`font-jakarta text-[14px] xl:text-[15px] text-[#4A4A4A] leading-[1.8] font-light max-w-[480px] ${isAboutVisible ? 'animate-paragraph' : 'opacity-0'
                                        }`} style={{ '--p-index': 1 }}>
                                        <strong className="font-semibold text-[#1C1C1C]">Gardet Propiedades</strong> es una corredora especializada en la comercialización de <strong className="font-semibold text-[#1C1C1C]">viviendas exclusivas</strong> en las mejores zonas de <strong className="font-semibold text-[#1C1C1C]">Lo Barnechea, Las Condes, Vitacura y Providencia</strong>.
                                    </p>
                                    <p className={`font-jakarta text-[14px] xl:text-[15px] text-[#4A4A4A] leading-[1.8] font-light max-w-[480px] ${isAboutVisible ? 'animate-paragraph' : 'opacity-0'
                                        }`} style={{ '--p-index': 2 }}>
                                        Como consultora experta, la firma dispone de una cuidada cartera de propiedades y cuenta con un equipo comercial altamente cualificado y con una extensa trayectoria en el sector inmobiliario de lujo.
                                    </p>
                                    <p className={`font-jakarta text-[14px] xl:text-[15px] text-[#4A4A4A] leading-[1.8] font-light max-w-[480px] ${isAboutVisible ? 'animate-paragraph' : 'opacity-0'
                                        }`} style={{ '--p-index': 3 }}>
                                        Ofrecemos un servicio cercano y de máxima calidad, donde los clientes están siempre acompañados de un consultor especializado que asesorará y atenderá durante todo el proceso.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Featured Properties (Clean Perpetual Showroom Marquee) */}
            <div className="py-16 overflow-hidden relative">
                {/* Section Header */}
                <div className="max-w-7xl mx-auto text-center mb-12 px-4">
                    <p className="text-gold text-xs font-jakarta font-semibold tracking-descriptor uppercase mb-3">
                        SELECCIÓN
                    </p>
                    <h2 className="title-editorial text-3xl sm:text-4xl text-ivory">
                        Propiedades Destacadas
                    </h2>
                    <div className="flex justify-center mt-4">
                        <div className="gold-line"></div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                        <p className="mt-4 text-ivory/40 font-jakarta text-sm">Cargando propiedades...</p>
                    </div>
                ) : listError ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 font-jakarta text-sm bg-red-400/10 border border-red-400/20 rounded-lg inline-block px-4 py-3">
                            {listError}
                        </p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-ivory/40 font-jakarta">No hay propiedades disponibles por el momento.</p>
                    </div>
                ) : (
                    /* Perpetual Continuous Showroom Track Container */
                    <div className="w-full overflow-hidden py-4 relative">
                        {/* Side Edge Acceleration Trigger Zones — narrow strips at page edges */}
                        <div
                            onMouseEnter={() => { targetSpeedRef.current = SPEED_FAST; }}
                            onMouseLeave={() => { targetSpeedRef.current = SPEED_NORMAL; }}
                            className="absolute left-0 top-0 bottom-0 w-16 sm:w-20 z-10"
                        />
                        <div
                            onMouseEnter={() => { targetSpeedRef.current = SPEED_FAST; }}
                            onMouseLeave={() => { targetSpeedRef.current = SPEED_NORMAL; }}
                            className="absolute right-0 top-0 bottom-0 w-16 sm:w-20 z-10"
                        />

                        {/* Marquee Track */}
                        <div
                            ref={trackRef}
                            className="flex will-change-transform"
                            style={{ width: 'max-content' }}
                        >
                            {displayProperties.map((property, idx) => (
                                <div
                                    key={`${property.id}-${idx}`}
                                    className="w-[340px] sm:w-[380px] flex-shrink-0 px-3.5"
                                >
                                    <PropertyCard
                                        property={property}
                                        onButtonHover={() => { targetSpeedRef.current = SPEED_PAUSED; }}
                                        onButtonLeave={() => { targetSpeedRef.current = SPEED_NORMAL; }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Quieres Vender / Alquilar Section */}
            <section ref={sellRef} className="w-full relative z-10 overflow-hidden lg:bg-transparent flex flex-col mb-16 lg:mb-24">
                {/* Desktop Background layers */}
                <div className="hidden lg:flex absolute inset-0 z-0 flex-col">
                    <div className="h-1/2 w-full bg-white"></div>
                    <div className="h-1/2 w-full bg-[#EBE7E0]"></div>
                </div>

                {/* Mobile White Section */}
                <div className="lg:hidden w-full bg-white pt-16 pb-8 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-end transition-none ${isSellVisible ? 'animate-slide-from-top' : 'opacity-0'}`}>
                        <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                            LOS MEJORES EXPERTOS A TU DISPOSICIÓN
                        </p>
                        <h3 className="title-editorial text-3xl sm:text-4xl text-[#2C2C2C] uppercase leading-[1.15] tracking-wide">
                            ¿DESEAS VENDER O<br />ALQUILAR TU<br />PROPIEDAD?
                        </h3>
                    </div>
                </div>

                {/* Mobile Beige Section */}
                <div className="lg:hidden w-full bg-[#EBE7E0] pt-8 pb-12 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-start transition-none ${isSellVisible ? 'animate-slide-from-bottom' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                        <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.8] font-light max-w-md mb-8 ${isSellVisible ? 'animate-paragraph' : 'opacity-0'
                            }`} style={{ '--p-index': 1 }}>
                            Contarás con un asesor inmobiliario experto en tu zona que te acompañará durante todo el proceso de venta de tu propiedad, desde la valoración hasta acompañarte a la firma en el notario.
                        </p>
                        <div>
                            <a href={VALORACION_MAILTO} className={`inline-block text-[#5B6D7A] font-jakarta font-semibold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase pb-1 border-b border-[#5B6D7A]/50 hover:text-[#7E6649] hover:border-[#7E6649] transition-all duration-300 ${isSellVisible ? 'animate-paragraph' : 'opacity-0'
                                }`} style={{ '--p-index': 2 }}>
                                SOLICITA UNA VALORACIÓN GRATUITA
                            </a>
                        </div>
                    </div>
                </div>

                {/* Mobile Image */}
                <div className="lg:hidden w-full bg-[#EBE7E0] px-4 sm:px-6 pb-16">
                    <div className={`w-full aspect-[4/5] max-w-7xl mx-auto transition-none ${isSellVisible ? 'animate-image-reveal' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                        <img
                            src={quieresVenderImg}
                            alt="Asesor inmobiliario"
                            className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                        />
                    </div>
                </div>

                {/* Desktop Content (Hidden on Mobile) */}
                <div className="hidden lg:block max-w-[1300px] mx-auto px-8 w-full relative z-10 py-24">
                    <div className="grid grid-cols-2 gap-16 items-stretch h-full">

                        {/* Text Side (Left) */}
                        <div className="flex flex-col h-[550px] xl:h-[600px]">
                            {/* White bg area content */}
                            <div className={`flex flex-col justify-end pb-12 pr-8 flex-1 transition-none ${isSellVisible ? 'animate-slide-from-top' : 'opacity-0'}`}>
                                <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                                    LOS MEJORES EXPERTOS A TU DISPOSICIÓN
                                </p>
                                <h3 className="title-editorial text-4xl lg:text-[42px] xl:text-[46px] text-[#2C2C2C] uppercase leading-[1.1] tracking-wide">
                                    ¿DESEAS VENDER O<br />ALQUILAR TU<br />PROPIEDAD?
                                </h3>
                            </div>

                            {/* Beige bg area content */}
                            <div className={`flex flex-col justify-start pt-12 pr-8 flex-1 transition-none ${isSellVisible ? 'animate-slide-from-bottom' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                                <p className={`font-jakarta text-base text-[#4A4A4A] leading-[1.8] font-light max-w-[440px] mb-10 ${isSellVisible ? 'animate-paragraph' : 'opacity-0'
                                    }`} style={{ '--p-index': 1 }}>
                                    Contarás con un asesor inmobiliario experto en tu zona que te acompañará durante todo el proceso de venta de tu propiedad, desde la valoración hasta acompañarte a la firma en el notario.
                                </p>
                                <div>
                                    <a href={VALORACION_MAILTO} className={`inline-block text-[#5B6D7A] font-jakarta font-semibold text-[13px] tracking-[0.15em] uppercase pb-1 border-b-2 border-[#5B6D7A]/40 hover:text-[#7E6649] hover:border-[#7E6649] transition-all duration-300 ${isSellVisible ? 'animate-paragraph' : 'opacity-0'
                                        }`} style={{ '--p-index': 2 }}>
                                        SOLICITA UNA VALORACIÓN GRATUITA
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Image Side (Right) */}
                        <div className={`relative h-[550px] xl:h-[600px] w-full transition-none ${isSellVisible ? 'animate-image-reveal' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                            <img
                                src={quieresVenderImg}
                                alt="Asesor inmobiliario"
                                className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                            />
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
