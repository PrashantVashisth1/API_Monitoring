/**
 * LandingPage.jsx — Pulse API Public Homepage
 * Route: / (always public, no auth required)
 *
 * Premium redesign with animated hero, live metrics ticker, features, and CTA.
 * If already authenticated, redirects to /dashboard (handled by InitializationGate).
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap, ArrowRight, Key, Building2, BarChart2,
    CheckCircle2, Loader2, Shield, Clock, Activity,
    ChevronRight, Globe,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { leadsApi } from '../api/api';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 2000, enabled = true) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!enabled) return;
        const start = performance.now();
        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration, enabled]);
    return value;
}

// ─── Code block lines ────────────────────────────────────────────────────────
const CODE_LINES = [
    { n: '01', tokens: [{ t: 'const', c: '#569cd6' }, { t: ' monitorMiddleware', c: '#9cdcfe' }, { t: ' = require(', c: '#d4d4d4' }, { t: "'./middleware/apim'", c: '#ce9178' }, { t: ');', c: '#d4d4d4' }] },
    { n: '02', tokens: [] },
    { n: '03', tokens: [{ t: '// One middleware. Complete visibility.', c: '#6a9955' }] },
    { n: '04', tokens: [{ t: 'app', c: '#9cdcfe' }, { t: '.use(monitorMiddleware({', c: '#d4d4d4' }] },
    { n: '05', tokens: [{ t: '  apiKey', c: '#9cdcfe' }, { t: ': ', c: '#d4d4d4' }, { t: 'process.env.MONITORING_API_KEY', c: '#dcdcaa' }, { t: ',', c: '#d4d4d4' }] },
    { n: '06', tokens: [{ t: '  serviceName', c: '#9cdcfe' }, { t: ': ', c: '#d4d4d4' }, { t: "'payments-api'", c: '#ce9178' }, { t: ',', c: '#d4d4d4' }] },
    { n: '07', tokens: [{ t: '  environment', c: '#9cdcfe' }, { t: ': ', c: '#d4d4d4' }, { t: "'production'", c: '#ce9178' }, { t: ',', c: '#d4d4d4' }] },
    { n: '08', tokens: [{ t: '}));', c: '#d4d4d4' }] },
    { n: '09', tokens: [] },
    { n: '10', tokens: [{ t: '// ✓ Latency tracked', c: '#6a9955' }] },
    { n: '11', tokens: [{ t: '// ✓ Error rates monitored', c: '#6a9955' }] },
    { n: '12', tokens: [{ t: '// ✓ Dashboard live in seconds', c: '#6a9955' }] },
];

// ─── How it works steps ──────────────────────────────────────────────────────
const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Get Your API Key',
        desc: 'Request access, get onboarded, and generate an API key from your Pulse API dashboard in seconds.',
        code: 'Dashboard → API Keys → Generate',
    },
    {
        step: '02',
        title: 'Add the Middleware',
        desc: 'Drop a single self-contained middleware file into your Express app. No npm package, no agents, no YAML.',
        code: 'app.use(monitorMiddleware({ apiKey }));',
    },
    {
        step: '03',
        title: 'Analyse & Act',
        desc: 'See latency trends, error rates, top endpoints, and multi-service health — all in one unified dashboard.',
        code: '→ Dashboard → Live Traffic → Archive',
    },
];

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
    {
        icon: Zap,
        gradient: 'from-amber-500/20 to-orange-500/5',
        border: 'border-amber-500/20',
        iconColor: 'text-amber-400',
        headline: 'Zero-Config Integration',
        body: 'One middleware, complete request coverage. Latency, status codes, and service names captured automatically — no code changes needed on individual routes.',
        tags: ['Express', 'Fastify', 'Koa'],
    },
    {
        icon: BarChart2,
        gradient: 'from-sky-500/20 to-blue-500/5',
        border: 'border-sky-500/20',
        iconColor: 'text-sky-400',
        headline: 'Real-Time Telemetry',
        body: 'Live traffic explorer refreshes every 10 seconds. Latency trend charts, error rate breakdown, and per-endpoint analytics updated continuously.',
        tags: ['Live Traffic', 'Latency Trends', 'Error Rates'],
    },
    {
        icon: Key,
        gradient: 'from-violet-500/20 to-purple-500/5',
        border: 'border-violet-500/20',
        iconColor: 'text-violet-400',
        headline: 'Per-Environment Keys',
        body: 'Generate isolated API keys for production, staging, development, and testing. Revoke compromised keys instantly from the dashboard.',
        tags: ['Production', 'Staging', 'Testing'],
    },
    {
        icon: Building2,
        gradient: 'from-emerald-500/20 to-green-500/5',
        border: 'border-emerald-500/20',
        iconColor: 'text-emerald-400',
        headline: 'Multi-Tenant by Design',
        body: 'Onboard multiple organisations under one deployment. Complete data isolation per client, role-based access, and dedicated dashboards for every team.',
        tags: ['Super Admin', 'Client Admin', 'Viewer'],
    },
    {
        icon: Clock,
        gradient: 'from-rose-500/20 to-red-500/5',
        border: 'border-rose-500/20',
        iconColor: 'text-rose-400',
        headline: 'Historical Archive',
        body: 'Query up to 30 days of API metrics. Filter by service, endpoint, time range. Identify patterns, spot regressions, and debug production incidents.',
        tags: ['Date Range', 'Filters', '30-Day History'],
    },
    {
        icon: Shield,
        gradient: 'from-zinc-500/20 to-zinc-700/5',
        border: 'border-zinc-600/20',
        iconColor: 'text-zinc-400',
        headline: 'Your Infrastructure',
        body: 'Self-hosted with PostgreSQL + MongoDB. No vendor lock-in, no data leaving your servers. Full control over retention and access.',
        tags: ['PostgreSQL', 'MongoDB', 'Self-Hosted'],
    },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, gradient, border, iconColor, headline, body, tags }) {
    return (
        <div className={`relative bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group overflow-hidden`}>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/[0.02] to-transparent" />

            <div className={`w-9 h-9 rounded-xl bg-zinc-900/80 border ${border} flex items-center justify-center mb-4`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>

            <h3 className="text-[15px] font-bold text-zinc-100 mb-2 tracking-tight">{headline}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">{body}</p>

            <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                    <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${border} ${iconColor} bg-zinc-950/60 uppercase tracking-wider`}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

function TerminalMockup() {
    return (
        <div className="w-full rounded-2xl overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black/80">
            {/* Window chrome */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#161616] border-b border-zinc-800">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900/60 border border-zinc-700/40">
                        <span className="text-[11px] text-zinc-500 font-mono">pulse-middleware.js</span>
                    </div>
                </div>
                <span className="text-[9px] font-bold text-orange-400 font-mono px-1.5 py-0.5 border border-orange-500/30 rounded bg-orange-500/10 uppercase tracking-widest">
                    JS
                </span>
            </div>

            {/* Code body */}
            <div className="bg-[#1a1a1a] px-5 py-5 font-mono text-[12.5px] leading-[1.75]">
                {CODE_LINES.map(({ n, tokens }) => (
                    <div key={n} className="flex gap-5 group hover:bg-white/[0.02] -mx-5 px-5 rounded">
                        <span className="select-none text-zinc-700 w-4 text-right flex-shrink-0 tabular-nums group-hover:text-zinc-600">
                            {n}
                        </span>
                        <span>
                            {tokens.map(({ t, c }, i) => (
                                <span key={i} style={{ color: c }}>{t}</span>
                            ))}
                        </span>
                    </div>
                ))}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 py-2 bg-[#0e4429] border-t border-emerald-900/50">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-400 font-mono">Pulse connected • 0ms overhead</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-mono">v1.0.0</span>
            </div>
        </div>
    );
}

// ─── Request Access Modal ─────────────────────────────────────────────────────
function RequestAccessModal({ isOpen, onClose }) {
    const addToast = useToast();
    const [form, setForm] = useState({ name: '', email: '', company: '', useCase: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setForm({ name: '', email: '', company: '', useCase: '' });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await leadsApi.submitLead(form);
            addToast("Success! Our team will review your request and contact you within 24 hours.", 'success');
            onClose();
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Something went wrong. Please try again.';
            addToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const field = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request Access">
            <form onSubmit={handleSubmit} className="space-y-4">
                {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your Name' },
                    { label: 'Work Email', key: 'email', type: 'email', placeholder: 'you@company.com' },
                    { label: 'Company', key: 'company', type: 'text', placeholder: 'Acme Corp' },
                ].map(({ label, key, type, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-400">{label}</label>
                        <input
                            type={type}
                            value={form[key]}
                            onChange={field(key)}
                            placeholder={placeholder}
                            required
                            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                        />
                    </div>
                ))}
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">Use Case</label>
                    <textarea
                        value={form.useCase}
                        onChange={field('useCase')}
                        placeholder="Briefly describe your use case..."
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors resize-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Submitting…' : 'Request Access'}
                </button>
            </form>
        </Modal>
    );
}

// ─── Live Metrics Ticker ──────────────────────────────────────────────────────
function MetricsTicker({ visible }) {
    const requests = useCounter(124853, 2200, visible);
    const services = useCounter(4, 1000, visible);
    const latency = useCounter(54, 1500, visible);
    const uptime = useCounter(999, 1800, visible);

    const metrics = [
        { label: 'API Requests Tracked', value: requests.toLocaleString(), suffix: '' },
        { label: 'Active Services', value: services, suffix: '' },
        { label: 'Avg Latency', value: latency, suffix: 'ms' },
        { label: 'Uptime', value: `${(uptime / 10).toFixed(1)}`, suffix: '%' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800/40 rounded-2xl overflow-hidden border border-zinc-800/60">
            {metrics.map(({ label, value, suffix }) => (
                <div key={label} className="bg-[#0d0d0d] px-6 py-5 text-center">
                    <p className="text-2xl sm:text-3xl font-black text-zinc-100 tabular-nums tracking-tight">
                        {value}<span className="text-orange-500">{suffix}</span>
                    </p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1 font-medium">{label}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loginAsGuest } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);
    const heroRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => setHeroVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleLoginClick = () => {
        navigate(isAuthenticated ? '/dashboard' : '/login');
    };

    const handleLiveDemoClick = () => {
        if (!isAuthenticated) loginAsGuest();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#080808] text-zinc-100 antialiased">

            {/* ── Navbar ──────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 border-b border-zinc-800/40 bg-[#080808]/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <span className="text-sm font-bold text-zinc-100 tracking-tight">Pulse API</span>
                    </div>

                    {/* Nav actions */}
                    <nav className="flex items-center gap-3">
                        <button
                            onClick={handleLoginClick}
                            className="text-sm font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                            {isAuthenticated ? 'Go to Dashboard →' : 'Sign In'}
                        </button>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-lg transition-colors"
                        >
                            Request Access
                        </button>
                    </nav>
                </div>
            </header>

            <main>
                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative overflow-hidden">
                    {/* Background gradient orbs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]" />
                        <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px]" />
                        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                            {/* Left: copy */}
                            <div className={`transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 mb-6">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
                                    </span>
                                    <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">
                                        Now in production
                                    </span>
                                </div>

                                {/* Headline */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                                    <span className="text-zinc-100">Real-time</span>
                                    <br />
                                    <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                                        API Intelligence
                                    </span>
                                    <br />
                                    <span className="text-zinc-500">for your stack.</span>
                                </h1>

                                <p className="text-base text-zinc-500 leading-relaxed mb-8 max-w-lg">
                                    Pulse API captures every request your services handle — latency, errors, throughput — and delivers a live dashboard in seconds. One middleware. Complete visibility.
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-6 mb-8">
                                    {[
                                        { icon: CheckCircle2, text: 'Zero config required', color: 'text-emerald-400' },
                                        { icon: Shield, text: 'Self-hosted & private', color: 'text-sky-400' },
                                    ].map(({ icon: Icon, text, color }) => (
                                        <div key={text} className="flex items-center gap-1.5">
                                            <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                                            <span className="text-xs text-zinc-500">{text}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTAs */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        id="cta-request-access"
                                        onClick={() => setModalOpen(true)}
                                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                                    >
                                        Request Access
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        id="cta-live-demo"
                                        onClick={handleLiveDemoClick}
                                        className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-300 hover:text-zinc-100 text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-150"
                                    >
                                        <Activity className="w-4 h-4" />
                                        View Live Demo
                                    </button>
                                </div>
                            </div>

                            {/* Right: terminal */}
                            <div className={`transition-all duration-700 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <TerminalMockup />
                            </div>
                        </div>

                        {/* Metrics ticker */}
                        <div className={`mt-14 transition-all duration-700 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <MetricsTicker visible={heroVisible} />
                        </div>
                    </div>
                </section>

                {/* ── How it works ──────────────────────────────────────── */}
                <section className="border-t border-zinc-800/40">
                    <div className="max-w-7xl mx-auto px-6 py-20">
                        <div className="mb-12 text-center">
                            <p className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest mb-3">
                                Getting Started
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                                Up and running in 3 steps
                            </h2>
                            <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto">
                                From zero to a live dashboard. No YAML, no agents, no nonsense.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {HOW_IT_WORKS.map((step, i) => (
                                <div key={step.step} className="relative group">
                                    {/* Connector line */}
                                    {i < HOW_IT_WORKS.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-full w-6 h-px bg-zinc-800 z-10" />
                                    )}

                                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 hover:border-zinc-700/60 transition-colors h-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[11px] font-black text-orange-500">
                                                {step.step}
                                            </span>
                                            <h3 className="text-sm font-bold text-zinc-100">{step.title}</h3>
                                        </div>
                                        <p className="text-sm text-zinc-500 leading-relaxed mb-4">{step.desc}</p>
                                        <div className="bg-[#111] border border-zinc-800/60 rounded-lg px-3 py-2 font-mono text-[11px] text-zinc-400">
                                            {step.code}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features ──────────────────────────────────────────── */}
                <section className="border-t border-zinc-800/40">
                    <div className="max-w-7xl mx-auto px-6 py-20">
                        <div className="mb-12">
                            <p className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest mb-3">
                                Platform Features
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight max-w-sm">
                                    Everything you need to monitor APIs at scale
                                </h2>
                                <p className="text-sm text-zinc-600 max-w-xs">
                                    Production-grade stack. No vendor lock-in. Your data stays on your infrastructure.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {FEATURES.map((feature) => (
                                <FeatureCard key={feature.headline} {...feature} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA section ──────────────────────────────────────── */}
                <section className="border-t border-zinc-800/40">
                    <div className="max-w-7xl mx-auto px-6 py-20">
                        <div className="relative rounded-3xl overflow-hidden border border-zinc-800/60 bg-gradient-to-br from-zinc-900 to-[#080808] p-12 text-center">
                            {/* Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-orange-500/10 blur-[60px] pointer-events-none" />

                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Zap className="w-6 h-6 text-orange-400" />
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight mb-4">
                                    Ready to add <span className="text-orange-400">pulse</span> to your APIs?
                                </h2>
                                <p className="text-zinc-500 text-base max-w-md mx-auto mb-8">
                                    Request access or explore the live demo with sample data. Setup takes under 5 minutes.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <button
                                        onClick={() => setModalOpen(true)}
                                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                                    >
                                        Request Access
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleLiveDemoClick}
                                        className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 text-sm font-semibold px-7 py-3.5 rounded-xl transition-all"
                                    >
                                        <Activity className="w-4 h-4" />
                                        Live Demo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer className="border-t border-zinc-800/40">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                            <Zap className="w-2.5 h-2.5 text-orange-400" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-600">Pulse API</span>
                        <span className="text-xs text-zinc-800">© 2025</span>
                    </div>
                    <nav className="flex items-center gap-5">
                        {['Documentation', 'Status', 'Privacy'].map((label) => (
                            <button
                                key={label}
                                className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors"
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>
            </footer>

            <RequestAccessModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}

export default LandingPage;
