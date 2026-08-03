import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Footer = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <footer className="bg-[#141416] relative z-20 border-t border-gold/20 shadow-2xl">
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
                    <p className="font-ysabeau text-gold/90 text-xl font-medium tracking-wide">
                        Propiedades de Alta Gama
                    </p>

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
                <div className="mt-8 pt-6 border-t border-obsidian-50/10 flex justify-center">
                    <div className="gold-line"></div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
