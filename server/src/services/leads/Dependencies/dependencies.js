import { MongoLeadRepository } from '../repository/LeadRepository.js';
import { LeadService }          from '../service/leadService.js';
import { LeadController }       from '../controller/leadController.js';
import Lead                     from '../../../shared/models/Lead.js';

// LeadService needs to call clientService for Client + User creation.
// We import the already-initialized client container to reuse its instance.
import clientDependencies from '../../client/Dependencies/dependencies.js';

/**
 * Dependency Injection container for the leads microservice.
 *
 * Follows the same Container.init() pattern used in client/Dependencies/dependencies.js.
 * Wire order: Model → Repository → Service → Controller
 *
 * Note: LeadService receives clientService from the client container
 * to orchestrate the approval flow without duplicating business logic.
 */
class LeadContainer {
    static init() {
        const repositories = {
            leadRepository: new MongoLeadRepository(Lead),
        };

        const services = {
            leadService: new LeadService({
                leadRepository: repositories.leadRepository,
                clientService:  clientDependencies.services.clientService,
            }),
        };

        const controllers = {
            leadController: new LeadController(services.leadService),
        };

        return { repositories, services, controllers };
    }
}

const initialized = LeadContainer.init();

export { LeadContainer };
export default initialized;
