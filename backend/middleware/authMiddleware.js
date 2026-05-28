import jwt from 'jsonwebtoken';
import { auth } from 'express-oauth2-jwt-bearer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_growth_jwt_secret_key_12345';

// Check if Auth0 is fully configured with real credentials (not placeholders)
const isAuth0Configured = process.env.AUTH0_ISSUER_BASE_URL && 
                          !process.env.AUTH0_ISSUER_BASE_URL.includes('AUTH0-DOMAIN') &&
                          process.env.AUTH0_CLIENT_ID && 
                          process.env.AUTH0_CLIENT_ID !== 'AUTH0-CLIENT-ID';

let checkJwt;
if (isAuth0Configured) {
  checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE || process.env.AUTH0_CLIENT_ID || 'http://localhost:5050',
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
  });
}

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // 1. Try local JWT token verification first
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    return next();
  } catch (error) {
    // 2. If local verification fails, fall back to Auth0 if configured
    if (isAuth0Configured) {
      return checkJwt(req, res, (err) => {
        if (err) {
          console.error('Auth0 token validation failed:', err.message);
          return res.status(401).json({ message: 'Not authorized, token failed' });
        }
        req.userId = req.auth.payload.sub;
        next();
      });
    } else {
      console.error('Local Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
};


