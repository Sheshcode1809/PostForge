import { Router, type IRouter } from "express";
import {
  SignupBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  AuthUserResponse,
  AuthMeResponse,
  SimpleSuccessResponse,
  ForgotPasswordResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { SESSION_COOKIE_NAME, AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

const isProduction = process.env.NODE_ENV === "production";

function setSessionCookie(res: any, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  });
}

function clearSessionCookie(res: any) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

// POST /api/auth/signup
router.post("/auth/signup", async (req, res, next) => {
  try {
    const body = SignupBody.parse(req.body);
    const user = await db.createUser(body.email, body.password, body.name);
    const sessionToken = await db.createSession(user.id);

    setSessionCookie(res, sessionToken);

    const data = AuthUserResponse.parse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res, next) => {
  try {
    const body = LoginBody.parse(req.body);
    const user = await db.authenticateUser(body.email, body.password);
    const sessionToken = await db.createSession(user.id);

    setSessionCookie(res, sessionToken);

    const data = AuthUserResponse.parse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (req: AuthenticatedRequest, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      await db.deleteSession(token);
    }
    clearSessionCookie(res);

    const data = SimpleSuccessResponse.parse({
      success: true,
      message: "Successfully logged out.",
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/auth/me", async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user) {
      const data = AuthMeResponse.parse({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          createdAt: req.user.createdAt,
        },
      });
      res.json(data);
      return;
    }

    res.json({ user: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const body = ForgotPasswordBody.parse(req.body);
    const token = await db.createPasswordReset(body.email);

    // Provide resetToken in response for development convenience
    const data = ForgotPasswordResponse.parse({
      success: true,
      message: "If that email exists in our system, reset instructions have been generated.",
      resetToken: token || undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const body = ResetPasswordBody.parse(req.body);
    await db.resetPassword(body.token, body.newPassword);

    const data = SimpleSuccessResponse.parse({
      success: true,
      message: "Your password has been successfully reset. You can now log in.",
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
