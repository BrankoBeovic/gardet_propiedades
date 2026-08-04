import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useDocumentMeta('Acceso', 'Acceso privado al panel de GARDET Propiedades.');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            navigate('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-20">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <div className="gold-line"></div>
                    </div>
                    <h2 className="title-editorial text-4xl text-ivory">
                        Acceso Privado
                    </h2>
                    <p className="mt-3 text-ivory/40 font-jakarta text-sm">
                        Ingresa tus credenciales para continuar
                    </p>
                </div>

                {/* Login Card */}
                <div className="card-dark rounded-xl p-8">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-jakarta font-medium text-ivory/70 mb-2">
                                Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="input-dark"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-jakarta font-medium text-ivory/70 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="input-dark"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center font-jakarta bg-red-400/10 border border-red-400/20 rounded-md py-2 px-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin"></span>
                                    Ingresando...
                                </span>
                            ) : 'Ingresar'}
                        </button>
                    </form>
                </div>

                {/* Bottom decoration */}
                <div className="flex justify-center mt-8">
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;
