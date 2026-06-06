import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: ({ username, password }) => login({ username, password }),
        onError: (err) => {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        loginMutation.mutate({ username, password });
    };

    const handleGuestLogin = () => {
        loginAsGuest();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-16 relative overflow-hidden">
            {/* Background glowing orbs (Tailwind approximation of the old SCSS) */}
            <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
                <div className="absolute w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-violet-600/10 rounded-full blur-[100px] -translate-x-1/3 -translate-y-1/3 mix-blend-screen" />
                <div className="absolute w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] bg-emerald-600/10 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 mix-blend-screen" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* ── Form Card ──────────────────────────────────────────── */}
                <div className="bg-[#0f0f12] border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                    
                    <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center shadow-inner">
                                <Activity className="w-6 h-6 text-zinc-100" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                                    API Monitor
                                </h1>
                                <p className="text-sm text-zinc-500">
                                    Sign in to access your dashboard
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6">
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-950/30 border border-red-800/40 rounded-lg text-center">
                                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            {/* Username Field */}
                            <div className="space-y-1.5">
                                <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={loginMutation.isPending}
                                        placeholder="Enter your username"
                                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:opacity-50 transition-colors duration-150"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loginMutation.isPending}
                                        placeholder="Enter your password"
                                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:opacity-50 transition-colors duration-150"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loginMutation.isPending}
                                    className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loginMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Guest Access Section ────────────────────────────── */}
                    <div className="px-8 pb-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-medium">
                                <span className="bg-[#0f0f12] px-3 text-zinc-600">Or continue without account</span>
                            </div>
                        </div>

                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={handleGuestLogin}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 font-medium text-sm py-2.5 px-4 rounded-lg transition-colors duration-150"
                            >
                                View Live Demo (Guest)
                                <ArrowRight className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-zinc-600">
                    <p>Protected by industry standard encryption.</p>
                </div>
            </div>
        </div>
    );
}
