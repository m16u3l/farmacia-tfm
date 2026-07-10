import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { UserRole, roleCanAccess } from "@/lib/permissions";

export type { UserRole };
export { roleCanAccess };

export interface SessionPayload {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const SESSION_COOKIE = "biofarm_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET no está configurado. Defínelo en tu .env (mínimo 32 caracteres)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;

// NextRequest tiene un shape compatible; se tipa laxo para evitar el import
// pesado de next/server en contextos donde no hace falta.
interface RequestLike {
  cookies: { get(name: string): { value: string } | undefined };
}

export async function getSessionFromRequest(
  request: RequestLike
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
