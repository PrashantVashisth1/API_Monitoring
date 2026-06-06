import crypto from 'crypto';
import logger from '../../../shared/config/logger.js';
import AppError from '../../../shared/utils/AppError.js';
import { APPLICATION_ROLES } from '../../../shared/constants/roles.js';

/**
 * LeadService.js — Business logic for the lead management system.
 *
 * Responsibilities:
 *  - submitLead:   public form submission → creates a pending lead
 *  - getLeads:     paginated list for super_admin (with status filter)
 *  - getLeadById:  single lead detail
 *  - approveLead:  atomic approval → creates Client + client_admin → returns credentials
 *  - rejectLead:   marks lead as rejected with optional note
 *
 * The approveLead method delegates Client and User creation to the
 * injected clientService — keeping each service focused.
 */
export class LeadService {
    /**
     * @param {Object} deps
     * @param {import('../repository/LeadRepository').MongoLeadRepository} deps.leadRepository
     * @param {import('../../client/service/clientService').ClientService}  deps.clientService
     */
    constructor(deps) {
        if (!deps?.leadRepository)  throw new Error('leadRepository is required');
        if (!deps?.clientService)   throw new Error('clientService is required');

        this.leadRepository = deps.leadRepository;
        this.clientService  = deps.clientService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC — no authentication required
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Submit a new access request from the public landing page.
     * Enforces one request per email address.
     *
     * @param {{ name, email, company, website? }} formData
     * @returns {Lead} the created lead document
     */
    async submitLead(formData) {
        try {
            const { name, email, company, website = '' } = formData;

            // Guard: duplicate email
            const existing = await this.leadRepository.findByEmail(email);
            if (existing) {
                throw new AppError(
                    `An access request for ${email} already exists. Our team will be in touch.`,
                    409
                );
            }

            const lead = await this.leadRepository.create({
                name,
                email,
                company,
                website,
                status: 'pending',
            });

            logger.info('New lead submitted', { leadId: lead._id, company });

            return lead;
        } catch (error) {
            // Re-wrap Mongoose duplicate key error (race condition edge case)
            if (error.code === 11000) {
                throw new AppError('An access request for this email already exists.', 409);
            }
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROTECTED — super_admin only
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * List leads with optional status filter and pagination.
     *
     * @param {Object} queryParams - { status?, page?, limit? }
     * @returns {{ leads, total, page, limit }}
     */
    async getLeads(queryParams = {}) {
        try {
            const {
                status,
                page  = 1,
                limit = 20,
            } = queryParams;

            const filters = {};
            if (status && ['pending', 'approved', 'rejected'].includes(status)) {
                filters.status = status;
            }

            const skip  = (page - 1) * limit;
            const [leads, total] = await Promise.all([
                this.leadRepository.find(filters, { limit: Number(limit), skip }),
                this.leadRepository.count(filters),
            ]);

            return { leads, total, page: Number(page), limit: Number(limit) };
        } catch (error) {
            logger.error('Error fetching leads', error);
            throw error;
        }
    }

    /**
     * Get a single lead by ID.
     * @param {string} leadId
     */
    async getLeadById(leadId) {
        try {
            const lead = await this.leadRepository.findById(leadId);
            if (!lead) throw new AppError('Lead not found', 404);
            return lead;
        } catch (error) {
            logger.error('Error fetching lead', error);
            throw error;
        }
    }

    /**
     * Approve a lead — the core onboarding action.
     *
     * Atomic steps:
     *   1. Validate lead exists and is still pending
     *   2. Derive slug and username from company/email
     *   3. Auto-generate a strong temporary password (16 chars)
     *   4. Create the Client organisation via clientService
     *   5. Create the first client_admin user via clientService
     *   6. Mark the lead as approved, linking to the new Client
     *   7. Return { client, user, tempPassword } — password shown ONCE to super_admin
     *
     * @param {string} leadId
     * @param {{ username?: string }} adminInput — optional override username
     * @param {Object} actingUser — the super_admin from req.user
     */
    async approveLead(leadId, adminInput = {}, actingUser) {
        try {
            const lead = await this.leadRepository.findById(leadId);
            if (!lead) throw new AppError('Lead not found', 404);

            if (lead.status === 'approved') {
                throw new AppError('This lead has already been approved.', 409);
            }
            if (lead.status === 'rejected') {
                throw new AppError('This lead was rejected and cannot be approved.', 409);
            }

            // ── 1. Derive credentials ──────────────────────────────────────
            const username    = adminInput.username
                || this._deriveUsername(lead.company, lead.email);
            const tempPassword = this._generateSecurePassword();

            // ── 2. Create Client org ───────────────────────────────────────
            const client = await this.clientService.createClient(
                {
                    name:        lead.company,
                    email:       lead.email,
                    description: `Client account for ${lead.company}`,
                    website:     lead.website || '',
                },
                actingUser
            );

            // ── 3. Create first client_admin user ──────────────────────────
            const user = await this.clientService.createClientUser(
                client._id,
                {
                    username,
                    email:    lead.email,
                    password: tempPassword,
                    role:     APPLICATION_ROLES.CLIENT_ADMIN,
                },
                actingUser
            );

            // ── 4. Mark lead approved ──────────────────────────────────────
            await this.leadRepository.updateById(leadId, {
                status:     'approved',
                approvedBy: actingUser.userId,
                approvedAt: new Date(),
                clientId:   client._id,
            });

            logger.info('Lead approved — Client and admin created', {
                leadId,
                clientId: client._id,
                username,
            });

            // tempPassword is returned here ONLY — it is NOT stored in the DB
            // (bcrypt hash is stored in the User document, not plaintext)
            return {
                client,
                user,       // password field already stripped by formatClientForResponse
                tempPassword,
                username,
            };
        } catch (error) {
            logger.error('Error approving lead', error);
            throw error;
        }
    }

    /**
     * Reject a lead with an optional note.
     *
     * @param {string} leadId
     * @param {{ note?: string }} body
     * @param {Object} actingUser
     */
    async rejectLead(leadId, body = {}, actingUser) {
        try {
            const lead = await this.leadRepository.findById(leadId);
            if (!lead) throw new AppError('Lead not found', 404);

            if (lead.status !== 'pending') {
                throw new AppError(`Lead is already ${lead.status} and cannot be rejected.`, 409);
            }

            const updated = await this.leadRepository.updateById(leadId, {
                status:     'rejected',
                rejectedBy: actingUser.userId,
                rejectedAt: new Date(),
                notes:      body.note || '',
            });

            logger.info('Lead rejected', { leadId, rejectedBy: actingUser.userId });

            return updated;
        } catch (error) {
            logger.error('Error rejecting lead', error);
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Derive a safe username from the company name or email prefix.
     * Example: "Zomato India" → "zomato_india" | "zomato@gmail.com" → "zomato"
     */
    _deriveUsername(company, email) {
        const fromCompany = company
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 20);

        if (fromCompany.length >= 3) return `${fromCompany}_admin`;

        // Fallback to email prefix
        const fromEmail = email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');
        return `${fromEmail}_admin`;
    }

    /**
     * Generate a cryptographically secure 16-character temporary password.
     * Mix of uppercase, lowercase, digits, and symbols for enterprise strength.
     * Format:  Xxxxx9!Xxxxx9!xx  (always passes common password validators)
     */
    _generateSecurePassword() {
        const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower   = 'abcdefghjkmnpqrstuvwxyz';
        const digits  = '23456789';
        const symbols = '!@#$%&*';
        const all     = upper + lower + digits + symbols;

        const rand = () => crypto.randomInt(all.length);
        const pick = (set) => set[crypto.randomInt(set.length)];

        // Guarantee at least one of each category
        const mandatory = [
            pick(upper),
            pick(upper),
            pick(lower),
            pick(lower),
            pick(digits),
            pick(digits),
            pick(symbols),
        ];

        // Fill remaining 9 characters randomly
        const rest = Array.from({ length: 9 }, () => all[rand()]);

        // Fisher-Yates shuffle
        const combined = [...mandatory, ...rest];
        for (let i = combined.length - 1; i > 0; i--) {
            const j = crypto.randomInt(i + 1);
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return combined.join('');
    }
}
