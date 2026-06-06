import ResponseFormatter from '../../../shared/utils/responseFormatter.js';

/**
 * LeadController.js — HTTP layer for the lead management system.
 *
 * Routes:
 *   POST   /api/leads                    → submitLead   (public)
 *   GET    /api/admin/leads              → getLeads     (super_admin)
 *   GET    /api/admin/leads/:leadId      → getLeadById  (super_admin)
 *   POST   /api/admin/leads/:leadId/approve → approveLead  (super_admin)
 *   POST   /api/admin/leads/:leadId/reject  → rejectLead   (super_admin)
 *
 * All business logic lives in LeadService. This controller only:
 *  - Extracts request data
 *  - Calls the service
 *  - Formats and sends the HTTP response
 *  - Passes errors to the global error handler via next(error)
 */
export class LeadController {
    constructor(leadService) {
        if (!leadService) throw new Error('leadService is required');
        this.leadService = leadService;
    }

    /**
     * POST /api/leads
     * Public — no authentication required.
     * Body: { name, email, company, website? }
     */
    async submitLead(req, res, next) {
        try {
            const lead = await this.leadService.submitLead(req.body);

            return res.status(201).json(
                ResponseFormatter.success(
                    {
                        id:      lead._id,
                        company: lead.company,
                        status:  lead.status,
                    },
                    "Access request submitted successfully. Our team will review it shortly.",
                    201
                )
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/admin/leads
     * Query params: ?status=pending|approved|rejected&page=1&limit=20
     */
    async getLeads(req, res, next) {
        try {
            const result = await this.leadService.getLeads(req.query);

            return res.status(200).json(
                ResponseFormatter.success(result, 'Leads fetched successfully', 200)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/admin/leads/:leadId
     */
    async getLeadById(req, res, next) {
        try {
            const lead = await this.leadService.getLeadById(req.params.leadId);

            return res.status(200).json(
                ResponseFormatter.success(lead, 'Lead fetched successfully', 200)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/admin/leads/:leadId/approve
     * Body: { username? }  — username is optional, backend derives one if omitted
     *
     * IMPORTANT: The response includes `tempPassword` which is shown ONCE
     * to the super_admin and NEVER stored in plaintext.
     */
    async approveLead(req, res, next) {
        try {
            const { leadId } = req.params;
            const result = await this.leadService.approveLead(
                leadId,
                req.body,       // { username? }
                req.user        // actingUser from authenticate middleware
            );

            return res.status(201).json(
                ResponseFormatter.success(
                    result,
                    `Client "${result.client.name}" onboarded successfully. Share the temporary credentials with the client admin.`,
                    201
                )
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/admin/leads/:leadId/reject
     * Body: { note? }
     */
    async rejectLead(req, res, next) {
        try {
            const { leadId } = req.params;
            const lead = await this.leadService.rejectLead(leadId, req.body, req.user);

            return res.status(200).json(
                ResponseFormatter.success(lead, 'Lead rejected successfully', 200)
            );
        } catch (error) {
            next(error);
        }
    }
}
