import { BaseLeadRepository } from './BaseLeadRepository.js';
import logger from '../../../shared/config/logger.js';

/**
 * MongoLeadRepository.js
 *
 * Concrete MongoDB implementation of the lead repository.
 * All database access for the leads collection lives here.
 */
export class MongoLeadRepository extends BaseLeadRepository {
    constructor(model) {
        super(model);
    }

    /**
     * Persist a new lead document.
     * Throws a MongoError with code 11000 if email already exists
     * (unique index). The service layer translates this to a 409 AppError.
     */
    async create(leadData) {
        try {
            const lead = new this.model(leadData);
            await lead.save();

            logger.info('Lead created in MongoDB', {
                leadId:  lead._id,
                email:   lead.email,
                company: lead.company,
            });

            return lead;
        } catch (error) {
            logger.error('Error creating lead in MongoDB', error);
            throw error;
        }
    }

    /**
     * Find a single lead by its MongoDB _id.
     * Returns null if not found (caller decides how to handle 404).
     */
    async findById(leadId) {
        try {
            const lead = await this.model.findById(leadId).select('-__v');
            return lead;
        } catch (error) {
            logger.error('Error finding lead by ID', error);
            throw error;
        }
    }

    /**
     * Find a lead by email address (used for duplicate-check).
     */
    async findByEmail(email) {
        try {
            const lead = await this.model.findOne({ email: email.toLowerCase() });
            return lead;
        } catch (error) {
            logger.error('Error finding lead by email', error);
            throw error;
        }
    }

    /**
     * List leads with optional filters and pagination.
     * @param {Object} filters - Mongoose filter query (e.g. { status: 'pending' })
     * @param {Object} options - { limit, skip, sort }
     */
    async find(filters = {}, options = {}) {
        try {
            const {
                limit = 50,
                skip  = 0,
                sort  = { createdAt: -1 },
            } = options;

            const leads = await this.model
                .find(filters)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-__v');

            return leads;
        } catch (error) {
            logger.error('Error finding leads', error);
            throw error;
        }
    }

    /**
     * Count documents matching a filter (used for pagination metadata).
     */
    async count(filters = {}) {
        try {
            return await this.model.countDocuments(filters);
        } catch (error) {
            logger.error('Error counting leads', error);
            throw error;
        }
    }

    /**
     * Atomic update for status transitions (pending → approved / rejected).
     * Returns the updated document (new: true).
     */
    async updateById(leadId, update) {
        try {
            const lead = await this.model.findByIdAndUpdate(
                leadId,
                { $set: update },
                { new: true, runValidators: true }
            ).select('-__v');

            logger.info('Lead updated in MongoDB', { leadId, update });

            return lead;
        } catch (error) {
            logger.error('Error updating lead in MongoDB', error);
            throw error;
        }
    }
}
