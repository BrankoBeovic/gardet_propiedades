import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import ProyectoCard from '../components/ProyectoCard';
import FeaturedMarquee from '../components/FeaturedMarquee';
import HeroSearch from '../components/HeroSearch';
import HeroVideo from '../components/HeroVideo';
import SectionHeader from '../components/SectionHeader';
import quieresVenderImg from '../assets/imagen_quieres_vender.webp';
import louisImg from '../assets/Louis_home.webp';
import { peekPendingScroll, restoreScrollY, shouldSkipHomeEntranceAnimations } from '../utils/scrollMemory';
import { PROPERTY_CARD_SELECT, PUBLIC_ESTADOS } from '../lib/propertyHelpers';
import { PROYECTO_CARD_SELECT } from '../lib/proyectoHelpers';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const ABOUT_ESSENCE_LABEL = 'NUESTRA ESENCIA';
const ABOUT_HEADLINE = 'SOMOS UNA CORREDORA BOUTIQUE ESPECIALIZADA EN LA COMERCIALIZACIÓN DE VIVIENDAS EXCLUSIVAS.';

const ABOUT_PARAGRAPHS = [
    'Somos una corredora especializada en la comercialización de viviendas exclusivas en las mejores zonas de nuestro país.',
    'Como consultora experta, disponemos de una cuidada cartera de propiedades y cuenta con un equipo comercial altamente cualificado y con una extensa trayectoria en el sector inmobiliario.',
    'Ofrecemos un servicio cercano y de máxima calidad, donde los clientes están siempre acompañados de un consultor especializado que asesorará y atenderá durante todo el proceso.',
];

const SELL_LABEL = 'LOS MEJORES EXPERTOS A TU DISPOSICIÓN';
const SELL_BODY = 'Contarás con un asesor inmobiliario experto en tu zona que te acompañará durante todo el proceso de venta de tu propiedad, desde la valoración hasta acompañarte a la firma en el notario.';
const SELL_CTA = 'SOLICITA UNA VALORACIÓN GRATUITA';

const Home = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [proyectos, setProyectos] = useState([]);
    const [proyectosLoading, setProyectosLoading] = useState(true);
    const [proyectosError, setProyectosError] = useState(null);

    useDocumentMeta(null, 'GARDET Propiedades — Corredora inmobiliaria de ultra lujo en Santiago.');

    // When returning from property detail mid-page, show sections already revealed (no blank/entrance anim)
    const [skipEntrance] = useState(() => shouldSkipHomeEntranceAnimations());

    // Scroll visibility state for Sobre Nosotros section
    const aboutRef = useRef(null);
    const [isAboutVisible, setIsAboutVisible] = useState(() => shouldSkipHomeEntranceAnimations());

    // Scroll visibility state for Quieres Vender section
    const sellRef = useRef(null);
    const [isSellVisible, setIsSellVisible] = useState(() => shouldSkipHomeEntranceAnimations());

    // Visible instantly when returning from detail; otherwise play entrance anim
    const revealClass = (visible, animClass) => {
        if (!visible) return 'opacity-0';
        if (skipEntrance) return '';
        return animClass;
    };

    const renderAboutParagraph = (text, index, className) => (
        <p
            key={index}
            className={`${className} ${revealClass(isAboutVisible, 'animate-paragraph')}`}
            style={{ '--p-index': index + 1 }}
        >
            {text}
        </p>
    );

    const sellHeadline = (
        <>
            ¿DESEAS VENDER O<br />ARRENDAR TU<br />PROPIEDAD?
        </>
    );

    // Fetch properties
    useEffect(() => {
        const fetchProperties = async () => {
            setListError(null);
            try {
                const { data, error } = await supabase
                    .from('propiedades')
                    .select(PROPERTY_CARD_SELECT)
                    .in('estado', PUBLIC_ESTADOS)
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

    // Fetch featured projects: the top-20 ranking, in ranking order
    useEffect(() => {
        const fetchProyectos = async () => {
            setProyectosError(null);
            try {
                const { data, error } = await supabase
                    .from('proyectos')
                    .select(PROYECTO_CARD_SELECT)
                    .eq('estado', 'publicado')
                    .not('ranking', 'is', null)
                    .order('ranking', { ascending: true })
                    .limit(12);

                if (error) throw error;
                setProyectos(data || []);
            } catch (error) {
                console.error('Error fetching proyectos:', error.message);
                setProyectosError(error.message || 'No se pudieron cargar los proyectos destacados');
            } finally {
                setProyectosLoading(false);
            }
        };

        fetchProyectos();
    }, []);

    // After featured content is ready, re-apply return scroll if needed
    const featuredLoading = loading || proyectosLoading;
    useEffect(() => {
        if (featuredLoading) return undefined;
        let target = peekPendingScroll();
        if (target == null || target <= 0) {
            try {
                const raw = sessionStorage.getItem('gardet:returnScroll');
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data?.path === '/' && typeof data.y === 'number') target = data.y;
                }
            } catch {
                // ignore
            }
        }
        if (target == null || target <= 0) return undefined;
        return restoreScrollY(target);
    }, [featuredLoading]);

    // Direction-aware scroll handler for Sobre Nosotros entrance animation:
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
                } else if (!skipEntrance && rect.top > viewportHeight * 0.95) {
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
                } else if (!skipEntrance && rect.top > viewportHeight * 0.95) {
                    setIsSellVisible(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        if (!skipEntrance) {
            handleScroll(); // Initial check only on fresh visits
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [skipEntrance]);


    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-20 overflow-hidden min-h-[88vh] sm:min-h-[820px] flex flex-col items-center justify-start bg-[#141414] z-10">
                {/* Media stretches to the hero's real height, so it stays behind the search bar
                    and the advanced panel whenever that panel is expanded. */}
                <HeroVideo />

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
                        Propiedades exclusivas en las mejores ubicaciones del país.
                    </p>

                    {/* Search Bar */}
                    <HeroSearch />

                    {/* Bottom gold line */}
                    <div className="flex justify-center mt-16">
                        <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Sobre Nosotros Header (Dark Background) */}
            <SectionHeader
                label="Trayectoria"
                title="Sobre Nosotros"
                as="h2"
                className="w-full flex flex-col items-center justify-center text-center py-16 lg:py-24 px-4 relative z-10"
            />


            {/* Sobre Nosotros Content */}
            <section ref={aboutRef} className="w-full relative z-10 overflow-hidden lg:bg-transparent flex flex-col">
                {/* Desktop Background layers */}
                <div className="hidden lg:flex absolute inset-0 z-0 flex-col">
                    <div className="h-1/2 w-full bg-white"></div>
                    <div className="h-1/2 w-full bg-[#EBE7E0]"></div>
                </div>

                {/* Mobile White Section */}
                <div className="lg:hidden w-full bg-white pt-12 pb-8 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-end transition-none ${revealClass(isAboutVisible, 'animate-slide-from-top')}`}>
                        <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                            {ABOUT_ESSENCE_LABEL}
                        </p>
                        <h3 className="title-editorial text-2xl sm:text-3xl text-[#2C2C2C] uppercase leading-[1.25] tracking-wide">
                            {ABOUT_HEADLINE}
                        </h3>
                    </div>
                </div>

                {/* Mobile Beige Section */}
                <div className="lg:hidden w-full bg-[#EBE7E0] pt-8 pb-12 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-start transition-none ${revealClass(isAboutVisible, 'animate-slide-from-bottom')}`} style={{ animationDelay: '0.6s' }}>
                        <div className="flex flex-col space-y-6">
                            {ABOUT_PARAGRAPHS.map((paragraph, index) =>
                                renderAboutParagraph(
                                    paragraph,
                                    index,
                                    'font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.8] font-light'
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Image */}
                <div className="lg:hidden w-full bg-[#EBE7E0] px-4 sm:px-6 pb-16">
                    <div className={`w-full aspect-[4/5] max-w-7xl mx-auto transition-none ${revealClass(isAboutVisible, 'animate-slide-from-left')}`} style={{ animationDelay: '0.3s' }}>
                        <img
                            src={louisImg}
                            alt="Gardet Propiedades - Sobre Nosotros"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                        />
                    </div>
                </div>

                {/* Desktop Content (Hidden on Mobile) */}
                <div className="hidden lg:block max-w-[1300px] mx-auto px-8 w-full relative z-10 py-16">
                    <div className="grid grid-cols-2 gap-16 items-stretch h-full">

                        {/* Image Side (Left) */}
                        <div className={`relative h-[550px] xl:h-[600px] w-full transition-none ${revealClass(isAboutVisible, 'animate-slide-from-left')}`} style={{ animationDelay: '0.3s' }}>
                            <img
                                src={louisImg}
                                alt="Gardet Propiedades - Sobre Nosotros"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                            />
                        </div>

                        {/* Text Side (Right) */}
                        <div className="flex flex-col h-[550px] xl:h-[600px]">
                            {/* White bg area content */}
                            <div className={`flex flex-col justify-end pb-12 pl-8 flex-1 transition-none ${revealClass(isAboutVisible, 'animate-slide-from-top')}`}>
                                <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                                    {ABOUT_ESSENCE_LABEL}
                                </p>
                                <h3 className="title-editorial text-2xl xl:text-3xl text-[#2C2C2C] uppercase leading-[1.35] tracking-wide">
                                    {!isAboutVisible ? (
                                        <span className="opacity-0">{ABOUT_HEADLINE}</span>
                                    ) : skipEntrance ? (
                                        ABOUT_HEADLINE
                                    ) : (
                                        ABOUT_HEADLINE.split(' ').map((word, i, words) => (
                                            <span
                                                key={i}
                                                className="inline-block animate-split-word"
                                                style={{ '--word-index': i }}
                                            >
                                                {word}{i < words.length - 1 ? '\u00A0' : ''}
                                            </span>
                                        ))
                                    )}
                                </h3>
                            </div>

                            {/* Beige bg area content */}
                            <div className={`flex flex-col justify-start pt-12 pl-8 flex-1 transition-none ${revealClass(isAboutVisible, 'animate-slide-from-bottom')}`} style={{ animationDelay: '0.6s' }}>
                                <div className="flex flex-col space-y-6">
                                    {ABOUT_PARAGRAPHS.map((paragraph, index) =>
                                        renderAboutParagraph(
                                            paragraph,
                                            index,
                                            'font-jakarta text-[14px] xl:text-[15px] text-[#4A4A4A] leading-[1.8] font-light max-w-[480px]'
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Featured Projects */}
            <FeaturedMarquee
                label="INVERSIÓN"
                title="Proyectos Destacados"
                items={proyectos}
                loading={proyectosLoading}
                error={proyectosError}
                loadingText="Cargando proyectos..."
                emptyText="No hay proyectos disponibles por el momento."
                renderItem={(proyecto, handlers) => <ProyectoCard proyecto={proyecto} {...handlers} />}
            />

            {/* Quieres Vender / Arrendar Section */}
            <section ref={sellRef} className="w-full relative z-10 overflow-hidden lg:bg-transparent flex flex-col">
                {/* Desktop Background layers */}
                <div className="hidden lg:flex absolute inset-0 z-0 flex-col">
                    <div className="h-1/2 w-full bg-white"></div>
                    <div className="h-1/2 w-full bg-[#EBE7E0]"></div>
                </div>

                {/* Mobile White Section */}
                <div className="lg:hidden w-full bg-white pt-16 pb-8 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-end transition-none ${revealClass(isSellVisible, 'animate-slide-from-top')}`}>
                        <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                            {SELL_LABEL}
                        </p>
                        <h3 className="title-editorial text-3xl sm:text-4xl text-[#2C2C2C] uppercase leading-[1.15] tracking-wide">
                            {sellHeadline}
                        </h3>
                    </div>
                </div>

                {/* Mobile Beige Section */}
                <div className="lg:hidden w-full bg-[#EBE7E0] pt-8 pb-12 px-4 sm:px-6">
                    <div className={`max-w-7xl mx-auto flex flex-col justify-start transition-none ${revealClass(isSellVisible, 'animate-slide-from-bottom')}`} style={{ animationDelay: '0.6s' }}>
                        <p className={`font-jakarta text-[15px] sm:text-base text-[#4A4A4A] leading-[1.8] font-light max-w-md mb-8 ${revealClass(isSellVisible, 'animate-paragraph')
                            }`} style={{ '--p-index': 1 }}>
                            {SELL_BODY}
                        </p>
                        <div>
                            <Link to="/contacto" className={`inline-block text-[#5B6D7A] font-jakarta font-semibold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase pb-1 border-b border-[#5B6D7A]/50 hover:text-[#7E6649] hover:border-[#7E6649] transition-all duration-300 ${revealClass(isSellVisible, 'animate-paragraph')
                                }`} style={{ '--p-index': 2 }}>
                                {SELL_CTA}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Image */}
                <div className="lg:hidden w-full bg-[#EBE7E0] px-4 sm:px-6 pb-16">
                    <div className={`w-full aspect-[4/5] max-w-7xl mx-auto transition-none ${revealClass(isSellVisible, 'animate-image-reveal')}`} style={{ animationDelay: '0.3s' }}>
                        <img
                            src={quieresVenderImg}
                            alt="Asesor inmobiliario"
                            loading="lazy"
                            decoding="async"
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
                            <div className={`flex flex-col justify-end pb-12 pr-8 flex-1 transition-none ${revealClass(isSellVisible, 'animate-slide-from-top')}`}>
                                <p className="text-[#A1917B] text-[11px] sm:text-xs font-jakarta font-semibold tracking-[0.2em] uppercase mb-4">
                                    {SELL_LABEL}
                                </p>
                                <h3 className="title-editorial text-4xl lg:text-[42px] xl:text-[46px] text-[#2C2C2C] uppercase leading-[1.1] tracking-wide">
                                    {sellHeadline}
                                </h3>
                            </div>

                            {/* Beige bg area content */}
                            <div className={`flex flex-col justify-start pt-12 pr-8 flex-1 transition-none ${revealClass(isSellVisible, 'animate-slide-from-bottom')}`} style={{ animationDelay: '0.6s' }}>
                                <p className={`font-jakarta text-base text-[#4A4A4A] leading-[1.8] font-light max-w-[440px] mb-10 ${revealClass(isSellVisible, 'animate-paragraph')
                                    }`} style={{ '--p-index': 1 }}>
                                    {SELL_BODY}
                                </p>
                                <div>
                                    <Link to="/contacto" className={`inline-block text-[#5B6D7A] font-jakarta font-semibold text-[13px] tracking-[0.15em] uppercase pb-1 border-b-2 border-[#5B6D7A]/40 hover:text-[#7E6649] hover:border-[#7E6649] transition-all duration-300 ${revealClass(isSellVisible, 'animate-paragraph')
                                        }`} style={{ '--p-index': 2 }}>
                                        {SELL_CTA}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Image Side (Right) */}
                        <div className={`relative h-[550px] xl:h-[600px] w-full transition-none ${revealClass(isSellVisible, 'animate-image-reveal')}`} style={{ animationDelay: '0.3s' }}>
                            <img
                                src={quieresVenderImg}
                                alt="Asesor inmobiliario"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.1)] object-center rounded-sm"
                            />
                        </div>

                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <FeaturedMarquee
                label="SELECCIÓN"
                title="Propiedades Destacadas"
                items={properties}
                loading={loading}
                error={listError}
                loadingText="Cargando propiedades..."
                emptyText="No hay propiedades disponibles por el momento."
                renderItem={(property, handlers) => <PropertyCard property={property} {...handlers} />}
            />
        </div>
    );
};

export default Home;
