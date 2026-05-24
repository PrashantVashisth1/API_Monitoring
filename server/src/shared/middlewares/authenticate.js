import config from "../config/index.js";
import logger from "../config/logger.js";
import ResponseFormatter from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";

const authenticate = async (req, res, next) => {
    try {
        let token = null;
        if(req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }
        if(!token) {
            return res.status(401).json(ResponseFormatter.error("Authentication token is required", 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        const { userId, username, email, role, clientId } = decoded;
        
        req.user = {
            userId, username, email, role, clientId
        };

        next();
    } catch (error) {
        logger.error("Authentication failed", {
            error: error.message,
            path: req.path
        });

        if(error.name === 'TokenExpiredError') {
            return res.status(401).json(ResponseFormatter.error("Authentication token expired", 401));
        }

        return res.status(401).json(ResponseFormatter.error("Invalid Token", 401));
    }
}

export default authenticate;