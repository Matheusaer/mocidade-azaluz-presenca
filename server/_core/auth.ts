import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { COOKIE_NAME } from "../../shared/const";

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getSecret());
}

export async function authenticateRequest(req: Request): Promise<SessionUser | null> {
  try {
    const raw = req.headers.cookie ?? "";
    const cookies: Record<string, string> = {};
    raw.split(";").forEach((part) => {
      const [k, ...v] = part.trim().split("=");
      if (k) cookies[k.trim()] = v.join("=");
    });
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
