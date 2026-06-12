/**
 * DashboardLayout.jsx
 *
 * Shell layout wrapping all authenticated pages.
 * Top bar shows: LIVE STATUS badge | platform info | time window selector | refresh | (mobile menu).
 * The logout action is delegated to the Sidebar's "Terminate Session" button.
 *
 * TimeWindowProvider wraps this layout so all pages share the same window state.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, X, RefreshCw, Radio } from 'lucide-react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { useDashboardQuery } from '../../hooks/useDashboardQuery';
import { TimeWindowProvider, useTimeWindow } from '../../contexts/TimeWindowContext';

const TIME_WINDOWS = ['24H', '7D'];

// ── Inner layout (needs TimeWindowContext already mounted) ────────────────────
function DashboardLayoutInner({ children, onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const queryClient  = useQueryClient();
    const navigate     = useNavigate();
    const { timeWindow, setTimeWindow } = useTimeWindow();

    // Watch ALL in-flight queries for the sync spinner
    const isFetching = useIsFetching() > 0;

    // Warm up the query (needed for dataUpdatedAt)
    useDashboardQuery({ notifyOnChangeProps: ['dataUpdatedAt'] });

    const handleRefresh = () => {
        // Invalidate every cached query so all pages reload
        queryClient.invalidateQueries();
    };

    const handleLogout = async () => {
        // Logout first (clears cookie + user state), THEN navigate.
        // Reversing the order causes a race: InitializationGate would see
        // isAuthenticated=true and redirect back to /dashboard before logout completes.
        await onLogout();
        navigate('/', { replace: true });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
            {/* Sidebar — receives onLogout to power the "Terminate Session" button */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            {/* Main column */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* ── Top Bar ──────────────────────────────────────────── */}
                <header className="h-14 flex-shrink-0 border-b border-zinc-800/60 bg-[#0a0a0a] z-20">
                    <div className="h-full px-5 flex items-center justify-between gap-4">

                        {/* Left: mobile toggle + status indicators */}
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                aria-label="Toggle menu"
                            >
                                {sidebarOpen
                                    ? <X className="w-4 h-4" />
                                    : <Menu className="w-4 h-4" />
                                }
                            </button>

                            {/* LIVE STATUS badge */}
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-500 tracking-widest uppercase">
                                    Live Status
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="hidden sm:block w-px h-4 bg-zinc-800" />

                            {/* Platform label */}
                            <div className="hidden md:flex items-center gap-1.5">
                                <Radio className="w-3 h-3 text-zinc-600" />
                                <span className="text-[11px] text-zinc-600 font-mono uppercase tracking-wider">
                                    Pulse API
                                </span>
                            </div>
                        </div>

                        {/* Right: time window + refresh */}
                        <div className="flex items-center gap-3">
                            {/* Time window toggle — NOW FUNCTIONAL */}
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
                                {TIME_WINDOWS.map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => setTimeWindow(w)}
                                        className={[
                                            'px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider transition-all duration-150',
                                            timeWindow === w
                                                ? 'bg-orange-500 text-white shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-200',
                                        ].join(' ')}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>

                            {/* Sync / Refresh — spins while ANY query is fetching */}
                            <button
                                onClick={handleRefresh}
                                disabled={isFetching}
                                aria-label="Refresh all data"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-40"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 transition-transform ${isFetching ? 'animate-spin text-orange-500' : ''}`} />
                                <span className="hidden sm:inline">Sync</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Page content ─────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-7xl mx-auto p-5 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

// ── Exported wrapper — mounts the TimeWindowProvider ─────────────────────────
export function DashboardLayout({ children, onLogout }) {
    return (
        <TimeWindowProvider>
            <DashboardLayoutInner onLogout={onLogout}>
                {children}
            </DashboardLayoutInner>
        </TimeWindowProvider>
    );
}
