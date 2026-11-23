import { Request, Response, NextFunction } from "express";
import { db, UserRecord } from "@workspace/db";

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  userId?: string;
}

export const SESSION_COOKIE_NAME = "postforge_session";

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined;

    const token = cookieToken || headerToken;

    if (token) {
      const user = await db.getSessionUser(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userId || !req.user) {
    res.status(401).json({
      message: "Please sign in to access your saved account drafts.",
    });
    return;
  }
  next();
}
