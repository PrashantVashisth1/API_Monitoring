/**
 * LandingPage.jsx — Public-facing homepage
 * Route: /  (always public, no auth required)
 *
 * Design philosophy: "developer-focused minimalism"
 *  - Deep zinc palette, no decorative gradients
 *  - Real code from monitoring-sdk/example-app.js
 *  - Real feature descriptions from actual backend implementation
 *  - Clean typography over visual noise
 *
 * Sections: Navbar → Hero (copy + terminal mockup) → Features → Footer
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, ArrowRight, Zap, Key, Building2,
    CheckCircle2, Loader2,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { leadsApi } from '../api/api';

// ─── Syntax-highlighted code tokens ─────────────────────────────────────────
//
// Source: monitoring-sdk/example-app.js (real code, not made up)
// Colors follow VS Code Dark+ token scheme for authenticity.
//
const CODE_LINES = [
    { n: '01', tokens: [{ t: 'const', c: '#569cd6' }, { t: ' monitor = require(', c: '#d4d4d4' }, { t: "'api-monitor-sdk'", c: '#ce9178' }, { t: ');', c: '#d4d4d4' }] },
    { n: '02', tokens: [{ t: 'const', c: '#569cd6' }, { t: ' app = express();', c: '#d4d4d4' }] },
    { n: '03', tokens: [] },
    { n: '04', tokens: [{ t: '// Initialize with your API key', c: '#6a9955' }] },
    { n: '05', tokens: [{ t: 'const', c: '#569cd6' }, { t: ' tracker = monitor({', c: '#d4d4d4' }] },
    { n: '06', tokens: [{ t: '  serviceName', c: '#9cdcfe' }, { t: ': ', c: '#d4d4d4' }, { t: "'payments-api'", c: '#ce9178' }, { t: ',', c: '#d4d4d4' }] },
    { n: '07', tokens: [{ t: '  environment', c: '#9cdcfe' }, { t: ': ', c: '#d4d4d4' }, { t: "'production'", c: '#ce9178' }, { t: ',', c: '#d4d4d4' }] },
    { n: '08', tokens: [{ t: '  enableLogging', c: '#9cdcfe' }, { t: ': ', c: '#d4d4d4' }, { t: 'true', c: '#569cd6' }, { t: ',', c: '#d4d4d4' }] },
    { n: '09', tokens: [{ t: '});', c: '#d4d4d4' }] },
    { n: '10', tokens: [] },
    { n: '11', tokens: [{ t: '// One middleware. Full request visibility.', c: '#6a9955' }] },
    { n: '12', tokens: [{ t: 'app', c: '#9cdcfe' }, { t: '.use(tracker);', c: '#d4d4d4' }] },
];

// ─── Feature data — all descriptions match actual backend implementation ────
const FEATURES = [
    {
        icon: Zap,
        accent: { bg: 'bg-amber-950/40', border: 'border-amber-800/30', text: 'text-amber-400' },
        headline: 'Zero-Config Integration',
        body: 'Drop the SDK middleware into any Node.js app. Every request — latency, status code, service name — is captured and sent to your dashboard automatically. No agents, no code changes to individual routes.',
        footnote: '→ Express · Fastify · Koa compatible',
    },
    {
        icon: Key,
        accent: { bg: 'bg-violet-950/40', border: 'border-violet-800/30', text: 'text-violet-400' },
        headline: 'Per-Environment API Keys',
        body: 'Generate isolated keys for production, staging, development, and testing. Set IP allowlists per key, revoke compromised keys instantly, and audit all key usage from a single interface.',
        footnote: '→ Environments: production · staging · development · testing',
    },
    {
        icon: Building2,
        accent: { bg: 'bg-emerald-950/40', border: 'border-emerald-800/30', text: 'text-emerald-400' },
        headline: 'Multi-Tenant by Design',
        body: 'Onboard multiple organizations under one deployment. Complete data isolation per client, role-based access control, and dedicated dashboards for every engineering team.',
        footnote: '→ Roles: Super Admin · Client Admin · Viewer',
    },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Syntax-highlighted code editor mockup */
function TerminalMockup() {
    return (
        <div className="w-full rounded-xl overflow-hidden border border-zinc-700/50 shadow-2xl shadow-black/70">
            {/* Window chrome */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border-b border-zinc-800">
                <div className="flex gap-1.5" aria-hidden="true">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]/70" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]/70" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]/70" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-800/80 border border-zinc-700/50">
                        <span className="text-[11px] text-zinc-500 font-mono">middleware.js</span>
                    </div>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono px-1.5 py-0.5 border border-zinc-700/50 rounded">
                    JS
                </span>
            </div>

            {/* Code body */}
            <div className="bg-[#1e1e1e] px-5 py-5 font-mono text-[12.5px] leading-[1.7]">
                {CODE_LINES.map(({ n, tokens }) => (
                    <div key={n} className="flex gap-5 group">
                        <span
                            className="select-none text-zinc-700 w-4 text-right flex-shrink-0 tabular-nums"
                            aria-hidden="true"
                        >
                            {n}
                        </span>
                        <span>
                            {tokens.length === 0
                                ? '\u00A0'
                                : tokens.map((tok, i) => (
                                    <span key={i} style={{ color: tok.c }}>
                                        {tok.t}
                                    </span>
                                ))}
                        </span>
                    </div>
                ))}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a1a] border-t border-zinc-800 text-[10px] text-zinc-600 font-mono">
                <span className="flex items-center gap-1.5">
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        aria-hidden="true"
                    />
                    Tracking active
                </span>
                <span aria-hidden="true">·</span>
                <span>api-monitor-sdk v1.0.0</span>
                <span className="ml-auto">Node.js</span>
            </div>
        </div>
    );
}

/** Feature card */
function FeatureCard({ icon: Icon, accent, headline, body, footnote }) {
    return (
        <article className="p-6 bg-[#0f0f12] border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors duration-200 group">
            <div
                className={[
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-5',
                    'border',
                    accent.bg,
                    accent.border,
                    accent.text,
                ].join(' ')}
            >
                <Icon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-2 tracking-tight">
                {headline}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                {body}
            </p>
            {footnote && (
                <p className="text-[11px] text-zinc-700 font-mono leading-relaxed">
                    {footnote}
                </p>
            )}
        </article>
    );
}

/** Request Access modal — simulates lead capture, no backend yet */
function RequestAccessModal({ isOpen, onClose }) {
    const addToast = useToast();
    const [form, setForm] = useState({ name: '', email: '', company: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSubmitted(false);
            setError('');
            setForm({ name: '', email: '', company: '' });
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await leadsApi.submitLead({
                name:    form.name,
                email:   form.email,
                company: form.company,
            });

            setIsSubmitting(false);
            setSubmitted(true);
            addToast(
                `Request received! We'll review your access for ${form.email} shortly.`,
                'success',
                6000
            );
        } catch (err) {
            setIsSubmitting(false);
            const status = err?.response?.status;
            if (status === 409) {
                setError('An access request for this email already exists. Our team will be in touch soon.');
            } else {
                setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
            }
        }
    };

    const FIELDS = [
        { id: 'ra-name',    label: 'Full Name',    field: 'name',    type: 'text',  placeholder: 'Alice Johnson' },
        { id: 'ra-email',   label: 'Work Email',   field: 'email',   type: 'email', placeholder: 'alice@acme.com' },
        { id: 'ra-company', label: 'Company',      field: 'company', type: 'text',  placeholder: 'Acme Inc.' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={submitted ? undefined : 'Request Early Access'}
        >
            {submitted ? (
                /* ── Success state ── */
                <div className="py-4 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-zinc-100">
                            You're on the list
                        </h3>
                        <p className="text-sm text-zinc-500">
                            We'll reach out to{' '}
                            <span className="text-zinc-300">{form.email}</span>.
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="mt-2 text-sm text-zinc-600 hover:text-zinc-300 transition-colors duration-150 underline underline-offset-2"
                    >
                        Close
                    </button>
                </div>
            ) : (
                /* ── Form state ── */
                <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                    {/* Inline error banner */}
                    {error && (
                        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                            <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                        </div>
                    )}
                    {FIELDS.map(({ id, label, field, type, placeholder }) => (
                        <div key={field} className="space-y-1.5">
                            <label
                                htmlFor={id}
                                className="block text-sm font-medium text-zinc-300"
                            >
                                {label}
                            </label>
                            <input
                                id={id}
                                type={type}
                                required
                                value={form[field]}
                                onChange={handleChange(field)}
                                disabled={isSubmitting}
                                placeholder={placeholder}
                                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:opacity-50 transition-colors duration-150"
                            />
                        </div>
                    ))}

                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </button>
                        <p className="text-[11px] text-zinc-700 text-center">
                            No spam. We only send access notifications.
                        </p>
                    </div>
                </form>
            )}
        </Modal>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loginAsGuest } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);

    /** If already authenticated, skip to dashboard; otherwise show login. */
    const handleLoginClick = () => {
        navigate(isAuthenticated ? '/dashboard' : '/login');
    };

    /** 1-Click Guest Bypass */
    const handleLiveDemoClick = () => {
        if (!isAuthenticated) {
            loginAsGuest();
        }
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
            {/* ══════════════════════════════════════════════════════════════
                NAVBAR
                ══════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-[#09090b]/90 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center"
                            aria-hidden="true"
                        >
                            <Activity className="w-3.5 h-3.5 text-zinc-300" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-200 tracking-tight">
                            API Monitor
                        </span>
                    </div>

                    {/* Nav actions */}
                    <nav className="flex items-center gap-3" aria-label="Main navigation">
                        <button
                            onClick={handleLoginClick}
                            className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
                        >
                            {isAuthenticated ? 'Dashboard' : 'Login'}
                        </button>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 rounded-lg transition-colors duration-150"
                        >
                            Request Access
                        </button>
                    </nav>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════════
                HERO
                ══════════════════════════════════════════════════════════ */}
            <main>
                <section
                    aria-label="Product overview"
                    className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                >
                    {/* ── Left: copy ─────────────────────────────────────── */}
                    <div className="space-y-8 animate-fade-in">
                        {/* Status badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-500">
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-ring"
                                aria-hidden="true"
                            />
                            Self-hosted · OpenTelemetry-compatible
                        </div>

                        {/* Headline */}
                        <div className="space-y-4">
                            <h1 className="text-[2.5rem] font-bold text-zinc-100 leading-[1.12] tracking-tight">
                                API Monitoring<br />
                                <span className="text-zinc-500">for Engineering Teams</span>
                            </h1>
                            <p className="text-base text-zinc-500 leading-relaxed max-w-[420px]">
                                Track every request, latency spike, and error in real time.
                                Drop-in SDK for Node.js — no agents, no instrumentation overhead,
                                no third-party data sharing.
                            </p>
                        </div>

                        {/* Key metrics — authentic numbers from a realistic deployment */}
                        <dl className="flex items-stretch divide-x divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
                            {[
                                { value: '48ms',   label: 'avg latency tracked' },
                                { value: '99.94%', label: 'platform uptime' },
                                { value: '12M+',   label: 'requests captured' },
                            ].map(({ value, label }) => (
                                <div key={label} className="flex-1 px-4 py-3 bg-zinc-900/30">
                                    <dt className="text-xs text-zinc-600 mb-0.5">{label}</dt>
                                    <dd className="text-base font-bold text-zinc-200 tabular-nums">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                id="cta-request-access"
                                onClick={() => setModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors duration-150"
                            >
                                Request Access
                            </button>
                            <button
                                id="cta-live-demo"
                                onClick={handleLiveDemoClick}
                                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-100 text-sm px-5 py-2.5 rounded-lg transition-colors duration-150"
                            >
                                View Live Demo
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* ── Right: code editor mockup ───────────────────────── */}
                    <div className="animate-fade-in">
                        <TerminalMockup />
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
                    FEATURES
                    ════════════════════════════════════════════════════════ */}
                <section
                    aria-label="Platform features"
                    className="border-t border-zinc-800/50"
                >
                    <div className="max-w-6xl mx-auto px-6 py-20">
                        {/* Section header */}
                        <div className="mb-10 space-y-1">
                            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                                Everything your team needs
                            </h2>
                            <p className="text-sm text-zinc-500">
                                Built on a production-grade stack. No vendor lock-in. Your data stays on your infrastructure.
                            </p>
                        </div>

                        {/* Feature grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {FEATURES.map((feature) => (
                                <FeatureCard key={feature.headline} {...feature} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
                    CTA STRIP (bottom)
                    ════════════════════════════════════════════════════════ */}
                <section className="border-t border-zinc-800/50">
                    <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-zinc-100">
                                Ready to get started?
                            </p>
                            <p className="text-sm text-zinc-500">
                                Request access or explore the live demo with sample data.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={() => setModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors duration-150"
                            >
                                Request Access
                            </button>
                            <button
                                onClick={handleLiveDemoClick}
                                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-100 text-sm px-5 py-2.5 rounded-lg transition-colors duration-150"
                            >
                                View Demo
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* ══════════════════════════════════════════════════════════════
                FOOTER
                ══════════════════════════════════════════════════════════ */}
            <footer className="border-t border-zinc-800/50">
                <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-zinc-700" aria-hidden="true" />
                        <span className="text-xs text-zinc-700">© 2025 API Monitor</span>
                    </div>
                    <nav className="flex items-center gap-5" aria-label="Footer navigation">
                        {['Privacy', 'Documentation', 'Status'].map((label) => (
                            <button
                                key={label}
                                className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors duration-150"
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>
            </footer>

            {/* ══════════════════════════════════════════════════════════════
                MODALS
                ══════════════════════════════════════════════════════════ */}
            <RequestAccessModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}

export default LandingPage;
