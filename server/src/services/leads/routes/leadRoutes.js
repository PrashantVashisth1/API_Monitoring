import express from 'express';
import leadDependencies from '../Dependencies/dependencies.js';
import authenticate from '../../../shared/middlewares/authenticate.js';
import ResponseFormatter from '../../../shared/utils/responseFormatter.js';

const router = express.Router();
const { leadController } = leadDependencies.controllers;

/**
 * leadRoutes.js
 *
 * Route map:
 *
 *  PUBLIC (no auth):
 *    POST   /api/leads                         → submitLead
 *
 *  PROTECTED — super_admin only (authenticate + role guard inline):
 *    GET    /api/admin/leads                   → getLeads
 *    GET    /api/admin/leads/:leadId           → getLeadById
 *    POST   /api/admin/leads/:leadId/approve   → approveLead
 *    POST   /api/admin/leads/:leadId/reject    → rejectLead
 */

// ── Role guard for all /admin/leads routes ───────────────────────────────────
// Keeps things self-contained without needing a separate `authorize` middleware.
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json(
            ResponseFormatter.error('Access denied. Super Admin privileges required.', 403)
        );
    }
    next();
};

// ─── Public route ────────────────────────────────────────────────────────────
router.post(
    '/leads',
    (req, res, next) => leadController.submitLead(req, res, next)
);

// ─── Protected routes (authenticate → requireSuperAdmin) ─────────────────────
router.get(
    '/admin/leads',
    authenticate,
    requireSuperAdmin,
    (req, res, next) => leadController.getLeads(req, res, next)
);

router.get(
    '/admin/leads/:leadId',
    authenticate,
    requireSuperAdmin,
    (req, res, next) => leadController.getLeadById(req, res, next)
);

router.post(
    '/admin/leads/:leadId/approve',
    authenticate,
    requireSuperAdmin,
    (req, res, next) => leadController.approveLead(req, res, next)
);

router.post(
    '/admin/leads/:leadId/reject',
    authenticate,
    requireSuperAdmin,
    (req, res, next) => leadController.rejectLead(req, res, next)
);

export default router;
