const RETURN_KEY = 'gardet:returnScroll';
const PENDING_KEY = 'gardet:pendingScroll';

export function rememberScrollForReturn() {
  try {
    sessionStorage.setItem(
      RETURN_KEY,
      JSON.stringify({
        path: `${window.location.pathname}${window.location.search}`,
        y: Math.round(window.scrollY),
      })
    );
  } catch {
    // ignore
  }
}

export function queueReturnScroll() {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.y === 'number' && data.path) {
      sessionStorage.setItem(PENDING_KEY, String(data.y));
      return data;
    }
  } catch {
    // ignore
  }
  return null;
}

export function consumePendingScroll() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (raw == null) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const y = Number(raw);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function peekPendingScroll() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (raw == null) return null;
    const y = Number(raw);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function restoreScrollY(y) {
  if (y == null || y < 0) return () => {};
  const apply = () => window.scrollTo(0, y);
  apply();
  const timers = [
    requestAnimationFrame(apply),
    setTimeout(apply, 0),
    setTimeout(apply, 50),
    setTimeout(apply, 150),
    setTimeout(apply, 400),
    setTimeout(apply, 800),
  ];
  return () => {
    cancelAnimationFrame(timers[0]);
    timers.slice(1).forEach(clearTimeout);
  };
}

/** True when Volver from property detail should land mid-Home without entrance animations. */
export function shouldSkipHomeEntranceAnimations() {
  try {
    const pending = peekPendingScroll();
    if (pending != null && pending > 0) return true;

    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data.y !== 'number' || data.y <= 0) return false;
    const savedPath = String(data.path || '').split('?')[0];
    return savedPath === '/';
  } catch {
    return false;
  }
}
