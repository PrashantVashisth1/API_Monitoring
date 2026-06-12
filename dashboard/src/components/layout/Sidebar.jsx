/**
 * Sidebar.jsx
 *
 * Premium enterprise sidebar — Pulse API aesthetic.
 *
 * Structure:
 *   ├── Branding (logo + collapse toggle)
 *   ├── Primary Nav
 *   └── Bottom (User profile card + Terminate Session button)
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Archive, BookOpen,
    Building2, LogOut, ChevronRight, Key, Users,
    Zap, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Nav item definitions ────────────────────────────────────────────────────
const PRIMARY_NAV = [
    { id: 'dashboard', label: 'Dashboard',     href: '/dashboard',           icon: LayoutDashboard, live: false },
    { id: 'traffic',   label: 'Live Traffic',  href: '/dashboard/traffic',   icon: Activity,        live: true  },
    { id: 'api-keys',  label: 'API Keys',      href: '/dashboard/api-keys',  icon: Key,             live: false },
    { id: 'archive',   label: 'Archive',       href: '/dashboard/archive',   icon: Archive,         live: false },
    { id: 'docs',      label: 'Documentation', href: '/dashboard/docs',      icon: BookOpen,        live: false },
];

const SUPER_ADMIN_NAV = [
    { id: 'orgs', label: 'Organizations', href: '/dashboard/organizations', icon: Building2, live: false },
    { id: 'team', label: 'Team',          href: '/dashboard/team',          icon: Users,    live: false },
];

const ROLE_LABELS = {
    super_admin:   'Super Admin',
    client_admin:  'Client Admin',
    client_viewer: 'Viewer',
};

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ item, onClick, collapsed }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.href}
            end={item.href === '/dashboard'}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
                [
                    'group relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150',
                    collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                    isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent',
                ].join(' ')
            }
        >
            {({ isActive }) => (
                <>
                    {/* Active indicator bar */}
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-full" />
                    )}

                    <Icon
                        className={`w-[15px] h-[15px] flex-shrink-0 ${
                            isActive ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                    />

                    {!collapsed && (
                        <>
                            <span className="flex-1 truncate">{item.label}</span>

                            {/* Live traffic pulsing dot */}
                            {item.live && (
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            )}

                            {/* Arrow on hover for non-active */}
                            {!isActive && (
                                <ChevronRight className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </>
                    )}

                    {/* Live dot in collapsed mode */}
                    {collapsed && item.live && (
                        <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ isOpen, onClose, onLogout }) {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const roleLabel    = ROLE_LABELS[user?.role] ?? user?.role ?? 'Unknown';
    const username     = user?.username ?? 'Unknown';
    const initial      = username.charAt(0).toUpperCase();
    const isSuperAdmin = user?.role === 'super_admin';
    const isClientAdmin = user?.role === 'client_admin';

    const navItems = [
        ...PRIMARY_NAV,
        ...(isClientAdmin ? [{ id: 'team', label: 'Team', href: '/dashboard/team', icon: Users, live: false }] : []),
        ...(isSuperAdmin ? SUPER_ADMIN_NAV : []),
    ];

    const sidebarWidth = collapsed ? 'w-[60px]' : 'w-[220px]';

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={[
                    'fixed lg:static inset-y-0 left-0 z-50',
                    sidebarWidth, 'flex-shrink-0 flex flex-col',
                    'bg-[#0a0a0a] border-r border-zinc-800/60',
                    'transition-all duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                ].join(' ')}
            >
                {/* ── Branding ─────────────────────────────────────────── */}
                <div className={`flex items-center h-16 border-b border-zinc-800/60 flex-shrink-0 ${collapsed ? 'justify-center px-3' : 'gap-3 px-5'}`}>
                    {/* Logo */}
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3.5 h-3.5 text-orange-400" />
                    </div>

                    {/* Brand name + collapse button */}
                    {!collapsed && (
                        <>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[13px] font-semibold text-zinc-100 tracking-tight leading-tight truncate">
                                    Pulse API
                                </span>
                                <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest truncate">
                                    Monitoring Platform
                                </span>
                            </div>
                            {/* Collapse toggle — desktop only */}
                            <button
                                onClick={() => setCollapsed(true)}
                                className="hidden lg:flex p-1 rounded-md text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800 transition-colors flex-shrink-0"
                                aria-label="Collapse sidebar"
                                title="Collapse sidebar"
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* Expand toggle in collapsed mode */}
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(false)}
                            className="hidden lg:flex absolute -right-3 top-[70px] p-1 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors z-10"
                            aria-label="Expand sidebar"
                            title="Expand sidebar"
                        >
                            <PanelLeftOpen className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* ── Primary navigation ───────────────────────────────── */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5" aria-label="Primary">
                    {!collapsed && (
                        <p className="px-2 mb-2 text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                            Navigation
                        </p>
                    )}
                    {PRIMARY_NAV.map((item) => (
                        <NavItem key={item.id} item={item} onClick={onClose} collapsed={collapsed} />
                    ))}

                    {/* client_admin gets Team link */}
                    {isClientAdmin && (
                        <NavItem
                            item={{ id: 'team', label: 'Team', href: '/dashboard/team', icon: Users, live: false }}
                            onClick={onClose}
                            collapsed={collapsed}
                        />
                    )}

                    {/* Super Admin section */}
                    {isSuperAdmin && (
                        <>
                            {!collapsed && (
                                <div className="pt-3 pb-1 px-2">
                                    <p className="text-[9px] font-semibold text-zinc-700 uppercase tracking-widest">
                                        Admin
                                    </p>
                                </div>
                            )}
                            {SUPER_ADMIN_NAV.map((item) => (
                                <NavItem key={item.id} item={item} onClick={onClose} collapsed={collapsed} />
                            ))}
                        </>
                    )}
                </nav>

                {/* ── Bottom: user profile + logout ────────────────────── */}
                <div className="px-3 py-4 border-t border-zinc-800/60 space-y-2 flex-shrink-0">
                    {/* User profile card */}
                    {!collapsed && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-bold text-orange-400">{initial}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-zinc-200 truncate leading-tight">
                                    {username}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate leading-tight">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Collapsed avatar */}
                    {collapsed && (
                        <div className="flex justify-center">
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center" title={username}>
                                <span className="text-[11px] font-bold text-orange-400">{initial}</span>
                            </div>
                        </div>
                    )}

                    {/* Terminate Session button */}
                    <button
                        onClick={onLogout}
                        className={`w-full flex items-center gap-3 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all duration-150 group ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}`}
                        title={collapsed ? 'Sign out' : undefined}
                    >
                        <LogOut className="w-[15px] h-[15px] flex-shrink-0 group-hover:text-red-400" />
                        {!collapsed && <span>Terminate Session</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
