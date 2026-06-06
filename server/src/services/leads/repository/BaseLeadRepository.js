/**
 * BaseLeadRepository.js
 *
 * Abstract base class for the lead repository.
 * Defines the interface that all concrete implementations must honour.
 * Follows the same Repository pattern used by BaseClientRepository.
 */
export class BaseLeadRepository {
    constructor(model) {
        this.model = model;
    }

    async create(leadData) {
        throw new Error('Method not implemented');
    }

    async findById(leadId) {
        throw new Error('Method not implemented');
    }

    async findByEmail(email) {
        throw new Error('Method not implemented');
    }

    async find(filters, options) {
        throw new Error('Method not implemented');
    }

    async count(filters) {
        throw new Error('Method not implemented');
    }

    async updateById(leadId, update) {
        throw new Error('Method not implemented');
    }
}
