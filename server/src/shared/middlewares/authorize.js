import ResponseFormatter from "../utils/responseFormatter.js"

const authorize = (allowedRoles = []) => async (req, res, next) => {
    try {
        if(!req.user || !req.user.role) {
            return res.status(403).json(ResponseFormatter.error("Forbidden", 403));
        }

        // no role required for a specific route -> so skip
        if(allowedRoles.length === 0) {
            return next();
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(ResponseFormatter.error("Insufficient Permissions", 403));
        }

        next();
    } catch (error) {
        return res.status(403).json(ResponseFormatter.error("Forbidden", 403));
    }
}

export default authorize;