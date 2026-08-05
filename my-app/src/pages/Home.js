import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import HeroSearch from '../components/HeroSearch';
import SectionHeader from '../components/SectionHeader';
import quieresVenderImg from '../assets/imagen_quieres_vender.webp';
import louisImg from '../assets/Louis_home.webp';
import { peekPendingScroll, restoreScrollY, shouldSkipHomeEntranceAnimations } from '../utils/scrollMemory';
import { PROPERTY_CARD_SELECT } from '../lib/propertyHelpers';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const HERO_POSTER = '/media/hero-v1-poster.webp';
const HERO_VIDEO_1080 = '/media/hero-v1-1080.mp4';
const HERO_VIDEO_WEBM = '/media/hero-v1-1080.webm';

/** Prefer poster-only when the user wants less motion or Save-Data is on. */
function shouldPreferHeroPosterOnly() {
    if (typeof window === 'undefined') return false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    return prefersReducedMotion || saveData;
}

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

// Marquee motion constants (module-level so hooks exhaustive-deps stays clean in CI)
const SPEED_NORMAL = 0.35;
const SPEED_FAST = 1.8;
const SPEED_PAUSED = 0;
const LERP_FACTOR = 0.04; // Smooth interpolation factor (lower = smoother transition)
const DRAG_CLICK_THRESHOLD = 8; // px — below this, treat as tap so Ver Detalles still works
const FRAME_MS = 1000 / 60; // Baseline frame time for frame-rate-independent motion
const MAX_FLICK_SPEED = 45; // Cap released momentum (px/frame) so hard flicks stay controlled

const Home = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [preferPosterOnly] = useState(() => shouldPreferHeroPosterOnly());
    const [heroVideoReady, setHeroVideoReady] = useState(false);

    useDocumentMeta(null, 'GARDET Propiedades — Corredora inmobiliaria de ultra lujo en Santiago.');

    // When returning from property detail mid-page, show sections already revealed (no blank/entrance anim)
    const [skipEntrance] = useState(() => shouldSkipHomeEntranceAnimations());

    // Scroll visibility state for Sobre Nosotros section
    const aboutRef = useRef(null);
    const [isAboutVisible, setIsAboutVisible] = useState(() => shouldSkipHomeEntranceAnimations());

    // Scroll visibility state for Quieres Vender section
    const sellRef = useRef(null);
    const [isSellVisible, setIsSellVisible] = useState(() => shouldSkipHomeEntranceAnimations());

    // Marquee animation state managed via refs for smooth RAF loop
    const trackRef = useRef(null);
    const trackContainerRef = useRef(null);
    const offsetRef = useRef(0);
    const targetSpeedRef = useRef(0.35);  // Normal slow speed (px per frame)
    const currentSpeedRef = useRef(0.35);
    const rafRef = useRef(null);
    const isDraggingRef = useRef(false);
    const lastXRef = useRef(0);
    const dragMovedRef = useRef(false);
    const dragDistanceRef = useRef(0);
    const velocityRef = useRef(0);       // Smoothed pointer velocity (offset px per ms)
    const lastMoveTimeRef = useRef(0);   // Timestamp of last pointer move (for velocity)
    const lastFrameTimeRef = useRef(0);  // Timestamp of last RAF frame (for dt normalization)
    const [isDragging, setIsDragging] = useState(false);

    /** Wrap offset every 1/3 of track width for seamless loop. */
    const wrapOffset = useCallback(() => {
        if (!trackRef.current) return;
        const segmentWidth = trackRef.current.scrollWidth / 3;
        if (segmentWidth <= 0) return;
        while (offsetRef.current >= segmentWidth) {
            offsetRef.current -= segmentWidth;
        }
        while (offsetRef.current < 0) {
            offsetRef.current += segmentWidth;
        }
    }, []);

    /** Apply current offset to the track transform. */
    const applyTrackTransform = useCallback(() => {
        if (!trackRef.current) return;
        trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
    }, []);

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

    // After featured content is ready, re-apply return scroll if needed
    useEffect(() => {
        if (loading) return undefined;
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
    }, [loading]);

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

    // Smooth RAF animation loop (time-based so speed is consistent across refresh rates)
    const animate = useCallback((now) => {
        const last = lastFrameTimeRef.current || now;
        // Clamp dt so returning from a background tab doesn't cause a big jump
        const dt = Math.min(now - last, 50);
        lastFrameTimeRef.current = now;
        const frameFactor = dt / FRAME_MS;

        // Ease current speed toward target. After a flick, currentSpeed is seeded
        // with the release velocity and this lerp glides it back to SPEED_NORMAL,
        // giving momentum + a smooth resume without any abrupt snap-back.
        currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * LERP_FACTOR * frameFactor;

        // Settle onto the target once close enough (avoids floating point drift)
        if (Math.abs(currentSpeedRef.current - targetSpeedRef.current) < 0.001) {
            currentSpeedRef.current = targetSpeedRef.current;
        }

        // During pointer drag, offset is written 1:1 by the pointer handler
        if (!isDraggingRef.current) {
            offsetRef.current += currentSpeedRef.current * frameFactor;
            wrapOffset();
            applyTrackTransform();
        }

        rafRef.current = requestAnimationFrame(animate);
    }, [wrapOffset, applyTrackTransform]);

    // Start/stop animation loop
    useEffect(() => {
        if (!loading && properties.length > 0) {
            lastFrameTimeRef.current = 0; // reset so first frame's dt is 0
            rafRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [loading, properties.length, animate]);

    /** Pause auto-scroll and start tracking a potential drag. */
    const handleMarqueePointerDown = (e) => {
        // Only primary button / touch / pen
        if (e.button != null && e.button !== 0) return;

        isDraggingRef.current = true;
        dragMovedRef.current = false;
        dragDistanceRef.current = 0;
        lastXRef.current = e.clientX;
        lastMoveTimeRef.current = performance.now();
        velocityRef.current = 0;
        // Freeze motion instantly under the finger (no residual glide while held)
        targetSpeedRef.current = SPEED_PAUSED;
        currentSpeedRef.current = SPEED_PAUSED;
        setIsDragging(true);
        // Delay setPointerCapture until past tap threshold so Ver Detalles clicks still work
    };

    /** Move track by pointer delta while dragging (1:1) and track release velocity. */
    const handleMarqueePointerMove = (e) => {
        if (!isDraggingRef.current) return;

        const now = performance.now();
        const deltaX = e.clientX - lastXRef.current;
        const dt = now - lastMoveTimeRef.current;
        lastXRef.current = e.clientX;
        lastMoveTimeRef.current = now;

        if (deltaX === 0) return;

        dragDistanceRef.current += Math.abs(deltaX);

        if (dragDistanceRef.current >= DRAG_CLICK_THRESHOLD && !dragMovedRef.current) {
            dragMovedRef.current = true;
            // Capture only once it's a real swipe — keeps taps on Ver Detalles intact
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                // ignore if capture fails (e.g. pointer already released)
            }
        }

        // Finger moves right → content moves right (offset decreases)
        const offsetDelta = -deltaX;
        offsetRef.current += offsetDelta;

        // Smooth the instantaneous velocity (offset px per ms) to feed momentum on release
        if (dt > 0) {
            const instant = offsetDelta / dt;
            velocityRef.current = velocityRef.current * 0.8 + instant * 0.2;
        }

        // Write the transform immediately so the drag stays perfectly 1:1 (no RAF lag)
        wrapOffset();
        applyTrackTransform();
    };

    /** End drag; suppress click if swiped; carry momentum then ease back to SPEED_NORMAL. */
    const handleMarqueePointerUp = (e) => {
        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;
        setIsDragging(false);

        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        // If the user dragged past the tap threshold, suppress the following synthetic click
        // so Ver Detalles does not navigate after a swipe.
        if (dragMovedRef.current) {
            const suppressClick = (clickEvent) => {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
            };
            const container = trackContainerRef.current;
            if (container) {
                container.addEventListener('click', suppressClick, { capture: true, once: true });
                // Safety: drop listener if no click follows (e.g. released off interactive target)
                window.setTimeout(() => {
                    container.removeEventListener('click', suppressClick, { capture: true });
                }, 400);
            }
        }

        // Seed the loop with the release velocity (px/ms → px/frame) so the flick
        // keeps gliding, then let the RAF lerp ease it smoothly back to SPEED_NORMAL.
        const releaseSpeed = velocityRef.current * FRAME_MS;
        currentSpeedRef.current = Math.max(-MAX_FLICK_SPEED, Math.min(MAX_FLICK_SPEED, releaseSpeed));
        velocityRef.current = 0;
        targetSpeedRef.current = SPEED_NORMAL;
    };

    // Duplicate properties array to create a seamless infinite perpetual loop
    const displayProperties = properties.length > 0
        ? [...properties, ...properties, ...properties]
        : [];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-20 overflow-hidden min-h-[88vh] sm:min-h-[820px] flex flex-col items-center justify-start bg-[#141414] z-10">
                {/* Poster always paints first; video fades in when ready (or poster-only for reduced-motion / Save-Data) */}
                <img
                    src={HERO_POSTER}
                    alt=""
                    aria-hidden="true"
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                />
                {!preferPosterOnly && (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        poster={HERO_POSTER}
                        aria-hidden="true"
                        onCanPlay={() => setHeroVideoReady(true)}
                        onPlaying={() => setHeroVideoReady(true)}
                        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-[1] transition-opacity duration-700 ease-out ${
                            heroVideoReady ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <source src={HERO_VIDEO_WEBM} type="video/webm" />
                        <source src={HERO_VIDEO_1080} type="video/mp4" />
                    </video>
                )}

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

            {/* Featured Properties (Clean Perpetual Showroom Marquee) */}
            <div className="overflow-hidden relative">
                {/* Section Header — vertically & horizontally centered band */}
                <SectionHeader
                    label="SELECCIÓN"
                    title="Propiedades Destacadas"
                    as="h2"
                    className="w-full min-h-[200px] lg:min-h-[240px] flex flex-col items-center justify-center text-center px-4"
                />


                <div className="pb-16">
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
                    <div
                        ref={trackContainerRef}
                        className={`w-full overflow-hidden py-4 relative touch-pan-y select-none ${
                            isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                        style={{ touchAction: 'pan-y' }}
                        onPointerDown={handleMarqueePointerDown}
                        onPointerMove={handleMarqueePointerMove}
                        onPointerUp={handleMarqueePointerUp}
                        onPointerCancel={handleMarqueePointerUp}
                    >
                        {/* Side Edge Acceleration — desktop only so they don't block touch on mobile */}
                        <div
                            onMouseEnter={() => { if (!isDraggingRef.current) targetSpeedRef.current = SPEED_FAST; }}
                            onMouseLeave={() => { if (!isDraggingRef.current) targetSpeedRef.current = SPEED_NORMAL; }}
                            className="absolute left-0 top-0 bottom-0 w-16 sm:w-20 z-10 hidden lg:block"
                            aria-hidden="true"
                        />
                        <div
                            onMouseEnter={() => { if (!isDraggingRef.current) targetSpeedRef.current = SPEED_FAST; }}
                            onMouseLeave={() => { if (!isDraggingRef.current) targetSpeedRef.current = SPEED_NORMAL; }}
                            className="absolute right-0 top-0 bottom-0 w-16 sm:w-20 z-10 hidden lg:block"
                            aria-hidden="true"
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
                                        onButtonLeave={() => {
                                            if (!isDraggingRef.current) {
                                                targetSpeedRef.current = SPEED_NORMAL;
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* Quieres Vender / Arrendar Section */}
            <section ref={sellRef} className="w-full relative z-10 overflow-hidden lg:bg-transparent flex flex-col mb-16 lg:mb-24">
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
        </div>
    );
};

export default Home;
