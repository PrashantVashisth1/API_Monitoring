import jwt from "jsonwebtoken";
import config from "../../../shared/config/index.js";
import AppError from "../../../shared/utils/AppError.js";
import logger from "../../../shared/config/logger.js";
import bcrypt from "bcryptjs";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";

export class AuthService {
    constructor(userRepository) {
        if(!userRepository) {
            throw new Error("userRepository is required");
        }
        this.userRepository = userRepository;
    };

    generateToken(user) {
        const { _id, username, role, email, clientId } = user;
        const payload = {
            userId: _id,
            username,
            email,
            role,
            clientId
        }

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });
    }

    formatUserForResponse(user) {
        const userObj = user.toObject ? user.toObject() : {...user};
        delete userObj.password;
        return userObj;
    }

    async comparePassword(userEnteredPassword, hashedPassword) {
        return bcrypt.compare(userEnteredPassword, hashedPassword);
    }

    async onboardSuperAdmin(superAdminData) {
        try {
            const existingUser = await this.userRepository.findAll();
            if(existingUser && existingUser.length > 0) {
                throw new AppError("Super admin onboarding is disabled", 403);
            }

            const user = await this.userRepository.create(superAdminData);
            const token = this.generateToken(user);

            logger.info("Admin onboarded sucessfully", {
                username: user.username
            });

            return {
                user: this.formatUserForResponse(user),
                token
            }
        } catch (error) {
            logger.error("Error in onboarding admin", error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const existingUser = await this.userRepository.findByUsername(userData.username);

            if(existingUser) {
                throw new AppError("Username already exists", 409);
            }

            const existingEmail = await this.userRepository.findByEmail(userData.email);

            if(existingEmail) {
                throw new AppError("Email already exists", 409);
            }

            const user = await this.userRepository.create(userData);
            const token = this.generateToken(user);

            logger.info("User registered sucessfully", {
                username: user.username
            });

            return {
                user: this.formatUserForResponse(user),
                token
            }

        } catch (error) {
            logger.error("Error in registering user", error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            const user = await this.userRepository.findByUsername(username);
            if(!user) {
                throw new AppError("Invalid Credentials", 401);
            }

            if(!user.isActive) {
                throw new AppError("Account is deactivated", 403);
            }

            const isPasswordValid = await this.comparePassword(password, user.password);

            if(!isPasswordValid) {
                throw new AppError("Invalid Credentials", 401);
            }

            const token = this.generateToken(user);

            logger.info("user loggedIn successfully", { username: user.username});  

            return {
                user: this.formatUserForResponse(user),
                token
            }


        } catch (error) {
            logger.error("Error in log in service", error);
            throw error;
        }
    }

    async getProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError('User not found', 404);
            }
            return this.formatUserForResponse(user)
        } catch (error) {
            logger.error('Error getting user profile:', error);
            throw error;
        }
    };

    async checkSuperAdminPermissions(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError("User not found", 404);
            }

            return user.role === APPLICATION_ROLES.SUPER_ADMIN;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if the platform has been initialized.
     * Returns true if at least one user exists in the database.
     * Used by GET /api/auth/status (public endpoint).
     *
     * Note: findAll() already exists on userRepository and is used by
     * onboardSuperAdmin to enforce the single-setup rule.
     */
    async isPlatformInitialized() {
        try {
            const users = await this.userRepository.findAll();
            return users && users.length > 0;
        } catch (error) {
            logger.error('Error checking platform initialization status:', error);
            throw error;
        }
    }
}