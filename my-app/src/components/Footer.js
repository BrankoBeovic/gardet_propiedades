import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-charcoal-dark border-t border-gold/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Brand */}
                    <div className="text-center md:text-left">
                        <h3 className="font-jakarta font-extrabold text-xl text-ivory tracking-brand">
                            GARDET
                        </h3>
                        <p className="text-gold text-xs tracking-descriptor font-jakarta mt-1">
                            PROPIEDADES
                        </p>
                    </div>

                    {/* Tagline */}
                    <p className="font-cormorant italic text-ivory/50 text-lg">
                        Propiedades de Alta Gama
                    </p>

                    {/* Copyright */}
                    <div className="text-center md:text-right">
                        <p className="text-sm text-ivory/30 font-jakarta">
                            © {new Date().getFullYear()} GARDET Propiedades.
                        </p>
                        <p className="text-xs text-ivory/20 font-jakarta mt-1">
                            Todos los derechos reservados.
                        </p>
                    </div>
                </div>

                {/* Gold separator line */}
                <div className="mt-8 pt-6 border-t border-obsidian-50/10 flex justify-center">
                    <div className="gold-line"></div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
