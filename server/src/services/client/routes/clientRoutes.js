import express from "express";
import clientDependencies from "../Dependencies/dependencies.js";
import authenticate from "../../../shared/middlewares/authenticate.js";

const router = express.Router();
const { clientController } = clientDependencies.controllers;

/**
 * clientRoutes.js
 *
 * FIX: Removed the global `router.use(authenticate)` which was intercepting
 * ALL /api/* requests — including the public POST /api/leads — and returning
 * 401 before they could reach leadRoutes.
 *
 * `authenticate` is now applied per-route so only these protected routes
 * require a valid JWT. Unmatched paths fall through to the next router.
 */

router.post("/admin/clients/onboard",
    authenticate,
    (req, res, next) => clientController.createClient(req, res, next)
);

router.post("/admin/clients/:clientId/users",
    authenticate,
    (req, res, next) => clientController.createClientUser(req, res, next)
);

router.post("/admin/clients/:clientId/api/keys",
    authenticate,
    (req, res, next) => clientController.createApiKey(req, res, next)
);

router.get("/admin/clients/:clientId/api/keys",
    authenticate,
    (req, res, next) => clientController.getClientApiKeys(req, res, next)
);

export default router;