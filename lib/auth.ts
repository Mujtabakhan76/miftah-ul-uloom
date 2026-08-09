import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "";
const COOKIE_NAME = "miftah_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  username: string;
  role: "admin";
}

export function signAdminToken(username: string): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ username, role: "admin" } as AdminSession, JWT_SECRET, {
    expiresIn: SESSION_MAX_AGE,
  });
}

export function verifyAdminToken(token: string): AdminSession | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = SESSION_MAX_AGE;
