import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Page numbers with ellipsis: 1 … 4 5 6 … 10 */
function pageList(current, total) {
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const out = [];
    sorted.forEach((n, i) => {
        if (i > 0 && n - sorted[i - 1] > 1) out.push('…');
        out.push(n);
    });
    return out;
}

const ARROW_CLASS =
    'h-10 w-10 inline-flex items-center justify-center rounded-xl border border-white/15 text-ivory/70 ' +
    'hover:border-gold hover:text-gold disabled:opacity-30 disabled:pointer-events-none transition-colors';

/** Gold-accented pager for dark list pages. Renders nothing with a single page. */
const Pagination = ({ page, totalPages, onChange, label = 'Paginación' }) => {
    if (totalPages <= 1) return null;

    return (
        <nav className="mt-12 flex items-center justify-center gap-2 font-jakarta" aria-label={label}>
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className={ARROW_CLASS}
                aria-label="Página anterior"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            {pageList(page, totalPages).map((n, i) =>
                n === '…' ? (
                    <span key={`gap-${i}`} className="px-1 text-ivory/40">…</span>
                ) : (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        aria-current={n === page ? 'page' : undefined}
                        className={`h-10 min-w-10 px-3 inline-flex items-center justify-center rounded-xl text-sm font-bold border transition-colors ${n === page
                            ? 'bg-gold text-obsidian border-gold'
                            : 'border-white/15 text-ivory/70 hover:border-gold hover:text-gold'
                            }`}
                    >
                        {n}
                    </button>
                )
            )}
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
                className={ARROW_CLASS}
                aria-label="Página siguiente"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </nav>
    );
};

export default Pagination;
