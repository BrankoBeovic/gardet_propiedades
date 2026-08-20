import React, { useCallback, useEffect, useRef, useState } from 'react';

const HERO_POSTER = '/media/hero-v1-poster.webp';
const HERO_VIDEO_1080 = '/media/hero-v1-1080.mp4';
const HERO_VIDEO_WEBM = '/media/hero-v1-1080.webm';

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
 * HD background hero. Starts loading/playing on page enter.
 * Retries play() if the first autoplay is blocked, if iOS pauses in the background,
 * or if loop stalls on the last frame — without waiting for a tap.
 */
const HeroVideo = () => {
    const videoRef = useRef(null);
    const playPromiseRef = useRef(null);
    const retryTimerRef = useRef(null);
    const tryPlayRef = useRef(() => {});
    const [preferPosterOnly] = useState(() => shouldPreferHeroPosterOnly());

    const clearRetry = useCallback(() => {
        if (retryTimerRef.current == null) return;
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
    }, []);

    const tryPlay = useCallback(() => {
        const video = videoRef.current;
        if (!video || preferPosterOnly) return;
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
                clearRetry();
            })
            .catch((error) => {
                playPromiseRef.current = null;
                if (error?.name === 'AbortError') return;
                if (retryTimerRef.current != null) return;
                retryTimerRef.current = window.setTimeout(() => {
                    retryTimerRef.current = null;
                    tryPlayRef.current();
                }, 300);
            });
    }, [clearRetry, preferPosterOnly]);

    tryPlayRef.current = tryPlay;

    const setVideoNode = useCallback((node) => {
        videoRef.current = node;
        if (node) armVideoForAutoplay(node);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || preferPosterOnly) return undefined;

        armVideoForAutoplay(video);

        const handleTryPlay = () => tryPlay();

        const handlePlaying = () => {
            clearRetry();
        };

        const handlePause = () => {
            if (document.visibilityState !== 'visible') return;
            window.requestAnimationFrame(() => tryPlay());
        };

        const handleEnded = () => {
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

        video.addEventListener('canplay', handleTryPlay);
        video.addEventListener('loadeddata', handleTryPlay);
        video.addEventListener('canplaythrough', handleTryPlay);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('stalled', handleTryPlay);
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pageshow', handleTryPlay);
        window.addEventListener('focus', handleTryPlay);

        tryPlay();

        return () => {
            clearRetry();
            video.removeEventListener('canplay', handleTryPlay);
            video.removeEventListener('loadeddata', handleTryPlay);
            video.removeEventListener('canplaythrough', handleTryPlay);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('stalled', handleTryPlay);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pageshow', handleTryPlay);
            window.removeEventListener('focus', handleTryPlay);
            if (!video.paused) video.pause();
        };
    }, [clearRetry, preferPosterOnly, tryPlay]);

    return (
        <>
            <img
                src={HERO_POSTER}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover z-0"
            />
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
                    <source src={HERO_VIDEO_WEBM} type="video/webm" />
                    <source src={HERO_VIDEO_1080} type="video/mp4" />
                </video>
            )}
        </>
    );
};

export default HeroVideo;
