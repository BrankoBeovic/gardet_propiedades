import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Check current session
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const navItems = [
        { num: '01', label: 'Inicio', path: '/' },
        { num: '02', label: 'Venta', path: '/venta' },
        { num: '03', label: 'Arriendo', path: '/arriendo' },
        ...(user ? [{ num: '04', label: 'Dashboard', path: '/dashboard' }] : [])
    ];

    return (
        <header className="sticky top-0 z-50 bg-gardet-obsidian/90 backdrop-blur-md border-b border-gardet-border px-6 py-4 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo / Text */}
                <Link to="/" className="flex items-center space-x-3 group">
                    <span className="text-ivory font-extrabold text-lg tracking-widest uppercase transition-opacity group-hover:opacity-90">
                        GARDET
                    </span>
                    <span className="text-xs text-gold font-jakarta border-l border-gardet-border pl-3 tracking-wider uppercase">
                        PROPIEDADES
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex space-x-8 text-xs font-mono tracking-wider uppercase text-slate-400">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`transition-colors hover:text-gardet-gold ${isActive ? 'text-gardet-gold font-semibold' : ''
                                    }`}
                            >
                                <span className="text-gardet-gold/70 mr-1.5">{item.num}.</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile Trigger */}
                <div className="flex items-center lg:hidden">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-slate-400 hover:text-gardet-gold transition-colors p-1"
                        aria-label="Abrir menú"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {isOpen && (
                <div className="lg:hidden mt-4 pt-4 border-t border-gardet-border font-mono text-xs uppercase tracking-wider text-slate-400 space-y-3 animate-fade-in">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className="block py-1 hover:text-gardet-gold transition-colors"
                        >
                            <span className="text-gardet-gold/70 mr-2">{item.num}.</span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
};

export default Navbar;
