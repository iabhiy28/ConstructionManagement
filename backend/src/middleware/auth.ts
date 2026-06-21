import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'buildflow-secret-key-12345';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    name: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // High-fidelity fallback check: allow requests in development mock mode
  if (process.env.NODE_ENV !== 'production' && req.headers['x-bypass-auth'] === 'true') {
    // In mock testing, trust client header for testing various roles
    const mockRole = (req.headers['x-mock-role'] as string) || 'Company Owner';
    const mockUserId = (req.headers['x-mock-user-id'] as string) || 'u1';
    req.user = {
      id: mockUserId,
      companyId: 'c1',
      name: 'Simulated User',
      email: 'user@buildflow.in',
      role: mockRole
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      companyId: decoded.companyId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User context not found. Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied: Your role '${req.user.role}' does not possess the permissions necessary for this action.` 
      });
    }

    next();
  };
}
