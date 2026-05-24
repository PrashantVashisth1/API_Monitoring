// import MongoUserRepository from "../repository/UserRepository.js"
import { AuthService } from "../service/authService.js";
import { AuthController } from "../controller/authController.js";
import { MongoUserRepository } from "../repository/UserRepository.js";
import User from "../../../shared/models/User.js"

class Container {
    static init() {
        const repositories = {
            userRepository: new MongoUserRepository(User)
        };

        const services = {
            authService: new AuthService(repositories.userRepository)
        };

        const controller = {
            authController: new AuthController(services.authService)
        };

        return {
            repositories, services, controller
        };
    }
}

const initialized = Container.init();
export { Container };
export default initialized;