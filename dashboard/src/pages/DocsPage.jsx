/**
 * DocsPage.jsx — SDK Integration Documentation
 *
 * A beautiful, developer-focused integration guide for client_admin users.
 * Shows exactly how to plug the monitoring-sdk middleware into their Express app.
 *
 * Sections:
 *  1. Quick Start (3-step flow)
 *  2. Installation
 *  3. Environment Configuration
 *  4. Middleware Integration code
 *  5. Verification
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Copy, Check, Terminal, Key, Zap,
    CheckCircle2, Code2, Package, Settings2, PlayCircle,
    ChevronRight, Activity, Lock, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ value }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(value).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 border border-zinc-700/60 transition-all duration-150 flex-shrink-0"
        >
            {copied
                ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                : <><Copy className="w-3 h-3" /> Copy</>
            }
        </button>
    );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'js', title }) {
    return (
        <div className="rounded-xl overflow-hidden border border-zinc-800/80">
            {title && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">{title}</span>
                    </div>
                    <CopyButton value={code} />
                </div>
            )}
            <pre className="p-4 bg-[#0d0d0d] overflow-x-auto">
                <code className="text-[12px] font-mono leading-relaxed text-zinc-300">
                    {code}
                </code>
            </pre>
        </div>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, step, children }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {step && (
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black text-white">{step}</span>
                    </div>
                )}
                {Icon && !step && (
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                )}
                <h2 className="text-sm font-bold text-zinc-100">{title}</h2>
            </div>
            <div className="ml-9">
                {children}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DocsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isGuest  = user?.isGuest === true;
    const apiKeyHint = 'apim_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    // Code snippets
    const installCode = `npm install axios dotenv`;

    const envCode = `# .env — Add these to your existing environment file

# Your API key from the OwlPi dashboard (API Keys section)
MONITORING_API_KEY=apim_your_key_here

# OwlPi ingest endpoint (use your deployed URL in production)
MONITORING_ENDPOINT=http://localhost:5000/api/hit

# Service identifier — appears in your dashboard charts
SERVICE_NAME=my-express-api

# Set to false to disable monitoring in local dev
MONITORING_ENABLED=true`;

    const middlewareCode = `// middleware/apim.js — Drop this file into your project
const axios = require('axios');

const monitoringMiddleware = (options = {}) => {
    const {
        apiKey      = process.env.MONITORING_API_KEY,
        endpoint    = process.env.MONITORING_ENDPOINT,
        serviceName = process.env.SERVICE_NAME || 'my-service',
        enabled     = process.env.MONITORING_ENABLED !== 'false',
        timeout     = 3000,
    } = options;

    // Graceful no-op if not configured
    if (!enabled || !apiKey) return (req, res, next) => next();

    return (req, res, next) => {
        const startTime   = Date.now();
        const originalEnd = res.end;

        res.end = function (...args) {
            const latencyMs = Date.now() - startTime;

            // Fire-and-forget — zero impact on your response time
            setImmediate(() => {
                axios.post(endpoint, {
                    serviceName,
                    endpoint:   req.originalUrl || req.url,
                    method:     req.method,
                    statusCode: res.statusCode,
                    latencyMs,
                    ip:         req.ip || 'unknown',
                    userAgent:  req.get('User-Agent') || 'unknown',
                }, {
                    headers: { 'x-api-key': apiKey },
                    timeout,
                }).catch(() => {}); // Fail silently
            });

            originalEnd.apply(res, args);
        };

        next();
    };
};

module.exports = monitoringMiddleware;`;

    const integrationCode = `// server.js — Your existing Express app
require('dotenv').config();
const express           = require('express');
const monitoringMiddleware = require('./middleware/apim');

const app = express();

app.use(express.json());

// ✅ Add this ONE line — before your routes
app.use(monitoringMiddleware());

// Your existing routes are unchanged
app.get('/api/products', (req, res) => { ... });
app.post('/api/orders',  (req, res) => { ... });

app.listen(3000);`;

    const verifyCode = `# Make a test request to your own API
curl http://localhost:3000/api/products

# You should see a log like:
# → Sending monitoring data: { endpoint: '/api/products', latencyMs: 23 }
# → Monitoring data sent successfully

# Then check your OwlPi dashboard — the hit appears within seconds.`;

    return (
        <div className="flex flex-col gap-8 max-w-3xl">
            {/* ── Guest banner ────────────────────────────────────────────── */}
            {isGuest && (
                <div className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                    <Lock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-orange-300 mb-0.5">Sign in to copy the integration code</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            You can read the guide below, but code snippets are blurred for guest sessions.
                            Sign in to reveal your personalised integration steps.
                        </p>
                    </div>
                    <button
                        onClick={() => { localStorage.removeItem('apim:guest'); navigate('/login', { replace: true }); }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                    >
                        Sign In <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                        ■ Integration Guide
                    </span>
                </div>
                <h1 className="text-xl font-black text-zinc-100 tracking-tight">Documentation</h1>
                <p className="text-sm text-zinc-600 mt-0.5">
                    Add API monitoring to your Express.js app in under 5 minutes
                </p>
            </div>

            {/* ── Quick overview strip ─────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: Key,         label: 'Generate API Key',  sub: 'From the API Keys page'     },
                    { icon: Code2,       label: 'Add middleware',    sub: '3 lines of code'             },
                    { icon: Activity,    label: 'See live traffic',  sub: 'Dashboard updates instantly' },
                ].map(({ icon: Icon, label, sub }, i) => (
                    <div key={i} className="p-4 bg-[#111111] border border-zinc-800/60 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
                            <Icon className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-orange-500">{i + 1}.</span>
                            <p className="text-xs font-semibold text-zinc-200">{label}</p>
                        </div>
                        <p className="text-[11px] text-zinc-600">{sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Prerequisite: API Key ─────────────────────────────────────── */}
            <div className="p-4 bg-sky-500/5 border border-sky-500/15 rounded-xl flex items-start gap-3">
                <Key className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-semibold text-sky-300 mb-0.5">Prerequisite: API Key</p>
                    <p className="text-[11px] text-sky-400/70 leading-relaxed">
                        Before integrating, generate an API key from the{' '}
                        <strong className="text-sky-300">API Keys</strong> page in the sidebar.
                        You'll need the key value (shown once after generation) to complete setup.
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800/60" />

            {/* ── Steps (blurred for guests) ────────────────────────────────────── */}
            <div className={`space-y-8 ${isGuest ? 'relative' : ''}`}>
                {isGuest && (
                    <div className="absolute inset-0 z-10 flex items-start justify-center pt-16 rounded-xl"
                         style={{ backdropFilter: 'blur(6px)', background: 'rgba(10,10,10,0.55)' }}>
                        <div className="flex flex-col items-center gap-4 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-zinc-500" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-300">Sign in to view the complete integration guide</p>
                            <button
                                onClick={() => { localStorage.removeItem('apim:guest'); navigate('/login', { replace: true }); }}
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                            >
                                Sign In <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

            {/* ── Step 1 ─────────────────────────────────────────────────────── */}
            <Section step="1" title="Install dependencies">
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    The SDK uses <code className="text-zinc-400 bg-zinc-900 px-1 rounded">axios</code> for
                    HTTP calls and <code className="text-zinc-400 bg-zinc-900 px-1 rounded">dotenv</code> for
                    environment configuration. If your project already has them, skip this step.
                </p>
                <CodeBlock code={installCode} title="terminal" />
            </Section>

            {/* ── Step 2 ─────────────────────────────────────────────────────── */}
            <Section step="2" title="Configure environment variables">
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    Add these variables to your project's <code className="text-zinc-400 bg-zinc-900 px-1 rounded">.env</code> file.
                    The <code className="text-zinc-400 bg-zinc-900 px-1 rounded">SERVICE_NAME</code> is
                    what appears as the label in your dashboard charts — use something descriptive.
                </p>
                <CodeBlock code={envCode} title=".env" />
                <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                    <p className="text-[11px] text-amber-400/80 leading-relaxed">
                        <strong>Never commit your API key to git.</strong> Add <code className="bg-zinc-900 px-1 rounded">.env</code> to
                        your <code className="bg-zinc-900 px-1 rounded">.gitignore</code>.
                    </p>
                </div>
            </Section>

            {/* ── Step 3 ─────────────────────────────────────────────────────── */}
            <Section step="3" title="Copy the middleware file">
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    Create a new file <code className="text-zinc-400 bg-zinc-900 px-1 rounded">middleware/apim.js</code> in
                    your project and paste this code. No npm package needed — it's a single self-contained file.
                </p>
                <CodeBlock code={middlewareCode} title="middleware/apim.js" />
            </Section>

            {/* ── Step 4 ─────────────────────────────────────────────────────── */}
            <Section step="4" title="Register it in your Express app">
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    Import and register the middleware <strong className="text-zinc-400">before your route definitions</strong>.
                    That's it — no other changes needed. All existing routes are monitored automatically.
                </p>
                <CodeBlock code={integrationCode} title="server.js" />
            </Section>

            {/* ── Step 5 ─────────────────────────────────────────────────────── */}
            <Section step="5" title="Verify it's working">
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    Hit any endpoint on your server and watch the Dashboard update within seconds.
                </p>
                <CodeBlock code={verifyCode} title="terminal" />
                <div className="mt-3 p-3 bg-emerald-500/6 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                        Check your Dashboard → the hit count and latency graphs should update immediately.
                    </p>
                </div>
            </Section>

            </div>{/* end blur wrapper */}

            {/* ── How it works ─────────────────────────────────────────────── */}
            <div className="border-t border-zinc-800/60 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <h2 className="text-sm font-bold text-zinc-100">How it works</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        {
                            title: 'Zero latency overhead',
                            desc:  'Monitoring data is sent via setImmediate() — after your response is already delivered to the client. Your users never wait.',
                        },
                        {
                            title: 'Fail-safe by design',
                            desc:  'If the OwlPi server is unreachable, the error is swallowed silently. Your API keeps running normally.',
                        },
                        {
                            title: 'Environment-aware',
                            desc:  'Set MONITORING_ENABLED=false in development and the middleware becomes a no-op pass-through. No code changes needed.',
                        },
                        {
                            title: 'Multi-service support',
                            desc:  'Use a different SERVICE_NAME for each microservice. They appear as separate services in your dashboard charts.',
                        },
                    ].map(({ title, desc }) => (
                        <div key={title} className="flex items-start gap-3 p-4 bg-[#111111] border border-zinc-800/60 rounded-xl">
                            <ChevronRight className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-zinc-200 mb-0.5">{title}</p>
                                <p className="text-[11px] text-zinc-600 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Config reference ──────────────────────────────────────────── */}
            <div className="border-t border-zinc-800/60 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-sm font-bold text-zinc-100">Configuration Reference</h2>
                </div>
                <div className="overflow-hidden border border-zinc-800/60 rounded-xl">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-zinc-800/60">
                                <th className="text-left px-4 py-2.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">Variable</th>
                                <th className="text-left px-4 py-2.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">Required</th>
                                <th className="text-left px-4 py-2.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">Default</th>
                                <th className="text-left px-4 py-2.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                            {[
                                { key: 'MONITORING_API_KEY',   req: true,  def: '—',              desc: 'Your API key from the dashboard' },
                                { key: 'MONITORING_ENDPOINT',  req: true,  def: 'localhost:5000',  desc: 'OwlPi server ingest URL' },
                                { key: 'SERVICE_NAME',         req: false, def: 'my-service',      desc: 'Label shown in dashboard charts' },
                                { key: 'MONITORING_ENABLED',   req: false, def: 'true',            desc: 'Set to false to disable completely' },
                            ].map(({ key, req, def, desc }) => (
                                <tr key={key} className="hover:bg-zinc-900/40 transition-colors">
                                    <td className="px-4 py-3 font-mono text-orange-300">{key}</td>
                                    <td className="px-4 py-3">
                                        {req
                                            ? <span className="text-red-400 font-semibold">Yes</span>
                                            : <span className="text-zinc-600">No</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">{def}</td>
                                    <td className="px-4 py-3 text-zinc-500 text-[11px]">{desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DocsPage;
