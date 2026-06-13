/**
 * ApiKeysPage.jsx — API Key Management Dashboard
 *
 * Accessible to: client_admin, super_admin
 * Client viewer: read-only (no generate button)
 *
 * Features:
 *  - List all API keys for the logged-in client
 *  - Generate new key → One-Time Key Display modal
 *  - Environment badges (production / staging / development / testing)
 *  - Key prefix display (full keyValue stripped on backend — shows only keyId prefix)
 *  - Expiry date + active/inactive status
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Key, Plus, Copy, Check, AlertTriangle, Loader2,
    ShieldCheck, Clock, Globe, Code2, RefreshCw, Eye, EyeOff,
    CheckCircle2, XCircle, Lock, ArrowRight, Trash2,
} from 'lucide-react';
import { clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ENV_STYLES = {
    production: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Production' },
    staging: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Staging' },
    development: { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20', label: 'Development' },
    testing: { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20', label: 'Testing' },
};

const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

const daysUntil = (d) => {
    const diff = new Date(d) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ value, size = 'sm' }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className={[
                'flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150',
                size === 'sm'
                    ? 'px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                    : 'px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700',
            ].join(' ')}
        >
            {copied
                ? <><Check className="w-3 h-3 text-emerald-400" />{size !== 'sm' && 'Copied!'}</>
                : <><Copy className="w-3 h-3" />{size !== 'sm' && 'Copy'}</>
            }
        </button>
    );
}

// ─── One-Time Key Display Modal ───────────────────────────────────────────────
function NewKeyModal({ keyData, onClose }) {
    const { name, keyValue, environment, keyId } = keyData;

    return (
        <Modal isOpen onClose={undefined} maxWidth="max-w-lg">
            <div className="space-y-5">
                {/* Warning header */}
                <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/25 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-300">One-time display — copy now</p>
                        <p className="text-xs text-amber-500/80 mt-0.5 leading-relaxed">
                            The full API key is shown <strong>only once</strong>. It is hashed before storage
                            and cannot be recovered. Copy it and store it securely.
                        </p>
                    </div>
                </div>

                {/* Key info */}
                <div className="p-4 bg-emerald-500/6 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                            API Key Generated
                        </p>
                    </div>
                    <p className="text-base font-bold text-zinc-100">{name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 capitalize">{environment} environment</p>
                </div>

                {/* Full key value */}
                <div>
                    <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                        Full API Key (copy this)
                    </p>
                    <div className="flex items-center gap-2 p-3.5 bg-[#0d0d0d] border border-orange-500/30 rounded-xl ring-1 ring-orange-500/10">
                        <Code2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <code className="flex-1 text-xs font-mono text-orange-300 break-all leading-relaxed">
                            {keyValue}
                        </code>
                        <CopyButton value={keyValue} size="md" />
                    </div>
                </div>

                {/* Key ID */}
                <div>
                    <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                        Key ID (for reference)
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-[#0d0d0d] border border-zinc-800 rounded-xl">
                        <code className="flex-1 text-xs font-mono text-zinc-400">{keyId}</code>
                        <CopyButton value={keyId} size="sm" />
                    </div>
                </div>

                {/* SDK usage snippet */}
                <div>
                    <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                        SDK Integration
                    </p>
                    <div className="p-3 bg-[#0d0d0d] border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-500 leading-relaxed">
                        <span className="text-zinc-600">// .env file</span><br />
                        <span className="text-sky-400">APIM_API_KEY</span>
                        <span className="text-zinc-500">=</span>
                        <span className="text-amber-400">"{keyValue?.slice(0, 12)}…"</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 transition-all duration-150"
                >
                    I've saved the key — Close
                </button>
            </div>
        </Modal>
    );
}

// ─── Generate Key Modal ───────────────────────────────────────────────────────
function GenerateModal({ clientId, actingUser, onGenerated, onClose }) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        environment: 'production',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const ENVIRONMENTS = ['production', 'staging', 'development', 'testing'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Key name is required.'); return; }
        setError('');
        setIsSubmitting(true);
        try {
            const res = await clientApi.createApiKey(clientId, {
                name: form.name.trim(),
                description: form.description.trim(),
                environment: form.environment,
            });
            onGenerated(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to generate key. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Generate New API Key" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                {/* Key name */}
                <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                        Key Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Production Backend Key"
                        className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-700 transition-colors"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                        Description <span className="text-zinc-700">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="e.g. Used by the main Express.js server"
                        className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-700 transition-colors"
                    />
                </div>

                {/* Environment selector */}
                <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-2">
                        Environment
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {ENVIRONMENTS.map((env) => {
                            const style = ENV_STYLES[env];
                            const isSelected = form.environment === env;
                            return (
                                <button
                                    key={env}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, environment: env }))}
                                    className={[
                                        'py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-all duration-150',
                                        isSelected
                                            ? style.cls + ' ring-1 ring-current'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400',
                                    ].join(' ')}
                                >
                                    {style.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                        <p className="text-xs text-red-400">{error}</p>
                    </div>
                )}

                {/* Info */}
                <div className="p-3 bg-sky-500/5 border border-sky-500/15 rounded-lg">
                    <p className="text-[11px] text-sky-400/80 leading-relaxed">
                        Keys expire in <strong>365 days</strong> by default.
                        The full key value is shown <strong>once</strong> after generation.
                    </p>
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                            : <><Key className="w-4 h-4" /> Generate Key</>
                        }
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Key Row ──────────────────────────────────────────────────────────────────
function KeyRow({ apiKey, canDelete, onDelete, isDeleting }) {
    const env     = ENV_STYLES[apiKey.environment] ?? ENV_STYLES.production;
    const days    = daysUntil(apiKey.expiresAt);
    const expired = days <= 0;
    const warning = days > 0 && days <= 30;

    return (
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-zinc-800/20 transition-colors border-b border-zinc-800/40 last:border-0">
            {/* Icon */}
            <div className={[
                'w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0',
                apiKey.isActive && !expired
                    ? 'bg-orange-500/10 border-orange-500/20'
                    : 'bg-zinc-900 border-zinc-800',
            ].join(' ')}>
                <Key className={`w-4 h-4 ${apiKey.isActive && !expired ? 'text-orange-400' : 'text-zinc-700'}`} />
            </div>

            {/* Name + meta */}
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-100">{apiKey.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${env.cls}`}>
                        {env.label}
                    </span>
                    {!apiKey.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-zinc-900 text-zinc-600 border-zinc-800">
                            Inactive
                        </span>
                    )}
                </div>
                {apiKey.description && (
                    <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{apiKey.description}</p>
                )}
                <p className="text-[10px] text-zinc-700 mt-0.5 font-mono">
                    keyId: {apiKey.keyId?.slice(0, 8)}…
                </p>
            </div>

            {/* Created */}
            <div className="text-right hidden sm:block">
                <p className="text-[9px] text-zinc-700 uppercase tracking-widest">Created</p>
                <p className="text-xs text-zinc-500 mt-0.5">{fmtDate(apiKey.createdAt)}</p>
            </div>

            {/* Expiry */}
            <div className="text-right">
                <p className="text-[9px] text-zinc-700 uppercase tracking-widest">Expires</p>
                <p className={[
                    'text-xs mt-0.5 font-medium',
                    expired ? 'text-red-400'
                        : warning ? 'text-amber-400'
                            : 'text-zinc-500',
                ].join(' ')}>
                    {expired
                        ? 'Expired'
                        : warning
                            ? `${days}d left`
                            : fmtDate(apiKey.expiresAt)
                    }
                </p>
            </div>

            {/* Status icon */}
            <div className="flex-shrink-0">
                {apiKey.isActive && !expired
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-zinc-700" />
                }
            </div>

            {/* Delete button — only shown to admins */}
            {canDelete && (
                <button
                    onClick={() => onDelete(apiKey.keyId, apiKey.name)}
                    disabled={isDeleting}
                    title="Delete key"
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 disabled:opacity-40"
                >
                    {isDeleting
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
    );
}

// ─── Guest Locked UI ─────────────────────────────────────────────────────────
function GuestLockedApiKeys() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const handleSignIn = async () => {
        logout();
        // navigate('/login', { replace: true });
    };
    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">■ Security</span>
                </div>
                <h1 className="text-xl font-black text-zinc-100 tracking-tight">API Keys</h1>
                <p className="text-sm text-zinc-600 mt-0.5">Manage authentication keys for your SDK integration</p>
            </div>
            <div className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-12 flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-zinc-600" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h2 className="text-base font-bold text-zinc-200">Authentication Required</h2>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                        API Keys are tied to your organisation account. Sign in to generate,
                        view, and manage your monitoring keys.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSignIn}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Sign In <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ApiKeysPage() {
    const { user } = useAuth();
    const isGuest = user?.isGuest === true;

    if (isGuest) return <GuestLockedApiKeys />;

    const clientId = user?.clientId;
    const canGenerate = user?.role === 'client_admin' || user?.role === 'super_admin';

    const [showGenerate, setShowGenerate] = useState(false);
    const [newKeyData, setNewKeyData] = useState(null); // set after generation → shows modal

    const queryClient = useQueryClient();

    // ── Fetch keys ────────────────────────────────────────────────────────────
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['api-keys', clientId],
        queryFn: () => clientApi.getClientApiKeys(clientId),
        enabled: !!clientId,
        select: (res) => res?.data ?? [],
    });

    const keys = data ?? [];

    const handleGenerated = useCallback((keyData) => {
        setShowGenerate(false);
        setNewKeyData(keyData);
        queryClient.invalidateQueries({ queryKey: ['api-keys', clientId] });
    }, [clientId, queryClient]);

    // ── Delete key ────────────────────────────────────────────────────────────────
    const [deletingKeyId, setDeletingKeyId] = useState(null);
    const canDelete = canGenerate; // same role gate: client_admin + super_admin

    const deleteMutation = useMutation({
        mutationFn: ({ keyId }) => clientApi.deleteApiKey(clientId, keyId),
        onSuccess: (_, { keyId }) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys', clientId] });
            setDeletingKeyId(null);
        },
        onError: () => {
            setDeletingKeyId(null);
        },
    });

    const handleDelete = useCallback((keyId, name) => {
        if (!window.confirm(`Delete key “${name}”?\n\nThis is permanent and cannot be undone. Any services using this key will stop being monitored.`)) return;
        setDeletingKeyId(keyId);
        deleteMutation.mutate({ keyId });
    }, [deleteMutation]);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const activeCount = keys.filter(k => k.isActive && daysUntil(k.expiresAt) > 0).length;
    const expiringCount = keys.filter(k => {
        const d = daysUntil(k.expiresAt);
        return d > 0 && d <= 30;
    }).length;

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                                ■ Security
                            </span>
                        </div>
                        <h1 className="text-xl font-black text-zinc-100 tracking-tight">API Keys</h1>
                        <p className="text-sm text-zinc-600 mt-0.5">
                            Manage authentication keys for your SDK integration
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all disabled:opacity-40"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        {canGenerate && (
                            <button
                                onClick={() => setShowGenerate(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-lg shadow-orange-900/20"
                            >
                                <Plus className="w-4 h-4" />
                                Generate Key
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats strip ──────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: 'Total Keys',
                            value: isLoading ? '—' : keys.length,
                            icon: Key,
                            cls: 'text-zinc-400',
                        },
                        {
                            label: 'Active',
                            value: isLoading ? '—' : activeCount,
                            icon: CheckCircle2,
                            cls: 'text-emerald-400',
                        },
                        {
                            label: 'Expiring Soon',
                            value: isLoading ? '—' : expiringCount,
                            icon: Clock,
                            cls: expiringCount > 0 ? 'text-amber-400' : 'text-zinc-700',
                        },
                    ].map(({ label, value, icon: Icon, cls }) => (
                        <div
                            key={label}
                            className="p-4 bg-[#111111] border border-zinc-800/60 rounded-xl"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-3.5 h-3.5 ${cls}`} />
                                <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">{label}</p>
                            </div>
                            <p className="text-2xl font-black text-zinc-100">{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Keys list ────────────────────────────────────────────── */}
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden">
                    {/* Header row */}
                    {keys.length > 0 && (
                        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-zinc-800/60">
                            {['', 'Key Name', 'Created', 'Expires', ''].map((h, i) => (
                                <p key={i} className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                                    {h}
                                </p>
                            ))}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                            <span className="text-sm text-zinc-600">Loading keys…</span>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <XCircle className="w-6 h-6 text-red-500" />
                            <p className="text-sm text-red-400">Failed to load API keys</p>
                            <button onClick={() => refetch()} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
                                Retry
                            </button>
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                                <Key className="w-6 h-6 text-zinc-700" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-500">No API keys yet</p>
                            <p className="text-xs text-zinc-700 mt-1 max-w-xs">
                                Generate your first key to start sending monitoring data via the SDK
                            </p>
                            {canGenerate && (
                                <button
                                    onClick={() => setShowGenerate(true)}
                                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Generate First Key
                                </button>
                            )}
                        </div>
                    ) : (
                        keys.map((key) => (
                            <KeyRow
                                key={key._id}
                                apiKey={key}
                                canDelete={canDelete}
                                onDelete={handleDelete}
                                isDeleting={deletingKeyId === key.keyId}
                            />
                        ))
                    )}
                </div>

                {/* ── Integration notice ───────────────────────────────────── */}
                {keys.length > 0 && (
                    <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Code2 className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 mb-1">SDK Integration</p>
                                <p className="text-[11px] text-zinc-700 leading-relaxed">
                                    Add your API key to your Node.js app via the{' '}
                                    <code className="text-zinc-500 bg-zinc-900 px-1 rounded">APIM_API_KEY</code>{' '}
                                    environment variable. See the Documentation page for the full integration guide.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Generate modal ────────────────────────────────────────────── */}
            {showGenerate && (
                <GenerateModal
                    clientId={clientId}
                    actingUser={user}
                    onGenerated={handleGenerated}
                    onClose={() => setShowGenerate(false)}
                />
            )}

            {/* ── One-time key display ──────────────────────────────────────── */}
            {newKeyData && (
                <NewKeyModal
                    keyData={newKeyData}
                    onClose={() => setNewKeyData(null)}
                />
            )}
        </>
    );
}

export default ApiKeysPage;
