import ResponseFormatter from "../../../shared/utils/responseFormatter.js";

export class ClientController {
    constructor(clientService, authService) {
        if(!clientService) {
            throw new Error("clientService is required");
        }

        if(!authService) {
            throw new Error("authService is required");
        }

        this.clientService = clientService;
        this.authService = authService;
    }

    async createClient(req, res, next) {
        try {
            const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId);

            if(!isSuperAdmin) {
                return res.status(403).json(ResponseFormatter.error("Access denied", 403));
            }

            const client = await this.clientService.createClient(req.body, req.user);

            return res.status(201).json(ResponseFormatter.success(client, "Client created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    async createClientUser(req, res, next) {
        try {
            const { clientId } = req.params;

            const user = await this.clientService.createClientUser(clientId, req.body, req.user);

            return res.status(201).json(ResponseFormatter.success(user, "Client user created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    async createApiKey(req, res, next) {
        try {
            const { clientId } = req.params;

            const user = await this.clientService.createApiKey(clientId, req.body, req.user);

            return res.status(201).json(ResponseFormatter.success(user, "API Key created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    async getClientApiKeys(req, res, next) {
        try {
            const { clientId } = req.params;
            const apiKey = await this.clientService.getClientApiKeys(clientId, req.user)
            return res.status(200).json(ResponseFormatter.success(apiKey, "API key fetched successfully", 200))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/admin/clients — List all client organisations.
     * super_admin: all clients.
     * client_admin: only their own client (for the "Add User" dropdown).
     */
    async getClients(req, res, next) {
        try {
            const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId);

            let clients;
            if (isSuperAdmin) {
                clients = await this.clientService.listClients();
            } else {
                // client_admin — return only their own org
                const myClientId = req.user.clientId;
                if (!myClientId) return res.status(403).json(ResponseFormatter.error('No client association', 403));
                const client = await this.clientService.clientRepository.findById(myClientId);
                clients = client ? [client] : [];
            }

            return res.status(200).json(ResponseFormatter.success(clients, 'Clients fetched successfully', 200));
        } catch (error) {
            next(error);
        }
    }

    async deleteApiKey(req, res, next) {
        try {
            const { clientId, keyId } = req.params;
            const result = await this.clientService.deleteApiKey(clientId, keyId, req.user);
            return res.status(200).json(ResponseFormatter.success(result, 'API key deleted successfully', 200));
        } catch (error) {
            next(error);
        }
    }
}