/**
 * api.js — Central Axios instance + all API call definitions.
 *
 * Backend Truth verified against:
 *  - server/src/services/auth/routes/authRouter.js
 *  - server/src/services/client/routes/clientRoutes.js
 *  - server/src/services/analytics/routes/analyticsRoutes.js
 *  - server/src/services/ingest/routes/ingestRoutes.js
 */
import axios from 'axios';

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Required: JWT stored in httpOnly cookie
});

// ─── Response Interceptor ────────────────────────────────────────────────────
// Dispatch a DOM event on 401 so AuthContext can react globally
// without every component needing to handle it.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = error.config?.url?.includes('/auth/');
        if (error.response?.status === 401 && !isAuthRoute) {
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
// Backend routes: POST /api/auth/login, POST /api/auth/register,
//                 GET  /api/auth/profile, GET /api/auth/logout  ← GET not POST
//                 POST /api/auth/onboard-super-admin
export const authApi = {
    /**
     * Login with username + password.
     * Backend loginSchema: { username: required, password: required }
     * Returns: { success, data: { _id, username, email, role, clientId, permissions }, message }
     */
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    /**
     * Register a new user (super_admin only — called from Team page).
     * Backend registrationSchema: { username, email, password, role? }
     */
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Fetch the currently logged-in user's profile.
     * Returns: { success, data: { _id, username, email, role, clientId, isActive, permissions } }
     */
    getProfile: async (options) => {
        const response = await api.get('/auth/profile', { signal: options?.signal });
        return response.data;
    },

    /**
     * Logout — BUG FIX: Backend route is GET /logout, not POST.
     * router.get('/logout', ...) in authRouter.js clears the authToken cookie.
     */
    logout: async () => {
        const response = await api.get('/auth/logout');   // ← was POST, now GET
        return response.data;
    },

    /**
     * One-time Super Admin initialization.
     * Only succeeds when 0 users exist in the database.
     * Backend onboardSuperAdminSchema: { username, email, password }
     * Returns 403 if a super admin already exists.
     */
    onboardSuperAdmin: async (data) => {
        const response = await api.post('/auth/onboard-super-admin', data);
        return response.data;
    },

    /**
     * PUBLIC — check if the platform has been initialized.
     * Returns { initialized: boolean }
     * Called ONCE on first visit if localStorage flag is absent.
     * After that, localStorage('apim:initialized') is used — no more DB calls.
     */
    getSystemStatus: async () => {
        const response = await api.get('/auth/status');
        return response.data;
    },
};

// ─── Analytics API ───────────────────────────────────────────────────────────
// Backend routes: GET /api/analytics/dashboard, GET /api/analytics/stats
// Both accept query params: ?startTime=&endTime=&clientId=
// clientId is optional — super_admin can pass it; client users' clientId
// is resolved server-side from their JWT.
export const analyticsApi = {
    /**
     * Full dashboard payload in one call.
     * Returns: { stats, topEndpoints, recentActitivy } (note backend typo is handled)
     */
    getDashboard: async (params = {}) => {
        const response = await api.get('/analytics/dashboard', { params });
        const payload = response.data || {};

        // Normalise response shape — backend typo "recentActitivy" handled here
        payload.data = payload.data || {};
        payload.data.stats = payload.data.stats ?? {
            totalHits: 0,
            avgLatency: 0,
            errorRate: 0,
            errorHits: 0,
            successHits: 0,
            uniqueServices: 0,
            uniqueEndpoints: 0,
        };
        payload.data.topEndpoints = payload.data.topEndpoints ?? [];
        // Accept both the typo key and the correct key defensively
        payload.data.recentActivity =
            payload.data.recentActitivy ??
            payload.data.recentActivity ??
            [];

        return payload;
    },

    /**
     * Aggregated stats only — lighter call.
     * Params: { startTime?, endTime?, clientId? }
     */
    getStats: async (params = {}) => {
        const response = await api.get('/analytics/stats', { params });
        return response.data;
    },
};

// ─── Client API (requires authenticate middleware) ───────────────────────────
// Backend routes: POST /api/admin/clients/onboard
//                 POST /api/admin/clients/:clientId/users
//                 POST /api/admin/clients/:clientId/api/keys   ← /api/keys not /api-keys
//                 GET  /api/admin/clients/:clientId/api/keys
export const clientApi = {
    /**
     * Onboard a new Client organisation (super_admin only).
     * Payload matches Client schema: { name, email, description?, website? }
     * Returns: the newly created Client document.
     */
    onboardClient: async (clientData) => {
        const response = await api.post('/admin/clients/onboard', clientData);
        return response.data;
    },

    /**
     * Create a user under a specific client (super_admin or client_admin).
     * Payload: { username, email, password, role }
     * Role must be 'client_admin' or 'client_viewer' (isValidClientRole enforced by backend).
     */
    createClientUser: async (clientId, userData) => {
        const response = await api.post(`/admin/clients/${clientId}/users`, userData);
        return response.data;
    },

    /**
     * Generate a new API key for a client.
     * BUG FIX: URL was /api-keys, backend route is /api/keys.
     * Payload matches ApiKey schema: { name, description?, environment? }
     * environment enum: 'production' | 'staging' | 'development' | 'testing'
     *
     * IMPORTANT: The raw keyValue (apim_xxxx) is returned ONLY on creation.
     * It is stripped from all subsequent GET responses. Show a one-time copy
     * modal immediately after this call succeeds.
     */
    createApiKey: async (clientId, keyData) => {
        const response = await api.post(`/admin/clients/${clientId}/api/keys`, keyData); // ← was /api-keys
        return response.data;
    },

    /**
     * List API keys for a client.
     * BUG FIX: URL was /api-keys, backend route is /api/keys.
     * Returns keys WITHOUT keyValue (stripped in clientService.getClientApiKeys).
     */
    getClientApiKeys: async (clientId) => {
        const response = await api.get(`/admin/clients/${clientId}/api/keys`); // ← was /api-keys
        return response.data;
    },
    /**
     * List all client organisations (super_admin only).
     * Used by Team Management page to populate the client dropdown.
     */
    getClients: async () => {
        const response = await api.get('/admin/clients');
        return response.data;
    },

    /**
     * Register a new user (super_admin or client role).
     * For super_admin: { username, email, password, role: 'super_admin' }
     * For client user: use createClientUser instead.
     */
    registerUser: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
};

// ─── Admin API (convenience wrappers) ────────────────────────────────────────
export const adminApi = {
    onboardClient: clientApi.onboardClient,
    createClientUser: clientApi.createClientUser,
};

// ─── Leads API ───────────────────────────────────────────────────────────────
// Backend routes (from leadRoutes.js):
//   POST   /api/leads                        — public (no auth)
//   GET    /api/admin/leads                  — super_admin only
//   GET    /api/admin/leads/:id              — super_admin only
//   POST   /api/admin/leads/:id/approve      — super_admin only
//   POST   /api/admin/leads/:id/reject       — super_admin only
export const leadsApi = {
    /**
     * Public — visitor submits "Request Access" form.
     * Payload: { name, email, company, website? }
     * Returns 201 on success, 409 if email already submitted.
     */
    submitLead: async (data) => {
        const response = await api.post('/leads', data);
        return response.data;
    },

    /**
     * Super Admin — list leads with optional status filter + pagination.
     * Params: { status?: 'pending'|'approved'|'rejected', page?, limit? }
     */
    getLeads: async (params = {}) => {
        const response = await api.get('/admin/leads', { params });
        return response.data;
    },

    /**
     * Super Admin — get a single lead by ID.
     */
    getLeadById: async (leadId) => {
        const response = await api.get(`/admin/leads/${leadId}`);
        return response.data;
    },

    /**
     * Super Admin — approve a lead.
     * Payload: { username? }  — backend auto-generates if omitted
     * Returns: { client, user, tempPassword, username }
     * IMPORTANT: tempPassword is returned ONCE — display it immediately.
     */
    approveLead: async (leadId, data = {}) => {
        const response = await api.post(`/admin/leads/${leadId}/approve`, data);
        return response.data;
    },

    /**
     * Super Admin — reject a lead.
     * Payload: { note? }
     */
    rejectLead: async (leadId, note = '') => {
        const response = await api.post(`/admin/leads/${leadId}/reject`, { note });
        return response.data;
    },
};

export default api;
