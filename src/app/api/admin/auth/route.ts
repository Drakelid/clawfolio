import { cookies } from "next/headers";
import { COOKIE_NAME, createToken } from "@/lib/auth";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function shouldUseSecureCookie(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;

  if (!expected || !secret) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!timingSafeEqual(password, expected)) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createToken(secret);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return Response.json({ success: true });
}
