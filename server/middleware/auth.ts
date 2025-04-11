import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Data stored in the JWT token (minimal for security)
export interface UserJwtInfo {
  id: string | number;
  username: string;
  role: string;
  email?: string;
}

// Request with authenticated user - making user optional to match Express.Request
export interface AuthRequest extends Request {
  user?: Express.User;
}

/**
 * Middleware to authenticate requests using both session and JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated via session (Passport)
  if (req.isAuthenticated() && req.user) {
    // Ensure user has both MongoDB _id and numeric id
    const user = req.user as Express.User;
    if (!user.id && user._id) {
      user.id = 1; // Set a default numeric ID if missing
    }
    next();
    return;
  }

  // If not authenticated via session, try JWT
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Verify token
    const jwtData = jwt.verify(token, JWT_SECRET) as UserJwtInfo;

    // Create user object compatible with Express.User
    // No more numeric ID conversion needed
    const user = {
      id: jwtData.id,
      _id: jwtData.id, // Assuming id in JWT is the MongoDB _id string
      username: jwtData.username,
      role: jwtData.role,
      email: jwtData.email || '',
      password: '', // We don't store passwords in JWT
      createdAt: null
    } as Express.User;

    // Attach user data to request object
    (req as any).user = user;

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Safe type cast since authentication middleware guarantees req.user exists
  const user = req.user as Express.User;

  if (user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required',
      userRole: user.role
    });
  }

  next();
};

/**
 * Middleware to check if user has seller or admin role
 */
export const requireSeller = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Safe type cast since authentication middleware guarantees req.user exists
  const user = req.user as Express.User;

  if (user.role !== 'seller' && user.role !== 'admin') {
    return res.status(403).json({
      message: 'Seller access required',
      userRole: user.role
    });
  }

  next();
};

/**
 * Generate JWT token from user data
 * Handles both numeric IDs and MongoDB ObjectIds
 */
export const generateToken = (user: { id?: number | string; _id?: any; username: string; role: string }): string => {
  // Use MongoDB _id as the primary identifier if available, otherwise use 'id'
  const userId = user._id?.toString() || user.id?.toString();

  if (!userId) {
    throw new Error('User ID is required to generate token');
  }

  const payload: UserJwtInfo = {
    id: userId,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // Token valid for 7 days
};