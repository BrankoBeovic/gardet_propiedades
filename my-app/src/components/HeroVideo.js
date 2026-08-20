import React, { useCallback, useEffect, useRef, useState } from 'react';

const HERO_POSTER = '/media/hero-v1-poster.webp';
const HERO_VIDEO_1080 = '/media/hero-v1-1080.mp4';
const HERO_VIDEO_720 = '/media/hero-v1-720.mp4';
const HERO_VIDEO_WEBM = '/media/hero-v1-1080.webm';

const MAX_AUTO_RETRIES = 10;
const IN_VIEW_RATIO = 0.2;

/**
 * Prefer poster-only when the user wants less motion or Save-Data is on.
 */
function shouldPreferHeroPosterOnly() {
    if (typeof window === 'undefined') return false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    return prefersReducedMotion || saveData;
}

/**
 * Pick a lighter MP4 on phones / slow links so the hero is less likely to stall.
 * Desktop keeps WebM with 1080p MP4 fallback.
 */
function pickHeroSources() {
    if (typeof window === 'undefined') {
        return [{ src: HERO_VIDEO_1080, type: 'video/mp4' }];
    }

    const narrow = window.matchMedia('(max-width: 767px)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const slow = ['slow-2g', '2g', '3g'].includes(navigator.connection?.effectiveType);

    if (narrow || saveData || slow) {
        return [{ src: HERO_VIDEO_720, type: 'video/mp4' }];
    }

    return [
        { src: HERO_VIDEO_WEBM, type: 'video/webm' },
        { src: HERO_VIDEO_1080, type: 'video/mp4' },
    ];
}

/**
 * Force the autoplay-safe flags. React's `muted` prop does not always stick on iOS,
 * and without a real muted + playsinline element, play() is rejected.
 */
function armVideoForAutoplay(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    video.disablePictureInPicture = true;
    if ('disableRemotePlayback' in video) video.disableRemotePlayback = true;
}

/**
 * Background hero video. Native autoPlay is not enough on phones:
 * 1. First play() is often NotAllowedError (Low Power Mode / autoplay policy).
 * 2. iOS pauses on hide/background and never resumes.
 * 3. `loop` and buffer stalls freeze the last frame.
 * We keep retrying play() instead of giving up after the first rejection.
 */
const HeroVideo = () => {
    const videoRef = useRef(null);
    const playPromiseRef = useRef(null);
    const retryTimerRef = useRef(null);
    const autoRetryCountRef = useRef(0);
    const wantPlayingRef = useRef(true);
    const tryPlayRef = useRef(() => {});
    const [preferPosterOnly] = useState(() => shouldPreferHeroPosterOnly());
    const [sources] = useState(() => pickHeroSources());
    const [ready, setReady] = useState(false);

    const clearRetry = useCallback(() => {
        if (retryTimerRef.current == null) return;
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
    }, []);

    const scheduleRetry = useCallback(() => {
        if (retryTimerRef.current != null) return;
        if (autoRetryCountRef.current >= MAX_AUTO_RETRIES) return;

        const delay = Math.min(2000, 250 * 2 ** autoRetryCountRef.current);
        autoRetryCountRef.current += 1;
        retryTimerRef.current = window.setTimeout(() => {
            retryTimerRef.current = null;
            tryPlayRef.current();
        }, delay);
    }, []);

    const tryPlay = useCallback(() => {
        const video = videoRef.current;
        if (!video || preferPosterOnly) return;
        if (!wantPlayingRef.current) return;
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        if (!video.paused && !video.ended) return;
        if (playPromiseRef.current) return;

        armVideoForAutoplay(video);

        const playAttempt = video.play();
        if (!playAttempt || typeof playAttempt.then !== 'function') return;

        playPromiseRef.current = playAttempt;
        playAttempt
            .then(() => {
                playPromiseRef.current = null;
                autoRetryCountRef.current = 0;
                clearRetry();
            })
            .catch((error) => {
                playPromiseRef.current = null;
                // A newer play/pause raced us; the next event will retry.
                if (error?.name === 'AbortError') return;
                scheduleRetry();
            });
    }, [clearRetry, preferPosterOnly, scheduleRetry]);

    tryPlayRef.current = tryPlay;

    const setVideoNode = useCallback((node) => {
        videoRef.current = node;
        if (node) armVideoForAutoplay(node);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || preferPosterOnly) return undefined;

        wantPlayingRef.current = true;
        armVideoForAutoplay(video);
        if (video.readyState === 0) video.load();

        const handleTryPlay = () => tryPlay();

        const handlePlaying = () => {
            autoRetryCountRef.current = 0;
            clearRetry();
            setReady(true);
        };

        const handlePause = () => {
            if (!wantPlayingRef.current) return;
            if (document.visibilityState !== 'visible') return;
            window.requestAnimationFrame(() => tryPlay());
        };

        const handleEnded = () => {
            // iOS often ignores the loop attribute and freezes on the last frame.
            video.currentTime = 0.05;
            tryPlay();
        };

        const handleTimeUpdate = () => {
            if (!video.duration || video.duration < 1) return;
            if (video.currentTime >= video.duration - 0.12) {
                video.currentTime = 0.05;
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') tryPlay();
        };

        const handleUserGesture = () => {
            autoRetryCountRef.current = 0;
            tryPlay();
        };

        video.addEventListener('canplay', handleTryPlay);
        video.addEventListener('loadeddata', handleTryPlay);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('stalled', handleTryPlay);
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pageshow', handleTryPlay);
        window.addEventListener('focus', handleTryPlay);
        document.addEventListener('touchstart', handleUserGesture, { passive: true });
        document.addEventListener('pointerdown', handleUserGesture);
        document.addEventListener('click', handleUserGesture);

        let observer;
        if (typeof IntersectionObserver !== 'undefined') {
            observer = new IntersectionObserver(
                ([entry]) => {
                    wantPlayingRef.current = Boolean(entry?.isIntersecting && entry.intersectionRatio >= IN_VIEW_RATIO);
                    if (wantPlayingRef.current) {
                        tryPlay();
                        return;
                    }
                    if (!video.paused) video.pause();
                },
                { threshold: [0, IN_VIEW_RATIO, 0.5, 1] }
            );
            observer.observe(video);
        }

        tryPlay();

        return () => {
            wantPlayingRef.current = false;
            clearRetry();
            observer?.disconnect();
            video.removeEventListener('canplay', handleTryPlay);
            video.removeEventListener('loadeddata', handleTryPlay);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('stalled', handleTryPlay);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pageshow', handleTryPlay);
            window.removeEventListener('focus', handleTryPlay);
            document.removeEventListener('touchstart', handleUserGesture);
            document.removeEventListener('pointerdown', handleUserGesture);
            document.removeEventListener('click', handleUserGesture);
            if (!video.paused) video.pause();
        };
    }, [clearRetry, preferPosterOnly, tryPlay]);

    return (
        <>
            {!preferPosterOnly && (
                <video
                    ref={setVideoNode}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster={HERO_POSTER}
                    aria-hidden="true"
                    disablePictureInPicture
                    disableRemotePlayback
                    className="absolute inset-0 w-full h-full object-cover z-0"
                >
                    {sources.map((source) => (
                        <source key={source.src} src={source.src} type={source.type} />
                    ))}
                </video>
            )}
            <img
                src={HERO_POSTER}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-700 ease-out pointer-events-none ${
                    ready ? 'opacity-0' : 'opacity-100'
                }`}
            />
        </>
    );
};

export default HeroVideo;
