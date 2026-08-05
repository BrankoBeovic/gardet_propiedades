import React from 'react';

/**
 * Dark-section header: gold label, editorial title, and animated gold line.
 * Reuses sn-fade / sn-clip-up / sn-line from index.css.
 */
const SectionHeader = ({ label, title, as: TitleTag = 'h2', className = '' }) => {
    return (
        <div className={className}>
            <p
                className="text-gold text-[11px] sm:text-xs font-jakarta font-semibold tracking-[5px] uppercase mb-4 sn-fade"
                style={{ '--sn-delay': 80 }}
            >
                {label}
            </p>
            <TitleTag
                className="title-editorial text-3xl sm:text-4xl lg:text-[46px] text-ivory tracking-wide sn-clip-up"
                style={{ '--sn-delay': 160 }}
            >
                {title}
            </TitleTag>
            <div className="flex justify-center mt-6">
                <div
                    className="w-28 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent sn-line"
                    style={{ '--sn-delay': 320 }}
                />
            </div>
        </div>
    );
};

export default SectionHeader;
