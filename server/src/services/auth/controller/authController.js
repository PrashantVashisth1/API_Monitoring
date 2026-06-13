import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";
import config from "../../../shared/config/index.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js"

export class AuthController {
    constructor(authService) {
        if(!authService) {
            throw new Error("authService is required");
        }
        this.authService = authService;
    }

    async onboardSuperAdmin(req, res, next) {
        try {
            const { username, email, password } = req.body;

            const superAdminData = {
                username, email, password, role: APPLICATION_ROLES.SUPER_ADMIN
            };

            const { user, token } = await this.authService.onboardSuperAdmin(superAdminData);
            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                sameSite: config.cookie.sameSite,
                maxAge: config.cookie.expiresIn
            });

            res.status(201).json(ResponseFormatter.success(user, "Super admin created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const { username, email, password, role } = req.body;
            const userData = {
                username, email, password, role: role || APPLICATION_ROLES.CLIENT_VIEWER
            }

            const { token, user } = await this.authService.register(userData);

            // BUG FIX: Only set the auth cookie if there is NO existing session.
            // When a super_admin calls POST /api/auth/register from the Team
            // Management page they are already authenticated (req.user is set by
            // the authenticate middleware). Setting the cookie here would silently
            // replace their session with the newly created user's token.
            if (!req.user) {
                res.cookie("authToken", token, {
                    httpOnly: config.cookie.httpOnly,
                    secure:   config.cookie.secure,
                    sameSite: config.cookie.sameSite,
                    maxAge:   config.cookie.expiresIn
                });
            }

            res.status(201).json(ResponseFormatter.success(user, "User created successfully", 201));
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            const { token, user } = await this.authService.login(username, password);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                sameSite: config.cookie.sameSite,
                maxAge: config.cookie.expiresIn
            });

            res.status(200).json(ResponseFormatter.success(user, "User Logged in successfully", 200));
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await this.authService.getProfile(userId);

            res.status(200).json(ResponseFormatter.success(result, "Profile fetched successfully", 200))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/auth/status — PUBLIC, no auth required.
     *
     * Returns whether the platform has been initialized (i.e. at least one
     * super_admin exists in the database). Used by the frontend on first load
     * to decide whether to redirect to /setup.
     *
     * Response is intentionally minimal — we don't expose user counts.
     * { initialized: boolean }
     *
     * Performance: This is called ONCE per browser (result is cached in
     * localStorage as 'apim:initialized'). Not called on every page visit.
     */
    async getSystemStatus(req, res, next) {
        try {
            const initialized = await this.authService.isPlatformInitialized();
            res.status(200).json(
                ResponseFormatter.success(
                    { initialized },
                    'System status fetched successfully',
                    200
                )
            );
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            res.clearCookie("authToken", {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                sameSite: config.cookie.sameSite
            });
            res.status(200).json(ResponseFormatter.success({}, "Logout successful", 200))
        } catch (error) {
            next(error)
        }
    }
}