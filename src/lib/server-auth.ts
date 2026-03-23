import "server-only";

import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./auth";

export async function validateAdminCookie(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  return verifyToken(token, secret);
}
