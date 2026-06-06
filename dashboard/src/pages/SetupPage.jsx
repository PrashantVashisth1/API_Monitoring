/**
 * SetupPage.jsx — One-time Platform Initialization Wizard
 *
 * Logic:
 *  - Only reachable when setupRequired = true (no users in DB, no localStorage flag).
 *  - Calls POST /api/auth/onboard-super-admin → on 201, auto-login via cookie.
 *  - On 403 ("already initialized") → marks platform as initialized, shows link to /login.
 *  - On 400 (validation) → displays the backend's error[] array as inline messages.
 *
 * Backend contract (onboardSuperAdminSchema + User model):
 *  Request  → { username: string, email: string, password: string (min 6) }
 *  Response → ResponseFormatter.success(user, "Super admin created successfully", 201)
 *  Error 400 → { error: string[] }  (from validate middleware)
 *  Error 403 → { message: "Super admin onboarding is disabled" }
 *
 * Design: Developer-focused minimalism.
 *  Dark zinc palette, solid borders, no glowing gradients, clean typography.
 */
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Loader2, ChevronRight, Terminal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/api';

// ─── Tiny reusable components (Phase 3 will give these a full home) ───────────

function FormField({ id, label, type = 'text', value, onChange, disabled, error, hint, autoComplete }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                autoComplete={autoComplete}
                className={[
                    'w-full bg-zinc-950 border rounded-lg px-3.5 py-2.5',
                    'text-sm text-zinc-100 placeholder:text-zinc-600',
                    'transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error
                        ? 'border-red-700/80 focus:ring-red-700/50'
                        : 'border-zinc-700/80 hover:border-zinc-600',
                ].join(' ')}
            />
            {hint && !error && (
                <p className="text-xs text-zinc-600">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                    <span aria-hidden>·</span> {error}
                </p>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SetupPage() {
    const { setUser, markInitialized, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // If already authenticated (e.g. back-button after setup), skip to dashboard
    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    // ── Form state ────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        username: '',
        email:    '',
        password: '',
    });

    // Per-field errors (parsed from backend 400 response)
    const [fieldErrors, setFieldErrors] = useState({
        username: '',
        email:    '',
        password: '',
    });

    // Generic error (network failure, unexpected server error)
    const [generalError, setGeneralError] = useState('');

    // Shown when backend returns 403 — platform already configured
    const [alreadyInitialized, setAlreadyInitialized] = useState(false);

    // ── Mutation ───────────────────────────────────────────────────────────────
    const setupMutation = useMutation({
        /**
         * POST /api/auth/onboard-super-admin
         * { username, email, password }
         */
        mutationFn: (data) => authApi.onboardSuperAdmin(data),

        onSuccess: (res) => {
            // Backend sets httpOnly cookie AND returns the user object.
            // We update AuthContext so the app re-renders immediately to /dashboard.
            markInitialized();
            setUser(res?.data ?? null);
            // navigate() is handled by AuthGate re-render, but adding it
            // here as a fallback is clean and explicit.
            navigate('/dashboard', { replace: true });
        },

        onError: (err) => {
            const status  = err.response?.status;
            const payload = err.response?.data;

            setFieldErrors({ username: '', email: '', password: '' });
            setGeneralError('');

            if (status === 403) {
                // Platform is already initialized — update flag and show info state
                markInitialized();
                setAlreadyInitialized(true);
                return;
            }

            if (status === 400) {
                /**
                 * validate middleware returns:
                 * { success: false, message: "Validation failed", error: string[] }
                 * Each string is like "username is required" or
                 * "password must be at least 6 characters".
                 *
                 * We map each message to its field by checking which keyword it starts with.
                 */
                const errors = Array.isArray(payload?.error) ? payload.error : [];
                const mapped = { username: '', email: '', password: '' };

                errors.forEach((msg) => {
                    if (msg.toLowerCase().includes('username')) mapped.username = msg;
                    else if (msg.toLowerCase().includes('email'))    mapped.email    = msg;
                    else if (msg.toLowerCase().includes('password')) mapped.password = msg;
                    else setGeneralError(prev => prev ? `${prev}. ${msg}` : msg);
                });

                setFieldErrors(mapped);
                return;
            }

            // Mongoose validation errors or unexpected failures (500, etc.)
            setGeneralError(
                payload?.message
                || payload?.error
                || 'An unexpected error occurred. Check the server logs.'
            );
        },
    });

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        // Clear that field's error on change
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
        if (generalError) setGeneralError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setGeneralError('');
        setupMutation.mutate({
            username: form.username.trim(),
            email:    form.email.trim(),
            password: form.password,
        });
    };

    const isPending = setupMutation.isPending;

    // ─── Already Initialized State ─────────────────────────────────────────────
    if (alreadyInitialized) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-[#0f0f12] border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/60 text-center space-y-5">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-800/40 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
                                Already Initialized
                            </h1>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                This platform has already been configured. The Super&nbsp;Administrator
                                account exists and this setup cannot be run again.
                            </p>
                        </div>

                        <div className="pt-1">
                            <button
                                onClick={() => navigate('/login', { replace: true })}
                                className="w-full inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors duration-150"
                            >
                                Go to Sign In
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Main Setup Form ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="mb-8 space-y-1">
                    {/* Brand mark */}
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0">
                            <Terminal className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-300 tracking-tight">
                            API Monitor
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                        Platform Initialization
                    </h1>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Create the first Super&nbsp;Administrator account to activate the platform.
                        This screen is only shown once.
                    </p>
                </div>

                {/* ── Form Card ──────────────────────────────────────────── */}
                <div className="bg-[#0f0f12] border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/60">

                    <div className="px-8 pt-8 pb-6">
                        {/* General / server error */}
                        {generalError && (
                            <div className="mb-5 flex gap-2.5 items-start p-3.5 bg-red-950/30 border border-red-800/40 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400 leading-relaxed">{generalError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            <FormField
                                id="setup-username"
                                label="Username"
                                type="text"
                                value={form.username}
                                onChange={handleChange('username')}
                                disabled={isPending}
                                error={fieldErrors.username}
                                autoComplete="username"
                                hint="Letters, numbers, dots, dashes, and underscores only."
                            />

                            <FormField
                                id="setup-email"
                                label="Email Address"
                                type="email"
                                value={form.email}
                                onChange={handleChange('email')}
                                disabled={isPending}
                                error={fieldErrors.email}
                                autoComplete="email"
                            />

                            <FormField
                                id="setup-password"
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={handleChange('password')}
                                disabled={isPending}
                                error={fieldErrors.password}
                                autoComplete="new-password"
                                hint="Minimum 6 characters."
                            />

                            {/* Submit */}
                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Initializing…
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Initialize Platform
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Warning Notice ──────────────────────────────────── */}
                    <div className="px-8 pb-6">
                        <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-lg">
                            <div className="flex gap-2.5 items-start">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    This setup runs{' '}
                                    <span className="text-amber-500/90 font-medium">once only</span>.
                                    The account created will have full Super&nbsp;Administrator
                                    privileges — including onboarding clients, managing API keys, and
                                    accessing all analytics data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer note ────────────────────────────────────────── */}
                <p className="mt-6 text-center text-xs text-zinc-700">
                    Already initialized?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
                    >
                        Sign in instead
                    </button>
                </p>

            </div>
        </div>
    );
}

export default SetupPage;
