/**
 * TeamPage.jsx — Team Management
 *
 * super_admin only page.
 * Two tabs:
 *   1. Platform Admins  — list of super_admins, add new super_admin
 *   2. Client Users     — pick a client org, add client_admin or client_viewer
 *
 * Backend APIs used:
 *   POST /api/auth/register              { username, email, password, role: 'super_admin' }
 *   GET  /api/admin/clients              → list all client orgs
 *   POST /api/admin/clients/:id/users    { username, email, password, role }
 */
import { useState, useId } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    Users, Plus, ShieldCheck, Building2, Loader2,
    Eye, EyeOff, AlertTriangle, CheckCircle2, ChevronDown,
    UserPlus, Lock,
} from 'lucide-react';
import { clientApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_META = {
    client_admin:  { label: 'Client Admin',  desc: 'Can generate API keys, manage users, view analytics', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    client_viewer: { label: 'Client Viewer', desc: 'Read-only access to analytics',                       cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    super_admin:   { label: 'Super Admin',   desc: 'Full platform access',                                cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
};

function RoleBadge({ role }) {
    const m = ROLE_META[role] ?? { label: role, cls: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${m.cls}`}>
            {m.label}
        </span>
    );
}

// ─── Password Field ───────────────────────────────────────────────────────────
function PasswordField({ id, value, onChange, disabled, error }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder="Min 6 characters"
                className={[
                    'w-full px-3 py-2.5 pr-9 rounded-lg bg-zinc-900 border text-sm text-zinc-200',
                    'placeholder:text-zinc-700 focus:outline-none transition-colors',
                    error
                        ? 'border-red-700/60 focus:border-red-600'
                        : 'border-zinc-700 focus:border-orange-500/60',
                    disabled ? 'opacity-40' : '',
                ].join(' ')}
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-zinc-400">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-[10px] text-zinc-700">{hint}</p>}
            {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
    );
}

// ─── Add Super Admin Modal ────────────────────────────────────────────────────
function AddSuperAdminModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const mutation = useMutation({
        mutationFn: (data) => clientApi.registerUser({ ...data, role: 'super_admin' }),
        onSuccess: (res) => {
            onSuccess(res?.data);
            onClose();
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || 'Failed to create admin. Try again.';
            const status = err?.response?.status;
            if (status === 409) setServerError('Username or email already exists.');
            else setServerError(msg);
        },
    });

    const validate = () => {
        const e = {};
        if (!form.username.trim())     e.username = 'Username is required';
        if (!form.email.trim())        e.email    = 'Email is required';
        if (form.password.length < 6)  e.password = 'Minimum 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;
        mutation.mutate({ username: form.username.trim(), email: form.email.trim(), password: form.password });
    };

    const f = (field) => (e) => {
        setForm(p => ({ ...p, [field]: e.target.value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
        if (serverError)   setServerError('');
    };

    return (
        <Modal isOpen onClose={onClose} title="Add Super Admin" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                {/* Info */}
                <div className="p-3 bg-violet-500/6 border border-violet-500/15 rounded-lg flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-violet-400/80 leading-relaxed">
                        Super Admins have full platform access — they can onboard clients,
                        manage all organizations, and access all analytics.
                    </p>
                </div>

                {serverError && (
                    <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                        <p className="text-xs text-red-400">{serverError}</p>
                    </div>
                )}

                <Field label="Username" required error={errors.username}>
                    <input
                        type="text"
                        value={form.username}
                        onChange={f('username')}
                        disabled={mutation.isPending}
                        placeholder="e.g. john_doe"
                        className={`w-full px-3 py-2.5 rounded-lg bg-zinc-900 border text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none transition-colors ${errors.username ? 'border-red-700/60' : 'border-zinc-700 focus:border-orange-500/60'}`}
                    />
                </Field>

                <Field label="Email Address" required error={errors.email}>
                    <input
                        type="email"
                        value={form.email}
                        onChange={f('email')}
                        disabled={mutation.isPending}
                        placeholder="john@company.com"
                        className={`w-full px-3 py-2.5 rounded-lg bg-zinc-900 border text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none transition-colors ${errors.email ? 'border-red-700/60' : 'border-zinc-700 focus:border-orange-500/60'}`}
                    />
                </Field>

                <Field label="Password" required error={errors.password} hint="Min 6 characters — share this securely with the new admin">
                    <PasswordField
                        value={form.password}
                        onChange={f('password')}
                        disabled={mutation.isPending}
                        error={errors.password}
                    />
                </Field>

                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} disabled={mutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40">
                        Cancel
                    </button>
                    <button type="submit" disabled={mutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-700 hover:bg-violet-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {mutation.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                            : <><UserPlus className="w-4 h-4" /> Create Admin</>
                        }
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Add Client User Modal ────────────────────────────────────────────────────
function AddClientUserModal({ clients, onClose, onSuccess }) {
    const [form, setForm] = useState({
        clientId:  clients[0]?._id ?? '',
        username:  '',
        email:     '',
        password:  '',
        role:      'client_viewer',
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const mutation = useMutation({
        mutationFn: ({ clientId, ...userData }) =>
            clientApi.createClientUser(clientId, userData),
        onSuccess: (res) => {
            onSuccess(res?.data);
            onClose();
        },
        onError: (err) => {
            const status = err?.response?.status;
            const msg    = err?.response?.data?.message || 'Failed to create user.';
            if (status === 409) setServerError('Username or email already exists in this organisation.');
            else setServerError(msg);
        },
    });

    const validate = () => {
        const e = {};
        if (!form.clientId)            e.clientId = 'Select an organisation';
        if (!form.username.trim())     e.username  = 'Username is required';
        if (!form.email.trim())        e.email     = 'Email is required';
        if (form.password.length < 6)  e.password  = 'Minimum 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;
        mutation.mutate({
            clientId:  form.clientId,
            username:  form.username.trim(),
            email:     form.email.trim(),
            password:  form.password,
            role:      form.role,
        });
    };

    const f = (field) => (e) => {
        setForm(p => ({ ...p, [field]: e.target.value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
        if (serverError)   setServerError('');
    };

    const selectedRole = ROLE_META[form.role];

    return (
        <Modal isOpen onClose={onClose} title="Add Client User" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                {serverError && (
                    <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg">
                        <p className="text-xs text-red-400">{serverError}</p>
                    </div>
                )}

                {/* Organisation selector */}
                <Field label="Organisation" required error={errors.clientId}>
                    <div className="relative">
                        <select
                            value={form.clientId}
                            onChange={f('clientId')}
                            disabled={mutation.isPending}
                            className="w-full px-3 py-2.5 pr-8 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-200 appearance-none transition-colors"
                        >
                            <option value="">Select an organisation…</option>
                            {clients.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                    </div>
                </Field>

                {/* Role selector */}
                <Field label="Role" required>
                    <div className="grid grid-cols-2 gap-2">
                        {(['client_admin', 'client_viewer']).map(role => {
                            const m = ROLE_META[role];
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, role }))}
                                    className={[
                                        'p-3 rounded-lg border text-left transition-all',
                                        form.role === role
                                            ? m.cls + ' ring-1 ring-current'
                                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
                                    ].join(' ')}
                                >
                                    <p className="text-xs font-semibold text-zinc-200 mb-0.5">{m.label}</p>
                                    <p className="text-[10px] text-zinc-600 leading-relaxed">{m.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                <Field label="Username" required error={errors.username}>
                    <input type="text" value={form.username} onChange={f('username')} disabled={mutation.isPending}
                        placeholder="e.g. alice_zomato"
                        className={`w-full px-3 py-2.5 rounded-lg bg-zinc-900 border text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none transition-colors ${errors.username ? 'border-red-700/60' : 'border-zinc-700 focus:border-orange-500/60'}`}
                    />
                </Field>

                <Field label="Email" required error={errors.email}>
                    <input type="email" value={form.email} onChange={f('email')} disabled={mutation.isPending}
                        placeholder="alice@company.com"
                        className={`w-full px-3 py-2.5 rounded-lg bg-zinc-900 border text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none transition-colors ${errors.email ? 'border-red-700/60' : 'border-zinc-700 focus:border-orange-500/60'}`}
                    />
                </Field>

                <Field label="Temporary Password" required error={errors.password} hint="Share this securely. The user should change it after first login.">
                    <PasswordField value={form.password} onChange={f('password')} disabled={mutation.isPending} error={errors.password} />
                </Field>

                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} disabled={mutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40">
                        Cancel
                    </button>
                    <button type="submit" disabled={mutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {mutation.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                            : <><UserPlus className="w-4 h-4" /> Add User</>
                        }
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Success Toast ─────────────────────────────────────────────────────────────
function SuccessBanner({ message, onDismiss }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/25 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 flex-1">{message}</p>
            <button onClick={onDismiss} className="text-zinc-600 hover:text-zinc-400 text-xs">Dismiss</button>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                active
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    : 'text-zinc-600 hover:text-zinc-400 border border-transparent',
            ].join(' ')}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TeamPage() {
    const { user }  = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const isClientAdmin = user?.role === 'client_admin';

    // client_admin only sees Client Users tab
    const [tab, setTab] = useState(isSuperAdmin ? 'admins' : 'client-users');
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [showAddUser,  setShowAddUser]  = useState(false);
    const [success, setSuccess] = useState('');

    // Fetch client list for the "Add Client User" form
    const { data: clientsRes, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients-list'],
        queryFn:  () => clientApi.getClients(),
        select:   (res) => res?.data ?? [],
        enabled:  tab === 'client-users',
    });
    const clients = clientsRes ?? [];

    const handleSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 5000);
    };

    return (
        <>
            <div className="flex flex-col gap-6 max-w-3xl">
                {/* ── Page header ─────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                            ■ Administration
                        </span>
                    </div>
                    <h1 className="text-xl font-black text-zinc-100 tracking-tight">Team Management</h1>
                    <p className="text-sm text-zinc-600 mt-0.5">
                        Add platform administrators and client users
                    </p>
                </div>

                {/* ── Success banner ───────────────────────────────────────── */}
                {success && <SuccessBanner message={success} onDismiss={() => setSuccess('')} />}

                {/* ── Tabs ──────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                        <Tab active={tab === 'admins'}       onClick={() => setTab('admins')}       icon={ShieldCheck} label="Platform Admins" />
                    )}
                    <Tab active={tab === 'client-users'} onClick={() => setTab('client-users')} icon={Building2}   label="Client Users"   />
                </div>

                {/* ── Platform Admins tab ──────────────────────────────────── */}
                {tab === 'admins' && (
                    <div className="space-y-4">
                        {/* Info card */}
                        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-100">Super Administrators</p>
                                        <p className="text-xs text-zinc-500 mt-0.5 max-w-sm leading-relaxed">
                                            Super Admins have full platform access — they can onboard new client
                                            organisations, manage all API keys, and access all analytics data.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddAdmin(true)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-700 hover:bg-violet-600 text-white transition-colors flex-shrink-0 shadow-lg shadow-violet-900/20"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Admin
                                </button>
                            </div>
                        </div>

                        {/* Current user card */}
                        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-800/60">
                                <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">Your Account</p>
                            </div>
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-black text-orange-400">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-100">{user?.username}</p>
                                    <p className="text-xs text-zinc-600">{user?.email}</p>
                                </div>
                                <RoleBadge role={user?.role} />
                            </div>
                        </div>

                        {/* How to tip */}
                        <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl flex items-start gap-3">
                            <Lock className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-zinc-600 leading-relaxed">
                                After creating a new Super Admin, share their credentials securely.
                                They can log in at <code className="text-zinc-500">/login</code> and
                                change their password via the Settings page.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Client Users tab ─────────────────────────────────────── */}
                {tab === 'client-users' && (
                    <div className="space-y-4">
                        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-100">Client Users</p>
                                        <p className="text-xs text-zinc-500 mt-0.5 max-w-sm leading-relaxed">
                                            Add users to specific client organisations. Client Admins can generate
                                            API keys; Viewers have read-only analytics access.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddUser(true)}
                                    disabled={clientsLoading || clients.length === 0}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex-shrink-0 disabled:opacity-40 shadow-lg shadow-orange-900/20"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add User
                                </button>
                            </div>
                        </div>

                        {/* Role reference */}
                        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-800/60">
                                <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">Role Reference</p>
                            </div>
                            <div className="divide-y divide-zinc-800/40">
                                {(['client_admin', 'client_viewer']).map(role => {
                                    const m = ROLE_META[role];
                                    return (
                                        <div key={role} className="flex items-center gap-4 px-5 py-3.5">
                                            <RoleBadge role={role} />
                                            <p className="text-xs text-zinc-500">{m.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {clients.length === 0 && !clientsLoading && (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <p className="text-xs text-amber-400/80">
                                    No client organisations found. Onboard a client first from the
                                    <strong className="text-amber-300"> Organizations</strong> page.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {showAddAdmin && (
                <AddSuperAdminModal
                    onClose={() => setShowAddAdmin(false)}
                    onSuccess={(u) => handleSuccess(`Super Admin "${u?.username}" created successfully. Share their credentials securely.`)}
                />
            )}

            {showAddUser && (
                <AddClientUserModal
                    clients={clients}
                    onClose={() => setShowAddUser(false)}
                    onSuccess={(u) => handleSuccess(`User "${u?.username}" (${ROLE_META[u?.role]?.label}) added successfully.`)}
                />
            )}
        </>
    );
}

export default TeamPage;
