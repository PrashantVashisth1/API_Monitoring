/**
 * App.jsx — Root application component.
 *
 * Provider stack (outermost → innermost):
 *   ErrorBoundary → QueryClientProvider → ToastProvider → AuthProvider → BrowserRouter
 *
 * Routing:
 *   /          → InitializationGate → LandingPage (if initialized) | redirect /setup
 *   /setup     → SetupPage (standalone, handles 403 internally if already initialized)
 *   /*         → AuthGate (decides: loading | login | dashboard)
 *
 * Initialization Gate Logic:
 *   1. Check localStorage('apim:initialized')  — instant, no network call
 *   2. If absent: call GET /api/auth/status    — ONE db call, then cache result
 *   3. If not initialized → redirect to /setup
 *   4. If initialized     → show LandingPage normally
 *
 * After /setup completes, SetupPage calls markInitialized() which sets
 * localStorage('apim:initialized') = 'true' — so the status endpoint is
 * never called again on this browser.
 */
import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import { SetupPage } from './pages/SetupPage';
import { LandingPage } from './pages/LandingPage';
import { authApi } from './api/api';


// ── Lazy-loaded protected pages ───────────────────────────────────────────────
const OverviewPage = lazy(() =>
    import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage }))
);
const SettingsPage = lazy(() =>
    import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const OnboardClient = lazy(() => import('./pages/OnboardClient'));
const OrganizationsPage = lazy(() =>
    import('./pages/OrganizationsPage').then(m => ({ default: m.OrganizationsPage }))
);
const ApiKeysPage = lazy(() =>
    import('./pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage }))
);
const TrafficPage = lazy(() =>
    import('./pages/TrafficPage').then(m => ({ default: m.TrafficPage }))
);
const DocsPage = lazy(() =>
    import('./pages/DocsPage').then(m => ({ default: m.DocsPage }))
);
const TeamPage = lazy(() =>
    import('./pages/TeamPage').then(m => ({ default: m.TeamPage }))
);
const ArchivePage = lazy(() =>
    import('./pages/ArchivePage').then(m => ({ default: m.ArchivePage }))
);

const FullscreenSpinner = ({ label = 'Loading…' }) => (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-orange-500 animate-spin" />
        <p className="text-xs text-zinc-600 tracking-widest uppercase">{label}</p>
    </div>
);

const PageSpinner = (
    <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-orange-500 animate-spin" />
    </div>
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
    },
});

// ─── InitializationGate ───────────────────────────────────────────────────────
// Wraps the "/" landing page route.
// On first visit (no localStorage flag), calls GET /api/auth/status ONCE.
// If not initialized → redirects to /setup.
// If initialized    → renders LandingPage.
// All subsequent visits use localStorage — zero additional DB calls.
//
// KEY IMPROVEMENT: If user is already authenticated (cookie still valid) OR
// has an active guest session, redirect them straight to /dashboard.
function InitializationGate() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [checking, setChecking] = useState(
        // Skip the network call if we already know it's initialized
        !localStorage.getItem('apim:initialized')
    );

    // If auth is resolved and user is logged in (real or guest), skip landing
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        // Already cached — nothing to do
        if (!checking) return;

        let cancelled = false;

        authApi.getSystemStatus()
            .then((res) => {
                if (cancelled) return;
                if (res?.data?.initialized) {
                    // Platform ready — cache so we never check again
                    localStorage.setItem('apim:initialized', 'true');
                    setChecking(false);
                } else {
                    // Fresh install — redirect to setup wizard
                    navigate('/setup', { replace: true });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    // Network error / server down — assume initialized, show landing
                    setChecking(false);
                }
            });

        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (authLoading || checking) {
        return <FullscreenSpinner label="Loading Pulse API…" />;
    }

    return <LandingPage />;
}

// ─── AuthGate ─────────────────────────────────────────────────────────────────
function AuthGate() {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <FullscreenSpinner label="Verifying session" />;
    }

    if (!isAuthenticated) {
        if (location.pathname !== '/login') {
            return <Navigate to="/" replace />;
        }
        return <Login />;
    }

    if (location.pathname === '/login') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <DashboardLayout onLogout={logout}>
            <Suspense fallback={PageSpinner}>
                <Routes>
                    {/* All protected routes live under /dashboard/* */}
                    <Route path="/dashboard" element={<OverviewPage />} />
                    <Route path="/dashboard/overview" element={<OverviewPage />} />
                    <Route path="/dashboard/onboard" element={<OnboardClient />} />
                    <Route path="/dashboard/settings" element={<SettingsPage />} />
                    <Route path="/dashboard/organizations" element={<OrganizationsPage />} />
                    <Route path="/dashboard/api-keys" element={<ApiKeysPage />} />
                    <Route path="/dashboard/traffic" element={<TrafficPage />} />
                    <Route path="/dashboard/docs" element={<DocsPage />} />
                    <Route path="/dashboard/team" element={<TeamPage />} />
                    <Route path="/dashboard/archive" element={<ArchivePage />} />
                    {/* Legacy paths: redirect gracefully */}
                    <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
                    <Route path="/onboard" element={<Navigate to="/dashboard/onboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Suspense>
        </DashboardLayout>
    );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <AuthProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* "/" checks initialization status, then shows Landing or redirects to Setup */}
                                <Route path="/" element={<InitializationGate />} />
                                {/* Standalone setup wizard — handles 403 if already initialized */}
                                <Route path="/setup" element={<SetupPage />} />
                                {/* All other routes — AuthGate decides login vs dashboard */}
                                <Route path="/*" element={<AuthGate />} />
                            </Routes>
                        </BrowserRouter>
                    </AuthProvider>
                </ToastProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
