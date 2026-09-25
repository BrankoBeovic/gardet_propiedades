import React, { useEffect, useState, useRef, useCallback } from 'react';
import SectionHeader from './SectionHeader';

// Marquee motion constants
const SPEED_NORMAL = 0.35;
const SPEED_FAST = 1.8;
const SPEED_PAUSED = 0;
const LERP_FACTOR = 0.04; // Smooth interpolation factor (lower = smoother transition)
const DRAG_CLICK_THRESHOLD = 8; // px — below this, treat as tap so card buttons still work
const FRAME_MS = 1000 / 60; // Baseline frame time for frame-rate-independent motion
const MAX_FLICK_SPEED = 45; // Cap released momentum (px/frame) so hard flicks stay controlled

/**
 * Featured section with a perpetual, draggable showroom marquee.
 * `renderItem(item, { onButtonHover, onButtonLeave })` renders one card; the hover
 * callbacks pause the track while the pointer is over the card's CTA.
 */
const FeaturedMarquee = ({ label, title, items, loading, error, loadingText, emptyText, renderItem, getKey = (item) => item.id }) => {
    const trackRef = useRef(null);
    const trackContainerRef = useRef(null);
    const offsetRef = useRef(0);
    const targetSpeedRef = useRef(SPEED_NORMAL);
    const currentSpeedRef = useRef(SPEED_NORMAL);
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
        if (!loading && items.length > 0) {
            lastFrameTimeRef.current = 0; // reset so first frame's dt is 0
            rafRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [loading, items.length, animate]);

    /** Pause auto-scroll and start tracking a potential drag. */
    const handlePointerDown = (e) => {
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
        // Delay setPointerCapture until past tap threshold so card buttons still work
    };

    /** Move track by pointer delta while dragging (1:1) and track release velocity. */
    const handlePointerMove = (e) => {
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
            // Capture only once it's a real swipe — keeps taps on card buttons intact
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
    const handlePointerUp = (e) => {
        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;
        setIsDragging(false);

        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        // If the user dragged past the tap threshold, suppress the following synthetic click
        // so the card button does not navigate after a swipe.
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

    const cardHandlers = {
        onButtonHover: () => { targetSpeedRef.current = SPEED_PAUSED; },
        onButtonLeave: () => {
            if (!isDraggingRef.current) {
                targetSpeedRef.current = SPEED_NORMAL;
            }
        },
    };

    // Triplicate items to create a seamless infinite perpetual loop
    const displayItems = items.length > 0 ? [...items, ...items, ...items] : [];

    return (
        <div className="overflow-hidden relative">
            {/* Section Header — vertically & horizontally centered band */}
            <SectionHeader
                label={label}
                title={title}
                as="h2"
                className="w-full min-h-[200px] lg:min-h-[240px] flex flex-col items-center justify-center text-center px-4"
            />

            <div className="pb-16">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                        <p className="mt-4 text-ivory/40 font-jakarta text-sm">{loadingText}</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 font-jakarta text-sm bg-red-400/10 border border-red-400/20 rounded-lg inline-block px-4 py-3">
                            {error}
                        </p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-ivory/40 font-jakarta">{emptyText}</p>
                    </div>
                ) : (
                    /* Perpetual Continuous Showroom Track Container */
                    <div
                        ref={trackContainerRef}
                        className={`w-full overflow-hidden py-4 relative touch-pan-y select-none ${
                            isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                        style={{ touchAction: 'pan-y' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
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
                            {displayItems.map((item, idx) => (
                                <div
                                    key={`${getKey(item)}-${idx}`}
                                    className="w-[340px] sm:w-[380px] flex-shrink-0 px-3.5"
                                >
                                    {renderItem(item, cardHandlers)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeaturedMarquee;
