import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "occ-dev-secret-key-change-in-production";

export interface AuthPayload {
  userId: number;
  roleId: number;
  roleName: string;
  ptId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const ROLE_HIERARCHY: Record<string, number> = {
  "Owner": 6,
  "Direksi": 5,
  "Chief Dealing": 4,
  "SPV Dealing": 3,
  "Dealer": 2,
  "Admin System": 5,
};

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!allowedRoles.includes(req.user.roleName)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
