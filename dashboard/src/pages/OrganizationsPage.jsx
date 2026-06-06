/**
 * OrganizationsPage.jsx
 *
 * Super Admin only — manage client onboarding via the lead pipeline.
 *
 * Tabs:
 *   Pending Requests  — list of pending leads with Review action
 *   Active Clients    — placeholder (real data in a future phase)
 *
 * Flows:
 *   Review → Approve & Onboard → One-Time Credentials Panel
 *   Review → Reject → Confirmation with optional note
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Building2, Clock, CheckCircle2, XCircle, RefreshCw,
    User, Copy, Check, AlertTriangle, Eye, ChevronRight,
    Globe, Mail, Calendar, Loader2, ShieldCheck, Lock,
} from 'lucide-react';
import { leadsApi } from '../api/api';
import { Modal } from '../components/ui/Modal';

// ─── Utility: format date ─────────────────────────────────────────────────────
const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        pending:  { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  label: 'Pending' },
        approved: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Approved' },
        rejected: { cls: 'bg-red-500/10 text-red-400 border-red-500/20',        label: 'Rejected' },
    };
    const { cls, label } = map[status] ?? { cls: 'bg-zinc-800 text-zinc-400', label: status };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cls}`}>
            {label}
        </span>
    );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ value, label = 'Copy' }) {
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 transition-all duration-150"
        >
            {copied
                ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
                : <><Copy className="w-3 h-3" /> {label}</>
            }
        </button>
    );
}

// ─── One-Time Credentials Panel ───────────────────────────────────────────────
// Rendered inside the modal after a successful approval.
function CredentialsPanel({ credentials, onDone }) {
    const { client, username, tempPassword } = credentials;

    return (
        <div className="space-y-5">
            {/* Warning banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/25 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-300">One-time display — copy now</p>
                    <p className="text-xs text-amber-500/80 mt-0.5 leading-relaxed">
                        The temporary password is shown <strong>only once</strong> and is not stored in plaintext.
                        Copy and securely share these credentials with the client admin.
                    </p>
                </div>
            </div>

            {/* Client created */}
            <div className="p-4 bg-emerald-500/6 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                        Client Onboarded Successfully
                    </p>
                </div>
                <p className="text-base font-bold text-zinc-100">{client?.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{client?.email}</p>
            </div>

            {/* Credentials */}
            <div className="space-y-3">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                    Client Admin Credentials
                </p>

                {/* Username row */}
                <div className="flex items-center justify-between p-3.5 bg-[#0d0d0d] border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Username</p>
                            <p className="text-sm font-mono font-semibold text-zinc-100">{username}</p>
                        </div>
                    </div>
                    <CopyButton value={username} label="Copy" />
                </div>

                {/* Password row — visually prominent */}
                <div className="flex items-center justify-between p-3.5 bg-[#0d0d0d] border border-orange-500/30 rounded-xl ring-1 ring-orange-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Temp Password</p>
                            <p className="text-sm font-mono font-semibold text-orange-300 tracking-wider">
                                {tempPassword}
                            </p>
                        </div>
                    </div>
                    <CopyButton value={tempPassword} label="Copy" />
                </div>
            </div>

            <button
                onClick={onDone}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 transition-all duration-150"
            >
                I've saved the credentials — Close
            </button>
        </div>
    );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ lead, onClose, onApproved, onRejected }) {
    const [tab, setTab] = useState('approve'); // 'approve' | 'reject'
    const [username, setUsername]     = useState('');
    const [note, setNote]             = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]           = useState('');
    const [credentials, setCredentials] = useState(null); // set after approval

    const handleApprove = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            const res = await leadsApi.approveLead(lead._id, {
                username: username.trim() || undefined,
            });
            setCredentials(res.data);
            onApproved(lead._id);
        } catch (err) {
            setError(err?.response?.data?.message || 'Approval failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            await leadsApi.rejectLead(lead._id, note.trim());
            onRejected(lead._id);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Rejection failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={credentials ? undefined : onClose} maxWidth="max-w-lg">
            {credentials ? (
                /* ── Credentials panel (post-approval) ── */
                <div className="pt-2">
                    <h2 className="text-base font-black text-zinc-100 mb-5">
                        🎉 Client Onboarded
                    </h2>
                    <CredentialsPanel credentials={credentials} onDone={onClose} />
                </div>
            ) : (
                /* ── Review panel ── */
                <div className="space-y-5">
                    <div>
                        <p className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest mb-1">Review Request</p>
                        <h2 className="text-base font-black text-zinc-100">{lead.company}</h2>
                    </div>

                    {/* Lead details */}
                    <div className="space-y-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                        {[
                            { icon: User,     label: 'Contact',    value: lead.name },
                            { icon: Mail,     label: 'Email',      value: lead.email },
                            { icon: Globe,    label: 'Website',    value: lead.website || '—' },
                            { icon: Calendar, label: 'Submitted',  value: fmtDate(lead.createdAt) },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <Icon className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                                <span className="text-[11px] text-zinc-600 w-16 flex-shrink-0">{label}</span>
                                <span className="text-[12px] text-zinc-300 font-medium truncate">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action tabs */}
                    <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                        {[
                            { id: 'approve', label: 'Approve & Onboard', cls: 'text-emerald-400' },
                            { id: 'reject',  label: 'Reject',            cls: 'text-red-400' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => { setTab(t.id); setError(''); }}
                                className={[
                                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                                    tab === t.id
                                        ? `bg-zinc-800 ${t.cls}`
                                        : 'text-zinc-600 hover:text-zinc-400',
                                ].join(' ')}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {tab === 'approve' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                                    Admin Username
                                    <span className="font-normal text-zinc-600 ml-1">(optional — auto-generated if blank)</span>
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={`${lead.company.toLowerCase().replace(/\s+/g,'_')}_admin`}
                                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm font-mono text-zinc-200 placeholder:text-zinc-700 transition-colors"
                                />
                            </div>
                            <div className="p-3 bg-sky-500/5 border border-sky-500/15 rounded-lg">
                                <p className="text-[11px] text-sky-400/80 leading-relaxed">
                                    A strong temporary password will be auto-generated. You will see it once after approval.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                                Reason <span className="font-normal text-zinc-600">(optional note for records)</span>
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                placeholder="e.g. Unable to verify company details, duplicate request..."
                                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-red-500/60 focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-700 resize-none transition-colors"
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        {tab === 'approve' ? (
                            <button
                                onClick={handleApprove}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Onboarding…</>
                                    : <><ShieldCheck className="w-4 h-4" /> Approve & Onboard</>
                                }
                            </button>
                        ) : (
                            <button
                                onClick={handleReject}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting…</>
                                    : <><XCircle className="w-4 h-4" /> Reject Request</>
                                }
                            </button>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ─── Pending Leads Table ──────────────────────────────────────────────────────
function PendingTable({ leads, onReview }) {
    if (leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-zinc-700" />
                </div>
                <p className="text-sm font-semibold text-zinc-500">No pending requests</p>
                <p className="text-xs text-zinc-700 mt-1">New access requests will appear here</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-zinc-800/60">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5">
                {['Company / Contact', 'Submitted', 'Status', 'Action'].map((h) => (
                    <p key={h} className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                        {h}
                    </p>
                ))}
            </div>

            {leads.map((lead) => (
                <div
                    key={lead._id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-zinc-800/20 transition-colors"
                >
                    {/* Company */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-100 truncate">{lead.company}</p>
                                <p className="text-[11px] text-zinc-500 truncate">{lead.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-zinc-500 whitespace-nowrap">{fmtDate(lead.createdAt)}</p>

                    {/* Status */}
                    <StatusBadge status={lead.status} />

                    {/* Action */}
                    <button
                        onClick={() => onReview(lead)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-150"
                    >
                        <Eye className="w-3 h-3" /> Review
                    </button>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function OrganizationsPage() {
    const [activeTab,    setActiveTab]    = useState('pending');
    const [leads,        setLeads]        = useState([]);
    const [isLoading,    setIsLoading]    = useState(true);
    const [error,        setError]        = useState('');
    const [reviewLead,   setReviewLead]   = useState(null); // lead being reviewed

    const fetchLeads = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await leadsApi.getLeads({ status: activeTab === 'pending' ? 'pending' : undefined });
            setLeads(res.data?.leads ?? []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load requests.');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const handleApproved = (leadId) => {
        // Remove from list immediately (optimistic)
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
    };

    const handleRejected = (leadId) => {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
        setReviewLead(null);
    };

    const pendingCount = leads.filter((l) => l.status === 'pending').length;

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                                ■ Super Admin
                            </span>
                        </div>
                        <h1 className="text-xl font-black text-zinc-100 tracking-tight">Organizations</h1>
                        <p className="text-sm text-zinc-600 mt-0.5">
                            Review access requests and manage onboarded clients
                        </p>
                    </div>
                    <button
                        onClick={fetchLeads}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* ── Tabs ─────────────────────────────────────────────────── */}
                <div className="flex gap-1 p-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl w-fit">
                    {[
                        { id: 'pending', label: 'Pending Requests', icon: Clock, count: pendingCount },
                        { id: 'clients', label: 'Active Clients',   icon: Building2 },
                    ].map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={[
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                                    activeTab === t.id
                                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300',
                                ].join(' ')}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {t.label}
                                {t.count > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-500 text-white leading-none">
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Content card ─────────────────────────────────────────── */}
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden min-h-[300px]">
                    {activeTab === 'pending' ? (
                        isLoading ? (
                            <div className="flex items-center justify-center py-16 gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                                <span className="text-sm text-zinc-600">Loading requests…</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <XCircle className="w-6 h-6 text-red-500" />
                                <p className="text-sm text-red-400">{error}</p>
                                <button onClick={fetchLeads} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <PendingTable leads={leads} onReview={setReviewLead} />
                        )
                    ) : (
                        /* Active Clients — placeholder for Phase 7 */
                        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                                <Building2 className="w-6 h-6 text-zinc-700" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-500">Active Clients</p>
                            <p className="text-xs text-zinc-700 mt-1 max-w-xs">
                                A full client management panel — view telemetry, manage users,
                                and revoke access — is coming in Phase 7.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Review Modal (portal) ─────────────────────────────────── */}
            {reviewLead && (
                <ReviewModal
                    lead={reviewLead}
                    onClose={() => setReviewLead(null)}
                    onApproved={handleApproved}
                    onRejected={handleRejected}
                />
            )}
        </>
    );
}
