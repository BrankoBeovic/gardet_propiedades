import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LayoutDashboard, Instagram, Youtube } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { SOCIAL_LINKS } from '../constants/contact';

const WhatsAppIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const socialItems = [
    { href: SOCIAL_LINKS.whatsapp, label: 'WhatsApp', Icon: WhatsAppIcon },
    { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: Instagram },
    { href: SOCIAL_LINKS.youtube, label: 'YouTube', Icon: Youtube },
];

const Footer = () => {
    const { user } = useAuth();

    return (
        <footer className="bg-[#141416] relative z-20 border-t border-gold/20 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-5">
                    {/* Brand — same mark as navbar, links home */}
                    <Link to="/" className="inline-flex flex-col items-center md:items-start group">
                        <span className="text-ivory font-extrabold text-lg tracking-widest uppercase transition-opacity group-hover:opacity-90">
                            GARDET
                        </span>
                        <span className="text-xs text-gold font-jakarta tracking-[5px] uppercase mt-1">
                            PROPIEDADES
                        </span>
                    </Link>

                    {/* Tagline + social */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                        <p className="font-ysabeau text-gold/90 text-lg sm:text-xl font-medium tracking-wide">
                            Corredora boutique
                        </p>
                        <div className="hidden sm:block h-5 w-px bg-gold/25" aria-hidden="true" />
                        <div className="flex items-center gap-2.5">
                            {socialItems.map(({ href, label, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold/20 text-ivory/50 hover:text-gold hover:border-gold/45 hover:bg-gold/5 transition-colors"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Copyright & Acceder Button */}
                    <div className="text-center md:text-right flex flex-col items-center md:items-end">
                        <p className="text-sm text-slate-300 font-jakarta font-medium">
                            © {new Date().getFullYear()} GARDET Propiedades.
                        </p>
                        <p className="text-xs text-slate-400 font-jakarta mt-1">
                            Todos los derechos reservados.
                        </p>
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 text-ivory/40 hover:text-gold transition-colors font-jakarta text-sm border border-obsidian-50/20 hover:border-gold/30 px-4 py-2 mt-3 rounded-xl"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-ivory/40 hover:text-gold transition-colors font-jakarta text-sm border border-obsidian-50/20 hover:border-gold/30 px-4 py-2 mt-3 rounded-xl"
                            >
                                <LogIn className="h-4 w-4" />
                                Acceder
                            </Link>
                        )}
                    </div>
                </div>

                {/* Gold separator line */}
                <div className="mt-6 pt-5 border-t border-obsidian-50/10 flex justify-center">
                    <div className="gold-line"></div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
