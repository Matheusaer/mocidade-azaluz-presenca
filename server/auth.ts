import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { createSessionToken } from "./_core/auth";
import { getSessionCookieOptions } from "./_core/cookies";

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (
      !process.env.AUTH_EMAIL ||
      !process.env.AUTH_PASSWORD ||
      email !== process.env.AUTH_EMAIL ||
      password !== process.env.AUTH_PASSWORD
    ) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const user = {
      id: 1,
      name: process.env.AUTH_NAME ?? "Admin",
      email: process.env.AUTH_EMAIL,
      role: "admin" as const,
    };

    const token = await createSessionToken(user);
    const cookieOptions = getSessionCookieOptions(req);

    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS,
    });

    res.json({ ok: true, user });
  });
}
