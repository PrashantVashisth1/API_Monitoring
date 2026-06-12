/**
 * AuthContext.jsx
 *
 * Central auth state for the entire application.
 *
 * Setup Detection Strategy (IMPORTANT):
 * ──────────────────────────────────────
 * We do NOT auto-detect whether setup is required from the client side.
 * A GET /api/auth/profile → 401 only tells us the visitor is unauthenticated.
 * It does NOT tell us whether ANY users exist in the database.
 *
 * Therefore:
 *   • 200  → user is authenticated  → set user, mark platform initialized
 *   • 401  → not authenticated      → show Login  (safe default for all visitors)
 *
 * The /setup route is a standalone public URL that admins navigate to manually
 * on first deployment (same pattern as Gitea, Grafana, Nextcloud).
 * SetupPage.jsx handles the 403 ("already initialized") case internally.
 *
 * Exposed values:
 *   user, isLoading, isAuthenticated
 *   isSuperAdmin, isClientAdmin, isClientViewer
 *   canManageKeys, canManageUsers, canViewAnalytics, canExportData
 *   clientId, role
 *   login(creds), loginAsGuest(), logout(), setUser(u), markInitialized()
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/api';

const STORAGE_KEY = 'apim:initialized';
const GUEST_KEY = 'apim:guest';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [setupRequired, setSetupRequired] = useState(false);

    const queryClient = useQueryClient();

    // ── Mark platform as initialized (persists across sessions) ────────────
    const markInitialized = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setSetupRequired(false);
    }, []);

    // ── Initial profile check ───────────────────────────────────────────────
    useEffect(() => {
        // If they are a guest, bypass backend auth check to prevent 401
        if (localStorage.getItem(GUEST_KEY) === 'true') {
            setUser({
                username: 'Guest_Viewer',
                role: 'client_viewer',
                clientId: 'demo_client_123',
                isGuest: true,
            });
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();

        authApi
            .getProfile({ signal: controller.signal })
            .then((res) => {
                // Authenticated — set user and persist initialized flag
                const profile = res?.data ?? null;
                setUser(profile);
                localStorage.setItem(STORAGE_KEY, 'true');
                setIsLoading(false);
            })
            .catch((err) => {
                if (err.name === 'CanceledError' || err.name === 'AbortError') return;
                // 401 — visitor is not authenticated.
                // We CANNOT determine from a 401 whether the platform has any users.
                // Always show Login. /setup is navigated to directly by admins.
                setUser(null);
                setSetupRequired(false); // ← FIX: never auto-trigger setup wizard
                setIsLoading(false);
            });

        return () => controller.abort();
    }, []);

    // ── Global 401 listener ─────────────────────────────────────────────────
    // api.js interceptor fires 'auth:unauthorized' when any protected request
    // gets a 401 (e.g. session expired mid-use). Clear state → user sees Login.
    // IMPORTANT: Do NOT clear state for guest users — they intentionally have no
    // real auth token; their 401s are expected and should be handled per-page.
    useEffect(() => {
        if (isLoading) return;

        const handle401 = () => {
            // Guest sessions are local-only (no real JWT) — 401s are expected
            if (localStorage.getItem(GUEST_KEY) === 'true') return;
            queryClient.clear();
            setUser(null);
            setSetupRequired(false);
        };

        window.addEventListener('auth:unauthorized', handle401);
        return () => window.removeEventListener('auth:unauthorized', handle401);
    }, [isLoading, queryClient]);

    // ── Login ───────────────────────────────────────────────────────────────
    const login = useCallback(async (credentials) => {
        // POST /api/auth/login → { success, data: { _id, username, email, role, ... } }
        const res = await authApi.login(credentials);
        const profile = res?.data ?? null;
        setUser(profile);
        markInitialized(); // successful login ⇒ platform is initialized
        return res;
    }, [markInitialized]);

    // ── Login as Guest ──────────────────────────────────────────────────────
    const loginAsGuest = useCallback(() => {
        const guestUser = {
            username: 'Guest_Viewer',
            role: 'client_viewer',
            clientId: 'demo_client_123',
            isGuest: true,
        };
        setUser(guestUser);
        localStorage.setItem(GUEST_KEY, 'true');
    }, []);

    // ── Logout ──────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        // Clear guest session
        localStorage.removeItem(GUEST_KEY);

        try {
            await authApi.logout(); // GET /api/auth/logout — clears httpOnly cookie
        } catch {
            // Swallow network errors; still clear local state
        }
        queryClient.clear();
        setUser(null);
        // Don't reset setupRequired — the platform is still initialized
    }, [queryClient]);

    // ── Derived permission helpers ───────────────────────────────────────────
    const role = user?.role ?? null;
    const isSuperAdmin = role === 'super_admin';
    const isClientAdmin = role === 'client_admin';
    const isClientViewer = role === 'client_viewer';

    const canManageKeys = isSuperAdmin || !!user?.permissions?.canCreateApiKeys;
    const canManageUsers = isSuperAdmin || !!user?.permissions?.canManageUsers;
    const canViewAnalytics = isSuperAdmin || !!user?.permissions?.canViewAnalytics;
    const canExportData = isSuperAdmin || !!user?.permissions?.canExportData;

    // clientId — MongoDB ObjectId string for the user's org.
    // null for super_admin (they query any client via ?clientId=).
    const clientId = user?.clientId ?? null;

    // ── Context value ────────────────────────────────────────────────────────
    const value = {
        // State
        user,
        isLoading,
        isAuthenticated: !!user,
        setupRequired,

        // Role flags
        isSuperAdmin,
        isClientAdmin,
        isClientViewer,

        // Permission flags
        canManageKeys,
        canManageUsers,
        canViewAnalytics,
        canExportData,

        // Convenience
        clientId,
        role,

        // Actions
        login,
        loginAsGuest,
        logout,
        setUser,
        markInitialized,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

